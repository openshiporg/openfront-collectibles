import { shopperError } from "../lib/shopperError";

/**
 * Gift cards and store credit as a checkout tender (Shopify model: the card pays first, the
 * remaining balance goes to the card processor, refunds go back onto the card).
 *
 * Balances are held when stock and discounts are reserved, using a durable hold row so a
 * replayed or recovered checkout never debits twice. The hold becomes a captured "gift card"
 * Payment plus GiftCardTransaction rows when the order commits, or is returned on failure.
 */

export type GiftCardAllocation = { gross: number; applied: { id: string; code?: string; amount: number }[]; due: number };
type HoldBody = GiftCardAllocation & { cartId: string; orderId?: string; paymentId?: string };

export const giftCardHoldKey = (cartId: string) => `giftcard-hold:${cartId}`;
export const GIFT_CARD_TENDER = "gift_card";

export async function findGiftCardHold(prisma: any, cartId: string): Promise<{ status: string; body: HoldBody } | null> {
  const row = await prisma.idempotencyKey.findUnique({ where: { idempotencyKey: giftCardHoldKey(cartId) } });
  if (!row || !["held", "committed"].includes(row.recoveryPoint)) return null;
  return { status: row.recoveryPoint, body: row.responseBody as HoldBody };
}

/** Debit each applied card by its share. Fails the checkout if a balance moved since the cart was priced. */
export async function holdGiftCards(prisma: any, cartId: string, allocation: GiftCardAllocation): Promise<GiftCardAllocation> {
  if (!allocation.applied.length) return allocation;
  return prisma.$transaction(async (tx: any) => {
    const key = giftCardHoldKey(cartId);
    const existing = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: key } });
    if (existing && ["held", "committed"].includes(existing.recoveryPoint)) return existing.responseBody as GiftCardAllocation;
    const now = new Date();
    for (const card of allocation.applied) {
      const debited = await tx.giftCard.updateMany({
        where: { id: card.id, isDisabled: false, balance: { gte: card.amount }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        data: { balance: { decrement: card.amount } },
      });
      if (debited.count !== 1) {
        throw shopperError("A gift card balance changed. Review your order and try again.", "GIFT_CARD_BALANCE_CHANGED");
      }
    }
    const body: HoldBody = { ...allocation, cartId };
    const data = { requestPath: "giftCardHold", requestMethod: "POST", requestParams: { cartId }, recoveryPoint: "held", responseBody: body, lockedAt: null };
    if (existing) await tx.idempotencyKey.update({ where: { id: existing.id }, data });
    else await tx.idempotencyKey.create({ data: { idempotencyKey: key, ...data } });
    return allocation;
  });
}

/** Return held balances when checkout fails before an order exists. */
export async function releaseGiftCardHold(prisma: any, cartId: string, reason: string): Promise<void> {
  await prisma.$transaction(async (tx: any) => {
    const row = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: giftCardHoldKey(cartId) } });
    if (!row || row.recoveryPoint !== "held") return;
    const claimed = await tx.idempotencyKey.updateMany({
      where: { id: row.id, recoveryPoint: "held" },
      data: { recoveryPoint: "released", responseCode: 409, responseBody: { ...(row.responseBody || {}), releasedReason: reason.slice(0, 300) } },
    });
    if (claimed.count !== 1) return;
    for (const card of (row.responseBody as HoldBody).applied || []) {
      await tx.giftCard.update({ where: { id: card.id }, data: { balance: { increment: card.amount } } });
    }
  });
}

