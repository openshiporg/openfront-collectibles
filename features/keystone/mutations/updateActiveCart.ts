import {
  assertAddressAccess,
  assertCartAccess,
  assertLineItemBelongsToCart,
} from "../security/cart-access";
import { normalizeActiveCartInput } from "../security/active-cart-input";

async function updateActiveCart(
  root: any,
  { cartId, data }: { cartId: string; data: any },
  context: any
) {
  await assertCartAccess(context, cartId);
  const safeData = normalizeActiveCartInput(data, context.session?.itemId);
  const sudoContext = context.sudo();

  // First verify this cart exists
  const existingCart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      lineItems {
        id
        quantity
        productVariant {
          id
        }
      }
    `
  });

  if (!existingCart) {
    throw new Error("Cart not found");
  }
  if (safeData.region && existingCart.lineItems?.length) {
    throw new Error("Region cannot change after items are added; start a new cart");
  }

  // Commercial state and every nested write are constructed from a narrow DTO.
  for (const relation of [safeData.shippingAddress, safeData.billingAddress]) {
    const addressId = relation?.connect?.id;
    if (addressId) await assertAddressAccess(context, addressId);
    if (!addressId) throw new Error("Address ID is required");
  }

  const existingLineItemIds = [
    ...(safeData?.lineItems?.disconnect || []),
    ...(safeData?.lineItems?.update || []).map((entry: any) => entry.where),
  ]
    .map((entry) => entry?.id)
    .filter(Boolean);
  for (const lineItemId of existingLineItemIds) {
    await assertLineItemBelongsToCart(context, cartId, lineItemId);
  }

  // Existing line items may only be changed through their validated parent cart.
  for (const entry of safeData?.lineItems?.update || []) {
    if (
      entry.data?.quantity !== undefined &&
      (!Number.isInteger(entry.data.quantity) || entry.data.quantity <= 0 || entry.data.quantity > 99)
    ) {
      throw new Error("Line item quantity must be a positive integer");
    }
  }

  // Handle duplicate line items if we're adding new ones
  if (safeData?.lineItems?.create?.length) {
    for (const newItem of safeData.lineItems.create) {
      if (
        !newItem.productVariant?.connect?.id ||
        !Number.isInteger(newItem.quantity) ||
        newItem.quantity <= 0
      ) {
        throw new Error("A variant and positive integer quantity are required");
      }
      const variantId = newItem.productVariant.connect.id;
      const variant = await sudoContext.query.ProductVariant.findOne({
        where: { id: variantId },
        query: "id product { id status }",
      });
      if (!variant || variant.product?.status !== "published") {
        throw new Error("Product variant is unavailable");
      }
      const existingLineItem = existingCart.lineItems?.find(
        (item: any) => item.productVariant.id === variantId
      );

      if (existingLineItem) {
        // Update existing line item using graphql.raw
        await context.graphql.raw({
          query: `
            mutation UpdateActiveCartLineItem($cartId: ID!, $lineId: ID!, $quantity: Int!) {
              updateActiveCartLineItem(cartId: $cartId, lineId: $lineId, quantity: $quantity) {
                id
              }
            }
          `,
          variables: {
            cartId,
            lineId: existingLineItem.id,
            quantity: existingLineItem.quantity + newItem.quantity
          }
        });
        // Remove the create operation since we handled it
        // Duplicate variants are updated through the dedicated, ownership-checked command.
        safeData.lineItems.create = safeData.lineItems.create.filter(
          (item: any) => item.productVariant.connect.id !== variantId
        );
      }
    }
  }

  // Payment sessions are invalidated whenever quote-affecting cart data changes.
  if (
    safeData.email !== undefined || safeData.region || safeData.shippingAddress ||
    safeData.billingAddress || safeData.lineItems
  ) {
    safeData.paymentCollection = { disconnect: true };
  }

  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data: safeData,
  });
}

export default updateActiveCart;

