import { currencyExponent } from '../../lib/minor-units';
import { denyAll } from '@keystone-6/core/access';
import type { Lists } from '.keystone/types';
import { graphql, group, list } from "@keystone-6/core";
import { text, relationship, virtual } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Currency = list<Lists.Currency.TypeInfo>({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders,
    },
  },
  hooks: {
    validateInput({ operation, resolvedData, item, addValidationError }) {
      const code = operation === 'create' ? resolvedData.code : resolvedData.code ?? item.code;
      try { if (typeof code !== 'string' || ![0, 2].includes(currencyExponent(code))) addValidationError('Currency precision is not supported by this price contract'); }
      catch { addValidationError('Unsupported currency'); }
    },
  },
  fields: {
    code: text({
      access: { update: denyAll },
      ui: { itemView: { fieldMode: 'read' } },
      isIndexed: "unique",
      validation: { isRequired: true },
    }),
    symbol: text({
      validation: { isRequired: true },
    }),
    symbolNative: text({
      validation: { isRequired: true },
    }),
    name: text({
      validation: { isRequired: true },
    }),
    moneyAmounts: relationship({
      ref: "MoneyAmount.currency",
      many: true,
    }),
    orders: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "Order.currency",
      many: true,
    }),
    payments: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "Payment.currency",
      many: true,
    }),
    regions: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "Region.currency",
      many: true,
    }),
    stores: relationship({
      ref: "Store.currencies",
      many: true,
    }),
    accounts: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "Account.currency",
      many: true,
    }),
    invoices: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "Invoice.currency",
      many: true,
    }),
    ...group({
      label: "Virtual Fields",
      description: "Virtual fields for currency",
      fields: {
        noDivisionCurrency: virtual({
          field: graphql.field({
            type: graphql.Boolean,
            resolve(item) {
              const exponent = currencyExponent(item.code);
              if (exponent !== 0 && exponent !== 2) throw new Error('Unsupported currency precision');
              return exponent === 0;
            },
          }),
        }),
      },
    }),
    ...trackingFields,
  },
});