/** Turn the hold into the order's gift-card payment. Safe to call again for the same order. */
export async function commitGiftCardHold(prisma: any, cartId: string, order: { id: string }, currencyCode: string, userId?: string | null) {
  await prisma.$transaction(async (tx: any) => {
    const row = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: giftCardHoldKey(cartId) } });
    if (!row || row.recoveryPoint !== "held") return;
    const body = row.responseBody as HoldBody;
    const amount = body.applied.reduce((sum, card) => sum + card.amount, 0);
    const payment = await tx.payment.create({
      data: {
        status: "captured",
        amount,
        currencyCode,
        capturedAt: new Date(),
        idempotencyKey: giftCardHoldKey(cartId),
        orderId: order.id,
        userId: userId || null,
        data: { tender: GIFT_CARD_TENDER, provider: "Gift card", giftCards: body.applied.map((c) => ({ id: c.id, amount: c.amount, last4: c.code ? c.code.slice(-4) : null })) },
        metadata: { source: "checkout" },
      },
    });
    for (const card of body.applied) {
      await tx.giftCardTransaction.create({ data: { amount: -card.amount, giftCardId: card.id, orderId: order.id } });
    }
    await tx.orderEvent.create({
      data: { orderId: order.id, type: "PAYMENT_CAPTURED", data: { paymentId: payment.id, amount, currencyCode, source: "gift_card", giftCards: body.applied.map((c) => ({ last4: c.code ? c.code.slice(-4) : null, amount: c.amount })) } },
    });
    await tx.idempotencyKey.update({
      where: { id: row.id },
      data: { recoveryPoint: "committed", responseCode: 200, responseBody: { ...body, orderId: order.id, paymentId: payment.id } },
    });
  });
}

/**
 * Refund a gift-card payment by putting value back on the cards it came from, last card first.
 * Runs in one transaction with the Refund row; replays with the same key return the first refund.
 */
export async function refundGiftCardTender(
  prisma: any,
  input: { orderId: string; paymentId: string; amount: number; reason: string; businessKey: string; userId: string }
) {
  return prisma.$transaction(async (tx: any) => {
    const duplicate = await tx.refund.findFirst({ where: { idempotencyKey: input.businessKey } });
    if (duplicate) return duplicate;
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment || payment.orderId !== input.orderId || (payment.data as any)?.tender !== GIFT_CARD_TENDER) {
      throw new Error("Payment is not a gift-card payment on this order");
    }
    const reserved = await tx.payment.updateMany({
      where: { id: input.paymentId, amountRefunded: { lte: payment.amount - input.amount } },
      data: { amountRefunded: { increment: input.amount } },
    });
    if (reserved.count !== 1) throw new Error("Refund exceeds captured payment amount");
    // Value already returned to each card by earlier refunds on this payment.
    const prior = await tx.giftCardTransaction.findMany({ where: { orderId: input.orderId, amount: { gt: 0 } }, select: { giftCardId: true, amount: true } });
    const returned = new Map<string, number>();
    for (const row of prior) returned.set(row.giftCardId, (returned.get(row.giftCardId) || 0) + row.amount);
    let remaining = input.amount;
    const credited: { id: string; amount: number }[] = [];
    for (const card of [...((payment.data as any).giftCards || [])].reverse()) {
      if (remaining <= 0) break;
      const room = card.amount - (returned.get(card.id) || 0);
      const amount = Math.min(room, remaining);
      if (amount <= 0) continue;
      await tx.giftCard.update({ where: { id: card.id }, data: { balance: { increment: amount } } });
      await tx.giftCardTransaction.create({ data: { amount, giftCardId: card.id, orderId: input.orderId } });
      credited.push({ id: card.id, amount });
      remaining -= amount;
    }
    if (remaining > 0) throw new Error("Refund exceeds the gift-card amounts on this payment");
    const refund = await tx.refund.create({
      data: {
        amount: input.amount,
        reason: "other",
        note: input.reason,
        idempotencyKey: input.businessKey,
        payment: { connect: { id: input.paymentId } },
        metadata: { tender: GIFT_CARD_TENDER, credited, createdById: input.userId },
      },
    });
    await tx.orderEvent.create({
      data: { orderId: input.orderId, type: "REFUND_PROCESSED", data: { refundId: refund.id, amount: refund.amount, tender: GIFT_CARD_TENDER }, time: new Date(), userId: input.userId, createdById: input.userId },
    });
    return refund;
  });
}
