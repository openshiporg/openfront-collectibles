import test from "node:test";
import assert from "node:assert/strict";
import payTradeInSubmission from "../features/keystone/mutations/payTradeInSubmission";

// The payout counts bought cards against the buylist limit with one conditional increment.
function harness(entry: { maximumQuantity: number | null; quantityBought: number }) {
  const submissions: Record<string, any> = {};
  const prisma: any = {
    tradeInSubmission: {
      findUnique: async ({ where }: any) => submissions[where.id],
      updateMany: async ({ where, data }: any) => {
        const s = submissions[where.id];
        if (!s || s.status !== where.status) return { count: 0 };
        s.status = data.status; return { count: 1 };
      },
    },
    $executeRaw: async (_strings: TemplateStringsArray, quantity: number) => {
      if (entry.maximumQuantity != null && entry.quantityBought + quantity > entry.maximumQuantity) return 0;
      entry.quantityBought += quantity; return 1;
    },
    buylistEntry: { findUnique: async () => ({ ...entry, catalogItem: { title: "Charizard ex 199/165" } }) },
    giftCard: { findFirst: async () => null, create: async ({ data }: any) => ({ id: "gc1", ...data }) },
    notification: { create: async () => ({}) },
  };
  prisma.$transaction = async (fn: any) => {
    const snapshot = JSON.stringify({ entry, submissions });
    try { return await fn(prisma); } catch (e) {
      const back = JSON.parse(snapshot); Object.assign(entry, back.entry); Object.assign(submissions, back.submissions); throw e;
    }
  };
  const context: any = { session: { data: { role: { canManageConsignments: true } } }, sudo: () => ({ prisma }) };
  const add = (id: string, quantity: number) => {
    submissions[id] = { id, status: "accepted", disposition: "cash", reference: id, customer: null, items: [{ buylistEntryId: "e1", quantity, acceptedAmountMinor: 500 }] };
  };
  return { entry, submissions, context, add };
}

test("payout counts the cards against the buylist", async () => {
  const h = harness({ maximumQuantity: 4, quantityBought: 0 });
  h.add("t1", 3);
  await payTradeInSubmission(null, { id: "t1" }, h.context);
  assert.equal(h.entry.quantityBought, 3);
  assert.equal(h.submissions.t1.status, "paid");
});

test("a payout past the buylist limit is refused and nothing moves", async () => {
  const h = harness({ maximumQuantity: 4, quantityBought: 3 });
  h.add("t2", 2);
  await assert.rejects(payTradeInSubmission(null, { id: "t2" }, h.context), (e: any) => {
    assert.match(e.message, /only wants 1 more of Charizard ex 199\/165, and this trade-in has 2/);
    assert.equal(e.extensions?.code, "TRANSITION_REFUSED");
    return true;
  });
  assert.equal(h.entry.quantityBought, 3);
  assert.equal(h.submissions.t2.status, "accepted");
});

test("an uncapped entry still counts", async () => {
  const h = harness({ maximumQuantity: null, quantityBought: 7 });
  h.add("t3", 5);
  await payTradeInSubmission(null, { id: "t3" }, h.context);
  assert.equal(h.entry.quantityBought, 12);
});

test("a trade-in with an unpriced card can't be paid", async () => {
  const h = harness({ maximumQuantity: null, quantityBought: 0 });
  h.add("t4", 1);
  h.submissions.t4.items[0].acceptedAmountMinor = null;
  await assert.rejects(payTradeInSubmission(null, { id: "t4" }, h.context), /accepted amount/);
  assert.equal(h.submissions.t4.status, "accepted");
  assert.equal(h.entry.quantityBought, 0);
});
