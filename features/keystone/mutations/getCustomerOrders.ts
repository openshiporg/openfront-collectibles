import { MAX_CUSTOMER_ORDER_LINE_ITEMS, requireCustomerOrderPagination } from '../security/customer-order-pagination';

async function getCustomerOrders(
  root: unknown,
  { limit, offset }: { limit?: number | null; offset?: number | null },
  context: any
) {
  if (!context.session?.itemId) {
    throw new Error('Not authenticated');
  }

  const page = requireCustomerOrderPagination(limit, offset);
  const sudoContext = context.sudo();
  
  const orders = await sudoContext.query.Order.findMany({
    where: { 
      user: { id: { equals: context.session.itemId } }
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      displayId
      status
      fulfillmentStatus
      total
      formattedTotalPaid
      createdAt
      shippingAddress {
        country {
          id
          iso2
        }
      }
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ORDER_LINE_ITEMS}) {
        id
        title
        quantity
        thumbnail
      }
      region {
        id
        currency {
          code
        }
      }
    `
  });

  return orders.map((order: any) => {
    const hasBoundedRows = Array.isArray(order.lineItems);
    const hasKnownCount = Number.isSafeInteger(order.lineItemsCount) && order.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && order.lineItemsCount >= order.lineItems.length
      ? order.lineItemsCount > order.lineItems.length
      : null;
    return { ...order, lineItemsHasMore };
  });
}

export default getCustomerOrders; 