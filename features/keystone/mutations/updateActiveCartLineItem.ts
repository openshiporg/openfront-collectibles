import type * as Generated from '.keystone/types';
import { assertLineItemBelongsToCart } from "../security/cart-access";
import { assertPreorderLimit } from "../lib/pokemon/preorder-limit";

async function updateActiveCartLineItem(root: unknown, { cartId, lineId, quantity }: { cartId: string; lineId: string; quantity: number }, context: Generated.Context) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }
  await assertLineItemBelongsToCart(context, cartId, lineId);
  const sudoContext = context.sudo();
  const line = await sudoContext.prisma.lineItem.findUnique({ where: { id: lineId }, select: { productVariantId: true } });
  if (line?.productVariantId) {
    await assertPreorderLimit(sudoContext.prisma, { cartId, variantId: line.productVariantId, quantity });
  }

  // Update line item quantity
  const updatedLineItem = await sudoContext.query.LineItem.updateOne({
    where: { id: lineId },
    data: { quantity }
  });

  // Return the updated cart with all its data
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}

export default updateActiveCartLineItem; 