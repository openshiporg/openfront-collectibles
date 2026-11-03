import assert from "node:assert/strict";
import test from "node:test";
import { GraphQLError } from "graphql";
import { assertCartAccess } from "../features/keystone/security/cart-access";

// Signed-in customer session without a role; the cart row is returned by the mocked sudo query.
function context(userId: string, cart: { id: string; user: { id: string } | null } | null) {
  const ctx: any = {
    session: { itemId: userId, listKey: "User", data: { isActive: true, role: null } },
    req: { headers: {} },
  };
  ctx.withSession = (session: any) => ({ ...ctx, session });
  ctx.sudo = () => ({
    query: { Cart: { findOne: async () => cart } },
    prisma: { user: { findUnique: async () => ({ id: userId, role: null }) } },
  });
  return ctx;
}

const refused = (error: unknown) =>
  error instanceof GraphQLError && error.message === "Cart not found" && error.extensions.code === "CART_NOT_FOUND";

test("someone else's cart is a clear GraphQL refusal, not a masked plain Error", async () => {
  await assert.rejects(assertCartAccess(context("stranger", { id: "c1", user: { id: "owner" } }), "c1"), refused);
});

test("a missing cart gets the same refusal (no existence oracle)", async () => {
  await assert.rejects(assertCartAccess(context("stranger", null), "c404"), refused);
});

test("anonymous callers without a cart proof get the same refusal", async () => {
  const anonymous = context("x", { id: "c1", user: null });
  anonymous.session = undefined;
  await assert.rejects(assertCartAccess(anonymous, "c1"), refused);
});

test("the owner still reads the cart", async () => {
  const cart = await assertCartAccess(context("owner", { id: "c1", user: { id: "owner" } }), "c1");
  assert.equal(cart.id, "c1");
});
