
import { list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import { text, json, checkbox, relationship } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { shippingProviderAdapters } from '../../integrations/shipping';

export const ShippingProvider = list({
  ui: { listView: { initialColumns: ['name', 'isActive', 'updatedAt'] } },
  hooks: {
    validateInput: ({ resolvedData, item, addValidationError }) => {
      const allowed = new Set(Object.keys(shippingProviderAdapters));
      for (const field of ['createLabelFunction', 'getRatesFunction', 'validateAddressFunction', 'trackShipmentFunction', 'cancelLabelFunction']) {
        const adapterKey = resolvedData[field] ?? item?.[field];
        if (typeof adapterKey !== 'string' || !allowed.has(adapterKey)) {
          addValidationError(`${field} must name a registered shipping adapter`);
        }
      }
    },
  },
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canReadOrders({ session }) ||
        permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders,
    },
  },

  fields: {
    name: text({
      validation: { isRequired: true },
    }),

    isActive: checkbox({
      defaultValue: false,
    }),

    accessToken: text({
      isFilterable: false,
      isOrderable: false,
      validation: { isRequired: true },
      access: {
        read: denyAll,
        create: permissions.canManageOrders,
        update: permissions.canManageOrders,
      },
      ui: {
        itemView: { fieldMode: "hidden" },
      },
    }),

    // Adapter names are resolved only through the in-repository registry; arbitrary URLs are never called.
    createLabelFunction: text({
      validation: { isRequired: true },
      ui: { description: "Registered shipping adapter name (shippo, shipengine, or manual)" }
    }),

    getRatesFunction: text({
      validation: { isRequired: true },
      ui: { description: "Registered shipping adapter name (shippo, shipengine, or manual)" }
    }),

    validateAddressFunction: text({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)",
      }
    }),

    trackShipmentFunction: text({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)",
      }
    }),

    cancelLabelFunction: text({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)",
      }
    }),

    metadata: json(),

    // Relationships
    regions: relationship({
      ref: "Region.shippingProviders",
      many: true,
    }),

    labels: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
      ref: "ShippingLabel.provider",
      many: true,
    }),

    fulfillmentProvider: relationship({
      ref: "FulfillmentProvider.shippingProviders",
      many: false,
    }),

    fromAddress: relationship({
      ref: 'Address.shippingProviders',
      many: false,
      // ui: {
      //   displayMode: 'cards',
      //   cardFields: ['company', 'address1', 'city', 'province', 'country'],
      //   inlineCreate: { fields: ['company', 'firstName', 'lastName', 'address1', 'address2', 'city', 'province', 'postalCode', 'country', 'phone'] },
      //   inlineEdit: { fields: ['company', 'firstName', 'lastName', 'address1', 'address2', 'city', 'province', 'postalCode', 'country', 'phone'] },
      //   inlineConnect: true,
      // },
    }),

    ...trackingFields,
  },
});
