import { lockedRecordUi } from './lifecycle-ui';

import { list } from "@keystone-6/core";
import {
  checkbox,
  json,
  text,
  timestamp,
  relationship,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import { requiredRelationship } from './required-relationship';
import { trackingFields } from "./trackingFields";

export const Fulfillment = list({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canReadFulfillments({ session }) ||
        permissions.canManageFulfillments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false,
    },
  },

  fields: {
    // Status fields
    shippedAt: timestamp(),
    canceledAt: timestamp(),

    // Data fields
    data: json(),
    metadata: json(),
    idempotencyKey: text(),
    noNotification: checkbox({
      defaultValue: false,
    }),

    // Relationships
    order: requiredRelationship({
      ref: "Order.fulfillments",
      many: false,
      validation: { isRequired: true },
      // Atomic fulfillment commands validate quantities and audit together;
      // raw operations above are denied, including inverse relationship writes.
    }),
    claimOrder: relationship({
      ref: "ClaimOrder.fulfillments",
      many: false,
    }),
    swap: relationship({
      ref: "Swap.fulfillments",
      many: false,
    }),
    fulfillmentProvider: requiredRelationship({
      ref: "FulfillmentProvider.fulfillments",
      many: false,
      validation: { isRequired: true },
    }),
    fulfillmentItems: relationship({
      ref: "FulfillmentItem.fulfillment",
      many: true,
    }),
    shippingLabels: relationship({
      ref: "ShippingLabel.fulfillment",
      many: true,
    }),

    ...trackingFields,
  },
});
