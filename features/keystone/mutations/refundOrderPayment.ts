import { transitionRefused } from "../lib/transitionRefused";
import { permissions } from "../access";
import { refundPayment } from "../utils/paymentProviderAdapter";
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";
import { applyOrderStatusTransition } from "../utils/orderStatusTransition";
import { findIdempotencyAttempt, getOrCreateIdempotencyAttempt } from "../utils/idempotency";
import {
  assertNoRefundAwaitingProcessor,
  assertRefundReplayAllowed,
  attemptProviderKey,
  paymentProviderFor,
  providerPaymentReference,
  providerRefundKey,
  reconcilePaymentRefunds,
  refundRuleError,
  sendProviderRefund,
} from "../checkout/refund-reconcile";

const REFUND_QUERY = "id amount reason idempotencyKey metadata payment { id amount amountRefunded }";

async function refundOrderPayment(
  root: any,
  { orderId, paymentId, amount, reason, idempotencyKey, restock }: { orderId: string; paymentId: string; amount: number; reason: string; idempotencyKey: string; restock?: boolean | null },
  context: any
) {
  if (
    !permissions.canManageReturns({ session: context.session }) ||
    !permissions.canManagePayments({ session: context.session })
  ) {
    throw new Error("Access denied");
  }
  if (!idempotencyKey?.trim()) throw new Error("Idempotency key is required");

  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Refund amount must be positive minor units");
  if (!reason?.trim() || reason.trim().length > 1000) throw new Error("Refund reason is required (maximum 1000 characters)");

  const sudo = context.sudo();
  const businessKey = `refund:${idempotencyKey.trim()}`;
  const idempotencyRequest = {
    key: businessKey,
    requestPath: "refundOrderPayment",
    requestParams: { orderId, paymentId, amount, reason: reason.trim() },
  };
  let priorAttempt = await findIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (priorAttempt?.recoveryPoint === "completed" && priorAttempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({ where: { id: priorAttempt.responseBody.refundId }, query: REFUND_QUERY });
  }
  // Record what the processor already gave back and release reservations it never confirmed, so this request is
  // judged against what is really left. A fresh in-flight attempt is left alone.
  let reconciled = true;
  try {
    await reconcilePaymentRefunds(context, paymentId);
  } catch (error) {
    reconciled = false;
    console.error("Refund reconcile failed", paymentId, error instanceof Error ? error.message : error);
  }
  if (priorAttempt) {
    priorAttempt = await findIdempotencyAttempt(sudo.prisma, idempotencyRequest);
    if (priorAttempt?.recoveryPoint === "completed" && priorAttempt.responseBody?.refundId) {
      return sudo.query.Refund.findOne({ where: { id: priorAttempt.responseBody.refundId }, query: REFUND_QUERY });
    }
    if (priorAttempt) assertRefundReplayAllowed(priorAttempt, reconciled);
  }

  const payment = await sudo.query.Payment.findOne({
    where: { id: paymentId },
    query: `
      id status amount amountRefunded currencyCode data order { id }
      refunds { id amount idempotencyKey }
      paymentCollection {
        paymentSessions {
          isSelected
          paymentProvider {
            id code refundPaymentFunction credentials
          }
        }
      }
    `,
  });
  if (!payment || payment.order?.id !== orderId) throw new Error("Payment does not belong to order");
  if (payment.status !== "captured") throw refundRuleError("Only captured payments can be refunded", "PAYMENT_NOT_CAPTURED");
  const alreadyRefunded = payment.refunds?.reduce((sum: number, refund: any) => sum + refund.amount, 0) || 0;
  // In-flight reservations count against new requests; a replay re-reserves its own amount when it is sent again.
  const reserved = Math.max(alreadyRefunded, payment.amountRefunded || 0);
  // Only an attempt the processor already confirmed holds its reservation; any other replay reserves again.
  const ownsReservation = !!priorAttempt?.responseBody?.providerResult;
  if (!ownsReservation && reserved + amount > payment.amount) {
    throw refundRuleError("Refund exceeds captured payment amount", "REFUND_EXCEEDS_BALANCE");
  }

  // Gift card / store credit: value goes back onto the cards, no processor involved.
  if (payment.data?.tender === "gift_card") {
    const { refundGiftCardTender } = await import("../checkout/gift-card-tender");
    const refund = await refundGiftCardTender(sudo.prisma, {
      orderId, paymentId, amount, reason: reason.trim(), businessKey, userId: context.session.itemId,
    });
    await restockIfFullyRefunded(sudo, refund, { orderId, reason, restock, userId: context.session.itemId });
    return sudo.query.Refund.findOne({ where: { id: refund.id }, query: REFUND_QUERY });
  }

  const provider = paymentProviderFor(payment);
  const providerReference = providerPaymentReference(payment);
  if (!provider || !providerReference) throw new Error("Refund provider reference is missing");
  if (provider.code?.includes("manual")) {
    throw transitionRefused("Manual tender refunds require operator verification");
  }

  // A refund whose processor call has not answered yet may still land: no second refund races it.
  if (!priorAttempt) await assertNoRefundAwaitingProcessor(sudo.prisma, paymentId);

  const { attempt } = priorAttempt
    ? { attempt: priorAttempt }
    : await getOrCreateIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (attempt.recoveryPoint === "completed" && attempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({ where: { id: attempt.responseBody.refundId }, query: REFUND_QUERY });
  }

  let providerResult = attempt.responseBody?.providerResult;
  if (!providerResult) {
    // New attempts use a payment-scoped processor key; older ones keep the key they were first sent with.
    const providerKey = attemptProviderKey(attempt, attempt.recoveryPoint === "started" ? providerRefundKey(paymentId, idempotencyKey.trim()) : businessKey);
    providerResult = await sendProviderRefund(sudo.prisma, {
      attempt,
      paymentId,
      paymentAmount: payment.amount,
      amount,
      currency: payment.currencyCode,
      providerKey,
      call: (key) => refundPayment({ provider, paymentId: providerReference, amount, currency: payment.currencyCode, idempotencyKey: key }),
    });
  }

  const refundWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "refund.created"
  );
  const refund = await sudo.prisma.$transaction(async (tx: any) => {
    // Serialize finalization on the durable attempt row, including stale-lease replays.
    await tx.idempotencyKey.update({ where: { id: attempt.id }, data: { lockedAt: new Date() } });
    const duplicate = await tx.refund.findFirst({
      where: { idempotencyKey: businessKey },
    });
    if (duplicate) return duplicate;

    const created = await tx.refund.create({
      data: {
        amount: amount,
        reason: "other",
        note: reason.trim(),
        idempotencyKey: businessKey,
        payment: { connect: { id: paymentId } },
        metadata: { providerId: provider.id, providerResult, createdById: context.session.itemId },
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId: orderId,
        type: "REFUND_PROCESSED",
        data: { refundId: created.id, amount: created.amount },
        time: new Date(),
        userId: context.session.itemId,
        createdById: context.session.itemId,
      },
    });
    await enqueueWebhookOutbox(
      tx,
      refundWebhookEndpointIds,
      "refund.created",
      "Refund",
      created.id,
      { id: created.id, paymentId, orderId: orderId, amount: created.amount }
    );
    await tx.idempotencyKey.update({
      where: { id: attempt.id },
      data: { recoveryPoint: "completed", responseCode: 200, responseBody: { refundId: created.id, providerResult }, lockedAt: null },
    });
    return created;
  });

  await restockIfFullyRefunded(sudo, refund, { orderId, reason, restock, userId: context.session.itemId });

  return sudo.query.Refund.findOne({ where: { id: refund.id }, query: REFUND_QUERY });
}


