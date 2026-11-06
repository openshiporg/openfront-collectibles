import test from "node:test";
import assert from "node:assert/strict";
import { commitGiftCardHold, holdGiftCards, refundGiftCardTender, releaseGiftCardHold } from "../features/keystone/checkout/gift-card-tender";

function fakePrisma(cards: Record<string, { balance: number; isDisabled?: boolean }>) {
  const keys = new Map<string, any>();
  const payments: any[] = [];
  const transactions: any[] = [];
  const refunds: any[] = [];
  const prisma: any = {
    idempotencyKey: {
      findUnique: async ({ where }: any) => keys.get(where.idempotencyKey) || null,
      create: async ({ data }: any) => { const row = { id: `k${keys.size}`, ...data }; keys.set(data.idempotencyKey, row); return row; },
      update: async ({ where, data }: any) => { const row = [...keys.values()].find((r) => r.id === where.id); Object.assign(row, data); return row; },
      updateMany: async ({ where, data }: any) => { const row = [...keys.values()].find((r) => r.id === where.id && r.recoveryPoint === where.recoveryPoint); if (!row) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
    },
    giftCard: {
      updateMany: async ({ where, data }: any) => { const c = cards[where.id]; if (!c || c.isDisabled || c.balance < where.balance.gte) return { count: 0 }; c.balance -= data.balance.decrement; return { count: 1 }; },
      update: async ({ where, data }: any) => { cards[where.id].balance += data.balance.increment; return cards[where.id]; },
    },
    payment: {
      create: async ({ data }: any) => { const p = { id: `p${payments.length}`, amountRefunded: 0, ...data }; payments.push(p); return p; },
      findUnique: async ({ where }: any) => payments.find((p) => p.id === where.id) || null,
      updateMany: async ({ where, data }: any) => { const p = payments.find((x) => x.id === where.id); if (!p || p.amountRefunded > where.amountRefunded.lte) return { count: 0 }; p.amountRefunded += data.amountRefunded.increment; return { count: 1 }; },
    },
    giftCardTransaction: {
      create: async ({ data }: any) => { transactions.push(data); return data; },
      findMany: async ({ where }: any) => transactions.filter((t) => t.orderId === where.orderId && t.amount > 0),
    },
    refund: {
      findFirst: async ({ where }: any) => refunds.find((r) => r.idempotencyKey === where.idempotencyKey) || null,
      create: async ({ data }: any) => { const r = { id: `r${refunds.length}`, ...data }; refunds.push(r); return r; },
    },
    orderEvent: { create: async ({ data }: any) => data },
  };
  prisma.$transaction = async (fn: any) => fn(prisma);
  return { prisma, keys, payments, transactions, refunds };
}

const allocation = { gross: 5000, applied: [{ id: "gc1", code: "SC-AAAA-BBBB-CCCC-DDDD", amount: 3000 }], due: 2000 };

test("hold debits once, replay does not debit again, commit records a gift-card payment", async () => {
  const cards = { gc1: { balance: 3000 } };
  const { prisma, payments, transactions } = fakePrisma(cards);
  await holdGiftCards(prisma, "cart1", allocation);
  await holdGiftCards(prisma, "cart1", allocation);
  assert.equal(cards.gc1.balance, 0);
  await commitGiftCardHold(prisma, "cart1", { id: "o1" }, "USD", null);
  await commitGiftCardHold(prisma, "cart1", { id: "o1" }, "USD", null);
  assert.equal(payments.length, 1);
  assert.equal(payments[0].amount, 3000);
  assert.equal(payments[0].data.tender, "gift_card");
  assert.equal(payments[0].data.giftCards[0].last4, "DDDD");
  assert.deepEqual(transactions.map((t) => t.amount), [-3000]);
});

test("a balance that moved since pricing fails the hold", async () => {
  const cards = { gc1: { balance: 1000 } };
  const { prisma } = fakePrisma(cards);
  await assert.rejects(holdGiftCards(prisma, "cart1", allocation), /balance changed/);
  assert.equal(cards.gc1.balance, 1000);
});

test("release returns the held balance exactly once", async () => {
  const cards = { gc1: { balance: 3000 } };
  const { prisma } = fakePrisma(cards);
  await holdGiftCards(prisma, "cart1", allocation);
  await releaseGiftCardHold(prisma, "cart1", "card declined");
  await releaseGiftCardHold(prisma, "cart1", "card declined");
  assert.equal(cards.gc1.balance, 3000);
});

test("refund puts value back on the card, never more than was spent, and replays", async () => {
  const cards = { gc1: { balance: 3000 } };
  const { prisma, payments, refunds } = fakePrisma(cards);
  await holdGiftCards(prisma, "cart1", allocation);
  await commitGiftCardHold(prisma, "cart1", { id: "o1" }, "USD", null);
  const base = { orderId: "o1", paymentId: payments[0].id, reason: "QA", userId: "u1" };
  await refundGiftCardTender(prisma, { ...base, amount: 1000, businessKey: "refund:a" });
  await refundGiftCardTender(prisma, { ...base, amount: 1000, businessKey: "refund:a" });
  assert.equal(cards.gc1.balance, 1000);
  assert.equal(refunds.length, 1);
  await refundGiftCardTender(prisma, { ...base, amount: 2000, businessKey: "refund:b" });
  assert.equal(cards.gc1.balance, 3000);
  await assert.rejects(refundGiftCardTender(prisma, { ...base, amount: 1, businessKey: "refund:c" }), /exceeds/);
});
