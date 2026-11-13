import { GraphQLError } from "graphql";
import { getPaymentStatus } from "../utils/paymentProviderAdapter";
import { enqueueWebhookOutbox, subscribedWebhookEndpointIds } from "../../webhooks/outbox";
import { GIFT_CARD_TENDER } from "./gift-card-tender";
import { REFUND_BALANCE_TAKEN_MESSAGE, REFUND_DECLINED_MESSAGE, REFUND_NOT_CONFIRMED_MESSAGE } from "./refund-messages";

/** A refund attempt whose lock is older than this is not running any more (Stripe gives up after 80s). */
export const REFUND_LOCK_MS = 5 * 60 * 1000;

/** The processor reference a card payment was taken under (PayPal capture, Stripe intent). */
export function providerPaymentReference(payment: any): string | undefined {
  return (
    payment.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    payment.data?.payment_intent_id ||
    payment.data?.paymentIntentId ||
    payment.data?.orderId ||
    payment.data?.id
  );
}

export function paymentProviderFor(payment: any) {
  return (
    payment.paymentCollection?.paymentSessions?.find((session: any) => session.isSelected)?.paymentProvider ||
    payment.paymentCollection?.paymentSessions?.[0]?.paymentProvider
  );
}

/** Processor idempotency keys are account-wide: scope the staff key to the payment so two stores never collide. */
export function providerRefundKey(paymentId: string, clientKey: string) {
  return `refund:${paymentId}:${clientKey}`;
}

/** Amount an attempt reserved (or would reserve) on its payment. */
export function attemptAmount(attempt: any): number {
  return Number(attempt?.responseBody?.reservedAmount ?? attempt?.requestParams?.amount) || 0;
}

/** An attempt with no processor answer for this long is settled by asking the processor, not by calling it again. */
export const REFUND_REPLAY_WINDOW_MS = 60 * 60 * 1000;

export type RefundCode = "REFUND_EXCEEDS_BALANCE" | "PAYMENT_NOT_CAPTURED" | "REFUND_IN_PROGRESS" | "REFUND_DECLINED" | "REFUND_NOT_CONFIRMED";

/** Fixed, rule-written text only: provider output never reaches staff (it can carry ids and request details). */
export function refundRuleError(message: string, code: RefundCode) {
  return new GraphQLError(message, { extensions: { code } });
}


/**
 * Reserve the amount, call the processor once, and settle the attempt whatever happens:
 * - the ledger refuses the reservation: the attempt ends "failed" (never left "processing");
 * - the processor declines (a definitive 4xx): "failed", reservation released; final for this key;
 * - no usable answer (network, 5xx, idempotency_error, pending or mismatched result): "provider_unknown",
 *   reservation released and the lease kept for REFUND_LOCK_MS so no other refund races it;
 * - confirmed: "provider_refunded", reservation kept for the Refund row.
 * The attempt row is the lock: only one caller moves it out of "started" / "provider_unknown".
 */
