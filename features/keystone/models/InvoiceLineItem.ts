import { lockedRecordUi } from './lifecycle-ui';
import type { Lists } from '.keystone/types';
import { list, group, graphql } from '@keystone-6/core';
import { 
  relationship,
  virtual
} from '@keystone-6/core/fields';
import { requiredRelationship } from './required-relationship';
import { trackingFields } from './trackingFields';
import { permissions } from '../access';

export const InvoiceLineItem = list<Lists.InvoiceLineItem.TypeInfo>({
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
    // Junction table relationships
    invoice: requiredRelationship({
      ref: 'Invoice.lineItems',
      many: false,
      validation: { isRequired: true },
    }),
    
    accountLineItem: requiredRelationship({
      ref: 'AccountLineItem.invoiceLineItems',
      many: false,
      validation: { isRequired: true },
    }),

    // Virtual computed fields
    ...group({
      label: 'Computed Fields',
      description: 'Auto-calculated fields from related account line item',
      fields: {
        orderDisplayId: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    orderDisplayId
                  }
                `,
              });

              return invoiceLineItem?.accountLineItem?.orderDisplayId || '';
            },
          }),
        }),

        formattedAmount: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    formattedAmount
                  }
                `,
              });

              return invoiceLineItem?.accountLineItem?.formattedAmount || '$0.00';
            },
          }),
        }),

        orderDetails: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    orderDetails
                  }
                `,
              });

              return invoiceLineItem?.accountLineItem?.orderDetails || null;
            },
          }),
        }),
      },
    }),

    ...trackingFields,
  },
});