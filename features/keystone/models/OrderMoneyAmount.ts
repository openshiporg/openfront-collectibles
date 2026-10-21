import { lockedRecordUi } from './lifecycle-ui';

import { list } from "@keystone-6/core";
import { integer, relationship, json } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const OrderMoneyAmount = list({
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
    amount: integer({
      validation: { isRequired: true },
    }),
    originalAmount: integer({
      validation: { isRequired: true },
    }),
    priceData: json({
      ui: { description: "Snapshot of complete price data including rules, lists, etc." },
    }),
    metadata: json(),
    orderLineItem: relationship({
      ref: "OrderLineItem.moneyAmount",
    }),
    currency: relationship({
      ref: "Currency",
    }),
    region: relationship({
      ref: "Region",
    }),
    ...trackingFields,
  },
});