export async function sendProviderRefund(
  prisma: any,
  input: {
    attempt: any;
    paymentId: string;
    paymentAmount: number;
    amount: number;
    currency: string;
    providerKey: string;
    call: (providerKey: string) => Promise<any>;
  }
) {
  const { attempt, paymentId, amount, providerKey } = input;
  const body = { providerKey, reservedAmount: amount };
  // Only the caller that moves the attempt out of "started" / "provider_unknown" may call the processor.
  if (attempt.recoveryPoint !== "started" && attempt.recoveryPoint !== "provider_unknown") {
    throw refundRuleError("This refund is already being sent. Wait a moment and reload the order.", "REFUND_IN_PROGRESS");
  }
  {
    const outcome = await prisma.$transaction(async (tx: any) => {
      const claimed = await tx.idempotencyKey.updateMany({
        where: { id: attempt.id, recoveryPoint: attempt.recoveryPoint },
        data: { recoveryPoint: "amount_reserved", lockedAt: new Date(), responseBody: body },
      });
      if (claimed.count !== 1) return "busy";
      const reserved = await tx.payment.updateMany({
        where: { id: paymentId, amountRefunded: { lte: input.paymentAmount - amount } },
        data: { amountRefunded: { increment: amount } },
      });
      if (reserved.count !== 1) {
        await tx.idempotencyKey.update({
          where: { id: attempt.id },
          data: { recoveryPoint: "failed", responseCode: 409, responseBody: { ...body, error: "Refund exceeds what is left on the payment" }, lockedAt: null },
        });
        return "refused";
      }
      return "reserved";
    });
    if (outcome === "busy") throw refundRuleError("This refund is already being sent. Wait a moment and reload the order.", "REFUND_IN_PROGRESS");
    if (outcome === "refused") {
      attempt.recoveryPoint = "failed";
      throw refundRuleError(REFUND_BALANCE_TAKEN_MESSAGE, "REFUND_EXCEEDS_BALANCE");
    }
    attempt.recoveryPoint = "amount_reserved";
    attempt.responseBody = body;
  }

  const release = async (outcome: "failed" | "provider_unknown", message: string) => {
    await releaseRefundReservation(prisma, { attemptId: attempt.id, paymentId, amount, outcome, message, providerKey });
    attempt.recoveryPoint = outcome;
  };
  let providerResult: any;
  try {
    providerResult = await input.call(providerKey);
  } catch (error: any) {
    const declined = error?.providerDeclined === true;
    console.error("Provider refund call failed", paymentId, declined ? "declined" : "outcome unknown", error instanceof Error ? error.message : error);
    await release(declined ? "failed" : "provider_unknown", declined ? "declined" : "no answer");
    throw declined
      ? refundRuleError(REFUND_DECLINED_MESSAGE, "REFUND_DECLINED")
      : refundRuleError(REFUND_NOT_CONFIRMED_MESSAGE, "REFUND_NOT_CONFIRMED");
  }
  const status = String(providerResult?.status || "").toLowerCase();
  const usable =
    (providerResult?.id || providerResult?.refundId || providerResult?.data?.id) &&
    ["succeeded", "completed", "refunded"].includes(status) &&
    Number(providerResult.amount) === amount &&
    (!providerResult.currency || String(providerResult.currency).toUpperCase() === String(input.currency).toUpperCase());
  if (!usable) {
    // Pending or mismatched: money may still move, so this is unknown, settled later from the processor's refund list.
    await release("provider_unknown", `unconfirmed result: ${String(providerResult?.status || "none").slice(0, 40)}`);
    throw refundRuleError(REFUND_NOT_CONFIRMED_MESSAGE, "REFUND_NOT_CONFIRMED");
  }
  await prisma.idempotencyKey.update({
    where: { id: attempt.id },
    data: { recoveryPoint: "provider_refunded", responseBody: { ...body, providerResult }, lockedAt: new Date() },
  });
  attempt.recoveryPoint = "provider_refunded";
  return providerResult;
}

/** A locked attempt that is not finished: its processor call may still be running, or just answered "unknown". */
export function leaseIsFresh(attempt: any, now = Date.now()) {
  return !!attempt?.lockedAt && now - new Date(attempt.lockedAt).getTime() < REFUND_LOCK_MS;
}

/**
 * The rule for sending an existing attempt again (staff Retry, double click, reload), after reconcile ran:
 * - "failed": a decline or ledger refusal is final for its key;
 * - "amount_reserved": the first call is running (fresh lease) or the processor could not be asked about it;
 * - "provider_unknown": Retry resends the same key, but past the lease only once the processor was checked.
 */
export function assertRefundReplayAllowed(attempt: any, reconciled: boolean, now = Date.now()) {
  if (attempt.recoveryPoint === "failed") {
    throw attempt.responseCode === 409
      ? refundRuleError(REFUND_BALANCE_TAKEN_MESSAGE, "REFUND_EXCEEDS_BALANCE")
      : refundRuleError(REFUND_DECLINED_MESSAGE, "REFUND_DECLINED");
  }
  if (attempt.recoveryPoint === "amount_reserved") {
    if (leaseIsFresh(attempt, now)) throw refundRuleError("This refund is already being sent. Wait a moment and reload the order.", "REFUND_IN_PROGRESS");
    throw refundRuleError("The processor could not be reached to check this refund. Try again shortly.", "REFUND_NOT_CONFIRMED");
  }
  if (attempt.recoveryPoint === "provider_unknown" && !leaseIsFresh(attempt, now) && !reconciled) {
    throw refundRuleError("The processor could not be reached to check this refund. Try again shortly.", "REFUND_NOT_CONFIRMED");
  }
}

/** Refuse a new refund while another one on the payment is waiting for the processor's answer. */
export async function assertNoRefundAwaitingProcessor(prisma: any, paymentId: string) {
  const pending = await prisma.idempotencyKey.findFirst({
    where: {
      requestPath: { in: ["refundOrderPayment", "processReturnRefund"] },
      recoveryPoint: { in: ["amount_reserved", "provider_unknown"] },
      lockedAt: { gt: new Date(Date.now() - REFUND_LOCK_MS) },
      requestParams: { path: ["paymentId"], equals: paymentId },
    },
    select: { id: true },
  });
  if (pending) throw refundRuleError("A refund on this payment is waiting for the processor. Retry that refund, or wait five minutes.", "REFUND_IN_PROGRESS");
}

