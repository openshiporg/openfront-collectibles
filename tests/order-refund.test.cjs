const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: name => name in mocks ? mocks[name] : name.startsWith('.') ? load(path.join(path.dirname(file), name).replace(/\.ts$/, '') + '.ts') : require(name), process, Date, Number, Math }, { filename: file });
  return mod.exports;
}
const idempotency = load('features/keystone/utils/idempotency.ts');
// Matches the few Prisma where-shapes the refund code uses on attempt rows.
function matches(row, where) {
  return Object.entries(where).every(([key, cond]) => {
    if (key === 'requestParams') return row.requestParams?.[cond.path[0]] === cond.equals;
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond) return cond.in.includes(row[key]);
      if ('gt' in cond) return row[key] && new Date(row[key]) > cond.gt;
      if ('equals' in cond) return row[key] === cond.equals;
    }
    return row[key] === cond;
  });
}
function fixture({ amount = 3940, refunded = 0, allowed = true, status = 'captured', providerFails = false, declines = false, providerRefunds = [], statusFails = false, providerResult = {} } = {}) {
  const attempts = new Map(), refunds = [], events = [], outbox = [], transitions = [];
  let calls = 0, statusCalls = 0;
  const providerKeys = [];
  const payment = { id: 'p1', amount, amountRefunded: refunded, status, currencyCode: 'USD', order: { id: 'o1' }, data: { payment_intent_id: 'pi_test' }, refunds: [], paymentCollection: { paymentSessions: [{ isSelected: true, paymentProvider: { id: 'stripe', code: 'pp_stripe_stripe' } }] } };
  const rows = () => [...attempts.values()];
  const prisma = {
    $queryRaw: async () => [],
    idempotencyKey: {
      findUnique: async ({where}) => { const row = attempts.get(where.idempotencyKey); return row ? {...row} : null; },
      findMany: async ({where}) => rows().filter(r => matches(r, where)).map(r => ({...r})),
      findFirst: async ({where}) => rows().find(r => matches(r, where)) || null,
      create: async ({data}) => {
        if (attempts.has(data.idempotencyKey)) throw Object.assign(new Error('duplicate'), {code:'P2002'});
        const row = {...data, id: `a${attempts.size}`, createdAt: new Date()}; attempts.set(data.idempotencyKey, row); return {...row};
      },
      update: async ({where,data}) => { const row = rows().find(a => a.id === where.id); Object.assign(row,data); return {...row}; },
      updateMany: async ({where,data}) => { const row = rows().find(a => matches(a, where)); if (!row) return {count:0}; Object.assign(row,data); return {count:1}; },
    },
    payment: {
      findMany: async () => [{ status: payment.status, amount: payment.amount, refunds: refunds.map(r => ({ amount: r.amount })) }],
      findUnique: async () => ({ amount: payment.amount, amountRefunded: payment.amountRefunded, orderId: 'o1', refunds: refunds.map(r => ({ amount: r.amount, idempotencyKey: r.idempotencyKey })) }),
      update: async ({data}) => { payment.amountRefunded = data.amountRefunded; return payment; },
      updateMany: async ({where,data}) => {
        if (where.amountRefunded.lte !== undefined && payment.amountRefunded > where.amountRefunded.lte) return {count:0};
        if (where.amountRefunded.gte !== undefined && payment.amountRefunded < where.amountRefunded.gte) return {count:0};
        payment.amountRefunded += data.amountRefunded.increment ?? -data.amountRefunded.decrement; return {count:1};
      },
    },
    refund: { findFirst: async ({where}) => refunds.find(r => r.idempotencyKey === where.idempotencyKey), create: async ({data}) => { if ('paymentId' in data || 'createdById' in data || data.payment?.connect?.id !== 'p1') throw new Error('Unknown argument `paymentId`'); const r = {...data,id:`r${refunds.length}`}; refunds.push(r); payment.refunds.push(r); return r; } },
    orderEvent: { create: async ({data}) => { events.push(data); return data; } },
  };
  prisma.$transaction = async fn => fn(prisma);
  const context = { session: { itemId:'demo', data: {email:'impossible@openship.org'} }, prisma,
    query: { Payment: {findOne: async () => JSON.parse(JSON.stringify(payment))}, Refund: {findOne: async ({where}) => refunds.find(r => r.id === where.id)} }
  };
  context.sudo = () => context;
  const outboxMock = {subscribedWebhookEndpointIds: async () => ['endpoint'], enqueueWebhookOutbox: async (...args) => { outbox.push(args); }};
  const adapter = {
    refundPayment: async input => {
      calls++; providerKeys.push(input.idempotencyKey);
      if (declines) throw Object.assign(new Error('Error executing refundPaymentFunction for provider stripe: charge already refunded'), { providerDeclined: true });
      if (providerFails) throw new Error(providerFails === true ? 'network outcome unknown' : providerFails);
      return {status:'succeeded',amount:input.amount,currency:'USD',data:{id:'re_test'},...providerResult};
    },
    getPaymentStatus: async () => { statusCalls++; if (statusFails) throw new Error('stripe down'); return { status: 'succeeded', amount, currency: 'USD', refunds: providerRefunds }; },
  };
  const reconcile = load('features/keystone/checkout/refund-reconcile.ts', {
    '../utils/paymentProviderAdapter': adapter, '../../webhooks/outbox': outboxMock,
  });
  const fn = load('features/keystone/mutations/refundOrderPayment.ts', {
    '../access': {permissions: {canManagePayments: () => allowed, canManageReturns: () => allowed}},
    '../utils/idempotency': idempotency,
    '../utils/orderStatusTransition': {applyOrderStatusTransition: async (_sudo, input) => { transitions.push(input); return {changed: true}; }},
    '../utils/paymentProviderAdapter': adapter,
    '../../webhooks/outbox': outboxMock,
    '../checkout/refund-reconcile': reconcile,
  }).default;
  const args = {orderId:'o1',paymentId:'p1',amount:3940,reason:'Customer request',idempotencyKey:'request1'};
  const set = (opts) => { if ('providerFails' in opts) providerFails = opts.providerFails; if ('declines' in opts) declines = opts.declines; if ('providerRefunds' in opts) providerRefunds = opts.providerRefunds; if ('statusFails' in opts) statusFails = opts.statusFails; };
  const age = (key, ms) => { const row = attempts.get(key); row.lockedAt = new Date(Date.now() - ms); };
  return {run: overrides => fn(null,{...args,...overrides},context), context, reconcile, payment, refunds, events, outbox, attempts, transitions, calls:()=>calls, statusCalls:()=>statusCalls, providerKeys, set, age};
}

