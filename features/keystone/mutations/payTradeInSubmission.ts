import { transitionRefused } from "../lib/transitionRefused";
import { permissions } from "../access";
import { giftCardCode } from "../checkout/gift-card-issue";

/**
 * Pay out an accepted trade-in. Cash and trade payouts are recorded as paid. Store-credit payouts
 * issue a store-credit gift card for the accepted total, in one transaction with the status
 * change, and email the code to the customer (BinderPOS/TCGplayer model: credit lands on the
 * customer's account and is spent at checkout like a gift card).
 */
export default async function payTradeInSubmission(_root: unknown, { id }: { id: string }, context: any) {
  if (!permissions.canManageConsignments({ session: context.session })) throw new Error("Access denied");
  const sudo = context.sudo();

  const result = await sudo.prisma.$transaction(async (tx: any) => {
    const submission = await tx.tradeInSubmission.findUnique({
      where: { id },
      include: { items: true, customer: { select: { id: true, email: true, name: true } } },
    });
    if (!submission) throw new Error("Trade-in not found");
    if (submission.status === "paid") {
      const prior = await tx.giftCard.findFirst({ where: { metadata: { path: ["tradeInSubmissionId"], equals: id } } });
      return { submission, giftCard: prior, replay: true };
    }
    if (submission.status !== "accepted") throw transitionRefused(`Cannot pay a trade-in that is ${submission.status}`);
    const moved = await tx.tradeInSubmission.updateMany({ where: { id, status: "accepted" }, data: { status: "paid" } });
    if (moved.count !== 1) throw transitionRefused("Trade-in changed; reload and try again");

    // A buylist entry buys at most maximumQuantity cards. Paying out is when the shop has bought them,
    // so count them here with one conditional increment per entry: two payouts racing for the last
    // slot can't both pass (this was a per-submission check only, and quantityBought never moved).
    const perEntry = new Map<string, number>();
    for (const item of submission.items as any[]) {
      if (!item.buylistEntryId || item.acceptedAmountMinor == null) continue;
      perEntry.set(item.buylistEntryId, (perEntry.get(item.buylistEntryId) ?? 0) + (item.quantity ?? 1));
    }
    for (const [entryId, quantity] of perEntry) {
      const counted = await tx.$executeRaw`
        UPDATE "BuylistEntry" SET "quantityBought" = "quantityBought" + ${quantity}
        WHERE id = ${entryId} AND ("maximumQuantity" IS NULL OR "quantityBought" + ${quantity} <= "maximumQuantity")`;
      if (counted !== 1) {
        const entry = await tx.buylistEntry.findUnique({ where: { id: entryId }, select: { maximumQuantity: true, quantityBought: true, catalogItem: { select: { title: true } } } });
        const left = entry?.maximumQuantity == null ? 0 : Math.max(0, entry.maximumQuantity - (entry.quantityBought ?? 0));
        throw transitionRefused(
          `The buylist only wants ${left} more of ${entry?.catalogItem?.title || "this card"}, and this trade-in has ${quantity}. Raise the buylist limit or decline the extra cards first.`
        );
      }
    }

    if (submission.disposition !== "store_credit") return { submission, giftCard: null, replay: false };

    const items = submission.items.filter((item: any) => item.acceptedAmountMinor != null);
    if (!items.length) throw transitionRefused("No accepted amounts to pay");
    const currencies = new Set(items.map((item: any) => item.currencyCode || "USD"));
    if (currencies.size !== 1) throw new Error("Accepted amounts are in more than one currency");
    const total = items.reduce((sum: number, item: any) => sum + item.acceptedAmountMinor, 0);
    if (total <= 0) throw new Error("Accepted total must be more than zero");

    const giftCard = await tx.giftCard.create({
      data: {
        code: giftCardCode("SC"),
        value: total,
        balance: total,
        metadata: {
          kind: "store_credit",
          source: "trade_in",
          tradeInSubmissionId: id,
          tradeInReference: submission.reference,
          customerId: submission.customer?.id || null,
          currencyCode: [...currencies][0],
          issuedById: context.session?.itemId || null,
          issuedAt: new Date().toISOString(),
        },
      },
    });
    if (submission.customer?.email) {
      await tx.notification.create({
        data: {
          eventName: "STORE_CREDIT_ISSUED",
          resourceType: "GiftCard",
          resourceId: giftCard.id,
          to: submission.customer.email,
          userId: submission.customer.id,
          data: { tradeInSubmissionId: id, status: "pending_delivery", channel: "email" },
        },
      });
    }
    return { submission, giftCard, replay: false };
  });

  if (result.giftCard && !result.replay) await deliverStoreCreditEmail(sudo, result.giftCard.id);

  return {
    id,
    status: "paid",
    disposition: result.submission.disposition,
    storeCredit: result.giftCard
      ? { id: result.giftCard.id, code: result.giftCard.code, amountMinor: result.giftCard.value, currencyCode: result.giftCard.metadata?.currencyCode || "USD" }
      : null,
  };
}

async function deliverStoreCreditEmail(sudo: any, giftCardId: string) {
  try {
    const notification = await sudo.prisma.notification.findFirst({
      where: { eventName: "STORE_CREDIT_ISSUED", resourceType: "GiftCard", resourceId: giftCardId },
    });
    if (!notification) return;
    const base = (notification.data || {}) as Record<string, unknown>;
    const claim = await sudo.prisma.notification.updateMany({
      where: { id: notification.id, data: { path: ["status"], equals: "pending_delivery" } },
      data: { data: { ...base, status: "sending" } },
    });
    if (claim.count !== 1) return;
    const mark = (status: string, extra: Record<string, unknown> = {}) =>
      sudo.prisma.notification.update({ where: { id: notification.id }, data: { data: { ...base, status, ...extra } } });
    if (!process.env.SMTP_HOST) return void (await mark("skipped_not_configured"));
    const card = await sudo.prisma.giftCard.findUnique({ where: { id: giftCardId } });
    const { sendStoreCreditEmail } = await import("../lib/mail");
    const sent = await sendStoreCreditEmail({
      to: notification.to,
      code: card.code,
      amountMinor: card.value,
      currencyCode: (card.metadata as any)?.currencyCode || "USD",
      reference: (card.metadata as any)?.tradeInReference || "",
    });
    await mark(sent.sent ? "sent" : "failed", sent.sent ? { sentAt: new Date().toISOString(), ...(sent.messageId ? { messageId: sent.messageId } : {}) } : { error: sent.error || "send_failed" });
  } catch (error) {
    console.error("Store credit email failed:", error instanceof Error ? error.message : "Unknown error");
  }
}