/** The processor key an attempt was (or will be) sent under; attempts from before the payment-scoped key keep theirs. */
export function attemptProviderKey(attempt: any, fallback: string) {
  return typeof attempt?.responseBody?.providerKey === "string" ? attempt.responseBody.providerKey : fallback;
}

/**
 * Give an attempt's reservation back exactly once: the processor refused the refund ("failed", final for this key)
 * or never confirmed it ("provider_unknown"; the next refund or Retry checks the processor first).
 */
export async function releaseRefundReservation(
  prisma: any,
  input: { attemptId: string; paymentId: string; amount: number; outcome: "failed" | "provider_unknown"; message: string; providerKey?: string }
) {
  return prisma.$transaction(async (tx: any) => {
    const moved = await tx.idempotencyKey.updateMany({
      where: { id: input.attemptId, recoveryPoint: "amount_reserved" },
      data: {
        recoveryPoint: input.outcome,
        responseBody: { error: input.message, reservedAmount: input.amount, ...(input.providerKey ? { providerKey: input.providerKey } : {}) },
        // An unanswered call may still land at the processor: keep the lease so no other refund races it.
        lockedAt: input.outcome === "failed" ? null : new Date(),
      },
    });
    if (moved.count !== 1) return false;
    await tx.payment.updateMany({
      where: { id: input.paymentId, amountRefunded: { gte: input.amount } },
      data: { amountRefunded: { decrement: input.amount } },
    });
    return true;
  });
}

type Attempt = { id: string; idempotencyKey: string; amount: number; reserved: boolean; providerConfirmed: boolean };

/**
 * What to settle for one payment, given what the processor says it gave back. Pure, so the arithmetic is tested alone.
 * - in-flight attempts (fresh lock) may already be counted by the processor: they are left alone and their amount set aside;
 * - processor money not yet recorded is matched to stuck attempts, oldest and processor-confirmed first, while it fits;
 * - anything left over becomes one reconciliation refund;
 * - stuck attempts still holding a reservation the processor does not show are released.
 */
export function planRefundReconcile<T extends Attempt>(input: {
  amount: number;
  amountRefunded: number;
  recorded: number;
  providerRefunded: number;
  inFlight: number;
  stuck: T[];
}) {
  const providerRefunded = Math.min(Math.max(0, Math.trunc(input.providerRefunded || 0)), input.amount);
  let remaining = Math.max(0, providerRefunded - input.recorded - input.inFlight);
  const matched: T[] = [];
  const ordered = [...input.stuck].sort((a, b) => Number(b.providerConfirmed) - Number(a.providerConfirmed));
  for (const attempt of ordered) {
    if (attempt.amount > 0 && attempt.amount <= remaining) {
      matched.push(attempt);
      remaining -= attempt.amount;
    }
  }
  const released = input.stuck.filter((a) => !matched.includes(a) && a.reserved && !a.providerConfirmed);
  const extra = remaining;
  const delta =
    matched.filter((a) => !a.reserved).reduce((sum, a) => sum + a.amount, 0) +
    extra -
    released.reduce((sum, a) => sum + a.amount, 0);
  return { matched, released, extra, amountRefunded: input.amountRefunded + delta };
}

/**
 * Settle one card payment against its processor: refunds the processor made that this store never recorded become
 * Refund rows, and reservations left by a refund call that never answered are given back. Staff reach it from the
 * order page ("Check with processor"); every new refund runs it first. Throws when the processor cannot be asked.
 */
