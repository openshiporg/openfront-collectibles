import { transitionRefused } from "../lib/transitionRefused";
import { permissions } from "../access";
import { returnRefundError } from "../lib/lifecycles";
import { refundPayment } from "../utils/paymentProviderAdapter";
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";
import { findIdempotencyAttempt, getOrCreateIdempotencyAttempt } from "../utils/idempotency";
import {
  assertNoRefundAwaitingProcessor,
  assertRefundReplayAllowed,
  attemptProviderKey,
  paymentProviderFor,
  providerPaymentReference,
  providerRefundKey,
  reconcilePaymentRefunds,
  sendProviderRefund,
} from "../checkout/refund-reconcile";

async function processReturnRefund(
  root: any,
  { returnId, paymentId, idempotencyKey }: { returnId: string; paymentId: string; idempotencyKey: string },
  context: any
) {
  if (
    !permissions.canManageReturns({ session: context.session }) ||
    !permissions.canManagePayments({ session: context.session })
  ) {
    throw new Error("Access denied");
  }
  if (!idempotencyKey?.trim()) throw new Error("Idempotency key is required");

  const sudo = context.sudo();
  const businessKey = `refund:${idempotencyKey.trim()}`;
  const idempotencyRequest = {
    key: businessKey,
    requestPath: "processReturnRefund",
    requestParams: { returnId, paymentId },
  };
  let priorAttempt = await findIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (priorAttempt?.recoveryPoint === "completed" && priorAttempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({
      where: { id: priorAttempt.responseBody.refundId },
      query: "id amount reason idempotencyKey payment { id amount amountRefunded }",
    });
  }

  const returnRecord = await sudo.query.Return.findOne({
    where: { id: returnId },
    query: `id status refundAmount metadata order { id payments { id } }`,
  });
  if (!returnRecord?.order?.id || returnRecord.refundAmount <= 0) {
    throw transitionRefused("Return is not refundable");
  }
  // A return is refunded once. A canceled return is never refunded, and a second
  // refund under a fresh idempotency key must not pay it out again.
  // Settle refunds the processor already made (or never confirmed) before judging this one.
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
      return sudo.query.Refund.findOne({
        where: { id: priorAttempt.responseBody.refundId },
        query: "id amount reason idempotencyKey payment { id amount amountRefunded }",
      });
    }
    if (priorAttempt) assertRefundReplayAllowed(priorAttempt, reconciled);
  }
  const blocked = returnRefundError(returnRecord);
  if (blocked && !priorAttempt) throw transitionRefused(blocked);
  if (!returnRecord.order.payments?.some((payment: any) => payment.id === paymentId)) {
    throw new Error("Payment does not belong to return order");
  }

  const payment = await sudo.query.Payment.findOne({
    where: { id: paymentId },
    query: `
      id amount amountRefunded currencyCode data
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
  if (!payment) throw new Error("Payment not found");
  const alreadyRefunded = payment.refunds?.reduce((sum: number, refund: any) => sum + refund.amount, 0) || 0;
  if (alreadyRefunded + returnRecord.refundAmount > payment.amount) {
    throw transitionRefused("Refund exceeds captured payment amount");
  }

  const provider = paymentProviderFor(payment);
  const providerReference = providerPaymentReference(payment);
  if (!provider || !providerReference) throw new Error("Refund provider reference is missing");
  if (provider.code?.includes("manual")) {
    throw transitionRefused("Manual tender refunds require operator verification");
  }

  if (!priorAttempt) await assertNoRefundAwaitingProcessor(sudo.prisma, paymentId);
  const { attempt } = priorAttempt
    ? { attempt: priorAttempt }
    : await getOrCreateIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (attempt.recoveryPoint === "completed" && attempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({
      where: { id: attempt.responseBody.refundId },
      query: "id amount reason idempotencyKey payment { id amount amountRefunded }",
    });
  }

  let providerResult = attempt.responseBody?.providerResult;
  if (!providerResult) {
    const providerKey = attemptProviderKey(attempt, attempt.recoveryPoint === "started" ? providerRefundKey(paymentId, idempotencyKey.trim()) : businessKey);
    providerResult = await sendProviderRefund(sudo.prisma, {
      attempt,
      paymentId,
      paymentAmount: payment.amount,
      amount: returnRecord.refundAmount,
      currency: payment.currencyCode,
      providerKey,
      call: (key) => refundPayment({ provider, paymentId: providerReference, amount: returnRecord.refundAmount, currency: payment.currencyCode, idempotencyKey: key }),
    });
  }

  const refundWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "refund.created"
  );
  const refund = await sudo.prisma.$transaction(async (tx: any) => {
    const duplicate = await tx.refund.findFirst({
      where: { idempotencyKey: businessKey },
    });
    if (duplicate) return duplicate;

    const fresh = await tx.return.findUnique({ where: { id: returnId }, select: { status: true, metadata: true } });
    if (fresh?.status === "canceled") throw transitionRefused("A canceled return cannot be refunded");
    const created = await tx.refund.create({
      data: {
        amount: returnRecord.refundAmount,
        reason: "return",
        note: `Return ${returnId}`,
        idempotencyKey: businessKey,
        paymentId,
        metadata: { providerId: provider.id, providerResult },
      },
    });
    await tx.return.update({
      where: { id: returnId },
      data: {
        status: "received",
        receivedAt: new Date(),
        metadata: {
          ...(returnRecord.metadata || {}),
          refundId: created.id,
          refundStatus: "completed",
        },
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId: returnRecord.order.id,
        type: "REFUND_PROCESSED",
        data: { returnId, refundId: created.id, amount: created.amount },
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
      { id: created.id, returnId, paymentId, orderId: returnRecord.order.id, amount: created.amount }
    );
    return created;
  });

  await sudo.prisma.idempotencyKey.update({
    where: { id: attempt.id },
    data: {
      recoveryPoint: "completed",
      responseCode: 200,
      responseBody: { refundId: refund.id, providerResult },
      lockedAt: null,
    },
  });

  return sudo.query.Refund.findOne({
    where: { id: refund.id },
    query: "id amount reason idempotencyKey payment { id amount amountRefunded }",
  });
}

export default processReturnRefund;
