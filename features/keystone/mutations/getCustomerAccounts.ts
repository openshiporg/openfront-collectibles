import { getCustomerAccountPagination, MAX_CUSTOMER_ACCOUNT_LINE_ITEMS } from '../security/customer-account-pagination';

async function getCustomerAccounts(
  root: unknown,
  { limit, offset }: { limit?: number | null; offset?: number | null },
  context: any
) {
  if (!context.session?.itemId) {
    throw new Error('Not authenticated');
  }

  const page = getCustomerAccountPagination(limit, offset);
  const sudoContext = context.sudo();
  
  const accounts = await sudoContext.query.Account.findMany({
    where: { 
      user: { id: { equals: context.session.itemId } }
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      accountNumber
      title
      status
      totalAmount
      paidAmount
      creditLimit
      formattedTotal
      formattedCreditLimit
      availableCredit
      totalOwedInAccountCurrency
      formattedTotalOwedInAccountCurrency
      availableCreditInAccountCurrency
      formattedAvailableCreditInAccountCurrency
      balanceDue
      dueDate
      createdAt
      accountType
      currency {
        id
        code
        symbol
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
        }
      }
    `
  });

  return accounts.map((account: any) => {
    const hasBoundedRows = Array.isArray(account.lineItems);
    const hasKnownCount = Number.isSafeInteger(account.lineItemsCount) && account.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && account.lineItemsCount >= account.lineItems.length
      ? account.lineItemsCount > account.lineItems.length
      : null;
    return { ...account, lineItemsHasMore };
  });
}

export default getCustomerAccounts;
