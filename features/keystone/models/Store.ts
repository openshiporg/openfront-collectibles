
import type { Lists } from '.keystone/types';
import { list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import { json, text, relationship, virtual } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { graphql } from "@keystone-6/core";
import {
  DEFAULT_STORE_LOGO_COLOR,
  DEFAULT_STORE_LOGO_ICON,
  normalizeStoreLogoColor,
} from "../../platform/store-settings/lib/store-logo";
import { sanitizeStoreLogoSvg } from "../utils/storeLogo";
import { getPublicPaymentProviderConfig } from "../utils/paymentProviderConfig";

export const Store = list<Lists.Store.TypeInfo>({
  access: {
    operation: {
      // Allow public read access
      query: () => true,
      create: permissions.canManageSalesChannels,
      update: permissions.canManageSalesChannels,
      delete: permissions.canManageSalesChannels,
    },
  },
  fields: {
    name: text({
      defaultValue: "Openfront Store",
      validation: {
        isRequired: true,
      },
    }),
    defaultCurrencyCode: text({
      defaultValue: "usd",
      validation: {
        isRequired: true,
      },
    }),
    homepageTitle: text({
      defaultValue: "Openfront Next.js Starter",
    }),
    homepageDescription: text({
      defaultValue: "A performant frontend e-commerce starter template with Next.js 15 and Openfront.",
    }),
    logoIcon: text({
      defaultValue: DEFAULT_STORE_LOGO_ICON,
      hooks: {
        resolveInput: ({ resolvedData, fieldKey }) => {
          const value = resolvedData[fieldKey];
          if (value === undefined || value === null || value === '') return value;
          return typeof value === 'string' ? sanitizeStoreLogoSvg(value) : '';
        },
        validate: ({ inputData, resolvedData, fieldKey, addValidationError }) => {
          const submitted = inputData?.logoIcon;
          if (typeof submitted === 'string' && submitted.trim() && !resolvedData?.[fieldKey]) {
            addValidationError('Logo must be a valid, safe SVG document');
          }
        },
      },
    }),
    logoColor: text({
      defaultValue: DEFAULT_STORE_LOGO_COLOR,
      hooks: {
        resolveInput: ({ resolvedData, fieldKey }) => {
          const value = resolvedData[fieldKey];
          return value === undefined ? value : normalizeStoreLogoColor(value);
        },
      },
    }),
    metadata: json(),
    swapLinkTemplate: text(),
    paymentLinkTemplate: text(),
    inviteLinkTemplate: text(),
    // currency: relationship({
    //   ref: "Currency.stores",
    // }),
    currencies: relationship({
      ref: "Currency.stores",
      many: true,
    }),
    paymentProviders: virtual({
      field: graphql.field({
        type: graphql.list(
          graphql.object<{
            provider: string;
            publishableKey: string;
          }>()({
            name: 'PaymentProviderConfig',
            fields: {
              provider: graphql.field({ type: graphql.String }),
              publishableKey: graphql.field({ type: graphql.String }),
            },
          })
        ),
        resolve: async (_item, _args, context) => {
          const installedProviders = await context.sudo().query.PaymentProvider.findMany({
            where: { isInstalled: { equals: true } },
            take: 51,
            query: 'code',
          });
          if (installedProviders.length > 50) throw new Error('Payment provider configuration exceeds the supported bound');
          return installedProviders
            .map((provider: any) => getPublicPaymentProviderConfig(provider.code || ''))
            .filter((provider): provider is { provider: 'stripe' | 'paypal'; publishableKey: string } => Boolean(provider));
        },
      }),
      ui: { query: '{ provider publishableKey }', createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'hidden' }, listView: { fieldMode: 'hidden' } },
    }),
    ...trackingFields,
  },
});
