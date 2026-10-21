import { lockedRecordUi } from './lifecycle-ui';

import { list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import {
  checkbox,
  integer,
  float,
  relationship,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const GiftCardTransaction = list({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canReadGiftCards({ session }) ||
        permissions.canManageGiftCards({ session }),
      create: () => false,
      update: () => false,
      delete: () => false,
    },
  },
  fields: {
    amount: integer({
      validation: {
        isRequired: true,
      },
    }),
    isTaxable: checkbox(),
    taxRate: float(),
    giftCard: relationship({
      ref: "GiftCard.giftCardTransactions",
    }),
    order: relationship({
      ref: "Order.giftCardTransactions",
    }),
    ...trackingFields,
  },
});
