import { lockedRecordUi } from './lifecycle-ui';
import type { Lists } from '.keystone/types';
import { list, group, graphql } from '@keystone-6/core';
import type { JSONValue } from '@keystone-6/core/types';
import { 
  text,
  integer,
  relationship,
  virtual,
  select
} from '@keystone-6/core/fields';
import { requiredRelationship } from './required-relationship';
import { trackingFields } from './trackingFields';
import { permissions, isSignedIn } from '../access';
import {
  MAX_ACCOUNT_LINE_ITEM_ORDER_DETAIL_LINES,
  projectAccountLineItemOrderDetails,
} from '../lib/account-line-item-order-details';

export const AccountLineItem = list<Lists.AccountLineItem.TypeInfo>({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
  },
  fields: {
    // Core relationships
    account: requiredRelationship({
      ref: 'Account.lineItems',
      many: false,
      validation: { isRequired: true },
    }),
    
    order: requiredRelationship({
      ref: 'Order.accountLineItems',
      many: false,
      validation: { isRequired: true },
    }),
    orderKey: text({
      isIndexed: 'unique',
      db: { isNullable: true },
      ui: { itemView: { fieldMode: 'read' }, createView: { fieldMode: 'hidden' } },
    }),

    region: relationship({
      ref: 'Region.accountLineItems',
      many: false,
    }),

    // Line item details
    description: text({
      validation: { isRequired: true },
      defaultValue: 'Order line item',
    }),
    
    amount: integer({
      validation: { isRequired: true },
      label: 'Amount (in cents)',
    }),
    
    orderDisplayId: text({
      validation: { isRequired: true },
      isIndexed: true,
    }),
    
    itemCount: integer({
      validation: { isRequired: true },
      defaultValue: 0,
    }),
    
    paymentStatus: select({
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Canceled', value: 'canceled' },
      ],
      defaultValue: 'unpaid',
      validation: { isRequired: true },
    }),
    
    // Junction relationship to track which invoices paid this item
    invoiceLineItems: relationship({
      ref: 'InvoiceLineItem.accountLineItem',
      many: true,
    }),

    // Virtual computed fields
    ...group({
      label: 'Computed Fields',
      description: 'Auto-calculated fields for line item display',
      fields: {
        formattedAmount: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const lineItem = await context.sudo().query.AccountLineItem.findOne({
                where: { id: item.id },
                query: `
                  amount
                  account {
                    currency {
                      code
                      symbol
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if (!lineItem?.account?.currency) return '$0.00';

              const divisor = lineItem.account.currency.noDivisionCurrency ? 1 : 100;
              const amount = (lineItem.amount || 0) / divisor;
              
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: lineItem.account.currency.code,
              }).format(amount);
            },
          }),
        }),

        orderDetails: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              const lineItemId = (item as { id: string }).id;
              const lineItem = await context.sudo().query.AccountLineItem.findOne({
                where: { id: lineItemId },
                query: `
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
                    lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_ACCOUNT_LINE_ITEM_ORDER_DETAIL_LINES}) {
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
                `,
              });

              return projectAccountLineItemOrderDetails(lineItem?.order) as unknown as JSONValue;
            },
          }),
        }),

        paidAt: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              if (item.paymentStatus !== 'paid') return null;
              const invoices: readonly { paidAt?: string | null }[] = await context.sudo().query.Invoice.findMany({
                where: { status: { equals: 'paid' }, paidAt: { not: { equals: null } }, lineItems: { some: { accountLineItem: { id: { equals: item.id } } } } },
                orderBy: [{ paidAt: 'desc' }, { id: 'desc' }], take: 1, query: 'paidAt',
              });
              return invoices[0]?.paidAt ?? null;
            },
          }),
        }),
      },
    }),

    ...trackingFields,
  },
  
  hooks: {
    resolveInput: async ({ resolvedData, context, operation }) => {
      if (operation === 'create') {
        // Auto-populate description and amount from order if not provided
        if (resolvedData.order?.connect?.id && (!resolvedData.description || !resolvedData.amount)) {
          const order = await context.sudo().query.Order.findOne({
            where: { id: resolvedData.order.connect.id },
            query: `
              displayId
              rawTotal
              lineItems {
                id
              }
            `,
          });

          if (order) {
            return {
              ...resolvedData,
              description: resolvedData.description || `Order #${order.displayId} - ${order.lineItems?.length || 0} items`,
              amount: resolvedData.amount || order.rawTotal || 0,
              orderDisplayId: resolvedData.orderDisplayId || order.displayId,
              itemCount: resolvedData.itemCount || order.lineItems?.length || 0,
            };
          }
        }
      }
        
      return resolvedData;
    },
  },
});