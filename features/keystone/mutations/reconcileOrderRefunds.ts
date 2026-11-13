import { permissions } from "../access";
import { reconcilePaymentRefunds, refundRuleError } from "../checkout/refund-reconcile";

/**
 * Staff action ("Check with processor" on the order): ask the processor what it refunded on each captured card
 * payment, record refunds it made that the store never recorded, and give back amounts held by refund calls it
 * never confirmed. Safe to repeat; a refund call still waiting for its answer is left alone.
 */
async function reconcileOrderRefunds(root: any, { orderId }: { orderId: string }, context: any) {
  if (
    !permissions.canManageReturns({ session: context.session }) ||
    !permissions.canManagePayments({ session: context.session })
  ) {
    throw new Error("Access denied");
  }
  const sudo = context.sudo();
  const payments = await sudo.prisma.payment.findMany({
    where: { orderId, status: "captured" },
    select: { id: true },
  });
  let recorded = 0;
  let released = 0;
  for (const payment of payments) {
    try {
      const result = await reconcilePaymentRefunds(context, payment.id);
      recorded += result.recorded.reduce((sum: number, refund: any) => sum + refund.amount, 0);
      released += result.released;
    } catch (error) {
      console.error("Refund reconcile failed", payment.id, error instanceof Error ? error.message : error);
      throw refundRuleError("The processor could not be reached to check refunds. Try again shortly.", "REFUND_NOT_CONFIRMED");
    }
  }
  return { recorded, released };
}

export default reconcileOrderRefunds;
