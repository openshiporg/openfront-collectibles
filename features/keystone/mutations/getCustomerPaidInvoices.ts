import { requireCustomerPaidInvoicePagination } from '../security/customer-paid-invoice-pagination';

export const MAX_CUSTOMER_PAID_INVOICE_LINE_ITEMS = 100;

async function getCustomerPaidInvoices(
  root: any,
  { limit, offset }: { limit?: number | null; offset?: number | null },
  context: any
) {
  if (!context.session?.itemId) {
    throw new Error('Not authenticated');
  }

  const page = requireCustomerPaidInvoicePagination(limit, offset);
  const sudoContext = context.sudo();
  
  const invoices = await sudoContext.query.Invoice.findMany({
    where: { 
      account: { 
        user: { id: { equals: context.session.itemId } } 
      },
      status: { equals: 'paid' }
    },
    orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      invoiceNumber
      totalAmount
      status
      paidAt
      dueDate
      createdAt
      currency {
        id
        code
        symbol
        noDivisionCurrency
      }
      account {
        id
        accountNumber
        title
      }
      formattedTotal
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_PAID_INVOICE_LINE_ITEMS}) {
        id
        orderDisplayId
        formattedAmount
        accountLineItem {
          id
          orderDisplayId
          itemCount
          paymentStatus
          description
          amount
          order {
            id
            displayId
            createdAt
            total
          }
        }
      }
    `
  });

  return invoices.map((invoice: any) => {
    const hasBoundedRows = Array.isArray(invoice.lineItems);
    const hasKnownCount = Number.isSafeInteger(invoice.lineItemsCount) && invoice.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && invoice.lineItemsCount >= invoice.lineItems.length
      ? invoice.lineItemsCount > invoice.lineItems.length
      : null;
    return { ...invoice, lineItemsHasMore };
  });
}

export default getCustomerPaidInvoices;