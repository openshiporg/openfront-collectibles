import { currencyExponent } from '../../lib/minor-units';
import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import type * as Generated from '.keystone/types';
// Get unpaid account line items grouped by region for payment interface
async function getUnpaidLineItemsByRegion(root: unknown, { accountId }: { accountId: string }, context: Generated.Context) {
  const ownerId = requireHumanOwnerId(context.session);
  const sudoContext = context.sudo();
  
  // Validate user has access to this account
  if (!context.session?.itemId) {
    throw new Error('Authentication required');
  }

  // Get account and verify ownership
  const account = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: `
      id
      user {
        id
        email
      }
    `
  });

  if (!account) {
    throw new Error('Account not found');
  }

  if (account.user.id !== ownerId) {
    throw new Error('Unauthorized access to account');
  }

  try {
    // Get all unpaid line items with region information
    const unpaidLineItems = await sudoContext.query.AccountLineItem.findMany({
      where: {
        account: { id: { equals: accountId } },
        paymentStatus: { equals: 'unpaid' }
      },
      query: `
        id
        amount
        description
        orderDisplayId
        itemCount
        createdAt
        order {
          id
          currency { code }
        }
        region {
          id
          name
          currency {
            id
            code
            symbol
            noDivisionCurrency
          }
        }
      `,
      take: 1001,
      orderBy: { createdAt: 'desc' }
    });

    if (unpaidLineItems.length > 1000) throw new Error('Outstanding balance exceeds the supported page');
    for (const item of unpaidLineItems) {
      if (!Number.isSafeInteger(item.amount) || item.amount < 0 || !item.order?.currency?.code || item.order.currency.code.toUpperCase() !== item.region?.currency?.code?.toUpperCase()) throw new Error('Recorded charge currency is unavailable or inconsistent');
    }
    // Group line items by immutable region currency
    const lineItemsByRegion = unpaidLineItems.reduce((acc, item) => {
      const regionId = item.region.id;
      const regionName = item.region.name;
      const currency = item.region.currency;

      if (!acc[regionId]) {
        acc[regionId] = {
          region: {
            id: regionId,
            name: regionName,
            currency: currency
          },
          lineItems: [],
          totalAmount: 0,
          itemCount: 0
        };
      }

      acc[regionId].lineItems.push({
        id: item.id,
        amount: item.amount,
        description: item.description,
        orderDisplayId: item.orderDisplayId,
        itemCount: item.itemCount,
        createdAt: item.createdAt,
        formattedAmount: formatCurrencyAmount(item.amount, currency.code),
        order: item.order
      });

      acc[regionId].totalAmount += item.amount;
      if (!Number.isSafeInteger(acc[regionId].totalAmount)) throw new Error('Outstanding balance exceeds the integer range');
      acc[regionId].itemCount += 1; // Count orders, not products

      return acc;
    }, {});

    // Convert to array and add formatted totals
    const regionsWithLineItems = Object.values(lineItemsByRegion).map(regionData => ({
      ...regionData,
      formattedTotalAmount: formatCurrencyAmount(
        regionData.totalAmount, 
        regionData.region.currency.code
      )
    }));

    // Sort regions by total amount descending
    regionsWithLineItems.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      success: true,
      regions: regionsWithLineItems,
      totalRegions: regionsWithLineItems.length,
      totalUnpaidItems: unpaidLineItems.length,
      message: `Found ${unpaidLineItems.length} unpaid orders across ${regionsWithLineItems.length} regions`
    };

  } catch (error) {
    throw new Error(`Failed to get unpaid line items: ${error instanceof Error ? error.message : 'Outstanding items unavailable'}`);
  }
}

// Helper function to format currency amounts
function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = currencyCode.toUpperCase();
  
  const exponent = currencyExponent(currency);
  if (exponent !== 0 && exponent !== 2) throw new Error('Unsupported recorded currency precision');
  const divisor = 10 ** exponent;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / divisor);
}

export default getUnpaidLineItemsByRegion;