test('full refund uses the provider, preserves reason and records audit/outbox without a return', async () => {
  const f = fixture(); await f.run();
  assert.equal(f.calls(),1); assert.equal(f.refunds.length,1); assert.equal(f.refunds[0].amount,3940);
  assert.equal(f.refunds[0].note,'Customer request'); assert.equal(f.payment.amountRefunded,3940);
  assert.equal(f.events[0].type,'REFUND_PROCESSED'); assert.equal(f.outbox.length,1);
});
test('partial amount is capped at captured minus already-refunded/reserved', async () => {
  const f = fixture({refunded:1000}); await assert.rejects(f.run({amount:2941}),/exceeds/); assert.equal(f.calls(),0);
  await f.run({amount:2940}); assert.equal(f.payment.amountRefunded,3940);
});
test('same request retry and double-click cannot call provider or refund twice', async () => {
  const f = fixture(); const results = await Promise.allSettled([f.run(),f.run()]);
  assert.ok(results.some(r=>r.status==='fulfilled')); assert.equal(f.calls(),1); assert.equal(f.refunds.length,1);
  await f.run(); assert.equal(f.calls(),1); assert.equal(f.refunds.length,1);
});
test('different keys racing the full balance cannot over-refund', async () => {
  const f = fixture(); await Promise.allSettled([f.run(),f.run({idempotencyKey:'request2'})]);
  assert.equal(f.calls(),1); assert.equal(f.refunds.length,1); assert.equal(f.payment.amountRefunded,3940);
});
test('replay with changed amount/reason is refused', async () => {
  const f = fixture(); await f.run(); await assert.rejects(f.run({reason:'Changed'}),/different request/); await assert.rejects(f.run({amount:1}),/different request/); assert.equal(f.calls(),1);
});
test('permission, order/payment binding, captured state, amount and reason are enforced before provider calls', async () => {
  const no = fixture({allowed:false}); await assert.rejects(no.run(),/Access denied/);
  const f = fixture(); for(const args of [{orderId:'other'},{amount:0},{amount:-1},{amount:1.5},{amount:3941},{reason:''}]) await assert.rejects(f.run(args));
  const pending = fixture({status:'pending'}); await assert.rejects(pending.run(),/captured/); assert.equal(f.calls(),0); assert.equal(pending.calls(),0);
});
test('unknown provider outcome releases the reservation, keeps the key, and never fabricates a refund', async () => {
  const f = fixture({providerFails:true}); await assert.rejects(f.run(),/did not confirm/);
  assert.equal(f.refunds.length,0); assert.equal(f.payment.amountRefunded,0);
  assert.equal(f.attempts.get('refund:request1').recoveryPoint,'provider_unknown');
  // While its call may still land, no other refund races it.
  await assert.rejects(f.run({idempotencyKey:'new'}),/waiting for the processor/); assert.equal(f.calls(),1);
});
const code = p => p.then(() => assert.fail('expected rejection'), e => e.extensions?.code);
test('operator-facing refund rules are coded GraphQLErrors Yoga will not mask', async () => {
  assert.equal(await code(fixture().run({amount:3941})), 'REFUND_EXCEEDS_BALANCE');
  assert.equal(await code(fixture({status:'pending'}).run()), 'PAYMENT_NOT_CAPTURED');
  const racing = fixture(); const [a, b] = await Promise.allSettled([racing.run(), racing.run({idempotencyKey:'other'})]);
  const rejected = [a, b].find(r => r.status === 'rejected');
  assert.ok(['REFUND_EXCEEDS_BALANCE', 'REFUND_IN_PROGRESS'].includes(rejected.reason.extensions?.code));
});
test('dashboard shows coded refund messages and the Refund row connects the payment relation', () => {
  const sec = load('features/dashboard/lib/security.ts');
  const err = {response:{errors:[{message:'Refund exceeds captured payment amount',extensions:{code:'REFUND_EXCEEDS_BALANCE'}}]}};
  assert.equal(sec.publicGraphQLErrorMessage(err), 'Refund exceeds captured payment amount');
  assert.doesNotMatch(fs.readFileSync(path.join(root,'features/platform/orders/components/RefundOrderDialog.tsx'),'utf8'), /rounded-full bg-muted/);
});

