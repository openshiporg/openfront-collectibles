import crypto from "node:crypto";

/**
 * Issue digital gift cards bought on a paid order (Shopify model): one card per unit of a
 * gift-card product, valued at the unit price paid, emailed to the purchaser. Idempotent per
 * order line and unit, so recovery and replays never mint twice. Never fails the order.
 */
export function giftCardCode(prefix = "GC") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = Array.from(crypto.randomBytes(16), (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export async function issuePurchasedGiftCards(sudo: any, orderId: string): Promise<void> {
  try {
    const order = await sudo.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, email: true, displayId: true, userId: true, regionId: true,
        currency: { select: { code: true } },
        lineItems: { select: { id: true, quantity: true, title: true, productData: true, moneyAmount: { select: { amount: true } } } },
      },
    });
    if (!order) return;
    const lines = order.lineItems.filter((line: any) => (line.productData as any)?.isGiftcard === true && (line.moneyAmount?.amount || 0) > 0);
    if (!lines.length) return;
    const currencyCode = order.currency?.code?.toUpperCase() || "USD";
    const issued: { id: string; code: string; value: number }[] = [];
    for (const line of lines) {
      for (let unit = 0; unit < line.quantity; unit++) {
        const issueKey = `${line.id}:${unit}`;
        const existing = await sudo.prisma.giftCard.findFirst({ where: { metadata: { path: ["issueKey"], equals: issueKey } } });
        if (existing) continue;
        const card = await sudo.prisma.giftCard.create({
          data: {
            code: giftCardCode(),
            value: line.moneyAmount.amount,
            balance: line.moneyAmount.amount,
            orderId: order.id,
            regionId: order.regionId,
            metadata: { kind: "gift_card", source: "online_purchase", issueKey, orderLineItemId: line.id, currencyCode, purchaserId: order.userId || null },
          },
        });
        issued.push({ id: card.id, code: card.code, value: card.value });
      }
    }
    if (!issued.length || !order.email) return;
    await sudo.prisma.orderEvent.create({
      data: { orderId: order.id, type: "GIFT_CARDS_ISSUED", data: { count: issued.length, giftCardIds: issued.map((c) => c.id) } },
    });
    if (!process.env.SMTP_HOST) return;
    const { sendStoreCreditEmail } = await import("../lib/mail");
    for (const card of issued) {
      const result = await sendStoreCreditEmail({ to: order.email, code: card.code, amountMinor: card.value, currencyCode, reference: String(order.displayId), kind: "gift_card" });
      await sudo.prisma.notification.create({
        data: {
          eventName: "GIFT_CARD_ISSUED", resourceType: "GiftCard", resourceId: card.id, to: order.email, userId: order.userId || null,
          data: { orderId: order.id, status: result.sent ? "sent" : "failed", channel: "email", ...(result.sent ? { sentAt: new Date().toISOString() } : { error: result.error || "send_failed" }) },
        },
      });
    }
  } catch (error) {
    console.error("Gift card issue failed:", error instanceof Error ? error.message : "Unknown error");
  }
}
