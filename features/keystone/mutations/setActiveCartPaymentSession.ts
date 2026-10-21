import type { PaymentContainerProjection, PaymentSessionProjection } from '../lib/payment-session-projection';
import type * as Generated from '.keystone/types';
import { assertCartAccess } from "../security/cart-access";

async function setActiveCartPaymentSession(root: unknown, { cartId, providerId }: { cartId: string; providerId: string }, context: Generated.Context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();

  // Get cart with payment collection
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      paymentCollection {
        id
        paymentSessions {
          id
          paymentProvider {
            id
          }
        }
      }
    `
  }) as Pick<PaymentContainerProjection, 'id' | 'paymentCollection' | 'region'> | null;

  if (!cart) {
    throw new Error("Cart not found");
  }

  if (!cart.paymentCollection) {
    throw new Error("Cart has no payment collection");
  }

  // Update all payment sessions to not selected
  for (const session of cart.paymentCollection.paymentSessions || []) {
    await sudoContext.db.PaymentSession.updateOne({
      where: { id: session.id },
      data: { isSelected: false }
    });
  }

  // Find and update the selected session
  const selectedSession = cart.paymentCollection.paymentSessions?.find(
    s => s.paymentProvider.id === providerId
  );

  if (!selectedSession) {
    throw new Error("Payment session not found");
  }

  await sudoContext.db.PaymentSession.updateOne({
    where: { id: selectedSession.id },
    data: { isSelected: true }
  });

  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}

export default setActiveCartPaymentSession; 