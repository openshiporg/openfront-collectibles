
import type { Lists } from '.keystone/types';
import { graphql, group, list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import { integer, relationship, virtual } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

interface PriceListView { id: string; type: string; status: string; startsAt?: string | null; endsAt?: string | null }
interface MoneyPriceView { id: string; amount: number; currency: { code: string }; minQuantity?: number | null; maxQuantity?: number | null; priceList?: PriceListView | null }
interface PriceView extends MoneyPriceView {
  productVariant?: { id: string } | null;
  priceSet?: { prices: MoneyPriceView[]; priceRules: { type: string; value: number; priority: number }[] } | null;
}
interface CalculatedPrice { calculatedAmount: number; originalAmount: number; currencyCode: string; moneyAmountId: string; variantId: string | null; priceListId: string | null; priceListType: string | null }

export const MoneyAmount = list<Lists.MoneyAmount.TypeInfo>({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },
    filter: {
      query: ({ session }) => permissions.canManageProducts({ session }) ? true : {
        productVariant: { product: { status: { equals: "published" } } },
      },
    },
  },
  fields: {
    amount: integer({
      validation: {
        isRequired: true,
        min: 0,
        max: 2147483647,
      },
    }),
    compareAmount: integer(),
    minQuantity: integer(),
    maxQuantity: integer(),
    productVariant: relationship({
      ref: "ProductVariant.prices",
    }),
    region: relationship({
      ref: "Region.moneyAmounts",
    }),
    currency: relationship({
      ref: "Currency.moneyAmounts",
    }),
    priceList: relationship({
      ref: "PriceList.moneyAmounts",
    }),
    priceSet: relationship({
      ref: "PriceSet.prices",
    }),
    priceRules: relationship({
      ref: "PriceRule.moneyAmounts",
      many: true,
    }),

    ...group({
      label: "Virtual Fields",
      description: "Virtual fields for money amount",
      fields: {
        displayPrice: virtual({
          field: graphql.field({
            type: graphql.String,
            resolve: async (item, args, context) => {
              const price = await context.query.MoneyAmount.findOne({ where: { id: item.id }, query: 'currency { code noDivisionCurrency } amount' }) as { currency?: { code: string; noDivisionCurrency?: boolean } | null; amount: number } | null;
              if (!price?.currency) return null;
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency.code }).format(price.amount / (price.currency.noDivisionCurrency ? 1 : 100));
            },
          }),
        }),
        calculatedPrice: virtual({
          field: graphql.field({
            type: graphql.object<CalculatedPrice>()({
              name: "CalculatedPrice",
              fields: {
                calculatedAmount: graphql.field({ type: graphql.Int }),
                originalAmount: graphql.field({ type: graphql.Int }),
                currencyCode: graphql.field({ type: graphql.String }),
                moneyAmountId: graphql.field({ type: graphql.ID }),
                variantId: graphql.field({ type: graphql.ID }),
                priceListId: graphql.field({ type: graphql.ID }),
                priceListType: graphql.field({ type: graphql.String }),
              },
            }),
            resolve: async (item, args, context) => {
              const moneyAmount = await context.query.MoneyAmount.findOne({
                where: { id: item.id },
                query: `
                  id
                  amount
                  currency { code }
                  productVariant { id }
                  priceList { 
                    id 
                    type 
                    status
                    startsAt 
                    endsAt 
                  }
                  priceSet { 
                    id 
                    prices { 
                      id 
                      amount 
                      currency { code }
                      minQuantity
                      maxQuantity
                      priceList { 
                        id 
                        type 
                        status
                        startsAt 
                        endsAt 
                      }
                    }
                    priceRules {
                      id
                      type
                      value
                      priority
                      ruleAttribute
                      ruleValue
                    }
                  }
                `,
              }) as PriceView | null;

              if (!moneyAmount) return null;

              const now = new Date();
              const currencyCode = moneyAmount.currency.code;
              let calculatedAmount = moneyAmount.amount;
              let originalAmount = moneyAmount.amount;
              let appliedPriceList: PriceListView | null = null;

              // Check if there's a valid price list
              if (moneyAmount.priceList) {
                const startDate = moneyAmount.priceList.startsAt
                  ? new Date(moneyAmount.priceList.startsAt)
                  : null;
                const endDate = moneyAmount.priceList.endsAt
                  ? new Date(moneyAmount.priceList.endsAt)
                  : null;
                if (
                  moneyAmount.priceList.status === "active" &&
                  (!startDate || startDate <= now) &&
                  (!endDate || endDate >= now)
                ) {
                  appliedPriceList = moneyAmount.priceList;
                }
              }

              // Apply price set logic if it exists
              if (moneyAmount.priceSet) {
                const validPrices = moneyAmount.priceSet.prices.filter(
                  (price) => {
                    if (price.currency.code !== currencyCode) return false;
                    if (price.priceList) {
                      const startDate = price.priceList.startsAt
                        ? new Date(price.priceList.startsAt)
                        : null;
                      const endDate = price.priceList.endsAt
                        ? new Date(price.priceList.endsAt)
                        : null;
                      return (
                        price.priceList.status === "active" &&
                        (!startDate || startDate <= now) &&
                        (!endDate || endDate >= now)
                      );
                    }
                    return true;
                  }
                );

                if (validPrices.length > 0) {
                  // Sort prices by amount (ascending)
                  validPrices.sort((a, b) => a.amount - b.amount);
                  calculatedAmount = validPrices[0].amount;
                  appliedPriceList = validPrices[0].priceList || null;
                }

                // Apply price rules
                if (
                  moneyAmount.priceSet.priceRules &&
                  moneyAmount.priceSet.priceRules.length > 0
                ) {
                  const sortedRules = moneyAmount.priceSet.priceRules.sort(
                    (a, b) => b.priority - a.priority
                  );
                  for (const rule of sortedRules) {
                    if (rule.type === "fixed") {
                      calculatedAmount = Math.min(calculatedAmount, rule.value);
                    } else if (rule.type === "percentage") {
                      const discountAmount = Math.round(
                        calculatedAmount * (rule.value / 100)
                      );
                      calculatedAmount -= discountAmount;
                    }
                  }
                }
              }

              if (!Number.isSafeInteger(calculatedAmount) || calculatedAmount < 0 || calculatedAmount > 2147483647 || !Number.isSafeInteger(originalAmount) || originalAmount < 0) throw new Error('Invalid minor-unit price');
              return {
                calculatedAmount,
                originalAmount,
                currencyCode,
                moneyAmountId: moneyAmount.id,
                variantId: moneyAmount.productVariant?.id || null,
                priceListId: appliedPriceList?.id || null,
                priceListType: appliedPriceList?.type || null,
              };
            },
          }),
          ui: {
            query:
              "{ calculatedAmount originalAmount currencyCode moneyAmountId variantId priceListId priceListType }",
          },
        }),
      },
    }),
    ...trackingFields,
  },
  ui: {
    labelField: "displayPrice",
  },
});
