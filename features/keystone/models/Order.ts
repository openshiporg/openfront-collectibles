import { lockedRecordUi } from './lifecycle-ui';

import { jsonTransport } from '../lib/json-transport';
import { acceptedOrderCurrency, acceptedOrderTaxRate, acceptedOrderDiscounts } from '../lib/order-view-projection';
import type { OrderViewProjection } from '../lib/order-view-projection';
import type { Lists } from '.keystone/types';
import { graphql, group, list } from "@keystone-6/core";
import { denyAll } from "@keystone-6/core/access";
import {
  checkbox,
  integer,
  json,
  float,
  select,
  text,
  timestamp,
  relationship,
  virtual,
} from "@keystone-6/core/fields";
import { trackingFields } from "./trackingFields";
import { permissions } from "../access";
import { projectCustomerOrderForRead } from "../lib/customer-order-projection";

// Add these helper functions at the top
const formatCurrency = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
};

export const Order = list<Lists.Order.TypeInfo>({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canManageOrders({ session }) || Boolean(session?.customerToken),
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManageOrders({ session })) return true;
        if (session?.customerToken && session?.itemId) {
          return { user: { id: { equals: session.itemId } } };
        }
        return false;
      },
    },
  },
  fields: {
    status: select({
      type: "enum",
      options: [
        {
          label: "Pending",
          value: "pending",
        },
        {
          label: "Completed",
          value: "completed",
        },
        {
          label: "Archived",
          value: "archived",
        },
        {
          label: "Canceled",
          value: "canceled",
        },
        {
          label: "Requires Action",
          value: "requires_action",
        },
      ],
      defaultValue: "pending",
      validation: {
        isRequired: true,
      },
      access: {
        update: () => false,
      },
    }),
    displayId: integer({
      validation: {
        isRequired: true,
      },
    }),
    email: text({
      validation: {
        isRequired: true,
      },
    }),
    taxRate: float(),
    canceledAt: timestamp(),
    metadata: json(),
    idempotencyKey: text(),
    noNotification: checkbox(),
    externalId: text(),
    shippingAddress: relationship({
      ref: "Address.ordersUsingAsShippingAddress",
      many: false,
    }),
    billingAddress: relationship({
      ref: "Address.ordersUsingAsBillingAddress",
      many: false,
    }),
    currency: relationship({
      ref: "Currency.orders",
    }),
    draftOrder: relationship({
      ref: "DraftOrder.order",
    }),
    cart: relationship({
      ref: "Cart.order",
    }),
    user: relationship({
      ref: "User.orders",
    }),
    region: relationship({
      ref: "Region.orders",
    }),
    claimOrders: relationship({
      ref: "ClaimOrder.order",
      many: true,
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    fulfillments: relationship({
      ref: "Fulfillment.order",
      many: true,
      access: { create: denyAll, update: denyAll },
    }),
    giftCards: relationship({
      ref: "GiftCard.order",
      many: true,
    }),
    giftCardTransactions: relationship({
      ref: "GiftCardTransaction.order",
      many: true,
    }),
    lineItems: relationship({
      ref: "OrderLineItem.order",
      many: true,
    }),
    discounts: relationship({
      ref: "Discount.orders",
      many: true,
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    payments: relationship({
      ref: "Payment.order",
      many: true,
      access: { create: denyAll, update: denyAll },
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    returns: relationship({
      ref: "Return.order",
      many: true,
      access: { create: denyAll, update: denyAll },
    }),
    shippingMethods: relationship({
      ref: "ShippingMethod.order",
      many: true,
    }),
    swaps: relationship({
      ref: "Swap.order",
      many: true,
    }),
    
    // Account relationship for Openship integration
    account: relationship({
      ref: 'Account.orders',
      many: false,
    }),
    
    accountLineItems: relationship({
      ref: 'AccountLineItem.order',
      many: true,
    }),
    secretKey: text({
      hooks: {
        resolveInput: ({ operation }) => {
          // Only generate secretKey on creation
          if (operation === "create") {
            const randomBytes = require("crypto").randomBytes(32);
            return randomBytes.toString("hex");
          }
          // Don't allow updates to secretKey
          return undefined;
        },
      },
    }),

    ...group({
      label: "Virtual Fields",
      description: "Calculated fields for order display and totals",
      fields: {
        subtotal: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  lineItems(take: 501) { 
                    id 
                    quantity
                    title
                    sku
                    thumbnail
                    variantTitle
                    variantData
                    productData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  } 
                  region { 
                    id
                    currency { 
                      code 
                      noDivisionCurrency 
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              if (!order?.lineItems?.length) return "0";

              let subtotal = 0;
              for (const lineItem of order.lineItems) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }

              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;

              return formatCurrency(subtotal / divisor, currencyCode);
            },
          }),
        }),

        shipping: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  shippingMethods(take: 101) {
                    price
                  }
                  region {
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              if (!order?.shippingMethods?.length) return "0";

              const total = order.shippingMethods.reduce(
                (sum, method) => sum + (method.price || 0),
                0
              );

              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;

              return formatCurrency(total / divisor, currencyCode);
            },
          }),
        }),

        discount: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  lineItems(take: 501) {
                    id
                    quantity
                    title
                    sku
                    thumbnail
                    variantTitle
                    variantData
                    productData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  }
                  discounts(take: 101) {
                    id
                    discountRule {
                      type
                      value
                    }
                  }
                  shippingMethods(take: 101) {
                    price
                  }
                  region {
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              const discounts = acceptedOrderDiscounts(item, order?.discounts);
              if (!discounts.length) return null;

              // Calculate subtotal for percentage discounts
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }

              // Calculate total discount amount
              let totalDiscountAmount = 0;
              for (const discount of discounts) {
                if (!discount.discountRule?.type) continue;

                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * 
                      (acceptedOrderCurrency(item, order.currency).divisor);
                    break;
                  case "free_shipping":
                    totalDiscountAmount += order.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }

              if (totalDiscountAmount === 0) return null;

              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;

              return formatCurrency(totalDiscountAmount / divisor, currencyCode);
            },
          }),
        }),

        tax: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  lineItems(take: 501) {
                    id
                    quantity
                    title
                    sku
                    thumbnail
                    variantTitle
                    variantData
                    productData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  }
                  discounts(take: 101) {
                    id
                    discountRule {
                      type
                      value
                    }
                  }
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              // Calculate subtotal
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }

              // Calculate discount
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;

                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * 
                      (acceptedOrderCurrency(item, order.currency).divisor);
                    break;
                }
              }

              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * (acceptedOrderTaxRate(item));

              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;

              return formatCurrency(tax / divisor, currencyCode);
            },
          }),
        }),

        total: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  lineItems(take: 501) {
                    id
                    quantity
                    title
                    sku
                    thumbnail
                    variantTitle
                    variantData
                    productData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  }
                  discounts(take: 101) {
                    id
                    discountRule {
                      type
                      value
                    }
                  }
                  shippingMethods(take: 101) {
                    price
                  }
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              // Calculate subtotal
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }

              // Calculate discount
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;

                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * 
                      (acceptedOrderCurrency(item, order.currency).divisor);
                    break;
                  case "free_shipping":
                    totalDiscountAmount += order.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }

              // Calculate shipping
              const shipping = order.shippingMethods?.reduce(
                (sum, method) => sum + (method.price || 0),
                0
              ) || 0;

              // Calculate tax
              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * (acceptedOrderTaxRate(item));

              // Calculate total
              const total = subtotal - totalDiscountAmount + shipping + tax;

              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;

              return formatCurrency(total / divisor, currencyCode);
            },
          }),
        }),

        rawTotal: virtual({
          field: graphql.field({
            type: graphql.Int,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order: OrderViewProjection = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `
                  currency { code symbol noDivisionCurrency }
                  lineItems(take: 501) {
                    id
                    quantity
                    title
                    sku
                    thumbnail
                    variantTitle
                    variantData
                    productData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  }
                  discounts(take: 101) {
                    id
                    discountRule {
                      type
                      value
                    }
                  }
                  shippingMethods(take: 101) {
                    price
                  }
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `,
              });

              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error('Order projection exceeds the supported limit');
              // Calculate subtotal
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }

              // Calculate discount
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;

                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * 
                      (acceptedOrderCurrency(item, order.currency).divisor);
                    break;
                  case "free_shipping":
                    totalDiscountAmount += order.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }

              // Calculate shipping
              const shipping = order.shippingMethods?.reduce(
                (sum, method) => sum + (method.price || 0),
                0
              ) || 0;

              // Calculate tax
              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * (acceptedOrderTaxRate(item));

              // Calculate total
              return Math.round(subtotal - totalDiscountAmount + shipping + tax);
            },
          }),
        }),
        fulfillmentDetails: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  fulfillments {
                    id
                    createdAt
                    canceledAt
                    shippingLabels {
                      id
                      trackingNumber
                      trackingUrl
                      carrier
                      labelUrl
                    }
                    fulfillmentItems {
                      id
                      quantity
                      lineItem {
                        id
                        title
                        thumbnail
                        quantity
                        formattedUnitPrice
                        formattedTotal
                        sku
                        variantTitle
                        productData
                        variantData
                      }
                    }
                  }
                `,
              });

              const fulfillmentDetails = order.fulfillments?.map(fulfillment => ({
                id: fulfillment.id,
                createdAt: fulfillment.createdAt,
                canceledAt: fulfillment.canceledAt,
                shippingLabels: fulfillment.shippingLabels?.map(label => ({
                  id: label.id,
                  trackingNumber: label.trackingNumber,
                  url: label.trackingUrl,
                  carrier: label.carrier,
                  labelUrl: label.labelUrl
                })) || [],
                items: fulfillment.fulfillmentItems?.map(fi => ({
                  id: fi.id,
                  quantity: fi.quantity,
                  lineItem: {
                    id: fi.lineItem.id,
                    title: fi.lineItem.title,
                    thumbnail: fi.lineItem.thumbnail,
                    sku: fi.lineItem.sku,
                    variantTitle: fi.lineItem.variantTitle,
                    formattedUnitPrice: fi.lineItem.formattedUnitPrice,
                    formattedTotal: fi.lineItem.formattedTotal,
                    productData: fi.lineItem.productData,
                    variantData: fi.lineItem.variantData
                  }
                })) || []
              })) || [];
              if (permissions.canManageOrders({ session: context.session })) return jsonTransport(fulfillmentDetails);
              return jsonTransport(projectCustomerOrderForRead({ fulfillmentDetails })?.fulfillmentDetails || []);
            },
          }),
        }),

        unfulfilled: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              // First get the order with line items and active fulfillments
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  lineItems {
                    id
                    title
                    thumbnail
                    quantity
                    formattedUnitPrice
                    formattedTotal
                    sku
                    variantTitle
                    productData
                    variantData
                    moneyAmount {
                      amount
                      originalAmount
                    }
                  }
                  fulfillments {
                    canceledAt
                    fulfillmentItems {
                      quantity
                      lineItem {
                        id
                      }
                    }
                  }
                `,
              });

              // Calculate fulfilled quantities per line item from active fulfillments
              const fulfilledQuantities: Record<string, number> = {};
              order.fulfillments
                ?.filter(f => !f.canceledAt)
                ?.forEach(fulfillment => {
                  fulfillment.fulfillmentItems?.forEach(fi => {
                    const lineItemId = fi.lineItem.id;
                    fulfilledQuantities[lineItemId] = (fulfilledQuantities[lineItemId] || 0) + fi.quantity;
                  });
                });

              // Map line items with their fulfillment status
              const result = order.lineItems?.map(lineItem => {
                const fulfilledQuantity = fulfilledQuantities[lineItem.id] || 0;
                const remainingQuantity = lineItem.quantity - fulfilledQuantity;

                return {
                  id: lineItem.id,
                  title: lineItem.title,
                  thumbnail: lineItem.thumbnail,
                  sku: lineItem.sku,
                  quantity: remainingQuantity,
                  totalQuantity: lineItem.quantity,
                  fulfilledQuantity,
                  formattedUnitPrice: lineItem.formattedUnitPrice,
                  formattedTotal: lineItem.formattedTotal,
                  variantTitle: lineItem.variantTitle,
                  productData: lineItem.productData,
                  variantData: lineItem.variantData,
                  moneyAmount: lineItem.moneyAmount
                };
              }).filter(item => item.quantity > 0) || [];

              if (permissions.canManageOrders({ session: context.session })) return jsonTransport(result);
              return jsonTransport(projectCustomerOrderForRead({ unfulfilled: result })?.unfulfilled || []);
            },
          }),
        }),

        fulfillmentStatus: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  lineItems {
                    quantity
                  }
                  fulfillments {
                    canceledAt
                    shippingLabels {
                      id
                    }
                    fulfillmentItems {
                      quantity
                    }
                  }
                `,
              });

              const totalQuantity = (order.lineItems || []).reduce((sum, item) => sum + item.quantity, 0);
              const activeFulfillments = (order.fulfillments || []).filter(f => !f.canceledAt);
              
              const fulfilledQuantity = activeFulfillments.reduce((sum, f) => 
                sum + (f.fulfillmentItems || []).reduce((itemSum, fi) => itemSum + fi.quantity, 0), 0
              );

              const shippedQuantity = activeFulfillments
                .filter(f => Boolean(f.shippingLabels?.length))
                .reduce((sum, f) => 
                  sum + (f.fulfillmentItems || []).reduce((itemSum, fi) => itemSum + fi.quantity, 0), 0
                );

              return {
                totalQuantity,
                fulfilledQuantity, 
                shippedQuantity,
                remainingQuantity: totalQuantity - fulfilledQuantity,
                status: fulfilledQuantity === 0 ? 'not_fulfilled' :
                        fulfilledQuantity === totalQuantity ? 'fulfilled' :
                        'partially_fulfilled',
                shippingStatus: shippedQuantity === 0 ? 'not_shipped' :
                               shippedQuantity === totalQuantity ? 'shipped' :
                               'partially_shipped'
              };
            },
          }),
        }),
        paymentDetails: virtual({
          field: graphql.field({
            type: graphql.JSON,
            async resolve(item, args, context) {
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  payments {
                    id
                    amount
                    status
                    data
                    createdAt
                    paymentCollection {
                      paymentSessions {
                        id
                        amount
                        isSelected
                        paymentProvider {
                          name
                        }
                      }
                    }
                  }
                  currency {
                    code
                    symbol
                  }
                `
              });
    
              if (!order?.payments?.length) return null;
    
              return jsonTransport(order.payments.map(payment => ({
                id: payment.id,
                amount: payment.amount,
                formattedAmount: order.currency ? 
                  `${order.currency.symbol}${(payment.amount / 100).toFixed(2)}` :
                  `${(payment.amount / 100).toFixed(2)}`,
                status: payment.status,
                createdAt: payment.createdAt,
                provider: payment.data?.provider,
                cardLast4: payment.data?.cardLast4,
                paymentSession: payment.paymentCollection?.paymentSessions?.find(s => s.isSelected)
              })));
            }
          })
        }),
    
        totalPaid: virtual({
          field: graphql.field({
            type: graphql.Int,
            async resolve(item, args, context) {
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  payments {
                    amount
                    status
                  }
                  accountLineItems {
                    id
                    paymentStatus
                    amount
                  }
                `
              });
    
              // Check direct order payments first (normal checkout)
              let totalPaid = order.payments?.reduce((total, payment) => {
                if (payment.status === 'captured') {
                  return total + payment.amount;
                }
                return total;
              }, 0) || 0;

              // If no direct payments, check if this order was paid through an invoice
              if (totalPaid === 0 && order.accountLineItems && order.accountLineItems.length > 0) {
                // Check if any account line items for this order are marked as paid
                const hasPaidLineItems = order.accountLineItems.some(lineItem => 
                  lineItem.paymentStatus === 'paid'
                );
                
                if (hasPaidLineItems) {
                  // If paid through invoice, sum the account line item amounts
                  totalPaid = order.accountLineItems.reduce((total, lineItem) => {
                    if (lineItem.paymentStatus === 'paid') {
                      return total + (lineItem.amount || 0);
                    }
                    return total;
                  }, 0);
                }
              }

              return totalPaid;
            }
          })
        }),
    
        formattedTotalPaid: virtual({
          field: graphql.field({
            type: graphql.String,
            async resolve(item, args, context) {
              const order: OrderViewProjection = await context.sudo().query.Order.findOne({
                where: { id: item.id },
                query: `
                  payments {
                    amount
                    status
                  }
                  accountLineItems {
                    id
                    paymentStatus
                    amount
                  }
                  currency {
                    code
                    symbol
                  }
                `
              });
    
              // Check direct order payments first (normal checkout)
              let totalPaid = order.payments?.reduce((total, payment) => {
                if (payment.status === 'captured') {
                  return total + payment.amount;
                }
                return total;
              }, 0) || 0;

              // If no direct payments, check if this order was paid through an invoice
              if (totalPaid === 0 && order.accountLineItems && order.accountLineItems.length > 0) {
                // Check if any account line items for this order are marked as paid
                const hasPaidLineItems = order.accountLineItems.some(lineItem => 
                  lineItem.paymentStatus === 'paid'
                );
                
                if (hasPaidLineItems) {
                  // If paid through invoice, sum the account line item amounts
                  totalPaid = order.accountLineItems.reduce((total, lineItem) => {
                    if (lineItem.paymentStatus === 'paid') {
                      return total + (lineItem.amount || 0);
                    }
                    return total;
                  }, 0);
                }
              }
    
              const { code, divisor } = acceptedOrderCurrency(item, order.currency);
              return formatCurrency(totalPaid / divisor, code);
            }
          })
        }),
      },
    }),

    events: relationship({
      ref: "OrderEvent.order",
      many: true,
    }),

    note: text({
      label: 'Note',
    }),
    shippingLabels: relationship({
      ref: "ShippingLabel.order",
      many: true,
    }),
    ...trackingFields,



  },
});