test('replay of an attempt that already holds a provider result finalizes without a second provider call', async () => {
  const f = fixture(); await f.run();
  const row = f.attempts.get('refund:request1'); f.refunds.length = 0; f.payment.refunds.length = 0;
  row.recoveryPoint = 'completed'; row.responseBody = {providerResult:{status:'succeeded',amount:3940,currency:'USD',data:{id:'re_test'}}};
  await f.run(); assert.equal(f.calls(),1); assert.equal(f.refunds.length,1);
});

test('a full refund closes the order even without restock; stock moves only when asked', async () => {
  const f = fixture(); await f.run();
  assert.equal(f.transitions.length,1); assert.equal(f.transitions[0].status,'canceled'); assert.equal(f.transitions[0].restock,false);
  const g = fixture(); await g.run({restock:true}); assert.equal(g.transitions[0].restock,true);
});
test('a partial refund leaves the order open', async () => {
  const f = fixture(); await f.run({amount:1000}); assert.equal(f.transitions.length,0);
});
test('cancel transition skips both stock loops when restock is false', () => {
  const src = fs.readFileSync(path.join(root,'features/keystone/utils/orderStatusTransition.ts'),'utf8');
  assert.equal((src.match(/for \(const line of restock \? order\.lineItems : \[\]\)/g)||[]).length,2);
  assert.match(src,/restock = true \}/);
});

