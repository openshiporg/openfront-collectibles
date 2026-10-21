import { lockedRecordUi } from './lifecycle-ui';

import type { Lists } from '.keystone/types';
import { list } from "@keystone-6/core";
import { integer, relationship, text, json, virtual } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { getOrderSnapshotThumbnail } from "../lib/order-thumbnail-url";
import { trackingFields } from "./trackingFields";
import { graphql } from "@keystone-6/core";

export const OrderLineItem = list<Lists.OrderLineItem.TypeInfo>({
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
    quantity: integer({
      validation: { isRequired: true },
    }),
    title: text({
      validation: { isRequired: true },
    }),
    sku: text(),
    thumbnail: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve(item) {
          return getOrderSnapshotThumbnail(item.productData);
        }
      })
    }),
    metadata: json(),
    productData: json({
      ui: { description: "Snapshot of product data at time of order" },
    }),
    variantData: json({
      ui: { description: "Snapshot of variant data at time of order" },
    }),
    // Formatted values for display
    variantTitle: text(),
    formattedUnitPrice: text(),
    formattedTotal: text(),
    order: relationship({
      ref: "Order.lineItems",
    }),
    productVariant: relationship({
      ref: "ProductVariant",
      ui: { description: "Optional reference to product variant (may be deleted)" },
    }),
    moneyAmount: relationship({
      ref: "OrderMoneyAmount.orderLineItem",
    }),
    originalLineItem: relationship({
      ref: "LineItem",
      ui: { description: "Reference to the original cart line item" },
    }),
    fulfillmentItems: relationship({
      ref: "FulfillmentItem.lineItem",
      many: true,
    }),
    ...trackingFields,
  },
});