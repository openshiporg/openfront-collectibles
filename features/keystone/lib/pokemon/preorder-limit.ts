// Pre-order allocation limits: a customer may hold at most the variant's limit across
// this cart and their earlier, uncancelled orders. Guests are limited per cart.

/** `quantity` is the line's total after the change; `adding` is how many this change adds, when known. */
export async function assertPreorderLimit(prisma: any, { cartId, variantId, quantity, adding }: { cartId: string; variantId: string; quantity: number; adding?: number }) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { preorder: true, preorderLimitPerCustomer: true, title: true, product: { select: { title: true } } },
  });
  const limit = variant?.preorder ? variant.preorderLimitPerCustomer : null;
  if (!limit) return;
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, select: { userId: true } });
  const earlier = cart?.userId
    ? await prisma.orderLineItem.aggregate({
        where: { productVariantId: variantId, order: { userId: cart.userId, status: { not: 'canceled' } } },
        _sum: { quantity: true },
      })
    : null;
  const held = earlier?._sum?.quantity ?? 0;
  if (held + quantity > limit) {
    const name = variant?.product?.title ?? 'this pre-order';
    const inCart = adding != null ? quantity - adding : null;
    const left = inCart != null ? Math.max(0, limit - held - inCart) : null;
    const have = held + (inCart ?? 0);
    throw new Error(left
      ? `${name} is limited to ${limit} per customer; you can add ${left} more`
      : have
        ? `${name} is limited to ${limit} per customer, and you already have ${have}`
        : `${name} is limited to ${limit} per customer`);
  }
}
