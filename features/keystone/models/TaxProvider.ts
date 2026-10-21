import { Lists } from '.keystone/types';
import { list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import { checkbox, relationship } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const TaxProvider = list<Lists.TaxProvider.TypeInfo>({
  access: {
    operation: {
      query: permissions.canManageIntegrations,
      create: permissions.canManageIntegrations,
      update: permissions.canManageIntegrations,
      delete: permissions.canManageIntegrations,
    },
  },
  fields: {
    ...trackingFields,
    isInstalled: checkbox({
      defaultValue: true,
    }),
    regions: relationship({
      ref: "Region.taxProvider",
      many: true,
    }),
  },
});
