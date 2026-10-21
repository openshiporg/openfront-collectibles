import { canIssueOwnedCartProof } from "../security/cart-proof-issuance";
import { createCartProof } from "../security/token-crypto";

export default async function createActiveCartProof(
  _root: unknown,
  { cartId }: { cartId: string },
  context: any,
): Promise<string> {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("A signed-in customer is required");

  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: "id user { id } order { id }",
  });
  if (!canIssueOwnedCartProof(context.session, cart)) {
    throw new Error("Cart not found");
  }

  return createCartProof(cart.id);
}
