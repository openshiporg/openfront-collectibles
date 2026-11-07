import { transitionRefused } from '../lib/transitionRefused';
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";

// Shared by transitionOrderStatus and refundOrderPayment (restock on full refund).
// Cancelling puts sold serialized specimens back in stock exactly once: the order
// status check, the unit version fence and the stock-movement key all stop a repeat.
export async function applyOrderStatusTransition(
  sudo: any,
  { orderId, status, reason, userId, restock = true }: { orderId: string; status: "canceled" | "archived"; reason: string; userId: string; restock?: boolean }
): Promise<{ changed: boolean }> {
  const endpointIds = await subscribedWebhookEndpointIds(sudo, `order.${status}`);
  return sudo.prisma.$transaction(async (tx: any) => {
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
    if (order.status === status) return { changed: false };

    if (status === "archived") {
      if (order.status !== "completed") throw transitionRefused("Only completed orders can be archived");
    } else {
      if (!["pending", "completed", "requires_action"].includes(order.status)) {
        throw transitionRefused("Order cannot be canceled from its current state");
      }
      if (order.fulfillments.length) throw transitionRefused("Cancel active fulfillments before canceling the order");
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
        throw transitionRefused("Captured payments must be fully refunded before cancellation");
      }
      for (const payment of order.payments) {
        if (payment.status !== "pending") continue;
        await tx.payment.update({ where: { id: payment.id }, data: { status: "canceled" } });
      }
      // The order sold its serialized specimens at checkout. Put each one back in
      // stock, and pause its listing so the merchant chooses when to relist it.
      // Variants whose specimen actually went sold -> available in this run.
      // The variant counter moves only with the unit transition (or, for lines
      // with no serialized unit, with the order status transition), so a replay,
      // a later cancel or a second refund can never add stock twice.
      const restoredVariantIds = new Set<string>();
      // A full refund without "restock" still closes the order (Shopify: refund without
      // restocking leaves inventory alone), so skip both stock loops in that case.
      for (const line of restock ? order.lineItems : []) {
        const unit = line.productVariant?.collectibleInventoryUnit;
        if (!unit || unit.status !== "sold") continue;
        const restored = await tx.inventoryUnit.updateMany({
          where: { id: unit.id, status: "sold", version: unit.version },
          data: { status: "available", quantity: 1, version: { increment: 1 } },
        });
        if (restored.count !== 1) throw new Error("Specimen changed during cancellation");
        restoredVariantIds.add(line.productVariant.id);
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
      for (const line of restock ? order.lineItems : []) {
        if (!line.productVariant?.manageInventory) continue;
        const hasUnit = !!line.productVariant.collectibleInventoryUnit;
        if (hasUnit && !restoredVariantIds.has(line.productVariant.id)) continue;
        const alreadyReceived = await tx.stockMovement.findFirst({
          where: { variantId: line.productVariant.id, reason: "order_cancellation", note: `order:${orderId}` },
          select: { id: true },
        });
        if (alreadyReceived) continue;
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
        throw transitionRefused("Invoiced account orders require an approved credit-note workflow");
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
        userId: userId,
        createdById: userId,
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
    return { changed: true };
  }, { isolationLevel: "Serializable" });
}
