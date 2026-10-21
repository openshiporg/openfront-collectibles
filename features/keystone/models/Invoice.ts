import { lockedRecordUi } from './lifecycle-ui';
import type { Lists } from '.keystone/types';
import { list, group, graphql } from '@keystone-6/core';
import { 
  text,
  integer,
  select,
  timestamp,
  relationship,
  json,
  virtual
} from '@keystone-6/core/fields';
import { requiredRelationship } from './required-relationship';
import { trackingFields } from './trackingFields';
import { permissions } from '../access';

export const Invoice = list<Lists.Invoice.TypeInfo>({
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
    // Core invoice data
    user: requiredRelationship({
      ref: 'User.invoices',
      many: false,
      validation: { isRequired: true },
    }),
    
    invoiceNumber: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),

    title: text({
      validation: { isRequired: true },
      defaultValue: 'Payment Invoice',
    }),

    description: text({
      ui: { displayMode: 'textarea' },
      defaultValue: 'Invoice for selected orders payment',
    }),

    // Financial fields (amounts in cents)
    totalAmount: integer({
      validation: { isRequired: true },
      defaultValue: 0,
    }),
    
    currency: requiredRelationship({
      ref: 'Currency.invoices',
      many: false,
      validation: { isRequired: true },
    }),

    // Status and dates
    status: select({
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft', // Paid is only established by a verified completion command
      validation: { isRequired: true },
    }),
    
    dueDate: timestamp(),
    paidAt: timestamp(),
    
    // Metadata for payment details
    metadata: json({
      defaultValue: {},
    }),

    // Relationships
    account: requiredRelationship({
      ref: 'Account.invoices',
      many: false,
      validation: { isRequired: true },
    }),
    
    lineItems: relationship({
      ref: 'InvoiceLineItem.invoice',
      many: true,
    }),

    paymentCollection: relationship({
      ref: 'PaymentCollection.invoice',
      db: { foreignKey: true },
    }),

    // Virtual computed fields
    ...group({
      label: 'Computed Fields',
      description: 'Auto-calculated fields for invoice display',
      fields: {
        formattedTotal: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              try {
                const invoice: { currency?: { code: string; noDivisionCurrency?: boolean } | null } | null = await context.sudo().query.Invoice.findOne({ where: { id: item.id }, query: 'currency { code noDivisionCurrency }' });
                const currency = invoice?.currency;


                if (!currency) {
                  return null;
                }

                const divisor = currency.noDivisionCurrency ? 1 : 100;
                const amount = (item.totalAmount || 0) / divisor;
                
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency.code,
                }).format(amount);
              } catch (error) {
                return null;
              }
            },
          }),
        }),

        itemCount: virtual({
          field: graphql.field({
            type: graphql.Int,
            async resolve(item, args, context) {
              try {
                return context.sudo().query.InvoiceLineItem.count({ where: { invoice: { id: { equals: item.id } } } });
              } catch (error) {
                return 0;
              }
            },
          }),
        }),

        paymentSessions: virtual({
          field: graphql.field({
            type: graphql.list(graphql.nonNull(graphql.JSON)),
            async resolve(item, args, context) {
              try {


                const invoice = await context.sudo().query.Invoice.findOne({
                  where: { id: item.id },
                  query: `
                    paymentCollection {
                      id
                      paymentSessions {
                        id
                        paymentProvider {
                          id
                          code
                        }
                        data
                        isSelected
                        isInitiated
                        amount
                      }
                    }
                  `,
                });

                return invoice?.paymentCollection?.paymentSessions || [];
              } catch (error) {
                return [];
              }
            },
          }),
        }),
      },
    }),

    ...trackingFields,
  },
  hooks: {
    resolveInput({ operation, resolvedData }) {
      if (operation === 'create' && !resolvedData.invoiceNumber) {
        const timestamp = Date.now();
        resolvedData.invoiceNumber = `INV-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;
      }
      return resolvedData;
    },
  },
});