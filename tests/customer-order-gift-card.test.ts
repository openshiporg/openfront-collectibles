import test from "node:test";
import assert from "node:assert/strict";

test("customer order view keeps the gift-card tender without exposing the card id or code", async () => {
  const { projectCustomerOrderForRead } = await import("../features/keystone/lib/customer-order-projection");
  const order = projectCustomerOrderForRead({
    id: "o1",
    payments: [
      { id: "p1", amount: 798, status: "captured", createdAt: "2026-11-06", data: { id: "pi_x", client_secret: "secret", cardLast4: "4242" } },
      { id: "p2", amount: 500, status: "captured", createdAt: "2026-11-06", data: { tender: "gift_card", provider: "Gift card", giftCards: [{ id: "gc_internal", code: "GC-FULL-CODE", last4: "2611", amount: 500 }] } },
    ],
  }) as any;
  assert.deepEqual(order.payments[1].data, { provider: "Gift card", tender: "gift_card", giftCards: [{ amount: 500, last4: "2611" }] });
  assert.equal(order.payments[0].amount, 798);
  assert.equal(order.payments[0].data.client_secret, undefined);
  assert.equal(order.payments[0].data.tender, undefined);
});
