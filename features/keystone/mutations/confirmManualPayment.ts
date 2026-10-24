import { permissions } from "../access";
import { providerCaptureKey } from "../payments/provider-capture-key";
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";

// Records a manual-tender (bank transfer) payment as received. Checkout created it
// pending with no capture; this captures the full amount once, with the reference.
async function confirmManualPayment(
  root: any,
  { orderId, reference }: { orderId: string; reference: string },
  context: any
) {
  if (!permissions.canManagePayments({ session: context.session })) throw new Error("Access denied");
  const trimmedReference = reference?.trim();
  if (!trimmedReference) throw new Error("Payment reference is required");
  if (trimmedReference.length > 200) throw new Error("Payment reference is too long");

  const sudo = context.sudo();
  const endpointIds = await subscribedWebhookEndpointIds(sudo, "payment.captured");
  await sudo.prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        payments: { select: { id: true, status: true, amount: true, currencyCode: true, data: true } },
      },
    });
    if (!order) throw new Error("Order not found");
    if (!["pending", "requires_action"].includes(order.status)) {
      throw new Error("Payment can only be recorded on an open order");
    }
    const pending = order.payments.filter(
      (payment: any) => payment.status === "pending" && payment.data?.manual === true
    );
    if (pending.length !== 1) throw new Error("This order has no pending bank transfer to record");
    const payment = pending[0];
    const providerId = String(payment.data?.paymentProviderId || "");
    const capturedAt = new Date();

    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: {
        status: "captured",
        capturedAt,
        data: { ...payment.data, reference: trimmedReference },
      },
    });
    if (updated.count !== 1) throw new Error("Payment changed before it was recorded");
    await tx.capture.create({
      data: {
        amount: payment.amount,
        paymentId: payment.id,
        providerCaptureKey: providerCaptureKey(providerId, `manual-${payment.id}`),
        metadata: { paymentProviderId: providerId, reference: trimmedReference },
        createdBy: "manual",
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "PAYMENT_CAPTURED",
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currencyCode: payment.currencyCode,
          source: "manual",
          reference: trimmedReference,
        },
        userId: context.session.itemId,
        createdById: context.session.itemId,
      },
    });
    await enqueueWebhookOutbox(
      tx,
      endpointIds,
      "payment.captured",
      "Payment",
      payment.id,
      { id: payment.id, orderId, amount: payment.amount, currencyCode: payment.currencyCode }
    );
  }, { isolationLevel: "Serializable" });

  return sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id status displayId",
  });
}

export default confirmManualPayment;