export async function reconcilePaymentRefunds(context: any, paymentId: string) {
  const sudo = context.sudo();
  const now = Date.now();
  const payment = await sudo.query.Payment.findOne({
    where: { id: paymentId },
    query: `id status amount data order { id }
      paymentCollection { paymentSessions { isSelected paymentProvider { id code getPaymentStatusFunction credentials } } }`,
  });
  const none = { recorded: [] as any[], released: 0 };
  if (!payment || payment.status !== "captured" || payment.data?.tender === GIFT_CARD_TENDER) return none;
  const provider = paymentProviderFor(payment);
  const reference = providerPaymentReference(payment);
  if (!provider || !reference || String(provider.code || "").includes("manual") || provider.code === "pp_system_default") return none;

  const status = await getPaymentStatus({ provider, paymentId: reference, includeRefunds: true });
  if (!Array.isArray(status.refunds)) throw new Error("This processor does not report refunds; check it directly");
  const providerRefunded = status.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  const endpointIds = await subscribedWebhookEndpointIds(sudo, "refund.created");

  return sudo.prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${paymentId} FOR UPDATE`;
    const current = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, amountRefunded: true, orderId: true, refunds: { select: { amount: true, idempotencyKey: true } } },
    });
    const recorded = current.refunds.reduce((sum: number, refund: any) => sum + refund.amount, 0);
    const recordedKeys = new Set(current.refunds.map((refund: any) => refund.idempotencyKey));
    const rows = await tx.idempotencyKey.findMany({
      where: {
        requestPath: { in: ["refundOrderPayment", "processReturnRefund"] },
        recoveryPoint: { in: ["amount_reserved", "provider_refunded", "provider_unknown"] },
        requestParams: { path: ["paymentId"], equals: paymentId },
      },
      orderBy: { createdAt: "asc" },
    });
    let inFlight = 0;
    const stuck: (Attempt & { row: any })[] = [];
    for (const row of rows) {
      if (recordedKeys.has(row.idempotencyKey)) continue;
      const amount = attemptAmount(row);
      const fresh = row.lockedAt && now - new Date(row.lockedAt).getTime() < REFUND_LOCK_MS;
      // A fresh attempt may still land at the processor (and attempts from before reservations were recorded have
      // no amount): their money is set aside so it is never recorded twice.
      if (fresh || amount <= 0) {
        inFlight += amount;
        continue;
      }
      stuck.push({
        id: row.id, idempotencyKey: row.idempotencyKey, amount, row,
        reserved: row.recoveryPoint !== "provider_unknown",
        providerConfirmed: row.recoveryPoint === "provider_refunded",
      });
    }
    const plan = planRefundReconcile({ amount: current.amount, amountRefunded: current.amountRefunded, recorded, providerRefunded, inFlight, stuck });
    if (!plan.matched.length && !plan.released.length && !plan.extra) return none;
    if (plan.amountRefunded > current.amount || plan.amountRefunded < 0) {
      throw new Error("Recorded refunds disagree with the processor; review this payment");
    }
    const metadata = { providerId: provider.id, reconciled: true, providerRefunded, providerRefunds: status.refunds };
    const created: any[] = [];
    for (const attempt of plan.matched) {
      const returnId = attempt.row.requestPath === "processReturnRefund" ? String(attempt.row.requestParams?.returnId || "") : "";
      const refund = await tx.refund.create({
        data: {
          amount: attempt.amount, reason: returnId ? "return" : "other",
          note: returnId ? `Return ${returnId}` : String(attempt.row.requestParams?.reason || "Refunded at the processor; recorded on reconcile"),
          idempotencyKey: attempt.idempotencyKey, payment: { connect: { id: paymentId } }, metadata,
        },
      });
      if (returnId) {
        const record = await tx.return.findUnique({ where: { id: returnId }, select: { metadata: true } });
        await tx.return.update({
          where: { id: returnId },
          data: { status: "received", receivedAt: new Date(), metadata: { ...((record?.metadata as object) || {}), refundId: refund.id, refundStatus: "completed" } },
        });
      }
      await tx.idempotencyKey.update({
        where: { id: attempt.id },
        data: { recoveryPoint: "completed", responseCode: 200, responseBody: { refundId: refund.id, providerResult: { status: "succeeded", amount: attempt.amount, reconciled: true } }, lockedAt: null },
      });
      created.push(refund);
    }
    if (plan.extra > 0) {
      created.push(await tx.refund.create({
        data: {
          amount: plan.extra, reason: "other", note: "Refunded at the processor; recorded on reconcile",
          idempotencyKey: `reconcile:${paymentId}:${providerRefunded}`, payment: { connect: { id: paymentId } }, metadata,
        },
      }));
    }
    for (const attempt of plan.released) {
      await tx.idempotencyKey.update({
        where: { id: attempt.id },
        data: { recoveryPoint: "provider_unknown", responseBody: { ...(attempt.row.responseBody || {}), error: "The processor shows no refund for this request", reservedAmount: attempt.amount }, lockedAt: null },
      });
    }
    await tx.payment.update({ where: { id: paymentId }, data: { amountRefunded: plan.amountRefunded } });
    for (const refund of created) {
      await tx.orderEvent.create({
        data: { orderId: current.orderId, type: "REFUND_PROCESSED", data: { refundId: refund.id, amount: refund.amount, reconciled: true }, time: new Date(), userId: context.session?.itemId, createdById: context.session?.itemId },
      });
      await enqueueWebhookOutbox(tx, endpointIds, "refund.created", "Refund", refund.id, { id: refund.id, paymentId, orderId: current.orderId, amount: refund.amount });
    }
    return { recorded: created, released: plan.released.reduce((sum, a) => sum + a.amount, 0) };
  });
}
