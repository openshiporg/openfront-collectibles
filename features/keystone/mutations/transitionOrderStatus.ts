import { permissions } from "../access";
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";

async function transitionOrderStatus(
  root: any,
  { orderId, status, reason }: { orderId: string; status: string; reason: string },
  context: any
) {
  if (!permissions.canManageOrders({ session: context.session })) throw new Error("Access denied");
  if (!reason?.trim()) throw new Error("Transition reason is required");
  if (!["canceled", "archived"].includes(status)) {
    throw new Error("Order status is controlled by payment and fulfillment commands");
  }
  const sudo = context.sudo();
  const endpointIds = await subscribedWebhookEndpointIds(sudo, `order.${status}`);
  await sudo.prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          select: { id: true, status: true, amount: true, amountRefunded: true, refunds: { select: { amount: true } } },
        },
        fulfillments: { where: { canceledAt: null }, select: { id: true } },
        accountLineItems: {
          select: {
            id: true,
            accountId: true,
            amount: true,
            paymentStatus: true,
            invoiceLineItems: { select: { id: true } },
          },
        },
        discounts: { select: { id: true } },
        lineItems: {
          select: {
            quantity: true,
            productVariant: {
              select: {
                id: true,
                manageInventory: true,
                collectibleInventoryUnit: { select: { id: true, status: true, version: true } },
              },
            },
          },
        },
      },
    });
    if (!order) throw new Error("Order not found");
    if (order.status === status) return;

    if (status === "archived") {
      if (order.status !== "completed") throw new Error("Only completed orders can be archived");
    } else {
      if (!["pending", "completed", "requires_action"].includes(order.status)) {
        throw new Error("Order cannot be canceled from its current state");
      }
      if (order.fulfillments.length) throw new Error("Cancel active fulfillments before canceling the order");
      // Pending manual payments (an unpaid bank transfer) hold no money; they are
      // cancelled with the order. Anything else must be fully refunded first.
      if (
        order.payments.some(
          (payment: any) =>
            payment.status !== "pending" &&
            payment.status !== "canceled" &&
            payment.refunds.reduce((sum: number, refund: any) => sum + refund.amount, 0) < payment.amount
        )
      ) {
        throw new Error("Captured payments must be fully refunded before cancellation");
      }
      for (const payment of order.payments) {
        if (payment.status !== "pending") continue;
        await tx.payment.update({ where: { id: payment.id }, data: { status: "canceled" } });
      }
      // The order sold its serialized specimens at checkout. Put each one back in
      // stock, and pause its listing so the merchant chooses when to relist it.
      for (const line of order.lineItems) {
        const unit = line.productVariant?.collectibleInventoryUnit;
        if (!unit || unit.status !== "sold") continue;
        const restored = await tx.inventoryUnit.updateMany({
          where: { id: unit.id, status: "sold", version: unit.version },
          data: { status: "available", quantity: 1, version: { increment: 1 } },
        });
        if (restored.count !== 1) throw new Error("Specimen changed during cancellation");
        await tx.listing.updateMany({
          where: { inventoryUnitId: unit.id, status: "sold" },
          data: { status: "paused" },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryUnitId: unit.id,
            type: "release",
            fromStatus: "sold",
            toStatus: "available",
            reason: "order_cancellation",
            occurredAt: new Date(),
            idempotencyKey: `order-cancel:${orderId}:${unit.id}`,
          },
        });
      }
      for (const line of order.lineItems) {
        if (!line.productVariant?.manageInventory) continue;
        await tx.productVariant.update({
          where: { id: line.productVariant.id },
          data: { inventoryQuantity: { increment: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            type: "RECEIVE",
            quantity: line.quantity,
            reason: "order_cancellation",
            note: `order:${orderId}`,
            variantId: line.productVariant.id,
          },
        });
      }
      if (
        order.accountLineItems.some(
          (item: any) => item.paymentStatus !== "unpaid" || item.invoiceLineItems.length
        )
      ) {
        throw new Error("Invoiced account orders require an approved credit-note workflow");
      }
      for (const item of order.accountLineItems) {
        await tx.accountLineItem.update({
          where: { id: item.id },
          data: { paymentStatus: "canceled" },
        });
        if (item.accountId) {
          const adjustedAccount = await tx.account.updateMany({
            where: { id: item.accountId, totalAmount: { gte: item.amount } },
            data: { totalAmount: { decrement: item.amount } },
          });
          if (adjustedAccount.count !== 1) {
            throw new Error("Account balance is inconsistent; cancellation stopped");
          }
        }
      }
      for (const discount of order.discounts) {
        await tx.discount.updateMany({
          where: { id: discount.id, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "canceled" ? { canceledAt: new Date() } : {}),
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "STATUS_CHANGE",
        data: { previousStatus: order.status, newStatus: status, reason: reason.trim() },
        userId: context.session.itemId,
        createdById: context.session.itemId,
      },
    });
    await enqueueWebhookOutbox(
      tx,
      endpointIds,
      `order.${status}`,
      "Order",
      orderId,
      { id: orderId, previousStatus: order.status, status, reason: reason.trim() }
    );
  }, { isolationLevel: "Serializable" });

  return sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id status canceledAt displayId",
  });
}

export default transitionOrderStatus;
