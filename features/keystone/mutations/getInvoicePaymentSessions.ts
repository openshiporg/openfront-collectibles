import type { Context } from '.keystone/types';
import { assertInvoiceAccess } from '../security/invoice-access';

export default async function getInvoicePaymentSessions(_root: unknown, { invoiceId }: { invoiceId: string }, context: Context) {
  await assertInvoiceAccess(context, invoiceId);
  // This operation returns native PaymentSession items, not a serialized
  // relationship projection masquerading as a typed list result.
  const sessions = await context.sudo().db.PaymentSession.findMany({
    where: { paymentCollection: { invoice: { id: { equals: invoiceId } } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 101,
  });
  if (sessions.length > 100) throw new Error('Payment-session limit exceeded');
  return sessions;
}
