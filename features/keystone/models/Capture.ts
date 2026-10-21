import { lockedRecordUi } from './lifecycle-ui';

import { list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import {
  integer,
  json,
  text,
  timestamp,
  relationship,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Capture = list({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canReadPayments({ session }) ||
        permissions.canManagePayments({ session }),
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
    providerCaptureKey: text({
      isIndexed: 'unique',
      defaultValue: null,
      db: { isNullable: true },
      access: { read: denyAll, create: () => false, update: () => false },
    }),
    payment: relationship({
      ref: "Payment.captures",
    }),
    metadata: json(),
    createdBy: text(),
    ...trackingFields,
  },
}); 