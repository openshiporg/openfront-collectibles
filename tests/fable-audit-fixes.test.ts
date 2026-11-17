// Run: node --import tsx --test tests/fable-audit-fixes.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { giftCardCurrencyMismatch } from "../features/keystone/lib/cart-pricing-projection";
import { acceptedOrderDiscountAmounts } from "../features/keystone/lib/order-view-projection";
import { isAbandonedCartHold } from "../features/keystone/lib/lifecycles";

test("store credit in USD does not spend in a EUR cart", () => {
  assert.equal(giftCardCurrencyMismatch({ currencyCode: "USD" }, "eur"), true);
  assert.equal(giftCardCurrencyMismatch({ currencyCode: "USD" }, "usd"), false);
  // Ordinary gift cards carry no currency and keep their region rule.
  assert.equal(giftCardCurrencyMismatch({}, "eur"), false);
  assert.equal(giftCardCurrencyMismatch(null, "eur"), false);
});

test("orders read the discount the cart charged, split for tax", () => {
  const item = { taxRate: 0.08, metadata: { commercialSnapshot: { discountAmount: 1500, shippingDiscountAmount: 1000 } } };
  assert.deepEqual(acceptedOrderDiscountAmounts(item), { goods: 1500, shipping: 1000 });
  // Orders placed before the fix fall back to the old formula.
  assert.equal(acceptedOrderDiscountAmounts({ taxRate: 0, metadata: { commercialSnapshot: {} } }), null);
  assert.equal(acceptedOrderDiscountAmounts({ taxRate: 0, metadata: { commercialSnapshot: { discountAmount: -1, shippingDiscountAmount: 0 } } }), null);
});

test("a released checkout attempt can still be taken over once abandoned", () => {
  const hold = { purpose: "cart", status: "active", cartId: "c", expiresAt: new Date(0) };
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "started", lockedAt: null }, new Date()), true);
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "payment_unknown", lockedAt: null }, new Date()), false);
});
