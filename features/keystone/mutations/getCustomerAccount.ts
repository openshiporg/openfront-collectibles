import { MAX_CUSTOMER_ACCOUNT_LINE_ITEMS } from '../security/customer-account-pagination';

export const MAX_CUSTOMER_ACCOUNT_ORDERS = 50;
export const MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS = 100;

const CUSTOMER_ACCOUNT_PREFLIGHT_QUERY = `
  id
  user { id }
`;

const CUSTOMER_ACCOUNT_DETAIL_QUERY = `
  id
  accountNumber
  title
  description
  status
  totalAmount
  paidAmount
  creditLimit
  formattedTotal
  formattedBalance
  formattedCreditLimit
  availableCredit
  formattedAvailableCredit
  balanceDue
  dueDate
  paidAt
  createdAt
  accountType
  currency {
    id
    code
    symbol
  }
  user {
    id
    email
    name
  }
  ordersCount
  orders(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDERS}) {
    id
    displayId
    status
    total
    createdAt
    lineItemsCount
    lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS}) {
      id
      title
      quantity
      thumbnail
    }
  }
  lineItemsCount
  lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_LINE_ITEMS}) {
    id
    description
    amount
    formattedAmount
    orderDisplayId
    itemCount
    paymentStatus
    createdAt
    order {
      id
      displayId
      status
      email
      createdAt
      total
      subtotal
      shipping
      tax
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS}) {
        id
        title
        quantity
        sku
        variantTitle
        formattedUnitPrice
        formattedTotal
        thumbnail
      }
    }
  }
`;

function hasMoreRows(count: unknown, rows: unknown): boolean | null {
  if (!Array.isArray(rows) || !Number.isSafeInteger(count) || (count as number) < rows.length) {
    return null;
  }
  return (count as number) > rows.length;
}

function projectOrderLineItems(order: any) {
  if (!order || typeof order !== 'object') return order;
  return {
    ...order,
    lineItemsHasMore: hasMoreRows(order.lineItemsCount, order.lineItems),
  };
}

async function getCustomerAccount(
  root: unknown,
  { accountId }: { accountId?: string | null },
  context: any
) {
  const ownerId = typeof context.session?.itemId === 'string' && context.session.itemId
    ? context.session.itemId
    : null;
  if (!ownerId) throw new Error('Not authenticated');
  if (typeof accountId !== 'string' || accountId.length === 0) {
    throw new Error('Account not found');
  }

  const sudoContext = context.sudo();
  const authorizationRecord = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: CUSTOMER_ACCOUNT_PREFLIGHT_QUERY,
  });
  if (authorizationRecord?.user?.id !== ownerId) {
    throw new Error('Account not found');
  }

  const account = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: CUSTOMER_ACCOUNT_DETAIL_QUERY,
  });
  if (account?.user?.id !== ownerId) {
    throw new Error('Account not found');
  }

  const orders = Array.isArray(account.orders) ? account.orders : [];
  const lineItems = Array.isArray(account.lineItems) ? account.lineItems : [];
  return {
    ...account,
    orders: orders.map(projectOrderLineItems),
    ordersHasMore: hasMoreRows(account.ordersCount, account.orders),
    lineItems: lineItems.map((lineItem: any) => {
      const { order, ...accountLineItem } = lineItem;
      return {
        ...accountLineItem,
        orderDetails: projectOrderLineItems(order),
      };
    }),
    lineItemsHasMore: hasMoreRows(account.lineItemsCount, account.lineItems),
  };
}

export default getCustomerAccount;
