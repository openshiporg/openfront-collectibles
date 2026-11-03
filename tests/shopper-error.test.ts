import assert from "node:assert/strict";
import test from "node:test";
import { GraphQLError } from "graphql";
import updateActiveCart from "../features/keystone/mutations/updateActiveCart";
import updateActiveCartLineItem from "../features/keystone/mutations/updateActiveCartLineItem";
import { assertCartAccess, assertLineItemBelongsToCart } from "../features/keystone/security/cart-access";
import { normalizeActiveCartInput } from "../features/keystone/security/active-cart-input";
import { shopperError } from "../features/keystone/lib/shopperError";

// Signed-in owner of cart c1; `lineItems` are the cart's rows, `cart` overrides the access row.
function context(opts: { cart?: any; lineItems?: any[]; lineItemCart?: string } = {}) {
  const cart = opts.cart === undefined ? { id: "c1", user: { id: "owner" }, order: null } : opts.cart;
  const ctx: any = { session: { itemId: "owner", listKey: "User", data: { isActive: true, role: null } }, req: { headers: {} } };
  ctx.sudo = () => ({
    query: {
      Cart: { findOne: async (a: any) => (a.query.includes("lineItems") ? { id: "c1", lineItems: opts.lineItems ?? [] } : cart) },
      LineItem: { findOne: async () => ({ id: "l1", cart: { id: opts.lineItemCart ?? "c1" } }) },
    },
    prisma: {},
  });
  return ctx;
}
const is = (message: string, code: string) => (e: unknown) =>
  e instanceof GraphQLError && e.message === message && e.extensions.code === code;
const update = (data: any, ctx = context()) => updateActiveCart(null, { cartId: "c1", data }, ctx);

test("region change after items are added is CART_REGION_LOCKED", async () => {
  await assert.rejects(
    update({ region: { connect: { id: "r2" } } }, context({ lineItems: [{ id: "l1", quantity: 1, productVariant: { id: "v" } }] })),
    is("Region cannot change after items are added; start a new cart", "CART_REGION_LOCKED"),
  );
});

test("a malformed address relation is INVALID_CART_INPUT", async () => {
  await assert.rejects(update({ shippingAddress: { connect: {} } }), (e: any) => e instanceof GraphQLError && e.extensions.code === "INVALID_CART_INPUT");
});

test("invalid quantities are INVALID_QUANTITY", async () => {
  await assert.rejects(
    update({ lineItems: { update: [{ where: { id: "l1" }, data: { quantity: 0 } }] } }),
    is("Line item quantity must be an integer between 1 and 99", "INVALID_QUANTITY"),
  );
  await assert.rejects(updateActiveCartLineItem(null, { cartId: "c1", lineId: "l1", quantity: -1 }, context() as any), is("Quantity must be a positive integer", "INVALID_QUANTITY"));
});

test("a line item from another cart is LINE_ITEM_NOT_FOUND", async () => {
  await assert.rejects(assertLineItemBelongsToCart(context({ lineItemCart: "other" }), "c1", "l1"), is("Line item not found", "LINE_ITEM_NOT_FOUND"));
});

test("a completed cart is CART_COMPLETED", async () => {
  await assert.rejects(assertCartAccess(context({ cart: { id: "c1", user: { id: "owner" }, order: { id: "o1" } } }), "c1"), is("Cart has already been completed", "CART_COMPLETED"));
});

test("empty cart changes are INVALID_CART_INPUT", () => {
  assert.throws(() => normalizeActiveCartInput({}), is("Cart changes are empty", "INVALID_CART_INPUT"));
});

test("a foreign cart is still CART_NOT_FOUND", async () => {
  const ctx = context({ cart: { id: "c1", user: { id: "someone-else" }, order: null } });
  await assert.rejects(update({ email: "a@b.co" }, ctx), is("Cart not found", "CART_NOT_FOUND"));
});

test("internal errors stay plain Errors (masked)", async () => {
  const ctx = context();
  const sudo = ctx.sudo;
  ctx.sudo = () => ({ ...sudo(), query: { ...sudo().query, Cart: { findOne: async (a: any) => { if (a.query.includes("lineItems")) throw new Error("db down"); return { id: "c1", user: { id: "owner" }, order: null }; } } } });
  await assert.rejects(update({ email: "a@b.co" }, ctx), (e: unknown) => e instanceof Error && !(e instanceof GraphQLError) && e.message === "db down");
});

test("shopperError carries the code", () => {
  assert.equal(shopperError("x", "Y").extensions.code, "Y");
});