// 2026-11-12 audit BLOCKER: a failed processor call kept amountRefunded reserved forever (order #1794011296).
test('a processor failure releases the reservation, so the order shows no refund and can be refunded again', async () => {
  const f = fixture({providerFails:'Keys for idempotent requests can only be used with the same parameters'});
  await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_NOT_CONFIRMED');
  assert.equal(f.payment.amountRefunded, 0); assert.equal(f.refunds.length, 0);
  // Past the lease, a new refund checks the processor first and goes through.
  f.age('refund:request1', 10 * 60 * 1000); f.set({providerFails:false});
  await f.run({idempotencyKey:'request2'});
  assert.equal(f.refunds.length, 1); assert.equal(f.payment.amountRefunded, 3940); assert.equal(f.statusCalls() >= 1, true);
});
test('an idempotency_error is an unknown outcome, not a decline: Retry resends the same key', async () => {
  const f = fixture({providerFails:'Keys for idempotent requests can only be used with the same parameters'});
  await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_NOT_CONFIRMED');
  f.set({providerFails:false}); await f.run();
  assert.equal(f.calls(), 2); assert.equal(f.providerKeys[0], f.providerKeys[1]); assert.equal(f.refunds.length, 1); assert.equal(f.payment.amountRefunded, 3940);
});
test('a decline releases the reservation and is final for its key; a new refund is allowed', async () => {
  const f = fixture({declines:true});
  await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_DECLINED');
  assert.equal(f.payment.amountRefunded, 0); assert.equal(f.attempts.get('refund:request1').recoveryPoint, 'failed');
  f.set({declines:false});
  await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_DECLINED'); assert.equal(f.calls(), 1);
  await f.run({idempotencyKey:'request2'}); assert.equal(f.refunds.length, 1); assert.equal(f.calls(), 2);
});
test('when the ledger refuses the reservation the attempt ends failed, never processing, and the processor is not called', async () => {
  const f = fixture();
  // Another refund took the balance after the pre-check.
  const realUpdateMany = f.context.prisma.payment.updateMany;
  f.context.prisma.payment.updateMany = async () => ({count:0});
  await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_EXCEEDS_BALANCE');
  f.context.prisma.payment.updateMany = realUpdateMany;
  assert.equal(f.calls(), 0); assert.equal(f.attempts.get('refund:request1').recoveryPoint, 'failed'); assert.equal(f.attempts.get('refund:request1').lockedAt, null);
});
test('a pending or mismatched processor result is unknown: reservation released, no Refund row', async () => {
  for (const result of [{status:'pending'}, {amount:1}]) {
    const f = fixture({providerResult: result});
    await assert.rejects(f.run(), e => e.extensions?.code === 'REFUND_NOT_CONFIRMED');
    assert.equal(f.payment.amountRefunded, 0); assert.equal(f.refunds.length, 0);
    assert.equal(f.attempts.get('refund:request1').recoveryPoint, 'provider_unknown');
  }
});
test('a refund stuck before this fix (reserved, no answer, old key) is recovered by Check with processor', async () => {
  const f = fixture();
  // The live shape: attempt left at amount_reserved under refund:<key>, amountRefunded 3940, no Refund row.
  await f.context.prisma.idempotencyKey.create({ data: { idempotencyKey: 'refund:audit', requestMethod: 'POST', requestPath: 'refundOrderPayment', requestParams: { orderId: 'o1', paymentId: 'p1', amount: 3940, reason: 'Customer changed mind' }, recoveryPoint: 'amount_reserved', lockedAt: new Date(Date.now() - 20 * 60 * 1000) } });
  f.payment.amountRefunded = 3940;
  // The processor made no refund: the reservation is freed and the order can be refunded.
  const result = await f.reconcile.reconcilePaymentRefunds(f.context, 'p1');
  assert.equal(result.released, 3940); assert.equal(f.payment.amountRefunded, 0); assert.equal(f.attempts.get('refund:audit').recoveryPoint, 'provider_unknown');
  await f.run({idempotencyKey:'fresh'}); assert.equal(f.refunds.length, 1); assert.equal(f.payment.amountRefunded, 3940);
  assert.equal(f.providerKeys[0], 'refund:p1:fresh');
});
test('a stuck refund the processor did make becomes a Refund row under its own key, without a second processor call', async () => {
  const f = fixture({providerRefunds:[{id:'re_1',amount:3940,status:'succeeded'}]});
  await f.context.prisma.idempotencyKey.create({ data: { idempotencyKey: 'refund:audit', requestMethod: 'POST', requestPath: 'refundOrderPayment', requestParams: { orderId: 'o1', paymentId: 'p1', amount: 3940, reason: 'Customer changed mind' }, recoveryPoint: 'amount_reserved', lockedAt: new Date(Date.now() - 20 * 60 * 1000) } });
  f.payment.amountRefunded = 3940;
  const result = await f.reconcile.reconcilePaymentRefunds(f.context, 'p1');
  assert.equal(result.recorded.length, 1); assert.equal(f.refunds[0].idempotencyKey, 'refund:audit'); assert.equal(f.refunds[0].note, 'Customer changed mind');
  assert.equal(f.payment.amountRefunded, 3940); assert.equal(f.attempts.get('refund:audit').recoveryPoint, 'completed'); assert.equal(f.calls(), 0);
  // Repeating the check changes nothing.
  const again = await f.reconcile.reconcilePaymentRefunds(f.context, 'p1'); assert.equal(again.recorded.length, 0); assert.equal(f.refunds.length, 1);
});
test('reconcile leaves a refund whose call may still be running alone', async () => {
  const f = fixture();
  await f.context.prisma.idempotencyKey.create({ data: { idempotencyKey: 'refund:live', requestMethod: 'POST', requestPath: 'refundOrderPayment', requestParams: { orderId: 'o1', paymentId: 'p1', amount: 3940, reason: 'x' }, recoveryPoint: 'amount_reserved', lockedAt: new Date() } });
  f.payment.amountRefunded = 3940;
  const result = await f.reconcile.reconcilePaymentRefunds(f.context, 'p1');
  assert.equal(result.released, 0); assert.equal(f.payment.amountRefunded, 3940);
});
test('new refunds use a payment-scoped processor key', async () => {
  const f = fixture(); await f.run(); assert.equal(f.providerKeys[0], 'refund:p1:request1');
});
test('plan: matched first, extra recorded, unconfirmed released, never over the captured amount', () => {
  const { planRefundReconcile } = fixture().reconcile;
  const a = { id: 'a', idempotencyKey: 'k1', amount: 500, reserved: true, providerConfirmed: false };
  const b = { id: 'b', idempotencyKey: 'k2', amount: 300, reserved: true, providerConfirmed: false };
  let plan = planRefundReconcile({ amount: 1000, amountRefunded: 800, recorded: 0, providerRefunded: 500, inFlight: 0, stuck: [a, b] });
  assert.equal(plan.matched.map(x => x.id).join(), 'a'); assert.equal(plan.released.map(x => x.id).join(), 'b'); assert.equal(plan.extra, 0); assert.equal(plan.amountRefunded, 500);
  plan = planRefundReconcile({ amount: 1000, amountRefunded: 0, recorded: 0, providerRefunded: 200, inFlight: 0, stuck: [] });
  assert.equal(plan.extra, 200); assert.equal(plan.amountRefunded, 200);
  plan = planRefundReconcile({ amount: 1000, amountRefunded: 300, recorded: 0, providerRefunded: 300, inFlight: 300, stuck: [] });
  assert.equal(plan.extra, 0); assert.equal(plan.amountRefunded, 300);
});
test('order page shows refunded from Refund rows and offers Check with processor for held amounts', () => {
  const src = fs.readFileSync(path.join(root,'features/platform/orders/screens/OrderPageClient.tsx'),'utf8');
  assert.match(src, /refundedCents = capturedPayments\.reduce\(\(sum, p\) => sum \+ \(p\.refunds/);
  assert.match(src, /heldCents > 0 && .*CheckRefundsWithProcessor/);
});
test('Stripe: a 4xx is a decline, but idempotency_error, 409, 5xx and connection errors are unknown', () => {
  const { isDefinitiveStripeDecline } = load('features/integrations/payment/stripe.ts', { stripe: function Stripe() {} });
  assert.equal(isDefinitiveStripeDecline({ statusCode: 400, rawType: 'invalid_request_error', type: 'StripeInvalidRequestError' }), true);
  assert.equal(isDefinitiveStripeDecline({ statusCode: 402, rawType: 'card_error' }), true);
  assert.equal(isDefinitiveStripeDecline({ statusCode: 400, rawType: 'idempotency_error', type: 'StripeIdempotencyError' }), false);
  assert.equal(isDefinitiveStripeDecline({ statusCode: 409 }), false);
  assert.equal(isDefinitiveStripeDecline({ statusCode: 500, rawType: 'api_error' }), false);
  assert.equal(isDefinitiveStripeDecline({ type: 'StripeConnectionError' }), false);
});
