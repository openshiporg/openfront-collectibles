
import type { Lists } from '.keystone/types';
import { graphql, list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import {
  checkbox,
  integer,
  json,
  text,
  relationship,
  virtual,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const ProductVariant = list<Lists.ProductVariant.TypeInfo>({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },
    filter: {
      query: ({ session }) => permissions.canManageProducts({ session }) ? true : { product: { status: { equals: "published" } } },
    },
  },
  fields: {
    isUniqueCollectible: virtual({
      field: graphql.field({
        type: graphql.Boolean,
        async resolve(item, _args, context) {
          const product = item.productId ? await context.prisma.product.findUnique({ where: { id: item.productId }, select: { status: true } }) : null;
          if (product?.status !== 'published' && !permissions.canManageProducts({ session: context.session })) return false;
          // Public catalog classification only; never expose the private stock record.
          return Boolean(await context.prisma.inventoryUnit.findFirst({ where: { commerceVariantId: item.id }, select: { id: true } }));
        },
      }),
    }),
    fullTitle: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: async (item, args, context) => {
          const { product } = await context.query.ProductVariant.findOne({
            where: { id: item.id.toString() },
            query: "product { title }",
          });
          return `${product?.title ? `${product.title} - ` : ""}${item.title}`;
        },
      }),
    }),
    title: text({
      validation: {
        isRequired: true,
      },
    }),
    sku: text(),
    barcode: text({ access: { read: permissions.canManageProducts } }),
    ean: text({ access: { read: permissions.canManageProducts } }),
    upc: text({ access: { read: permissions.canManageProducts } }),
    inventoryQuantity: integer({
      validation: {
        isRequired: true,
      },
    }),
    allowBackorder: checkbox(),
    manageInventory: checkbox({
      defaultValue: true,
    }),
    hsCode: text({ access: { read: permissions.canManageProducts } }),
    originCountry: text({ access: { read: permissions.canManageProducts } }),
    midCode: text({ access: { read: permissions.canManageProducts } }),
    material: text({ access: { read: permissions.canManageProducts } }),
    metadata: json({ access: { read: permissions.canManageProducts } }),
    variantRank: integer({
      defaultValue: 0,
    }),
    product: relationship({
      ref: "Product.productVariants",
    }),
    claimItems: relationship({
      ref: "ClaimItem.productVariant",
      many: true,
    }),
    lineItems: relationship({
      ref: "LineItem.productVariant",
      many: true,
    }),
    prices: relationship({
      ref: "MoneyAmount.productVariant",
      many: true,
    }),
    productOptionValues: relationship({
      ref: "ProductOptionValue.productVariants",
      many: true,
    }),
    location: relationship({
      ref: "Location.variants",
    }),
    stockMovements: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "StockMovement.variant",
      many: true,
    }),
    collectibleInventoryUnit: relationship({
      ref: "InventoryUnit.commerceVariant",
      many: false,
      // Inverse connect/disconnect can otherwise change a read-only Unit's FK.
      access: { create: denyAll, update: denyAll },
      ui: { itemView: { fieldMode: "read" } },
    }),
    measurements: relationship({
      ref: "Measurement.productVariant",
      many: true,
    }),
    primaryImage: relationship({
      ref: "ProductImage.productVariants",
      many: false,
    }),
    ...trackingFields,
  },
  ui: {
    labelField: "fullTitle",
  },
});