async function restockIfFullyRefunded(
  sudo: any,
  refund: any,
  { orderId, reason, restock, userId }: { orderId: string; reason: string; restock?: boolean | null; userId: string }
) {
  // Once every captured payment is fully refunded the order is closed: it leaves
  // "Pending" through the same cancel path as transitionOrderStatus. Items go back
  // to stock only when the operator asked to restock. A failure here never undoes the refund.
  let outcome: { canceled: boolean; restocked: boolean; reason?: string };
  try {
    const payments = await sudo.prisma.payment.findMany({
      where: { order: { id: orderId } },
      select: { status: true, amount: true, refunds: { select: { amount: true } } },
    });
    const fullyRefunded = payments.length > 0 && payments.every(
      (p: any) =>
        p.status === "pending" ||
        p.status === "canceled" ||
        p.refunds.reduce((sum: number, r: any) => sum + r.amount, 0) >= p.amount
    );
    if (!fullyRefunded) {
      outcome = { canceled: false, restocked: false, reason: "the order is not fully refunded" };
    } else {
      const result = await applyOrderStatusTransition(sudo, {
        orderId,
        status: "canceled",
        reason: `Full refund: ${reason.trim()}`.slice(0, 1000),
        userId: userId,
        restock: restock === true,
      });
      outcome = { canceled: result.changed, restocked: result.changed && restock === true };
    }
  } catch (error: any) {
    outcome = { canceled: false, restocked: false, reason: String(error?.message || "unknown error").slice(0, 300) };
  }
  if (restock === true || outcome.canceled) {
    try {
      await sudo.prisma.refund.update({
        where: { id: refund.id },
        data: { metadata: { ...(refund.metadata || {}), restock: outcome } },
      });
    } catch {
      // The outcome note is informational; the refund itself is already final.
    }
  }
}

export default refundOrderPayment;
