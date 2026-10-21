"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// features/integrations/payment/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  capturePaymentFunction: () => capturePaymentFunction,
  createPaymentFunction: () => createPaymentFunction,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction,
  getPaymentStatusFunction: () => getPaymentStatusFunction,
  handleWebhookFunction: () => handleWebhookFunction,
  refundPaymentFunction: () => refundPaymentFunction
});
async function createPaymentFunction({ cart, amount, currency }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true
    },
    metadata: cart?.id ? { cartId: cart.id } : void 0
  }, cart?.id ? { idempotencyKey: `cart:${cart.id}:${amount}:${currency.toLowerCase()}` } : void 0);
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}
async function capturePaymentFunction({ paymentId, amount, idempotencyKey }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.capture(
    paymentId,
    { ...amount ? { amount_to_capture: amount } : {} },
    idempotencyKey ? { idempotencyKey } : void 0
  );
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    data: paymentIntent
  };
}
async function refundPaymentFunction({ paymentId, amount, idempotencyKey }) {
  const stripe = getStripeClient();
  const refund = await stripe.refunds.create({
    payment_intent: paymentId,
    ...amount ? { amount } : {}
  }, idempotencyKey ? { idempotencyKey } : void 0);
  return {
    status: refund.status,
    amount: refund.amount,
    currency: refund.currency,
    data: refund
  };
}
async function getPaymentStatusFunction({ paymentId }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received || paymentIntent.amount,
    currency: paymentIntent.currency,
    data: paymentIntent
  };
}
async function generatePaymentLinkFunction({ paymentId }) {
  return `https://dashboard.stripe.com/payments/${paymentId}`;
}
async function handleWebhookFunction({ event, headers }) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured");
  }
  const stripe = getStripeClient();
  try {
    if (!headers.__rawBody) throw new Error("Raw webhook body is required");
    const stripeEvent = stripe.webhooks.constructEvent(
      headers.__rawBody,
      headers["stripe-signature"],
      webhookSecret
    );
    return {
      isValid: true,
      event: stripeEvent,
      type: stripeEvent.type,
      resource: stripeEvent.data.object
    };
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
var import_stripe, getStripeClient;
var init_stripe = __esm({
  "features/integrations/payment/stripe.ts"() {
    "use strict";
    import_stripe = __toESM(require("stripe"));
    getStripeClient = () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("Stripe secret key not configured");
      }
      return new import_stripe.default(stripeKey, {
        apiVersion: "2025-05-28.basil"
      });
    };
  }
});

// features/integrations/payment/paypal.ts
var paypal_exports = {};
__export(paypal_exports, {
  capturePaymentFunction: () => capturePaymentFunction2,
  createPaymentFunction: () => createPaymentFunction2,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction2,
  getPaymentStatusFunction: () => getPaymentStatusFunction2,
  handleWebhookFunction: () => handleWebhookFunction2,
  refundPaymentFunction: () => refundPaymentFunction2
});
async function handleWebhookFunction2({ event, headers }) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PayPal webhook ID is not configured");
  }
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: event
    })
  });
  const verification = await response.json();
  const isValid = verification.verification_status === "SUCCESS";
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }
  return {
    isValid: true,
    event,
    type: event.event_type,
    resource: event.resource
  };
}
async function createPaymentFunction2({ cart, amount, currency }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...cart?.id ? { "PayPal-Request-Id": `cart-${cart.id}-${amount}-${currency.toUpperCase()}` } : {}
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: cart?.id,
            amount: {
              currency_code: currency.toUpperCase(),
              value: formatPayPalAmount(amount, currency)
            }
          }
        ]
      })
    }
  );
  const order = await response.json();
  if (order.error) {
    throw new Error(`PayPal order creation failed: ${order.error.message}`);
  }
  return {
    orderId: order.id,
    status: order.status
  };
}
async function capturePaymentFunction2({ paymentId, idempotencyKey }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${paymentId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}
      }
    }
  );
  const capture = await response.json();
  if (capture.error) {
    throw new Error(`PayPal capture failed: ${capture.error.message}`);
  }
  const capturedAmount = capture.purchase_units[0].payments.captures[0].amount;
  return {
    status: capture.status,
    amount: parsePayPalAmount(capturedAmount.value, capturedAmount.currency_code),
    currency: capturedAmount.currency_code,
    data: capture
  };
}
async function refundPaymentFunction2({ paymentId, amount = 0, currency = "USD", idempotencyKey }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/payments/captures/${paymentId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}
      },
      body: JSON.stringify({
        amount: {
          value: formatPayPalAmount(amount, currency),
          currency_code: currency.toUpperCase()
        }
      })
    }
  );
  const refund = await response.json();
  if (refund.error) {
    throw new Error(`PayPal refund failed: ${refund.error.message}`);
  }
  return {
    status: refund.status,
    amount: parsePayPalAmount(refund.amount.value, refund.amount.currency_code),
    currency: refund.amount.currency_code,
    data: refund
  };
}
async function getPaymentStatusFunction2({ paymentId }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${paymentId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const order = await response.json();
  if (order.error) {
    throw new Error(`PayPal status check failed: ${order.error.message}`);
  }
  const orderAmount = order.purchase_units[0].amount;
  return {
    status: order.status,
    amount: parsePayPalAmount(orderAmount.value, orderAmount.currency_code),
    currency: orderAmount.currency_code,
    data: order
  };
}
async function generatePaymentLinkFunction2({ paymentId }) {
  return `https://www.paypal.com/activity/payment/${paymentId}`;
}
var NO_DIVISION_CURRENCIES, getPayPalBaseUrl, formatPayPalAmount, parsePayPalAmount, getPayPalAccessToken;
var init_paypal = __esm({
  "features/integrations/payment/paypal.ts"() {
    "use strict";
    NO_DIVISION_CURRENCIES = [
      "JPY",
      "KRW",
      "VND",
      "CLP",
      "PYG",
      "XAF",
      "XOF",
      "BIF",
      "DJF",
      "GNF",
      "KMF",
      "MGA",
      "RWF",
      "XPF",
      "HTG",
      "VUV",
      "XAG",
      "XDR",
      "XAU"
    ];
    getPayPalBaseUrl = () => {
      const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX !== "false";
      return isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    };
    formatPayPalAmount = (amount, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return amount.toString();
      }
      return (amount / 100).toFixed(2);
    };
    parsePayPalAmount = (value, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return parseInt(value, 10);
      }
      return Math.round(parseFloat(value) * 100);
    };
    getPayPalAccessToken = async () => {
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials not configured");
      }
      const baseUrl = getPayPalBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/oauth2/token`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Language": "en_US",
            Authorization: `Basic ${Buffer.from(
              `${clientId}:${clientSecret}`
            ).toString("base64")}`
          },
          body: "grant_type=client_credentials"
        }
      );
      const { access_token } = await response.json();
      if (!access_token) {
        throw new Error("Failed to get PayPal access token");
      }
      return access_token;
    };
  }
});

// features/integrations/payment/manual.ts
var manual_exports = {};
__export(manual_exports, {
  capturePaymentFunction: () => capturePaymentFunction3,
  createPaymentFunction: () => createPaymentFunction3,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction3,
  getPaymentStatusFunction: () => getPaymentStatusFunction3,
  handleWebhookFunction: () => handleWebhookFunction3,
  refundPaymentFunction: () => refundPaymentFunction3
});
async function handleWebhookFunction3() {
  throw new Error("Manual payment providers do not accept webhook ingress");
}
async function createPaymentFunction3({ cart, amount, currency }) {
  return {
    status: "pending",
    data: {
      status: "pending",
      amount,
      currency: currency.toLowerCase()
    }
  };
}
async function capturePaymentFunction3({ paymentId, amount = 0 }) {
  return {
    status: "captured",
    amount,
    data: {
      status: "captured",
      amount,
      captured_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function refundPaymentFunction3({ paymentId, amount = 0, currency = "USD" }) {
  return {
    status: "refunded",
    amount,
    currency,
    data: {
      status: "refunded",
      amount,
      refunded_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function getPaymentStatusFunction3({ paymentId }) {
  return {
    status: "succeeded",
    data: {
      status: "succeeded"
    }
  };
}
async function generatePaymentLinkFunction3({ paymentId }) {
  return null;
}
var init_manual = __esm({
  "features/integrations/payment/manual.ts"() {
    "use strict";
  }
});

// features/integrations/shipping/contracts.ts
var import_zod3, addressSchema, providerSchema, dimensionsSchema, ratesInputSchema, labelInputSchema, addressInputSchema, trackingInputSchema, cancelInputSchema, rateSchema;
var init_contracts = __esm({
  "features/integrations/shipping/contracts.ts"() {
    "use strict";
    import_zod3 = require("zod");
    addressSchema = import_zod3.z.object({
      firstName: import_zod3.z.string().max(200).default(""),
      lastName: import_zod3.z.string().max(200).default(""),
      company: import_zod3.z.string().max(200).nullish(),
      address1: import_zod3.z.string().min(1).max(500),
      address2: import_zod3.z.string().max(500).nullish(),
      city: import_zod3.z.string().min(1).max(200),
      province: import_zod3.z.string().max(200).nullish(),
      postalCode: import_zod3.z.string().min(1).max(30),
      phone: import_zod3.z.string().max(100).nullish(),
      email: import_zod3.z.union([import_zod3.z.literal(""), import_zod3.z.string().email()]).nullish(),
      country: import_zod3.z.object({ iso2: import_zod3.z.string().regex(/^[a-z]{2}$/i) })
    });
    providerSchema = import_zod3.z.object({ id: import_zod3.z.string().min(1).max(200), accessToken: import_zod3.z.string().min(1).max(1e4) });
    dimensionsSchema = import_zod3.z.object({
      length: import_zod3.z.number().finite().positive(),
      width: import_zod3.z.number().finite().positive(),
      height: import_zod3.z.number().finite().positive(),
      unit: import_zod3.z.enum(["in", "cm", "m", "ft"]),
      weight: import_zod3.z.number().finite().positive(),
      weightUnit: import_zod3.z.enum(["oz", "lb", "lbs", "kg", "g", "mg"])
    });
    ratesInputSchema = import_zod3.z.object({ provider: providerSchema.extend({ fromAddress: addressSchema }), order: import_zod3.z.object({ shippingAddress: addressSchema }), dimensions: dimensionsSchema });
    labelInputSchema = ratesInputSchema.extend({ rateId: import_zod3.z.string().min(1).max(2e3), lineItems: import_zod3.z.array(import_zod3.z.unknown()).max(500).default([]), idempotencyKey: import_zod3.z.string().min(1).max(500) });
    addressInputSchema = import_zod3.z.object({ provider: providerSchema, address: addressSchema });
    trackingInputSchema = import_zod3.z.object({ provider: providerSchema, trackingNumber: import_zod3.z.string().min(1).max(200) });
    cancelInputSchema = import_zod3.z.object({ provider: providerSchema, labelId: import_zod3.z.string().min(1).max(200) });
    rateSchema = import_zod3.z.object({ id: import_zod3.z.string().min(1), providerId: import_zod3.z.string().min(1), service: import_zod3.z.string().min(1), carrier: import_zod3.z.string().min(1), price: import_zod3.z.union([import_zod3.z.string().regex(/^\d+(\.\d+)?$/), import_zod3.z.number().finite().nonnegative()]), currency: import_zod3.z.string().regex(/^[A-Z]{3}$/), estimatedDays: import_zod3.z.number().finite().nonnegative().nullish() });
  }
});

// features/integrations/shipping/shippo.ts
var shippo_exports = {};
__export(shippo_exports, {
  cancelLabelFunction: () => cancelLabelFunction,
  createLabelFunction: () => createLabelFunction,
  getRatesFunction: () => getRatesFunction,
  trackShipmentFunction: () => trackShipmentFunction,
  validateAddressFunction: () => validateAddressFunction
});
async function createLabelFunction(input) {
  const { provider, order, rateId, dimensions, lineItems, idempotencyKey } = labelInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to create a shipping label");
  }
  if (!dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
    throw new Error(
      "Invalid dimensions provided. All dimensions and weight are required"
    );
  }
  const addressToResponse = await fetch(`${SHIPPO_API_URL}/addresses/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      company: order.shippingAddress.company,
      street1: order.shippingAddress.address1,
      street2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.province,
      zip: order.shippingAddress.postalCode,
      country: order.shippingAddress.country.iso2,
      phone: order.shippingAddress.phone,
      email: order.shippingAddress.email
    })
  });
  const addressTo = await addressToResponse.json();
  if (!addressToResponse.ok) {
    throw new Error(addressTo.message || "Failed to create address");
  }
  const shipmentResponse = await fetch(`${SHIPPO_API_URL}/shipments/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      address_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        company: provider.fromAddress.company,
        street1: provider.fromAddress.address1,
        street2: provider.fromAddress.address2,
        city: provider.fromAddress.city,
        state: provider.fromAddress.province,
        zip: provider.fromAddress.postalCode,
        country: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone
      },
      address_to: addressTo.object_id,
      parcels: [
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          distance_unit: dimensions.unit,
          weight: dimensions.weight,
          mass_unit: dimensions.weightUnit || dimensions.unit
        }
      ],
      async: false
    })
  });
  const shipment = await shipmentResponse.json();
  if (!shipmentResponse.ok) {
    throw new Error(shipment.message || "Failed to create shipment");
  }
  const transactionResponse = await fetch(`${SHIPPO_API_URL}/transactions/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      rate: rateId,
      label_file_type: "PDF",
      async: false,
      ...idempotencyKey ? { metadata: idempotencyKey } : {}
    })
  });
  const transaction = await transactionResponse.json();
  if (!transactionResponse.ok) {
    throw new Error(transaction.message || "Failed to create label");
  }
  if (transaction.status === "ERROR") {
    const errorMessage = transaction.messages?.[0]?.text || "Label creation failed";
    throw new Error(errorMessage);
  }
  if (!transaction.label_url) {
    throw new Error("No label URL received from Shippo");
  }
  return {
    status: "purchased",
    data: transaction,
    rate: transaction.rate,
    carrier: transaction.provider,
    service: transaction.servicelevel?.name,
    trackingNumber: transaction.tracking_number,
    trackingUrl: transaction.tracking_url_provider,
    labelUrl: transaction.label_url
  };
}
async function getRatesFunction(input) {
  const { provider, order, dimensions } = ratesInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to get shipping rates");
  }
  const addressToResponse = await fetch(`${SHIPPO_API_URL}/addresses/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      company: order.shippingAddress.company,
      street1: order.shippingAddress.address1,
      street2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.province,
      zip: order.shippingAddress.postalCode,
      country: order.shippingAddress.country.iso2,
      phone: order.shippingAddress.phone
    })
  });
  const addressTo = await addressToResponse.json();
  if (!addressToResponse.ok) {
    throw new Error(addressTo.message || "Failed to create address");
  }
  const shipmentResponse = await fetch(`${SHIPPO_API_URL}/shipments/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      address_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        company: provider.fromAddress.company,
        street1: provider.fromAddress.address1,
        street2: provider.fromAddress.address2,
        city: provider.fromAddress.city,
        state: provider.fromAddress.province,
        zip: provider.fromAddress.postalCode,
        country: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone
      },
      address_to: addressTo.object_id,
      parcels: [
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          distance_unit: dimensions.unit,
          weight: dimensions.weight,
          mass_unit: dimensions.weightUnit
        }
      ]
    })
  });
  const shipment = await shipmentResponse.json();
  if (!shipmentResponse.ok) {
    throw new Error(
      shipment.message || shipment.__all__ || "Failed to create shipment"
    );
  }
  return shipment.rates.map((rawRate) => {
    const rate = import_zod4.z.object({ object_id: import_zod4.z.string(), servicelevel: import_zod4.z.object({ name: import_zod4.z.string() }), provider: import_zod4.z.string(), amount: import_zod4.z.string().regex(/^\d+(\.\d+)?$/), currency: import_zod4.z.string().regex(/^[A-Z]{3}$/), estimated_days: import_zod4.z.number().nonnegative().nullish() }).parse(rawRate);
    return {
      id: rate.object_id,
      providerId: provider.id,
      service: rate.servicelevel.name,
      carrier: rate.provider,
      price: rate.amount,
      currency: rate.currency,
      estimatedDays: rate.estimated_days
    };
  });
}
async function validateAddressFunction(input) {
  const { provider, address } = addressInputSchema.parse(input);
  try {
    const response = await fetch(`${SHIPPO_API_URL}/addresses/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${provider.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: `${address.firstName} ${address.lastName}`,
        company: address.company,
        street1: address.address1,
        street2: address.address2,
        city: address.city,
        state: address.province,
        zip: address.postalCode,
        country: address.country.iso2,
        phone: address.phone,
        validate: true
      })
    });
    const validation = await response.json();
    if (!response.ok) {
      throw new Error(validation.message || "Address validation failed");
    }
    return {
      isValid: validation.validation_results.is_valid,
      suggestedAddress: validation.validation_results.is_valid ? {
        address1: validation.street1,
        address2: validation.street2,
        city: validation.city,
        province: validation.state,
        postalCode: validation.zip,
        country: validation.country
      } : null,
      errors: validation.validation_results.messages || []
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Shipping operation failed"]
    };
  }
}
async function trackShipmentFunction(input) {
  const { provider, trackingNumber } = trackingInputSchema.parse(input);
  const response = await fetch(`${SHIPPO_API_URL}/tracks/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      carrier: "usps",
      tracking_number: trackingNumber
    })
  });
  const tracking = await response.json();
  if (!response.ok) {
    throw new Error(tracking.message || "Failed to track shipment");
  }
  return {
    status: tracking.tracking_status.status,
    estimatedDelivery: tracking.eta,
    trackingUrl: tracking.tracking_url,
    events: tracking.tracking_history.map((rawEvent) => {
      const event = import_zod4.z.object({ status: import_zod4.z.string(), location: import_zod4.z.unknown(), status_date: import_zod4.z.string(), status_details: import_zod4.z.string() }).parse(rawEvent);
      return {
        status: event.status,
        location: event.location,
        timestamp: event.status_date,
        message: event.status_details
      };
    })
  };
}
async function cancelLabelFunction(input) {
  const { provider, labelId } = cancelInputSchema.parse(input);
  try {
    const response = await fetch(`${SHIPPO_API_URL}/refunds/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${provider.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction: labelId
      })
    });
    const refund = await response.json();
    if (!response.ok) {
      throw new Error(refund.message || "Failed to cancel label");
    }
    return {
      success: refund.status === "SUCCESS",
      refundStatus: typeof refund.status === "string" ? refund.status : "UNKNOWN"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Shipping operation failed"
    };
  }
}
var import_zod4, SHIPPO_API_URL;
var init_shippo = __esm({
  "features/integrations/shipping/shippo.ts"() {
    "use strict";
    import_zod4 = require("zod");
    init_contracts();
    SHIPPO_API_URL = "https://api.goshippo.com";
  }
});

// features/integrations/shipping/shipengine.ts
var shipengine_exports = {};
__export(shipengine_exports, {
  cancelLabelFunction: () => cancelLabelFunction2,
  createLabelFunction: () => createLabelFunction2,
  getRatesFunction: () => getRatesFunction2,
  listCarriersFunction: () => listCarriersFunction,
  trackShipmentFunction: () => trackShipmentFunction2,
  validateAddressFunction: () => validateAddressFunction2
});
function convertDimensions(dim) {
  if (dim.unit === "m") {
    return {
      length: dim.length * 100,
      width: dim.width * 100,
      height: dim.height * 100,
      unit: "centimeter"
    };
  } else if (dim.unit === "ft") {
    return {
      length: dim.length * 12,
      width: dim.width * 12,
      height: dim.height * 12,
      unit: "inch"
    };
  } else {
    return {
      length: dim.length,
      width: dim.width,
      height: dim.height,
      unit: DIMENSION_UNIT_MAP[dim.unit] || dim.unit
    };
  }
}
function convertWeight(dim) {
  if (dim.weightUnit in WEIGHT_UNIT_MAP) {
    return {
      value: dim.weight,
      unit: WEIGHT_UNIT_MAP[dim.weightUnit]
    };
  } else if (dim.weightUnit === "mg") {
    return {
      value: dim.weight / 1e3,
      unit: "gram"
    };
  } else {
    return {
      value: dim.weight,
      unit: "gram"
    };
  }
}
async function listCarriersFunction(input) {
  const provider = providerSchema.parse(input);
  const response = await fetch(`${SHIPENGINE_API_URL}/carriers`, {
    method: "GET",
    headers: {
      "API-Key": provider.accessToken,
      "Content-Type": "application/json"
    }
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to list carriers");
  }
  if (!result.carriers || result.carriers.length === 0) {
    throw new Error("No carriers found from ShipEngine");
  }
  return import_zod5.z.array(import_zod5.z.object({ carrier_id: import_zod5.z.string().min(1) })).max(100).parse(result.carriers);
}
async function createLabelFunction2(input) {
  const { provider, order, rateId, dimensions, lineItems, idempotencyKey } = labelInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to create a shipping label");
  }
  if (!dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
    throw new Error(
      "Invalid dimensions provided. All dimensions and weight are required"
    );
  }
  const convertedDimensions = convertDimensions(dimensions);
  const convertedWeight = convertWeight(dimensions);
  let serviceCode = rateId;
  let finalRateId = rateId;
  try {
    const parsed = JSON.parse(rateId);
    serviceCode = parsed.service;
    finalRateId = parsed.id;
  } catch (e) {
  }
  const payload = {
    shipment: {
      ...idempotencyKey ? { external_shipment_id: idempotencyKey } : {},
      // Use the serviceCode variable instead of rateId directly
      service_code: serviceCode,
      ship_to: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address_line1: order.shippingAddress.address1,
        address_line2: order.shippingAddress.address2,
        city_locality: order.shippingAddress.city,
        state_province: order.shippingAddress.province,
        postal_code: order.shippingAddress.postalCode,
        country_code: order.shippingAddress.country.iso2,
        phone: order.shippingAddress.phone,
        email: order.shippingAddress.email
      },
      ship_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        address_line1: provider.fromAddress.address1,
        address_line2: provider.fromAddress.address2,
        city_locality: provider.fromAddress.city,
        state_province: provider.fromAddress.province,
        postal_code: provider.fromAddress.postalCode,
        country_code: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone
      },
      packages: [
        {
          weight: convertedWeight,
          dimensions: {
            length: convertedDimensions.length,
            width: convertedDimensions.width,
            height: convertedDimensions.height,
            unit: convertedDimensions.unit
          }
        }
      ]
    },
    label_format: "PDF"
  };
  const response = await fetch(`${SHIPENGINE_API_URL}/labels`, {
    method: "POST",
    headers: {
      "API-Key": provider.accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create label");
  }
  const labelUrl = result.label_download?.pdf || result.label_download?.href;
  if (!labelUrl) {
    throw new Error("No label URL received from ShipEngine");
  }
  return {
    status: "purchased",
    data: result,
    rate: result.rate,
    carrier: result.carrier_code,
    service: result.service_type || result.service_code,
    trackingNumber: result.tracking_number,
    trackingUrl: result.tracking_url,
    labelUrl,
    rateId: finalRateId
  };
}
async function getRatesFunction2(input) {
  const { provider, order, dimensions } = ratesInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to get shipping rates");
  }
  const carriers = await listCarriersFunction(provider);
  const carrier_ids = carriers.map((carrier) => carrier.carrier_id);
  const convertedDimensions = convertDimensions(dimensions);
  const convertedWeight = convertWeight(dimensions);
  const payload = {
    shipment: {
      ship_to: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address_line1: order.shippingAddress.address1,
        address_line2: order.shippingAddress.address2,
        city_locality: order.shippingAddress.city,
        state_province: order.shippingAddress.province,
        postal_code: order.shippingAddress.postalCode,
        country_code: order.shippingAddress.country.iso2,
        phone: order.shippingAddress.phone
      },
      ship_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        address_line1: provider.fromAddress.address1,
        address_line2: provider.fromAddress.address2,
        city_locality: provider.fromAddress.city,
        state_province: provider.fromAddress.province,
        postal_code: provider.fromAddress.postalCode,
        country_code: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone
      },
      packages: [
        {
          weight: convertedWeight,
          dimensions: {
            length: convertedDimensions.length,
            width: convertedDimensions.width,
            height: convertedDimensions.height,
            unit: convertedDimensions.unit
          }
        }
      ]
    },
    // rate_options is mandatory – we supply the gathered carrier_ids.
    rate_options: { carrier_ids }
  };
  const response = await fetch(`${SHIPENGINE_API_URL}/rates`, {
    method: "POST",
    headers: {
      "API-Key": provider.accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to get rates");
  }
  return result.rate_response.rates.map((rawRate) => {
    const rate = import_zod5.z.object({ rate_id: import_zod5.z.string(), service_code: import_zod5.z.string(), service_type: import_zod5.z.string().optional(), carrier_friendly_name: import_zod5.z.string().optional(), carrier_code: import_zod5.z.string(), shipping_amount: import_zod5.z.object({ amount: import_zod5.z.number().finite().nonnegative(), currency: import_zod5.z.string().regex(/^[a-z]{3}$/i) }), other_amount: import_zod5.z.object({ amount: import_zod5.z.number().finite().nonnegative() }).nullish(), delivery_days: import_zod5.z.number().nonnegative().nullish(), estimated_delivery_days: import_zod5.z.number().nonnegative().nullish() }).parse(rawRate);
    const shippingAmt = rate.shipping_amount && rate.shipping_amount.amount || 0;
    const otherAmt = rate.other_amount && rate.other_amount.amount || 0;
    const totalPrice = Number(shippingAmt + otherAmt).toFixed(2);
    const idValue = JSON.stringify({
      id: rate.rate_id,
      service: rate.service_code
    });
    return {
      id: idValue,
      providerId: provider.id,
      service: rate.service_type || rate.service_code,
      carrier: rate.carrier_friendly_name || rate.carrier_code,
      price: totalPrice,
      currency: rate.shipping_amount ? rate.shipping_amount.currency.toUpperCase() : "USD",
      estimatedDays: rate.delivery_days || rate.estimated_delivery_days
    };
  });
}
async function validateAddressFunction2(input) {
  const { provider, address } = addressInputSchema.parse(input);
  try {
    const payload = {
      address: {
        name: `${address.firstName} ${address.lastName}`,
        address_line1: address.address1,
        address_line2: address.address2,
        city_locality: address.city,
        state_province: address.province,
        postal_code: address.postalCode,
        country_code: address.country.iso2,
        phone: address.phone
      }
    };
    const response = await fetch(`${SHIPENGINE_API_URL}/addresses/validate`, {
      method: "POST",
      headers: {
        "API-Key": provider.accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const validation = await response.json();
    if (!response.ok) {
      throw new Error(validation.message || "Address validation failed");
    }
    return {
      isValid: validation.is_valid,
      suggestedAddress: validation.is_valid ? {
        address1: validation.address_line1,
        address2: validation.address_line2,
        city: validation.city_locality,
        province: validation.state_province,
        postalCode: validation.postal_code,
        country: validation.country_code
      } : null,
      errors: validation.messages || []
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Shipping operation failed"]
    };
  }
}
async function trackShipmentFunction2(input) {
  const { provider, trackingNumber } = trackingInputSchema.parse(input);
  const payload = {
    tracking_number: trackingNumber
    // Optionally include additional fields like carrier_code if required
  };
  const response = await fetch(`${SHIPENGINE_API_URL}/tracking`, {
    method: "POST",
    headers: {
      "API-Key": provider.accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const tracking = await response.json();
  if (!response.ok) {
    throw new Error(tracking.message || "Failed to track shipment");
  }
  return {
    status: tracking.status,
    estimatedDelivery: tracking.estimated_delivery_date,
    trackingUrl: tracking.tracking_url,
    events: tracking.events ? tracking.events.map((rawEvent) => {
      const event = import_zod5.z.object({ status: import_zod5.z.string(), location: import_zod5.z.unknown(), date: import_zod5.z.string(), detail: import_zod5.z.string() }).parse(rawEvent);
      return {
        status: event.status,
        location: event.location,
        timestamp: event.date,
        message: event.detail
      };
    }) : []
  };
}
async function cancelLabelFunction2(input) {
  const { provider, labelId } = cancelInputSchema.parse(input);
  try {
    const payload = { label_id: labelId };
    const response = await fetch(`${SHIPENGINE_API_URL}/labels/cancel`, {
      method: "POST",
      headers: {
        "API-Key": provider.accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to cancel label");
    }
    if (result.approved !== true) return { success: false, error: "Carrier void approval was not confirmed" };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Shipping operation failed"
    };
  }
}
var import_zod5, SHIPENGINE_API_URL, WEIGHT_UNIT_MAP, DIMENSION_UNIT_MAP;
var init_shipengine = __esm({
  "features/integrations/shipping/shipengine.ts"() {
    "use strict";
    import_zod5 = require("zod");
    init_contracts();
    SHIPENGINE_API_URL = "https://api.shipengine.com/v1";
    WEIGHT_UNIT_MAP = {
      oz: "ounce",
      lb: "pound",
      lbs: "pound",
      kg: "kilogram",
      g: "gram"
    };
    DIMENSION_UNIT_MAP = {
      in: "inch",
      cm: "centimeter"
    };
  }
});

// features/integrations/shipping/manual.ts
var manual_exports2 = {};
__export(manual_exports2, {
  cancelLabelFunction: () => cancelLabelFunction3,
  createLabelFunction: () => createLabelFunction3,
  getRatesFunction: () => getRatesFunction3,
  trackShipmentFunction: () => trackShipmentFunction3,
  validateAddressFunction: () => validateAddressFunction3
});
async function getRatesFunction3(_input) {
  throw unavailable();
}
async function createLabelFunction3(_input) {
  throw unavailable();
}
async function validateAddressFunction3(_input) {
  throw unavailable();
}
async function trackShipmentFunction3(_input) {
  throw unavailable();
}
async function cancelLabelFunction3(_input) {
  throw unavailable();
}
var unavailable;
var init_manual2 = __esm({
  "features/integrations/shipping/manual.ts"() {
    "use strict";
    unavailable = () => new Error("Manual shipping has no carrier verification; record operator-attributed fulfillment separately");
  }
});

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default2
});
module.exports = __toCommonJS(keystone_exports);

// features/keystone/index.ts
var import_auth = require("@keystone-6/auth");
var import_core97 = require("@keystone-6/core");

// features/keystone/models/fields.ts
var import_fields = require("@keystone-6/core/fields");
var permissionFields = {
  canAccessDashboard: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can access the dashboard"
  }),
  canReadOrders: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read orders"
  }),
  canManageOrders: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can update and delete any order"
  }),
  canReadProducts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read products"
  }),
  canManageProducts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can update and delete any product"
  }),
  canReadFulfillments: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read fulfillments"
  }),
  canManageFulfillments: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can update and delete any fulfillment"
  }),
  canReadUsers: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other users"
  }),
  canManageUsers: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can update and delete other users"
  }),
  canReadRoles: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other roles"
  }),
  canManageRoles: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can CRUD roles"
  }),
  canReadCheckouts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other checkouts"
  }),
  canManageCheckouts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage checkouts"
  }),
  canReadDiscounts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other discounts"
  }),
  canManageDiscounts: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage discounts"
  }),
  canReadGiftCards: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other gift cards"
  }),
  canManageGiftCards: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage gift cards"
  }),
  canReadReturns: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other returns"
  }),
  canManageReturns: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage returns"
  }),
  canReadSalesChannels: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other returns"
  }),
  canManageSalesChannels: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage returns"
  }),
  canReadPayments: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other payments"
  }),
  canManagePayments: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage payments"
  }),
  canReadIdempotencyKeys: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other idempotency keys"
  }),
  canManageIdempotencyKeys: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage idempotency keys"
  }),
  canReadApps: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read other apps"
  }),
  canManageApps: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage apps"
  }),
  canManageKeys: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can see and manage API Keys"
  }),
  canManageOnboarding: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can access onboarding and store configuration"
  }),
  canReadCollectibles: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can read private collectibles records"
  }),
  canManageCatalog: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage taxonomy, catalog definitions, and specimens"
  }),
  canManageInventory: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage serialized inventory, custody, and reservations"
  }),
  canManageListings: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage listings and offers"
  }),
  canManageAuctions: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage auctions and bids"
  }),
  canManageConsignments: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage consignments, settlements, and trade-ins"
  }),
  canManageCollectibleCustomers: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage buyer and seller relationships"
  }),
  canManageEvidence: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage condition, grading, provenance, custody, and valuation evidence"
  }),
  canManageRisk: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage restricted risk and dispute evidence"
  }),
  canManageIntegrations: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can manage provider adapters and notification operations"
  }),
  canReadWebhooks: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can view webhook endpoints and events"
  }),
  canManageWebhooks: (0, import_fields.checkbox)({
    defaultValue: false,
    label: "User can create, update, and delete webhook endpoints (Warning: Grants access to ALL resource events)"
  })
};
var permissionsList = Object.keys(permissionFields);

// features/keystone/index.ts
var import_config = require("dotenv/config");

// features/keystone/mutations/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/oauth/scopes.ts
var SCOPE_TO_PERMISSIONS = {
  // Products
  "read_products": ["canReadProducts"],
  "write_products": ["canReadProducts", "canManageProducts"],
  // Orders
  "read_orders": ["canReadOrders"],
  "write_orders": ["canReadOrders", "canManageOrders"],
  // Customers (maps to users in our system)
  "read_customers": ["canReadUsers"],
  "write_customers": ["canReadUsers", "canManageUsers"],
  // Fulfillments
  "read_fulfillments": ["canReadFulfillments"],
  "write_fulfillments": ["canReadFulfillments", "canManageFulfillments"],
  // Checkouts
  "read_checkouts": ["canReadCheckouts"],
  "write_checkouts": ["canReadCheckouts", "canManageCheckouts"],
  // Discounts
  "read_discounts": ["canReadDiscounts"],
  "write_discounts": ["canReadDiscounts", "canManageDiscounts"],
  // Gift Cards
  "read_gift_cards": ["canReadGiftCards"],
  "write_gift_cards": ["canReadGiftCards", "canManageGiftCards"],
  // Returns
  "read_returns": ["canReadReturns"],
  "write_returns": ["canReadReturns", "canManageReturns"],
  // Sales Channels
  "read_sales_channels": ["canReadSalesChannels"],
  "write_sales_channels": ["canReadSalesChannels", "canManageSalesChannels"],
  // Payments
  "read_payments": ["canReadPayments"],
  "write_payments": ["canReadPayments", "canManagePayments"],
  // Webhooks
  "read_webhooks": ["canReadWebhooks"],
  "write_webhooks": ["canReadWebhooks", "canManageWebhooks"],
  // Apps
  "read_apps": ["canReadApps"],
  "write_apps": ["canReadApps", "canManageApps"]
};
var AVAILABLE_SCOPES = Object.keys(SCOPE_TO_PERMISSIONS);
var DEFAULT_SCOPES = ["read_products", "read_orders"];

// features/keystone/security/principal.ts
function isMachinePrincipal(session) {
  return Array.isArray(session?.apiKeyScopes) || Array.isArray(session?.oauthScopes);
}

// features/keystone/access.ts
function isSignedIn({ session }) {
  return !!session;
}
function hasOAuthPermission(session, permission) {
  if (!Array.isArray(session?.oauthScopes)) return false;
  const scopes = session.oauthScopes;
  const grantedPermissions = /* @__PURE__ */ new Set();
  scopes.forEach((scope) => {
    const scopePermissions = SCOPE_TO_PERMISSIONS[scope];
    if (scopePermissions) {
      scopePermissions.forEach((p) => grantedPermissions.add(p));
    }
  });
  return grantedPermissions.has(permission);
}
function hasApiKeyPermission(session, permission) {
  if (!Array.isArray(session?.apiKeyScopes)) return false;
  const scopes = session.apiKeyScopes;
  const grantedPermissions = /* @__PURE__ */ new Set();
  scopes.forEach((scope) => {
    const scopePermissions = SCOPE_TO_PERMISSIONS[scope];
    if (scopePermissions) {
      scopePermissions.forEach((p) => grantedPermissions.add(p));
    }
  });
  return grantedPermissions.has(permission);
}
var generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function({ session }) {
      if (hasApiKeyPermission(session, permission)) {
        return true;
      }
      if (hasOAuthPermission(session, permission)) {
        return true;
      }
      if (isMachinePrincipal(session)) return false;
      return !!session?.data?.role?.[permission];
    }
  ])
);
var permissions = {
  ...generatedPermissions
};
var rules = {
  canManageOrders({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageProducts({ session })) {
      return true;
    }
  },
  canManageProducts({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageProducts({ session })) {
      return true;
    }
  },
  canManageOrderItems({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageCart({ session })) {
      return true;
    }
  },
  canReadProducts({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageProducts({ session })) {
      return true;
    }
  },
  canManageUsers({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    return { id: { equals: session?.itemId } };
  },
  canManageKeys({ session }) {
    if (!isSignedIn({ session }) || isMachinePrincipal(session)) {
      return { id: { equals: "__api_key_access_denied__" } };
    }
    if (permissions.canManageKeys({ session })) {
      return {};
    }
    const itemId = session?.itemId;
    return { user: { id: { equals: itemId } } };
  }
};

// features/keystone/mutations/receiveCollectibleItem.ts
var text = (value, max) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
function parseItem(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Item details are required");
  const item = input;
  if (!text(item.code, 128) || !/^[A-Za-z0-9_-]+$/.test(String(item.code).trim())) throw new Error("Item code is invalid");
  if (!text(item.title, 300)) throw new Error("Item title is required");
  if (!text(item.category, 120) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(item.category))) throw new Error("Category handle is invalid");
  if (!text(item.condition, 300)) throw new Error("Condition is required");
  if (item.priceMinor !== void 0 && (!Number.isSafeInteger(item.priceMinor) || Number(item.priceMinor) < 0)) throw new Error("Price must be a non-negative whole amount in minor units");
  if (item.year !== void 0 && item.year !== null && (!Number.isSafeInteger(item.year) || Number(item.year) < 0 || Number(item.year) > 9999)) throw new Error("Year is invalid");
  return {
    code: String(item.code).trim(),
    title: String(item.title).trim(),
    category: String(item.category),
    categoryName: text(item.categoryName, 120) ? String(item.categoryName).trim() : void 0,
    catalogNumber: typeof item.catalogNumber === "string" ? item.catalogNumber.slice(0, 120) : "",
    maker: typeof item.maker === "string" ? item.maker.slice(0, 200) : "",
    year: typeof item.year === "number" ? item.year : void 0,
    condition: String(item.condition).trim(),
    priceMinor: typeof item.priceMinor === "number" ? item.priceMinor : void 0,
    variantSku: text(item.variantSku, 128) ? String(item.variantSku).trim() : void 0,
    publish: item.publish !== false
  };
}
async function receiveCollectibleItem(_root, { input }, context) {
  const item = parseItem(input);
  const session = context.session;
  if (!session?.itemId || !permissions.canManageCatalog({ session }) || !permissions.canManageInventory({ session }) || item.publish && !permissions.canManageListings({ session })) {
    throw new Error("Not authorized");
  }
  const actorId = session.itemId;
  const variantSku = item.variantSku || item.code;
  return context.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`collectible-intake:${item.code}`}))::text AS locked`;
    const stores = await tx.store.findMany({ take: 2, select: { id: true, defaultCurrencyCode: true } });
    if (stores.length !== 1) throw new Error("Set up the store before receiving items");
    const store = stores[0];
    const currencyCode = store.defaultCurrencyCode.toUpperCase();
    const existing = await tx.specimen.findUnique({ where: { specimenCode: item.code }, include: { inventoryUnits: true } });
    if (existing) {
      if (existing.inventoryUnits.length !== 1) throw new Error(`Item ${item.code} already exists and needs review`);
      return { code: item.code, title: item.title, created: false };
    }
    const variants = await tx.productVariant.findMany({
      where: { sku: variantSku },
      take: 2,
      include: { product: true, collectibleInventoryUnit: true, prices: { include: { currency: true } } }
    });
    if (variants.length !== 1) throw new Error(`Create the product variant with SKU ${variantSku} first`);
    const variant = variants[0];
    if (variant.collectibleInventoryUnit) throw new Error(`Product variant ${variantSku} already has an item`);
    if (item.publish && variant.product?.status !== "published") throw new Error(`Publish the product for ${variantSku} before listing it`);
    const variantPrice = variant.prices.find((price) => price.currency?.code?.toUpperCase() === currencyCode && !price.priceListId);
    const priceMinor = item.priceMinor ?? variantPrice?.amount;
    if (item.publish && priceMinor === void 0) throw new Error(`Add a ${currencyCode} price to ${variantSku} before listing it`);
    if (variantPrice && priceMinor !== void 0 && priceMinor !== variantPrice.amount) {
      throw new Error(`Listing price must match the ${currencyCode} price of ${variantSku}`);
    }
    const location = await tx.inventoryLocation.upsert({
      where: { code: "MAIN" },
      create: { storeId: store.id, code: "MAIN", name: "Main storage", type: "shop", publicLabel: "Store", status: "active" },
      update: {}
    });
    const category = await tx.collectibleCategory.upsert({
      where: { handle: item.category },
      create: { storeId: store.id, handle: item.category, name: item.categoryName || item.category, status: "active" },
      update: {}
    });
    const handle = variant.product?.handle || item.code.toLowerCase();
    const catalog = await tx.catalogItem.create({
      data: { storeId: store.id, title: item.title, handle, catalogNumber: item.catalogNumber, maker: item.maker, year: item.year, status: "active", categoryId: category.id }
    });
    const specimen = await tx.specimen.create({
      data: { storeId: store.id, catalogItemId: catalog.id, specimenCode: item.code, displayName: item.title, lifecycleStatus: "available" }
    });
    await tx.conditionObservation.create({
      data: { specimenId: specimen.id, observerId: actorId, sourceType: "operator", label: item.condition, status: "reported", publiclyVisible: true }
    });
    const unit = await tx.inventoryUnit.create({
      data: { storeId: store.id, specimenId: specimen.id, commerceVariantId: variant.id, sku: item.code, ownershipBasis: "owned", status: "available", quantity: 1, version: 1, locationId: location.id, currencyCode }
    });
    await tx.inventoryMovement.create({
      data: { inventoryUnitId: unit.id, type: "receive", toStatus: "available", toLocationId: location.id, reason: "Received into inventory", actorId, idempotencyKey: `intake:${item.code}`, evidence: { source: "intake", code: item.code } }
    });
    if (item.publish) {
      await tx.listing.create({
        data: {
          storeId: store.id,
          inventoryUnitId: unit.id,
          title: item.title,
          slug: handle,
          format: "fixed_price",
          status: "published",
          priceMinor,
          currencyCode,
          offersEnabled: false,
          publicSummary: item.condition,
          publishedAt: /* @__PURE__ */ new Date(),
          publicationSnapshot: { code: item.code, condition: item.condition, askingPriceMinor: priceMinor }
        }
      });
    }
    return { code: item.code, title: item.title, created: true };
  }, { isolationLevel: "Serializable", timeout: 2e4 });
}

// features/keystone/mutations/manageCollectibleListing.ts
var import_node_crypto = require("node:crypto");
var import_zod = require("zod");

// features/keystone/security/customer-personalization-owner.ts
function isHumanOwnerSession(session) {
  if (!session || typeof session !== "object" || isMachinePrincipal(session)) {
    return false;
  }
  const itemId = session.itemId;
  return typeof itemId === "string" && itemId.length > 0;
}
function requireHumanOwnerId(session) {
  if (!isHumanOwnerSession(session)) {
    throw new Error("An authenticated human owner is required");
  }
  return session.itemId;
}
function customerOwnerFilter({ session }) {
  if (!isHumanOwnerSession(session)) return false;
  return { user: { id: { equals: session.itemId } } };
}

// features/lib/minor-units.ts
function currencyExponent(currency) {
  const code = currency.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !Intl.supportedValuesOf("currency").includes(code)) throw new Error("Unsupported currency");
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits;
  if (digits === void 0 || digits < 0 || digits > 4) throw new Error("Unsupported currency precision");
  return digits;
}
function parseMajorToMinor(value, currency, maximum = 2147483647) {
  if (typeof value !== "string" && typeof value !== "number") throw new Error("Amount must be decimal text or a finite number");
  const text77 = String(value).trim();
  if (text77.length > 80 || !/^\d+(\.\d+)?$/.test(text77)) throw new Error("Enter a non-negative decimal amount");
  const digits = currencyExponent(currency);
  const [whole, fraction = ""] = text77.split(".");
  if (fraction.length > digits && /[1-9]/.test(fraction.slice(digits))) throw new Error("Amount exceeds currency precision");
  const minor2 = BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.slice(0, digits).padEnd(digits, "0") || "0");
  if (!Number.isSafeInteger(maximum) || maximum < 0 || minor2 > BigInt(maximum)) throw new Error("Amount exceeds the supported integer range");
  return Number(minor2);
}

// features/keystone/mutations/manageCollectibleListing.ts
var id = import_zod.z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
var listingCommandInput = import_zod.z.object({
  action: import_zod.z.enum(["create", "update_draft", "publish", "withdraw"]),
  key: id,
  unitId: id.optional(),
  listingId: id.optional(),
  expectedVersion: import_zod.z.number().int().nonnegative().max(2147483646),
  title: import_zod.z.string().trim().min(1).max(300).optional(),
  slug: import_zod.z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).optional(),
  publicSummary: import_zod.z.string().trim().min(1).max(2e3).optional(),
  priceMinor: import_zod.z.number().int().min(1).max(2147483647).optional()
}).strict();
var authorized = (session) => ["canManageListings", "canManageInventory"].every((key) => permissions[key]({ session }));
async function manageCollectibleListing(_root, { input }, context) {
  const actorId = requireHumanOwnerId(context.session);
  if (!authorized(context.session)) throw new Error("Listing and inventory capability required");
  const command = listingCommandInput.parse(input);
  const visible = command.action === "create" ? command.unitId ? await context.query.InventoryUnit.findOne({ where: { id: command.unitId }, query: "id store { id }" }) : null : command.listingId ? await context.query.Listing.findOne({ where: { id: command.listingId }, query: "id store { id } inventoryUnit { id }" }) : null;
  if (!visible?.store?.id) throw new Error("Record not found");
  const storeId = visible.store.id;
  const unitId = command.action === "create" ? command.unitId : visible.inventoryUnit?.id;
  if (!unitId) throw new Error("Physical unit required");
  const receiptKey = `operator-listing:${storeId}:${command.key}`;
  const hash = (0, import_node_crypto.createHash)("sha256").update(JSON.stringify({ actorId, storeId, unitId, command })).digest("hex");
  return context.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR SHARE`;
    const identity = await tx.user.findUnique({ where: { id: actorId }, select: { roleId: true } });
    if (!identity?.roleId) throw new Error("Not authorized");
    await tx.$queryRaw`SELECT id FROM "Role" WHERE id = ${identity.roleId} FOR SHARE`;
    const role = await tx.role.findUnique({ where: { id: identity.roleId } });
    if (!authorized({ itemId: actorId, data: { role } })) throw new Error("Not authorized");
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${receiptKey}))::text AS locked`;
    const previous = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: receiptKey } });
    if (previous) {
      const params = previous.requestParams;
      if (!params || typeof params !== "object" || Array.isArray(params) || params.hash !== hash || !previous.responseBody || previous.recoveryPoint !== "completed") throw new Error("Command identity conflict");
      return previous.responseBody;
    }
    await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
    const unit = await tx.inventoryUnit.findUnique({ where: { id: unitId }, include: { specimen: true } });
    if (!unit || unit.storeId !== storeId || !unit.specimen || unit.specimen.storeId !== storeId || unit.quantity !== 1 || unit.version === null) throw new Error("Unit scope conflict");
    if (unit.version !== command.expectedVersion) throw new Error("Record changed; reload before retrying");
    if (unit.status !== "available" || unit.specimen.lifecycleStatus !== "available" || unit.ownershipBasis !== "owned") throw new Error("Claimed or unavailable stock cannot be edited");
    if (![0, 2].includes(currencyExponent(unit.currencyCode))) throw new Error("Unsupported stock currency precision");
    const live = { inventoryUnitId: unitId, status: { in: ["draft", "scheduled", "published", "paused"] } };
    const now = /* @__PURE__ */ new Date(), at = now.toISOString();
    let listing;
    if (command.action === "create") {
      if (!command.title || !command.slug || !command.publicSummary || command.priceMinor === void 0) throw new Error("Complete listing fields required");
      if (await tx.listing.count({ where: live })) throw new Error("Withdraw the existing listing first");
      listing = await tx.listing.create({ data: { storeId, inventoryUnitId: unitId, title: command.title, slug: command.slug, priceMinor: command.priceMinor, currencyCode: unit.currencyCode, publicSummary: command.publicSummary, format: "fixed_price", status: "draft", offersEnabled: false } });
    } else {
      listing = await tx.listing.findUnique({ where: { id: command.listingId } });
      if (!listing || listing.inventoryUnitId !== unitId || listing.storeId !== storeId || listing.format !== "fixed_price" || listing.currencyCode !== unit.currencyCode || !listing.status || ["sold", "ended"].includes(listing.status)) throw new Error("Listing scope or lifecycle conflict");
      if (command.action === "update_draft") {
        if (listing.status !== "draft" || !command.title || !command.publicSummary || command.priceMinor === void 0) throw new Error("Complete draft fields required");
        listing = await tx.listing.update({ where: { id: listing.id }, data: { title: command.title, publicSummary: command.publicSummary, priceMinor: command.priceMinor, updatedAt: now } });
      } else if (command.action === "publish") {
        if (!["draft", "withdrawn"].includes(listing.status) || !listing.priceMinor || !listing.publicSummary) throw new Error("Complete unpublished listing required");
        if (await tx.listing.count({ where: { ...live, id: { not: listing.id } } })) throw new Error("Another live listing exists");
        listing = await tx.listing.update({ where: { id: listing.id }, data: { status: "published", publishedAt: now, updatedAt: now, publicationSnapshot: { source: "operator_declaration", authority: "none", specimenCode: unit.specimen.specimenCode, title: listing.title, condition: listing.publicSummary, askingPriceMinor: listing.priceMinor, currencyCode: listing.currencyCode, actorId, at } } });
      } else {
        if (!["draft", "scheduled", "published", "paused"].includes(listing.status)) throw new Error("Listing cannot be withdrawn");
        listing = await tx.listing.update({ where: { id: listing.id }, data: { status: "withdrawn", updatedAt: now } });
      }
    }
    await tx.inventoryUnit.update({ where: { id: unit.id }, data: { version: { increment: 1 }, updatedAt: now } });
    const result = { id: listing.id, title: listing.title, slug: listing.slug, status: listing.status, priceMinor: listing.priceMinor, currencyCode: listing.currencyCode, publicSummary: listing.publicSummary, version: unit.version + 1 };
    await tx.idempotencyKey.create({ data: { idempotencyKey: receiptKey, requestMethod: "OPERATOR", requestPath: "collectibles/listing", requestParams: { hash, actorId, storeId, unitId, command }, responseCode: 200, responseBody: result, recoveryPoint: "completed" } });
    return result;
  }, { isolationLevel: "Serializable", timeout: 15e3 });
}

// features/keystone/mutations/redirectToInit.ts
async function redirectToInit(_root, _args, context) {
  return await context.sudo().query.User.count({}) === 0;
}

// features/keystone/security/token-crypto.ts
var import_node_crypto2 = __toESM(require("node:crypto"));
var CART_PROOF_VERSION = "v1";
var DEFAULT_CART_PROOF_TTL_SECONDS = 60 * 60 * 24 * 7;
function requireSecret(purpose, explicitSecret) {
  const secret = explicitSecret || process.env.CREDENTIAL_PEPPER || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      `${purpose} requires CREDENTIAL_PEPPER or SESSION_SECRET with at least 32 characters`
    );
  }
  return secret;
}
function generateOpaqueToken(prefix) {
  return `${prefix}${import_node_crypto2.default.randomBytes(32).toString("base64url")}`;
}
function digestCredential(value, purpose, explicitSecret) {
  const secret = requireSecret(purpose, explicitSecret);
  return import_node_crypto2.default.createHmac("sha256", secret).update(`${purpose}\0${value}`, "utf8").digest("hex");
}
function verifyCredentialDigest(value, expectedDigest, purpose, explicitSecret) {
  if (!value || !expectedDigest) return false;
  const actual = Buffer.from(
    digestCredential(value, purpose, explicitSecret),
    "hex"
  );
  const expected = Buffer.from(expectedDigest, "hex");
  return actual.length === expected.length && import_node_crypto2.default.timingSafeEqual(actual, expected);
}
function createCartProof(cartId, options = {}) {
  if (!cartId) throw new Error("Cart ID is required");
  const expiresAt = options.expiresAt || Math.floor(Date.now() / 1e3) + DEFAULT_CART_PROOF_TTL_SECONDS;
  const payload = `${CART_PROOF_VERSION}.${cartId}.${expiresAt}`;
  const signature = digestCredential(payload, "cart-proof", options.secret);
  return `${payload}.${signature}`;
}
function verifyCartProof(proof, cartId, options = {}) {
  if (!proof || !cartId) return false;
  const [version, proofCartId, expiresAtRaw, signature, ...extra] = proof.split(".");
  if (extra.length || version !== CART_PROOF_VERSION || proofCartId !== cartId || !/^\d+$/.test(expiresAtRaw || "") || !/^[a-f0-9]{64}$/.test(signature || "")) {
    return false;
  }
  const expiresAt = Number(expiresAtRaw);
  const now = options.now || Math.floor(Date.now() / 1e3);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  return verifyCredentialDigest(
    `${version}.${proofCartId}.${expiresAt}`,
    signature,
    "cart-proof",
    options.secret
  );
}
function customerTokenDigest(token) {
  return digestCredential(token, "customer-token");
}
function oauthTokenDigest(token) {
  return digestCredential(token, "oauth-token");
}
function oauthClientSecretDigest(secret) {
  return digestCredential(secret, "oauth-client-secret");
}

// features/keystone/security/cart-access.ts
function headerValue(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : void 0;
}
function cookieValue(cookieHeader, name) {
  if (!cookieHeader) return void 0;
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return void 0;
}
function getCartProofFromContext(context) {
  const headers = context?.req?.headers || {};
  return headerValue(headers["x-openfront-cart-proof"]) || cookieValue(headerValue(headers.cookie), "_openfront_cart_id");
}
async function assertCartAccess(context, cartId, options = {}) {
  if (!cartId) throw new Error("Cart ID is required");
  const canManage5 = permissions.canManageOrders({ session: context.session });
  const sessionUserId = context.session?.itemId;
  const proof = getCartProofFromContext(context);
  if (!canManage5 && !sessionUserId && !verifyCartProof(proof, cartId)) {
    throw new Error("Cart not found");
  }
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: "id user { id } order { id }"
  });
  if (!cart) throw new Error("Cart not found");
  if (!canManage5) {
    const ownsCart = Boolean(sessionUserId && cart.user?.id === sessionUserId);
    const ownsGuestProof = Boolean(!cart.user && verifyCartProof(proof, cartId));
    if (!ownsCart && !ownsGuestProof) throw new Error("Cart not found");
  }
  if (!options.allowCompleted && cart.order?.id) {
    throw new Error("Cart has already been completed");
  }
  return cart;
}
async function assertLineItemBelongsToCart(context, cartId, lineItemId) {
  await assertCartAccess(context, cartId);
  const lineItem = await context.sudo().query.LineItem.findOne({
    where: { id: lineItemId },
    query: "id cart { id }"
  });
  if (lineItem?.cart?.id !== cartId) throw new Error("Line item not found");
}
async function assertAddressAccess(context, addressId) {
  const canManage5 = permissions.canManageOrders({ session: context.session });
  const address = await context.sudo().query.Address.findOne({
    where: { id: addressId },
    query: "id user { id }"
  });
  if (!address || !canManage5 && (!context.session?.itemId || address.user?.id !== context.session.itemId)) {
    throw new Error("Address not found");
  }
}
async function assertPaymentSessionBelongsToCart(context, cartId, paymentSessionId) {
  await assertCartAccess(context, cartId, { allowCompleted: true });
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: "id paymentCollection { paymentSessions { id } }"
  });
  if (!cart?.paymentCollection?.paymentSessions?.some(
    (session) => session.id === paymentSessionId
  )) {
    throw new Error("Payment session not found");
  }
}

// features/keystone/mutations/activeCart.ts
async function activeCart(root, { cartId }, context) {
  await assertCartAccess(context, cartId, { allowCompleted: true });
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      email
      type
      checkoutStep
      region {
        id
        name
        countries {
          id
          name
          iso2
          region {
            id
          }
        }
        currency {
          code
          noDivisionCurrency
        }
        taxRate
      }
      subtotal
      total
      rawTotal
      discount
      giftCardTotal
      tax
      shipping
      lineItems(orderBy:  {
         createdAt: asc
      }) {
        id
        quantity
        title
        thumbnail
        description
        unitPrice
        originalPrice
        total
        percentageOff
        productVariant {
          id
          title
          product {
            id
            title
            thumbnail
            handle
          }
        }
      }
      giftCards {
        id
        code
        balance
      }
      discountsById
      discounts {
        id
        code
        isDynamic
        isDisabled
        discountRule {
          id
          type
          value
          allocation
        }
      }
      shippingMethods {
        id
        price
        shippingOption {
          id
          name
        }
      }
      paymentCollection {
        id
        paymentSessions {
          id
          data
          isSelected
          paymentProvider {
            id
            code
            isInstalled
          }
        }
      }
      addresses {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        country {
          id
          iso2
        }
        phone
      }
      shippingAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        country {
          id
          iso2
        }
        phone
      }
      billingAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        country {
          id
          iso2
        }
        phone
      }
    `
  });
  if (!cart) {
    return null;
  }
  return cart;
}
var activeCart_default = activeCart;

// features/keystone/security/active-cart-input.ts
var MAX_LINE_ITEMS = 50;
var MAX_ID_LENGTH = 128;
var MAX_EMAIL_LENGTH = 254;
function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}
function exactKeys(value, allowed, label) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label} contains unsupported fields`);
}
function id2(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ID_LENGTH) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}
function connectOnly(value, label) {
  const relation = record(value, label);
  exactKeys(relation, ["connect"], label);
  const connect = record(relation.connect, `${label}.connect`);
  exactKeys(connect, ["id"], `${label}.connect`);
  return { connect: { id: id2(connect.id, `${label} ID`) } };
}
function lineItemCreate(value) {
  const item = record(value, "Line item");
  exactKeys(item, ["productVariant", "quantity"], "Line item");
  const variant = connectOnly(item.productVariant, "Product variant");
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
    throw new Error("Line item quantity must be an integer between 1 and 99");
  }
  return { productVariant: variant, quantity: item.quantity };
}
function lineItemUpdate(value) {
  const update = record(value, "Line item update");
  exactKeys(update, ["where", "data"], "Line item update");
  const where = record(update.where, "Line item selector");
  exactKeys(where, ["id"], "Line item selector");
  const data = record(update.data, "Line item changes");
  exactKeys(data, ["quantity"], "Line item changes");
  if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 99) {
    throw new Error("Line item quantity must be an integer between 1 and 99");
  }
  return { where: { id: id2(where.id, "Line item ID") }, data: { quantity: data.quantity } };
}
function lineItemDisconnect(value) {
  const selector = record(value, "Line item selector");
  exactKeys(selector, ["id"], "Line item selector");
  return { id: id2(selector.id, "Line item ID") };
}
function normalizeActiveCartInput(input, sessionUserId) {
  const data = record(input, "Cart changes");
  exactKeys(data, ["email", "region", "shippingAddress", "billingAddress", "user", "lineItems"], "Cart changes");
  const normalized = {};
  if (data.email !== void 0) {
    if (typeof data.email !== "string" || data.email.length > MAX_EMAIL_LENGTH) {
      throw new Error("Cart email is invalid");
    }
    normalized.email = data.email;
  }
  if (data.region !== void 0) normalized.region = connectOnly(data.region, "Region");
  for (const key of ["shippingAddress", "billingAddress"]) {
    if (data[key] !== void 0) normalized[key] = connectOnly(data[key], key);
  }
  if (data.user !== void 0) {
    if (!sessionUserId) throw new Error("A signed-in user is required to associate a cart");
    const user = connectOnly(data.user, "User");
    if (user.connect.id !== sessionUserId) throw new Error("A cart can only be associated with the current user");
    normalized.user = user;
  }
  if (data.lineItems !== void 0) {
    const items = record(data.lineItems, "Line items");
    exactKeys(items, ["create", "update", "disconnect"], "Line items");
    const lineItems = {};
    if (items.create !== void 0) {
      if (!Array.isArray(items.create) || items.create.length > MAX_LINE_ITEMS) throw new Error("Too many line items");
      lineItems.create = items.create.map(lineItemCreate);
    }
    if (items.update !== void 0) {
      if (!Array.isArray(items.update) || items.update.length > MAX_LINE_ITEMS) throw new Error("Too many line item updates");
      lineItems.update = items.update.map(lineItemUpdate);
    }
    if (items.disconnect !== void 0) {
      if (!Array.isArray(items.disconnect) || items.disconnect.length > MAX_LINE_ITEMS) throw new Error("Too many line items");
      lineItems.disconnect = items.disconnect.map(lineItemDisconnect);
    }
    if (!Object.keys(lineItems).length) throw new Error("Line item changes are empty");
    normalized.lineItems = lineItems;
  }
  if (!Object.keys(normalized).length) throw new Error("Cart changes are empty");
  return normalized;
}

// features/keystone/mutations/updateActiveCart.ts
async function updateActiveCart(root, { cartId, data }, context) {
  await assertCartAccess(context, cartId);
  const safeData = normalizeActiveCartInput(data, context.session?.itemId);
  const sudoContext = context.sudo();
  const existingCart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      lineItems {
        id
        quantity
        productVariant {
          id
        }
      }
    `
  });
  if (!existingCart) {
    throw new Error("Cart not found");
  }
  if (safeData.region && existingCart.lineItems?.length) {
    throw new Error("Region cannot change after items are added; start a new cart");
  }
  for (const relation of [safeData.shippingAddress, safeData.billingAddress]) {
    const addressId = relation?.connect?.id;
    if (addressId) await assertAddressAccess(context, addressId);
    if (!addressId) throw new Error("Address ID is required");
  }
  const existingLineItemIds = [
    ...safeData?.lineItems?.disconnect || [],
    ...(safeData?.lineItems?.update || []).map((entry) => entry.where)
  ].map((entry) => entry?.id).filter(Boolean);
  for (const lineItemId of existingLineItemIds) {
    await assertLineItemBelongsToCart(context, cartId, lineItemId);
  }
  for (const entry of safeData?.lineItems?.update || []) {
    if (entry.data?.quantity !== void 0 && (!Number.isInteger(entry.data.quantity) || entry.data.quantity <= 0 || entry.data.quantity > 99)) {
      throw new Error("Line item quantity must be a positive integer");
    }
  }
  if (safeData?.lineItems?.create?.length) {
    for (const newItem of safeData.lineItems.create) {
      if (!newItem.productVariant?.connect?.id || !Number.isInteger(newItem.quantity) || newItem.quantity <= 0) {
        throw new Error("A variant and positive integer quantity are required");
      }
      const variantId = newItem.productVariant.connect.id;
      const variant = await sudoContext.query.ProductVariant.findOne({
        where: { id: variantId },
        query: "id product { id status }"
      });
      if (!variant || variant.product?.status !== "published") {
        throw new Error("Product variant is unavailable");
      }
      const existingLineItem = existingCart.lineItems?.find(
        (item) => item.productVariant.id === variantId
      );
      if (existingLineItem) {
        await context.graphql.raw({
          query: `
            mutation UpdateActiveCartLineItem($cartId: ID!, $lineId: ID!, $quantity: Int!) {
              updateActiveCartLineItem(cartId: $cartId, lineId: $lineId, quantity: $quantity) {
                id
              }
            }
          `,
          variables: {
            cartId,
            lineId: existingLineItem.id,
            quantity: existingLineItem.quantity + newItem.quantity
          }
        });
        safeData.lineItems.create = safeData.lineItems.create.filter(
          (item) => item.productVariant.connect.id !== variantId
        );
      }
    }
  }
  if (safeData.email !== void 0 || safeData.region || safeData.shippingAddress || safeData.billingAddress || safeData.lineItems) {
    safeData.paymentCollection = { disconnect: true };
  }
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data: safeData
  });
}
var updateActiveCart_default = updateActiveCart;

// features/keystone/mutations/updateActiveCartLineItem.ts
async function updateActiveCartLineItem(root, { cartId, lineId, quantity }, context) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }
  await assertLineItemBelongsToCart(context, cartId, lineId);
  const sudoContext = context.sudo();
  const updatedLineItem = await sudoContext.query.LineItem.updateOne({
    where: { id: lineId },
    data: { quantity }
  });
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}
var updateActiveCartLineItem_default = updateActiveCartLineItem;

// features/keystone/mutations/updateActiveUser.ts
var ONBOARDING_STATUSES = /* @__PURE__ */ new Set([
  "not_started",
  "in_progress",
  "completed",
  "dismissed"
]);
async function updateActiveUser(root, { data }, context) {
  requireHumanOwnerId(context.session);
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("Not authenticated");
  }
  const changesOnboardingStatus = data && Object.prototype.hasOwnProperty.call(data, "onboardingStatus");
  if (changesOnboardingStatus) {
    if (!permissions.canManageOnboarding({ session })) {
      throw new Error("Not authorized to update onboarding status");
    }
    if (typeof data.onboardingStatus !== "string" || !ONBOARDING_STATUSES.has(data.onboardingStatus)) {
      throw new Error("Invalid onboarding status");
    }
  }
  const sudoContext = context.sudo();
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId }
  });
  if (!existingUser) {
    throw new Error("User not found");
  }
  if (data.password !== void 0) throw new Error("Use the password-change action with old-password proof");
  if (data.billingAddress !== void 0) throw new Error("Use the owned address action");
  const { password: _password, billingAddress: _billingAddress, ...profile } = data;
  return await sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data: profile
  });
}
var updateActiveUser_default = updateActiveUser;

// features/keystone/mutations/updateActiveUserPassword.ts
async function updateActiveUserPassword(_root, { oldPassword, newPassword, confirmPassword }, context) {
  requireHumanOwnerId(context.session);
  const session = context.session;
  if (!session?.itemId) throw new Error("Not authenticated");
  if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
  const existingUser = await context.sudo().query.User.findOne({ where: { id: session.itemId }, query: "id email" });
  if (!existingUser) throw new Error("User not found");
  const result = await context.graphql.raw({
    query: `mutation VerifyPassword($email: String!, $password: String!) {
      authenticateUserWithPassword(email: $email, password: $password) {
        __typename
        ... on UserAuthenticationWithPasswordSuccess { item { id } }
      }
    }`,
    variables: { email: existingUser.email, password: oldPassword }
  });
  const authentication = result.data?.authenticateUserWithPassword;
  if (result.errors?.length || authentication?.__typename !== "UserAuthenticationWithPasswordSuccess" || authentication.item?.id !== session.itemId) throw new Error("Invalid old password");
  return context.sudo().db.User.updateOne({ where: { id: session.itemId }, data: { password: newPassword } });
}

// features/keystone/lib/json-transport.ts
function jsonTransport(value) {
  const serialized = JSON.stringify(value);
  if (serialized === void 0) return null;
  if (Buffer.byteLength(serialized, "utf8") > 1048576) throw new Error("Record projection exceeds the supported size");
  return JSON.parse(serialized);
}

// features/keystone/security/address-input.ts
var CUSTOMER_ADDRESS_FIELDS = /* @__PURE__ */ new Set([
  "company",
  "firstName",
  "lastName",
  "address1",
  "address2",
  "city",
  "province",
  "postalCode",
  "phone",
  "isBilling",
  "metadata",
  "country"
]);
var TEXT_FIELDS = ["company", "firstName", "lastName", "address1", "address2", "city", "province", "postalCode", "phone"];
function sanitizeCustomerAddressInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid address");
  const input = Object.fromEntries(Object.entries(value));
  for (const key of Object.keys(input)) if (!CUSTOMER_ADDRESS_FIELDS.has(key)) throw new Error("Unsupported address field");
  const text77 = Object.fromEntries(TEXT_FIELDS.flatMap((key) => {
    const value2 = input[key];
    if (value2 === void 0) return [];
    if (value2 === null) return [[key, ""]];
    if (typeof value2 !== "string" || value2.length > 2e3) throw new Error("Address fields must be bounded text");
    return [[key, value2]];
  }));
  if (input.isBilling !== void 0 && typeof input.isBilling !== "boolean") throw new Error("Invalid billing-address flag");
  let country;
  if (input.country !== void 0) {
    const relation = input.country;
    if (!relation || typeof relation !== "object" || Array.isArray(relation) || Object.keys(relation).length !== 1 || !("connect" in relation)) throw new Error("Select an existing country");
    const connect = relation.connect;
    if (!connect || typeof connect !== "object" || Array.isArray(connect) || Object.keys(connect).length !== 1) throw new Error("Select an existing country");
    if ("id" in connect && typeof connect.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(connect.id)) country = { connect: { id: connect.id } };
    else if ("iso2" in connect && typeof connect.iso2 === "string" && /^[a-z]{2}$/i.test(connect.iso2)) country = { connect: { iso2: connect.iso2.toLowerCase() } };
    else throw new Error("Select an existing country");
  }
  const metadata = input.metadata === void 0 ? void 0 : jsonTransport(input.metadata);
  if (metadata !== void 0 && JSON.stringify(metadata).length > 16384) throw new Error("Address metadata is too large");
  return { ...text77, ...country ? { country } : {}, ...typeof input.isBilling === "boolean" ? { isBilling: input.isBilling } : {}, ...metadata !== void 0 ? { metadata } : {} };
}
async function runOwnedAddressCommand(context, command) {
  const ownerId = requireHumanOwnerId(context.session);
  return context.sudo().transaction(async (tx) => {
    await tx.prisma.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`customer-addresses:${ownerId}`}::text, 0))::text`;
    if (!await tx.db.User.findOne({ where: { id: ownerId } })) throw new Error("User not found");
    return command(tx, ownerId);
  });
}
async function lockOwnedAddress(tx, ownerId, addressId) {
  if (typeof addressId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(addressId)) throw new Error("Address not found");
  const rows2 = await tx.prisma.$queryRaw`SELECT "id" FROM "Address" WHERE "id" = ${addressId} AND "userId" = ${ownerId} FOR UPDATE`;
  if (rows2.length !== 1) throw new Error("Address not found");
  return addressId;
}
function resolveCustomerAddressData({
  inputData,
  resolvedData,
  userId
}) {
  const restrictedData = { ...resolvedData };
  for (const key of Object.keys(inputData ?? {})) {
    if (!CUSTOMER_ADDRESS_FIELDS.has(key)) delete restrictedData[key];
  }
  restrictedData.user = { connect: { id: userId } };
  return restrictedData;
}

// features/keystone/mutations/updateActiveUserAddress.ts
async function updateActiveUserAddress(_root, { where, data }, context) {
  const input = sanitizeCustomerAddressInput(data);
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const addressId = await lockOwnedAddress(tx, ownerId, where.id);
    await tx.db.Address.updateOne({ where: { id: addressId }, data: input });
    if (input.isBilling) {
      await tx.prisma.address.updateMany({ where: { userId: ownerId, id: { not: addressId }, isBilling: true }, data: { isBilling: false, updatedAt: /* @__PURE__ */ new Date() } });
    }
    return tx.db.User.findOne({ where: { id: ownerId } });
  });
}

// features/keystone/mutations/createActiveUserAddress.ts
async function createActiveUserAddress(_root, { data }, context) {
  const input = sanitizeCustomerAddressInput(data);
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const address = await tx.db.Address.createOne({ data: { ...input, user: { connect: { id: ownerId } } } });
    if (input.isBilling) {
      await tx.prisma.address.updateMany({ where: { userId: ownerId, id: { not: address.id }, isBilling: true }, data: { isBilling: false, updatedAt: /* @__PURE__ */ new Date() } });
    }
    return tx.db.User.findOne({ where: { id: ownerId } });
  });
}

// features/keystone/mutations/deleteActiveUserAddress.ts
async function deleteActiveUserAddress(_root, { where }, context) {
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const addressId = await lockOwnedAddress(tx, ownerId, where.id);
    return tx.db.Address.deleteOne({ where: { id: addressId } });
  });
}

// features/keystone/mutations/addDiscountToActiveCart.ts
async function addDiscountToActiveCart(root, { cartId, code }, context) {
  await assertCartAccess(context, cartId);
  if (!code || code.length > 128) throw new Error("Invalid discount code");
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      region {
        id
      }
      user {
        id
        customerGroups {
          id
        }
      }
      lineItems {
        id
      }
      discounts {
        id
        code
        stackable
      }
    `
  });
  if (!cart) {
    throw new Error(`Cart not found`);
  }
  if (!cart.lineItems || cart.lineItems.length === 0) {
    throw new Error(`Cannot apply discount to an empty cart`);
  }
  if (!cart.region) throw new Error("Cart region is required");
  const discount = await sudoContext.query.Discount.findOne({
    where: { code },
    query: `
      id
      code
      isDynamic
      isDisabled
      stackable
      startsAt
      endsAt
      usageLimit
      usageCount
      regions {
        id
      }
      discountRule {
        id
        type
        value
        allocation
        discountConditions {
          id
          type
          operator
          customerGroups {
            id
          }
        }
      }
    `
  });
  if (!discount) {
    throw new Error(`Invalid discount code: ${code}`);
  }
  if (cart.discounts?.some((d) => d.id === discount.id)) {
    throw new Error(`Discount ${code} is already applied to this cart`);
  }
  if (discount.isDisabled) {
    throw new Error(`Discount ${code} is no longer available`);
  }
  const now = /* @__PURE__ */ new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    throw new Error(`Discount ${code} is not yet active`);
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    throw new Error(`Discount ${code} has expired`);
  }
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    throw new Error(`Discount ${code} has reached its usage limit`);
  }
  if (discount.regions && discount.regions.length > 0 && cart.region) {
    const isValidForRegion = discount.regions.some((r) => r.id === cart.region?.id);
    if (!isValidForRegion) {
      throw new Error(`Discount ${code} is not available in your region`);
    }
  }
  if (discount.discountRule?.discountConditions) {
    const customerGroupConditions = discount.discountRule.discountConditions.filter(
      (c) => c.type === "customer_groups"
    );
    for (const condition of customerGroupConditions) {
      const conditionGroupIds = condition.customerGroups?.map((g) => g.id) || [];
      const customerGroupIds = cart.user?.customerGroups?.map((g) => g.id) || [];
      if (conditionGroupIds.length === 0) continue;
      const hasMatch = customerGroupIds.some((id3) => conditionGroupIds.includes(id3));
      if (condition.operator === "in" && !hasMatch) {
        throw new Error(`Discount ${code} is not available for your customer group`);
      }
      if (condition.operator === "not_in" && hasMatch) {
        throw new Error(`Discount ${code} is not available for your customer group`);
      }
    }
  }
  let discountUpdate;
  if (cart.discounts && cart.discounts.length > 0) {
    const hasNonStackable = cart.discounts.some((d) => !d.stackable);
    if (hasNonStackable) {
      discountUpdate = {
        disconnect: cart.discounts.map((d) => ({ id: d.id })),
        connect: [{ id: discount.id }]
      };
    } else if (!discount.stackable) {
      discountUpdate = {
        disconnect: cart.discounts.map((d) => ({ id: d.id })),
        connect: [{ id: discount.id }]
      };
    } else {
      discountUpdate = {
        connect: [{ id: discount.id }]
      };
    }
  } else {
    discountUpdate = {
      connect: [{ id: discount.id }]
    };
  }
  const updatedCart = await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data: {
      discounts: discountUpdate,
      paymentCollection: { disconnect: true }
    }
  });
  return updatedCart;
}
var addDiscountToActiveCart_default = addDiscountToActiveCart;

// features/keystone/mutations/removeDiscountFromActiveCart.ts
async function removeDiscountFromActiveCart(root, { cartId, code }, context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();
  const discount = await sudoContext.query.Discount.findOne({
    where: { code },
    query: "id"
  });
  if (!discount) {
    throw new Error(`No discount found with code: ${code}`);
  }
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data: {
      discounts: {
        disconnect: [{ id: discount.id }]
      },
      paymentCollection: { disconnect: true }
    }
  });
}
var removeDiscountFromActiveCart_default = removeDiscountFromActiveCart;

// features/keystone/utils/paymentProviderConfig.ts
function isPaymentProviderConfigured(code) {
  if (code.startsWith("pp_stripe")) {
    return Boolean(
      (process.env.NEXT_PUBLIC_STRIPE_KEY || process.env.STRIPE_PUBLISHABLE_KEY) && process.env.STRIPE_SECRET_KEY
    );
  }
  if (code.startsWith("pp_paypal")) {
    return Boolean(
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    );
  }
  return code === "pp_system_default" || code.startsWith("pp_manual");
}
function getPublicPaymentProviderConfig(code) {
  if (!isPaymentProviderConfigured(code)) return null;
  if (code.startsWith("pp_stripe")) {
    return {
      provider: "stripe",
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || ""
    };
  }
  if (code.startsWith("pp_paypal")) {
    return {
      provider: "paypal",
      publishableKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
    };
  }
  return null;
}

// features/keystone/mutations/createActiveCartPaymentSessions.ts
async function createActiveCartPaymentSessions(root, { cartId }, context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      region {
        id
        paymentProviders {
          id
          code
          isInstalled
        }
      }
      paymentCollection {
        id
        paymentSessions {
          id
          paymentProvider {
            id
          }
        }
      }
    `
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  const availableProviders = cart.region?.paymentProviders?.filter(
    (provider) => provider.isInstalled && isPaymentProviderConfigured(provider.code || "")
  ) || [];
  let paymentCollection = cart.paymentCollection;
  if (!paymentCollection) {
    paymentCollection = await sudoContext.db.PaymentCollection.createOne({
      data: {
        cart: { connect: { id: cartId } },
        description: "default",
        amount: 0
        // Will be updated when payment is initiated
      }
    });
  }
  for (const provider of availableProviders) {
    const existingSession = cart.paymentCollection?.paymentSessions?.find(
      (s) => s.paymentProvider.id === provider.id
    );
    if (!existingSession) {
      await sudoContext.db.PaymentSession.createOne({
        data: {
          paymentCollection: { connect: { id: paymentCollection.id } },
          paymentProvider: { connect: { id: provider.id } },
          amount: 0,
          // Initialize with 0, will be updated when payment is initiated
          data: {},
          // Initialize with empty data object
          isSelected: false,
          isInitiated: false
        }
      });
    }
  }
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}
var createActiveCartPaymentSessions_default = createActiveCartPaymentSessions;

// features/keystone/mutations/createActiveCart.ts
async function createActiveCart(_root, { regionId }, context) {
  if (!regionId) throw new Error("Region ID is required");
  const region2 = await context.query.Region.findOne({
    where: { id: regionId },
    query: "id"
  });
  if (!region2) throw new Error("Region not found");
  const cart = await context.sudo().query.Cart.createOne({
    data: {
      type: "default",
      region: { connect: { id: region2.id } },
      ...context.session?.itemId ? { user: { connect: { id: context.session.itemId } } } : {}
    },
    query: "id region { id }"
  });
  return {
    ...cart,
    proof: createCartProof(cart.id)
  };
}
var createActiveCart_default = createActiveCart;

// features/keystone/security/cart-proof-issuance.ts
function canIssueOwnedCartProof(session, cart) {
  return Boolean(
    session?.itemId && !isMachinePrincipal(session) && cart?.user?.id === session.itemId && !cart?.order?.id
  );
}

// features/keystone/mutations/createActiveCartProof.ts
async function createActiveCartProof(_root, { cartId }, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("A signed-in customer is required");
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: "id user { id } order { id }"
  });
  if (!canIssueOwnedCartProof(context.session, cart)) {
    throw new Error("Cart not found");
  }
  return createCartProof(cart.id);
}

// features/keystone/mutations/setActiveCartPaymentSession.ts
async function setActiveCartPaymentSession(root, { cartId, providerId }, context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      paymentCollection {
        id
        paymentSessions {
          id
          paymentProvider {
            id
          }
        }
      }
    `
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  if (!cart.paymentCollection) {
    throw new Error("Cart has no payment collection");
  }
  for (const session of cart.paymentCollection.paymentSessions || []) {
    await sudoContext.db.PaymentSession.updateOne({
      where: { id: session.id },
      data: { isSelected: false }
    });
  }
  const selectedSession = cart.paymentCollection.paymentSessions?.find(
    (s) => s.paymentProvider.id === providerId
  );
  if (!selectedSession) {
    throw new Error("Payment session not found");
  }
  await sudoContext.db.PaymentSession.updateOne({
    where: { id: selectedSession.id },
    data: { isSelected: true }
  });
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}
var setActiveCartPaymentSession_default = setActiveCartPaymentSession;

// features/keystone/utils/paymentProviderAdapter.ts
var import_zod2 = require("zod");

// features/integrations/payment/index.ts
var paymentProviderAdapters = {
  stripe: () => Promise.resolve().then(() => (init_stripe(), stripe_exports)),
  paypal: () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
  manual: () => Promise.resolve().then(() => (init_manual(), manual_exports))
};

// features/keystone/utils/paymentProviderAdapter.ts
async function executeAdapterFunction({ provider, functionName, args }) {
  if (!["createPaymentFunction", "capturePaymentFunction", "refundPaymentFunction", "getPaymentStatusFunction", "generatePaymentLinkFunction", "handleWebhookFunction"].includes(functionName)) throw new Error("Payment provider operation is not registered");
  const adapterKey = provider?.[functionName];
  if (typeof adapterKey === "string" && adapterKey.startsWith("http")) {
    const response = await fetch(adapterKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  if (typeof adapterKey !== "string" || !Object.prototype.hasOwnProperty.call(paymentProviderAdapters, adapterKey)) {
    throw new Error("Payment provider adapter is not registered");
  }
  const adapter = await paymentProviderAdapters[adapterKey]();
  const fn = adapter[functionName];
  if (typeof fn !== "function") throw new Error("Payment provider operation is not registered");
  try {
    const operation = fn;
    return await operation({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${adapterKey}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
function parseVerifiedPaymentOperationResult(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payment provider returned an invalid operation result");
  }
  if (!("status" in value) || !("amount" in value) || !("currency" in value)) {
    throw new Error("Payment provider returned an invalid operation result");
  }
  const status = value.status;
  const amount = value.amount;
  const currency = value.currency;
  const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  if (typeof status !== "string" || status.trim().length === 0 || status.trim().length > 64 || typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0 || !/^[A-Z]{3}$/.test(normalizedCurrency)) {
    throw new Error("Payment provider returned an invalid operation result");
  }
  return {
    status: status.trim(),
    amount,
    currency: normalizedCurrency,
    ..."data" in value ? { data: value.data } : {}
  };
}
async function createPayment({ provider, cart, amount, currency }) {
  return executeAdapterFunction({ provider, functionName: "createPaymentFunction", args: { cart, amount, currency } });
}
async function capturePayment({ provider, paymentId, amount, currency, idempotencyKey }) {
  const result = await executeAdapterFunction({ provider, functionName: "capturePaymentFunction", args: { paymentId, amount, currency, idempotencyKey } });
  return parseVerifiedPaymentOperationResult(result);
}
async function refundPayment({ provider, paymentId, amount, currency, idempotencyKey }) {
  return executeAdapterFunction({ provider, functionName: "refundPaymentFunction", args: { paymentId, amount, currency, idempotencyKey } });
}
async function getPaymentStatus({ provider, paymentId }) {
  const result = await executeAdapterFunction({ provider, functionName: "getPaymentStatusFunction", args: { paymentId } });
  return parseVerifiedPaymentOperationResult(result);
}
var verifiedWebhookSchema = import_zod2.z.object({
  isValid: import_zod2.z.literal(true),
  type: import_zod2.z.string().min(1).max(200),
  event: import_zod2.z.object({ id: import_zod2.z.string().min(1).max(500) }).passthrough(),
  resource: import_zod2.z.object({
    id: import_zod2.z.string().max(500).optional(),
    currency: import_zod2.z.string().regex(/^[a-z]{3}$/i).optional(),
    amount_received: import_zod2.z.number().int().safe().nonnegative().optional(),
    amount: import_zod2.z.union([import_zod2.z.number().int().safe().nonnegative(), import_zod2.z.object({ value: import_zod2.z.string().regex(/^\d+(\.\d+)?$/).max(80), currency_code: import_zod2.z.string().regex(/^[a-z]{3}$/i) })]).optional(),
    metadata: import_zod2.z.record(import_zod2.z.string()).optional(),
    custom_id: import_zod2.z.string().max(500).optional()
  }).passthrough()
});
function parseVerifiedWebhookResult(value) {
  return verifiedWebhookSchema.parse(value);
}
async function handleWebhook({ provider, event, headers }) {
  const result = await executeAdapterFunction({ provider, functionName: "handleWebhookFunction", args: { event, headers } });
  return parseVerifiedWebhookResult(result);
}

// features/keystone/checkout/recovery.ts
var import_node_crypto4 = require("node:crypto");

// features/keystone/utils/idempotency.ts
var import_node_crypto3 = __toESM(require("node:crypto"));
function normalize(value) {
  if (value === null || value === void 0) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Idempotency request contains a non-finite number");
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== void 0).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, normalize(entry)])
    );
  }
  throw new Error(`Unsupported idempotency request value: ${typeof value}`);
}
function canonicalIdempotencyParams(params) {
  return normalize(params);
}
function idempotencyFingerprint(params) {
  return import_node_crypto3.default.createHash("sha256").update(JSON.stringify(canonicalIdempotencyParams(params))).digest("hex");
}
function storedFingerprint(requestParams) {
  const params = requestParams && typeof requestParams === "object" ? { ...requestParams } : {};
  const recorded = typeof params._fingerprint === "string" ? params._fingerprint : null;
  delete params._fingerprint;
  const calculated = idempotencyFingerprint(params);
  if (recorded && recorded !== calculated) {
    throw new Error("Stored idempotency request fingerprint is invalid");
  }
  return calculated;
}
function assertIdempotencyRequest(attempt, request) {
  const method = request.requestMethod || "POST";
  const expectedFingerprint = idempotencyFingerprint(request.requestParams);
  if (attempt.requestMethod !== method || attempt.requestPath !== request.requestPath || storedFingerprint(attempt.requestParams) !== expectedFingerprint) {
    throw new Error("Idempotency key was already used with a different request");
  }
}
async function findIdempotencyAttempt(prisma, request) {
  const key = request.key.trim();
  if (!key) throw new Error("Idempotency key is required");
  const existing = await prisma.idempotencyKey.findUnique({ where: { idempotencyKey: key } });
  if (existing) assertIdempotencyRequest(existing, { ...request, key });
  return existing;
}
async function getOrCreateIdempotencyAttempt(prisma, request) {
  const key = request.key.trim();
  if (!key) throw new Error("Idempotency key is required");
  const normalizedParams = canonicalIdempotencyParams(request.requestParams);
  const data = {
    idempotencyKey: key,
    requestMethod: request.requestMethod || "POST",
    requestPath: request.requestPath,
    requestParams: {
      ...normalizedParams,
      _fingerprint: idempotencyFingerprint(request.requestParams)
    },
    recoveryPoint: "started",
    lockedAt: /* @__PURE__ */ new Date()
  };
  const existing = await findIdempotencyAttempt(prisma, { ...request, key });
  if (existing) return { attempt: existing, replay: true };
  try {
    const attempt = await prisma.idempotencyKey.create({ data });
    return { attempt, replay: false };
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const raced = await prisma.idempotencyKey.findUnique({ where: { idempotencyKey: key } });
    if (!raced) throw error;
    assertIdempotencyRequest(raced, { ...request, key });
    return { attempt: raced, replay: true };
  }
}

// features/keystone/checkout/reservation-fencing.ts
function checkoutCartIdFromKey(idempotencyKey) {
  const prefix = "checkout:";
  if (typeof idempotencyKey !== "string" || !idempotencyKey.startsWith(prefix)) {
    throw new Error("Checkout reservation key is invalid");
  }
  const cartId = idempotencyKey.slice(prefix.length);
  if (!cartId || cartId.includes(":")) throw new Error("Checkout reservation key is invalid");
  return cartId;
}
function requireExactlyOne(rows2, description) {
  if (!Array.isArray(rows2) || rows2.length !== 1) {
    throw new Error(`Expected exactly one ${description}`);
  }
  return rows2[0];
}
function assertCartReservationFence(reservation, expected) {
  const legacyKey = `${expected.idempotencyKey}:${expected.unitId}`;
  const retryKeyPrefix = `${legacyKey}:`;
  const keyMatchesCheckout = reservation?.idempotencyKey === legacyKey || typeof reservation?.idempotencyKey === "string" && reservation.idempotencyKey.startsWith(retryKeyPrefix) && reservation.idempotencyKey.length > retryKeyPrefix.length;
  if (!reservation?.id || !reservation.idempotencyKey || !keyMatchesCheckout || reservation.status !== "active" || reservation.purpose !== "cart" || reservation.cartId !== expected.cartId || reservation.inventoryUnitId !== expected.unitId || reservation.listingId !== expected.listingId || !(reservation.expiresAt instanceof Date) || !expected.allowExpired && reservation.expiresAt.getTime() <= expected.now.getTime()) {
    throw new Error("Checkout reservation is not an active, unexpired hold for this cart, listing, and unit");
  }
}
function assertCheckoutCommitAttemptFence(attempt, expected) {
  const params = attempt?.requestParams;
  if (!attempt || attempt.id !== expected.attemptId || attempt.idempotencyKey !== expected.idempotencyKey || attempt.requestPath !== "completeActiveCart" || !params || typeof params !== "object" || Array.isArray(params) || params.cartId !== expected.cartId || !["resources_reserved", "payment_confirmed"].includes(attempt.recoveryPoint || "")) {
    throw new Error("Checkout attempt does not own this order commit");
  }
}
function assertInventoryUnitFence(unit, expected) {
  if (!unit || unit.id !== expected.unitId || unit.commerceVariantId !== expected.variantId || unit.status !== expected.status || unit.quantity !== 1 || !Number.isInteger(unit.version) || unit.version < 0) {
    throw new Error("Serialized inventory unit no longer matches the checkout hold");
  }
}
function assertCheckoutAttemptFence(attempt, expected) {
  const params = attempt?.requestParams;
  if (!attempt || attempt.id !== expected.attemptId || attempt.idempotencyKey !== expected.idempotencyKey || attempt.requestPath !== "completeActiveCart" || !params || typeof params !== "object" || Array.isArray(params) || params.cartId !== expected.cartId || !["stock_reserved", "resources_reserved"].includes(attempt.recoveryPoint || "")) {
    throw new Error("Checkout attempt no longer owns releasable resources");
  }
}

// features/keystone/checkout/recovery.ts
function checkoutKey(cartId) {
  return `checkout:${cartId}`;
}
async function getOrCreateCheckoutAttempt(prisma, cartId, paymentSessionId) {
  const idempotencyKey = checkoutKey(cartId);
  const { attempt, replay } = await getOrCreateIdempotencyAttempt(prisma, {
    key: idempotencyKey,
    requestPath: "completeActiveCart",
    requestParams: { cartId, paymentSessionId: paymentSessionId || null }
  });
  if (attempt.recoveryPoint === "completed") return attempt;
  if (!replay) return attempt;
  const acquired = await prisma.idempotencyKey.updateMany({
    where: {
      id: attempt.id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1e3) } }
      ]
    },
    data: { lockedAt: /* @__PURE__ */ new Date() }
  });
  if (acquired.count !== 1) throw new Error("Checkout is already in progress");
  return prisma.idempotencyKey.findUnique({ where: { id: attempt.id } });
}
async function updateCheckoutAttempt(prisma, id3, recoveryPoint, responseBody, responseCode) {
  await prisma.idempotencyKey.update({
    where: { id: id3 },
    data: {
      recoveryPoint,
      responseBody,
      responseCode,
      lockedAt: ["completed", "failed", "started"].includes(recoveryPoint) ? null : /* @__PURE__ */ new Date()
    }
  });
}
function aggregateLines(lines) {
  const byVariant = /* @__PURE__ */ new Map();
  for (const line of lines || []) {
    if (!line.productVariant?.id || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Cart contains an invalid inventory line");
    }
    const current = byVariant.get(line.productVariant.id);
    byVariant.set(line.productVariant.id, {
      variant: line.productVariant,
      quantity: (current?.quantity || 0) + line.quantity
    });
  }
  return [...byVariant.values()];
}
async function reserveCartInventory(prisma, lines, idempotencyKey, checkoutAttemptId) {
  const reservations = aggregateLines(lines);
  const cartId = checkoutCartIdFromKey(idempotencyKey);
  await prisma.$transaction(async (tx) => {
    for (const { variant, quantity } of reservations) {
      const collectibleUnit = variant.collectibleInventoryUnit;
      let existingCartHold = false;
      if (collectibleUnit) {
        if (quantity !== 1) throw new Error(`Serialized specimen ${collectibleUnit.sku || collectibleUnit.id} can only be purchased once`);
        const unitId = collectibleUnit.id;
        await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
        const current = await tx.inventoryUnit.findUnique({
          where: { id: unitId },
          select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true }
        });
        if (!current || current.commerceVariantId !== variant.id || current.quantity !== 1 || !Number.isInteger(current.version)) {
          throw new Error("Serialized inventory unit no longer matches this cart line");
        }
        const listings = await tx.listing.findMany({
          where: { inventoryUnitId: unitId, status: "published", format: "fixed_price" },
          take: 2,
          select: { id: true, inventoryUnitId: true }
        });
        const listing = requireExactlyOne(listings, "published fixed-price listing for the serialized unit");
        if (listing.inventoryUnitId !== unitId) throw new Error("Fixed-price listing does not own this inventory unit");
        const activeHolds = await tx.reservation.findMany({
          where: { inventoryUnitId: unitId, status: "active" },
          take: 2,
          select: {
            id: true,
            idempotencyKey: true,
            inventoryUnitId: true,
            listingId: true,
            cartId: true,
            purpose: true,
            status: true,
            expiresAt: true
          }
        });
        if (activeHolds.length > 0) {
          const hold = requireExactlyOne(activeHolds, "active reservation for the serialized unit");
          assertCartReservationFence(hold, { cartId, unitId, listingId: listing.id, idempotencyKey, now: /* @__PURE__ */ new Date(), allowExpired: true });
          assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "reserved" });
          existingCartHold = true;
        } else {
          assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "available" });
          const claimed = await tx.inventoryUnit.updateMany({
            where: {
              id: unitId,
              commerceVariantId: variant.id,
              status: "available",
              quantity: 1,
              version: current.version
            },
            data: { status: "reserved", version: { increment: 1 } }
          });
          if (claimed.count !== 1) throw new Error("Serialized inventory unit changed during reservation");
          await tx.reservation.create({
            data: {
              inventoryUnitId: unitId,
              listingId: listing.id,
              cartId,
              purpose: "cart",
              status: "active",
              idempotencyKey: `${idempotencyKey}:${unitId}:${(0, import_node_crypto4.randomUUID)()}`,
              expiresAt: new Date(Date.now() + 30 * 60 * 1e3)
            }
          });
        }
      }
      if (!variant.manageInventory || existingCartHold) continue;
      const result = await tx.productVariant.updateMany({
        where: {
          id: variant.id,
          ...variant.allowBackorder ? {} : { inventoryQuantity: { gte: quantity } }
        },
        data: { inventoryQuantity: { decrement: quantity } }
      });
      if (result.count !== 1) {
        throw new Error(`Insufficient stock for ${variant.title || variant.id}`);
      }
      await tx.stockMovement.create({
        data: {
          type: "REMOVE",
          quantity,
          reason: "checkout_reservation",
          note: idempotencyKey,
          variantId: variant.id
        }
      });
    }
    if (checkoutAttemptId) {
      await tx.idempotencyKey.update({
        where: { id: checkoutAttemptId },
        data: { recoveryPoint: "stock_reserved", lockedAt: /* @__PURE__ */ new Date() }
      });
    }
  });
}
async function reserveDiscountUsage(prisma, discounts, checkoutAttemptId) {
  await prisma.$transaction(async (tx) => {
    for (const discount of discounts) {
      const current = await tx.discount.findUnique({
        where: { id: discount.id },
        select: {
          usageCount: true,
          usageLimit: true,
          isDisabled: true,
          startsAt: true,
          endsAt: true
        }
      });
      if (!current) throw new Error("Discount not found");
      const now = /* @__PURE__ */ new Date();
      if (current.isDisabled || current.startsAt > now || current.endsAt && current.endsAt <= now) {
        throw new Error(`Discount ${discount.code || discount.id} is no longer active`);
      }
      if (current.usageLimit !== null && current.usageCount >= current.usageLimit) {
        throw new Error(`Discount ${discount.code || discount.id} has reached its usage limit`);
      }
      const result = await tx.discount.updateMany({
        where: {
          id: discount.id,
          usageCount: current.usageCount,
          isDisabled: false,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }]
        },
        data: { usageCount: { increment: 1 } }
      });
      if (result.count !== 1) throw new Error("Discount usage changed; retry checkout");
    }
    if (checkoutAttemptId) {
      await tx.idempotencyKey.update({
        where: { id: checkoutAttemptId },
        data: { recoveryPoint: "resources_reserved", lockedAt: /* @__PURE__ */ new Date() }
      });
    }
  });
}
async function releaseCartUnitHold(tx, variant, cartId, now, releaseReason) {
  const unitId = variant.collectibleInventoryUnit?.id;
  if (!unitId) return;
  await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
  const current = await tx.inventoryUnit.findUnique({
    where: { id: unitId },
    select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true }
  });
  assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "reserved" });
  const activeHolds = await tx.reservation.findMany({
    where: { inventoryUnitId: unitId, status: "active" },
    take: 2,
    select: {
      id: true,
      idempotencyKey: true,
      inventoryUnitId: true,
      listingId: true,
      cartId: true,
      purpose: true,
      status: true,
      expiresAt: true
    }
  });
  const hold = requireExactlyOne(activeHolds, "active reservation for the serialized unit");
  if (!hold.listingId) throw new Error("Checkout reservation has no listing identity");
  const listing = await tx.listing.findUnique({
    where: { id: hold.listingId },
    select: { id: true, inventoryUnitId: true }
  });
  if (!listing || listing.inventoryUnitId !== unitId) {
    throw new Error("Checkout reservation listing does not own this inventory unit");
  }
  assertCartReservationFence(hold, { cartId, unitId, listingId: listing.id, idempotencyKey: checkoutKey(cartId), now, allowExpired: true });
  const released = await tx.reservation.updateMany({
    where: {
      id: hold.id,
      idempotencyKey: hold.idempotencyKey,
      inventoryUnitId: unitId,
      listingId: listing.id,
      cartId,
      purpose: "cart",
      status: "active"
    },
    data: { status: "released", releasedAt: now, releaseReason }
  });
  if (released.count !== 1) throw new Error("Checkout reservation changed before release");
  const unitReleased = await tx.inventoryUnit.updateMany({
    where: {
      id: unitId,
      commerceVariantId: variant.id,
      status: "reserved",
      quantity: 1,
      version: current.version
    },
    data: { status: "available", version: { increment: 1 } }
  });
  if (unitReleased.count !== 1) throw new Error("Serialized inventory unit changed before release");
}
async function releaseCheckoutResources(prisma, lines, discounts, idempotencyKey, checkoutAttemptId, errorMessage) {
  const reservations = aggregateLines(lines);
  const cartId = checkoutCartIdFromKey(idempotencyKey);
  const now = /* @__PURE__ */ new Date();
  await prisma.$transaction(async (tx) => {
    const attempt = await tx.idempotencyKey.findUnique({
      where: { id: checkoutAttemptId },
      select: { id: true, idempotencyKey: true, requestPath: true, requestParams: true, recoveryPoint: true }
    });
    assertCheckoutAttemptFence(attempt, { attemptId: checkoutAttemptId, idempotencyKey, cartId });
    for (const { variant, quantity } of reservations) {
      if (variant.collectibleInventoryUnit) {
        await releaseCartUnitHold(tx, variant, cartId, now, errorMessage);
      }
      if (!variant.manageInventory) continue;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { inventoryQuantity: { increment: quantity } }
      });
      await tx.stockMovement.create({
        data: {
          type: "RECEIVE",
          quantity,
          reason: "checkout_release",
          note: idempotencyKey,
          variantId: variant.id
        }
      });
    }
    for (const discount of discounts || []) {
      const released = await tx.discount.updateMany({
        where: { id: discount.id, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } }
      });
      if (released.count !== 1) throw new Error("Discount reservation changed before release");
    }
    const attemptReleased = await tx.idempotencyKey.updateMany({
      where: {
        id: checkoutAttemptId,
        idempotencyKey,
        recoveryPoint: attempt.recoveryPoint
      },
      data: {
        recoveryPoint: "started",
        responseBody: { error: errorMessage },
        responseCode: 409,
        lockedAt: null
      }
    });
    if (attemptReleased.count !== 1) throw new Error("Checkout attempt changed before resource release");
  });
}

// features/keystone/checkout/order-commit.ts
var import_node_crypto5 = __toESM(require("node:crypto"));

// features/webhooks/delivery-policy.ts
var WEBHOOK_DELIVERY_MAX_ATTEMPTS = 12;
var WEBHOOK_DELIVERY_TIMEOUT_MS = 15e3;
var WEBHOOK_DELIVERY_LEASE_MS = 2 * 6e4;
function webhookDeliveryLease(now = Date.now()) {
  return new Date(now + WEBHOOK_DELIVERY_LEASE_MS);
}
function nextWebhookAttempt(attempts, now = Date.now()) {
  if (attempts >= WEBHOOK_DELIVERY_MAX_ATTEMPTS) return null;
  const delay = Math.min(Math.pow(2, attempts) * 6e4, 24 * 60 * 60 * 1e3);
  return new Date(now + delay);
}

// features/webhooks/outbox.ts
async function subscribedWebhookEndpointIds(context, eventType, userId) {
  const scopeFilters = [{ scope: { equals: "STORE" } }];
  if (userId) {
    scopeFilters.push({
      scope: { equals: "USER" },
      user: { id: { equals: userId } }
    });
  }
  const endpoints = await context.query.WebhookEndpoint.findMany({
    where: {
      isActive: { equals: true },
      OR: scopeFilters
    },
    query: "id events"
  });
  return endpoints.filter(
    (endpoint2) => Array.isArray(endpoint2.events) && (endpoint2.events.includes(eventType) || endpoint2.events.includes("*"))
  ).map((endpoint2) => endpoint2.id);
}
async function enqueueWebhookOutbox(tx, endpointIds, eventType, resourceType, resourceId, data) {
  const payload = {
    event: eventType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    listKey: resourceType,
    operation: eventType.split(".").pop(),
    data
  };
  const eventIds = [];
  for (const endpointId of endpointIds) {
    const event = await tx.webhookEvent.create({
      data: {
        eventType,
        resourceType,
        resourceId,
        payload,
        endpointId,
        delivered: false,
        deliveryAttempts: 0,
        nextAttempt: webhookDeliveryLease()
      },
      select: { id: true }
    });
    eventIds.push(event.id);
  }
  return eventIds;
}

// features/webhooks/webhook-plugin.ts
var import_crypto = __toESM(require("crypto"));

// features/webhooks/enrichers/base-enricher.ts
var BaseWebhookEnricher = class {
  /**
   * Helper method to query the entity with enriched data
   */
  async queryEnrichedEntity(item, context) {
    if (!item?.id) {
      return item;
    }
    try {
      const result = await context.query[this.entityType].findOne({
        where: { id: item.id },
        query: this.getQueryFields()
      });
      if (!result || result.id !== item.id) return item;
      return { ...item, ...result };
    } catch (error) {
      console.error(`Error querying ${this.entityType} for webhook enrichment:`, error);
      return item;
    }
  }
};

// features/webhooks/enrichers/order-enricher.ts
var OrderWebhookEnricher = class extends BaseWebhookEnricher {
  constructor() {
    super(...arguments);
    this.entityType = "Order";
  }
  async enrich(item, context) {
    const enrichedItem = await this.queryEnrichedEntity(item, context);
    return enrichedItem || item;
  }
  getQueryFields() {
    return `
      id
      displayId
      email
      status
      rawTotal
      total
      subtotal
      shipping
      discount
      tax
      canceledAt
      metadata
      idempotencyKey
      noNotification
      externalId
      currency {
        id
        code
        symbol
        noDivisionCurrency
      }
      shippingAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        phone
        country {
          id
          iso2
          displayName
        }
      }
      billingAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        phone
        country {
          id
          iso2
          displayName
        }
      }
      lineItems {
        id
        title
        quantity
        sku
        variantTitle
        thumbnail
        formattedUnitPrice
        formattedTotal
        moneyAmount {
          amount
          originalAmount
        }
        productVariant {
          id
          title
          sku
          product {
            id
            title
            handle
            thumbnail
            productImages {
              image {
                url
              }
              imagePath
            }
          }
        }
        productData
        variantData
      }
      createdAt
      updatedAt
    `;
  }
};

// features/webhooks/enrichers/registry.ts
var WebhookEnricherRegistry = class {
  constructor() {
    this.enrichers = /* @__PURE__ */ new Map();
  }
  register(entityType, enricher) {
    this.enrichers.set(entityType, enricher);
  }
  get(entityType) {
    return this.enrichers.get(entityType);
  }
  has(entityType) {
    return this.enrichers.has(entityType);
  }
  /**
   * Get all registered entity types
   */
  getRegisteredTypes() {
    return Array.from(this.enrichers.keys());
  }
};
var webhookEnricherRegistry = new WebhookEnricherRegistry();
function registerWebhookEnricher(enricher) {
  webhookEnricherRegistry.register(enricher.entityType, enricher);
}

// features/webhooks/enrichers/index.ts
registerWebhookEnricher(new OrderWebhookEnricher());

// features/webhooks/webhook-plugin.ts
var WEBHOOK_INTERNAL_LISTS = /* @__PURE__ */ new Set(["WebhookEndpoint", "WebhookEvent"]);
function isWebhookInternalList(listKey2) {
  return WEBHOOK_INTERNAL_LISTS.has(listKey2);
}
function withWebhooks(config2) {
  const enhancedLists = Object.fromEntries(
    Object.entries(config2.lists || {}).map(([listKey2, listConfig]) => {
      if (isWebhookInternalList(listKey2)) return [listKey2, listConfig];
      return [
        listKey2,
        {
          ...listConfig,
          hooks: {
            ...listConfig.hooks,
            afterOperation: async (args) => {
              const originalAfterOperation = listConfig.hooks?.afterOperation;
              if (typeof originalAfterOperation === "function") {
                await originalAfterOperation(args);
              } else if (originalAfterOperation?.[args.operation]) {
                await originalAfterOperation[args.operation](args);
              }
              try {
                await triggerWebhook({
                  listKey: listKey2,
                  operation: args.operation,
                  item: args.item,
                  originalItem: args.originalItem,
                  context: args.context.sudo()
                });
              } catch (error) {
                console.error(`Webhook enqueue failed for ${listKey2}:`, error);
              }
            }
          }
        }
      ];
    })
  );
  return {
    ...config2,
    lists: enhancedLists
  };
}
async function triggerWebhook({ listKey: listKey2, operation, item, originalItem, context }) {
  if (isWebhookInternalList(listKey2)) return;
  try {
    const operationMap = {
      "create": "created",
      "update": "updated",
      "delete": "deleted"
    };
    const webhookOperation = operationMap[operation] || operation;
    const eventType = `${listKey2.toLowerCase()}.${webhookOperation}`;
    const webhooks = await context.query.WebhookEndpoint.findMany({
      where: {
        isActive: { equals: true },
        scope: { equals: "STORE" }
      },
      query: "id url secret events failureCount"
    });
    if (!webhooks || webhooks.length === 0) {
      return;
    }
    const subscribedWebhooks = webhooks.filter((webhook) => {
      if (!webhook.events || !Array.isArray(webhook.events)) {
        return false;
      }
      return webhook.events.includes(eventType) || webhook.events.includes("*");
    });
    if (subscribedWebhooks.length === 0) {
      return;
    }
    const payload = await formatPayload(listKey2, operation, item, originalItem, context);
    for (const webhook of subscribedWebhooks) {
      await deliverWebhook(webhook, eventType, payload, context);
    }
  } catch (error) {
    console.error("Webhook trigger error:", error);
  }
}
async function deliverWebhook(webhook, eventType, payload, context, existingEvent) {
  let webhookEvent = existingEvent;
  try {
    if (!webhookEvent) {
      webhookEvent = await context.query.WebhookEvent.createOne({
        data: {
          eventType,
          resourceType: payload.listKey,
          resourceId: payload.data?.id || "unknown",
          payload,
          endpoint: { connect: { id: webhook.id } },
          deliveryAttempts: 0,
          nextAttempt: webhookDeliveryLease()
        },
        query: "id deliveryAttempts"
      });
    }
    await context.query.WebhookEvent.updateOne({
      where: { id: webhookEvent.id },
      data: { deliveryAttempts: (webhookEvent.deliveryAttempts || 0) + 1, lastAttempt: /* @__PURE__ */ new Date() }
    });
    if (!webhook.secret) {
      throw new Error("Webhook endpoint secret is required");
    }
    const secret = webhook.secret;
    const signature = import_crypto.default.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OpenFront-Webhook-Signature": `sha256=${signature}`,
        "X-OpenFront-Topic": eventType,
        "X-OpenFront-ListKey": payload.listKey,
        "X-OpenFront-Operation": payload.operation,
        "X-OpenFront-Delivery-ID": webhookEvent.id
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_DELIVERY_TIMEOUT_MS)
    });
    if (response.ok) {
      const responseBody = (await response.text()).slice(0, 64e3);
      await context.query.WebhookEvent.updateOne({
        where: { id: webhookEvent.id },
        data: {
          delivered: true,
          responseStatus: response.status,
          responseBody,
          lastAttempt: /* @__PURE__ */ new Date()
        }
      });
      if (webhook.failureCount > 0) {
        await context.query.WebhookEndpoint.updateOne({
          where: { id: webhook.id },
          data: {
            failureCount: 0,
            lastTriggered: /* @__PURE__ */ new Date()
          }
        });
      } else {
        await context.query.WebhookEndpoint.updateOne({
          where: { id: webhook.id },
          data: { lastTriggered: /* @__PURE__ */ new Date() }
        });
      }
    } else {
      const errorText = (await response.text()).slice(0, 64e3);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    try {
      const attempts = Number(webhookEvent?.deliveryAttempts || 0) + 1;
      const nextAttempt = nextWebhookAttempt(attempts);
      await context.query.WebhookEvent.updateOne({
        where: { id: webhookEvent?.id },
        data: {
          delivered: false,
          responseStatus: 0,
          responseBody: error instanceof Error ? error.message : String(error),
          lastAttempt: /* @__PURE__ */ new Date(),
          nextAttempt,
          ...nextAttempt ? {} : { deadLetteredAt: /* @__PURE__ */ new Date() }
        }
      });
      await context.query.WebhookEndpoint.updateOne({
        where: { id: webhook.id },
        data: {
          failureCount: (webhook.failureCount || 0) + 1
        }
      });
    } catch (updateError) {
      console.error("Failed to update webhook event after delivery failure:", updateError);
    }
  }
}
async function formatPayload(listKey2, operation, item, originalItem, context) {
  const basePayload = {
    event: `${listKey2.toLowerCase()}.${operation}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    listKey: listKey2,
    operation
  };
  let enrichedData = item;
  if (webhookEnricherRegistry.has(listKey2) && item?.id) {
    try {
      const enricher = webhookEnricherRegistry.get(listKey2);
      if (enricher) {
        enrichedData = await enricher.enrich(item, context);
      }
    } catch (error) {
      console.error(`Error enriching webhook payload for ${listKey2}:`, error);
      enrichedData = item;
    }
  }
  switch (operation) {
    case "create":
      return {
        ...basePayload,
        data: enrichedData || item
      };
    case "update":
      return {
        ...basePayload,
        data: enrichedData || item,
        previousData: originalItem,
        changes: getChangedFields(originalItem, enrichedData || item)
      };
    case "delete":
      return {
        ...basePayload,
        data: originalItem
      };
    default:
      return {
        ...basePayload,
        data: enrichedData || item
      };
  }
}
function getChangedFields(original, updated) {
  if (!original || !updated) return {};
  const changes = {};
  for (const key in updated) {
    if (original[key] !== updated[key]) {
      changes[key] = {
        from: original[key],
        to: updated[key]
      };
    }
  }
  return changes;
}
async function deliverWebhookEventsById(context, eventIds) {
  const uniqueEventIds = [...new Set(eventIds.filter(Boolean))];
  for (const eventId of uniqueEventIds) {
    const event = await context.sudo().query.WebhookEvent.findOne({
      where: { id: eventId },
      query: `
        id eventType payload deliveryAttempts delivered
        endpoint { id url secret failureCount }
      `
    });
    if (!event || event.delivered || !event.endpoint) continue;
    await deliverWebhook(
      event.endpoint,
      event.eventType,
      event.payload,
      context.sudo(),
      event
    );
  }
  return uniqueEventIds.length;
}
async function retryPendingWebhookDeliveries(context, limit = 25) {
  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const sudo = context.sudo();
  const now = /* @__PURE__ */ new Date();
  const candidates = await sudo.prisma.webhookEvent.findMany({
    where: {
      delivered: false,
      deadLetteredAt: null,
      nextAttempt: { lte: now },
      deliveryAttempts: { lt: WEBHOOK_DELIVERY_MAX_ATTEMPTS },
      endpointId: { not: null }
    },
    orderBy: { nextAttempt: "asc" },
    take: boundedLimit,
    select: { id: true }
  });
  let claimed = 0;
  for (const candidate of candidates) {
    const claim = await sudo.prisma.webhookEvent.updateMany({
      where: {
        id: candidate.id,
        delivered: false,
        deadLetteredAt: null,
        nextAttempt: { lte: now },
        deliveryAttempts: { lt: WEBHOOK_DELIVERY_MAX_ATTEMPTS }
      },
      data: { nextAttempt: webhookDeliveryLease() }
    });
    if (claim.count !== 1) continue;
    const event = await sudo.query.WebhookEvent.findOne({
      where: { id: candidate.id },
      query: `
        id eventType payload deliveryAttempts
        endpoint { id url secret failureCount }
      `
    });
    if (!event?.endpoint) continue;
    claimed += 1;
    await deliverWebhook(event.endpoint, event.eventType, event.payload, sudo, event);
  }
  return claimed;
}

// features/keystone/checkout/reservation-conversion.ts
async function convertCheckoutReservation(tx, expected) {
  if (checkoutCartIdFromKey(expected.idempotencyKey) !== expected.cartId) {
    throw new Error("Checkout reservation key does not identify this cart");
  }
  await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${expected.unitId} FOR UPDATE`;
  const unit = await tx.inventoryUnit.findUnique({
    where: { id: expected.unitId },
    select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true }
  });
  assertInventoryUnitFence(unit, {
    unitId: expected.unitId,
    variantId: expected.variantId,
    status: "reserved"
  });
  const listing = await tx.listing.findUnique({
    where: { id: expected.listingId },
    select: { id: true, inventoryUnitId: true, status: true, format: true }
  });
  if (!listing || listing.id !== expected.listingId || listing.inventoryUnitId !== expected.unitId || listing.status !== "published" || listing.format !== "fixed_price") {
    throw new Error("Checkout listing no longer owns the reserved unit");
  }
  const activeHolds = await tx.reservation.findMany({
    where: { inventoryUnitId: expected.unitId, status: "active" },
    take: 2,
    select: {
      id: true,
      idempotencyKey: true,
      inventoryUnitId: true,
      listingId: true,
      cartId: true,
      purpose: true,
      status: true,
      expiresAt: true
    }
  });
  const hold = requireExactlyOne(activeHolds, "active reservation for the order's serialized unit");
  assertCartReservationFence(hold, {
    cartId: expected.cartId,
    unitId: expected.unitId,
    listingId: expected.listingId,
    idempotencyKey: expected.idempotencyKey,
    now: expected.now,
    // Payment may already be captured; an active hold this checkout owns still converts after expiry.
    allowExpired: true
  });
  const converted = await tx.reservation.updateMany({
    where: {
      id: hold.id,
      idempotencyKey: hold.idempotencyKey,
      inventoryUnitId: expected.unitId,
      listingId: expected.listingId,
      cartId: expected.cartId,
      purpose: "cart",
      status: "active"
    },
    data: {
      status: "converted",
      releasedAt: expected.now,
      releaseReason: "order_created"
    }
  });
  if (converted.count !== 1) throw new Error("Checkout reservation changed before order conversion");
  const unitSold = await tx.inventoryUnit.updateMany({
    where: {
      id: expected.unitId,
      commerceVariantId: expected.variantId,
      status: "reserved",
      quantity: 1,
      version: unit.version
    },
    data: { status: "sold", quantity: 0, version: { increment: 1 } }
  });
  if (unitSold.count !== 1) throw new Error("Serialized inventory unit changed before order conversion");
  const listingSold = await tx.listing.updateMany({
    where: {
      id: expected.listingId,
      inventoryUnitId: expected.unitId,
      status: "published",
      format: "fixed_price"
    },
    data: { status: "sold" }
  });
  if (listingSold.count !== 1) throw new Error("Checkout listing changed before order conversion");
}

// features/keystone/checkout/order-commit.ts
var WEBHOOK_ADDRESS_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  company: true,
  address1: true,
  address2: true,
  city: true,
  province: true,
  postalCode: true,
  phone: true,
  country: { select: { id: true, iso2: true } }
};
async function createOrderFromCartAtomically(cart, sudo, checkoutAttemptId) {
  const prepared = [];
  for (const line of cart.lineItems) {
    const prices = await sudo.query.MoneyAmount.findMany({
      where: {
        productVariant: { id: { equals: line.productVariant.id } },
        region: { id: { equals: cart.region.id } },
        currency: { code: { equals: cart.region.currency.code } }
      },
      take: 1,
      query: "id calculatedPrice { calculatedAmount originalAmount currencyCode }"
    });
    const price = prices[0]?.calculatedPrice;
    if (!price) throw new Error(`No valid price for variant ${line.productVariant.id}`);
    const thumbnail = line.productVariant.primaryImage ? line.productVariant.primaryImage.image?.url || line.productVariant.primaryImage.imagePath : line.productVariant.product.thumbnail;
    let collectibleSnapshot;
    const collectibleUnitId = line.productVariant.collectibleInventoryUnit?.id;
    if (collectibleUnitId) {
      const [unit, listings] = await Promise.all([
        sudo.query.InventoryUnit.findOne({ where: { id: collectibleUnitId }, query: `
          id sku ownershipBasis status
          specimen {
            id displayName specimenCode attributeValues
            catalogItem { id title handle catalogNumber maker year attributeValues category { id name handle } franchise { id name handle } collectibleSet { id name handle } release { id name handle edition releaseDate } }
            media(where: { visibility: { equals: "public" } }, take: 8) { id kind url altText source capturedAt checksum }
            conditionObservations(where: { status: { in: ["reported", "reviewed"] } }, orderBy: { observedAt: desc }, take: 3) { id sourceType scale label score notes observedAt status evidence }
            gradeObservations(orderBy: { observedAt: desc }, take: 3) { id reportedGrade reportedLabel certificateReference certificateLookupUrl observedAt verificationState providerResponseHash disclaimer gradingCompany { id name code } }
            provenanceEvents(where: { reviewState: { in: ["reported", "reviewed"] } }, orderBy: { occurredAt: desc }, take: 6) { id eventType occurredAt recordedAt summary source confidence reviewState publicEvidence }
            valuationObservations(orderBy: { observedAt: desc }, take: 5) { id amountMinor currencyCode sourceType sourceName sourceReference observedAt confidence disclaimer }
          }
        ` }),
        sudo.query.Listing.findMany({ where: { inventoryUnit: { id: { equals: collectibleUnitId } }, status: { equals: "published" }, format: { equals: "fixed_price" } }, take: 2, query: "id title slug format status priceMinor currencyCode publicationSnapshot publicSummary seller { id displayName } inventoryUnit { id }" })
      ]);
      if (!unit || unit.status !== "reserved") throw new Error(`Serialized specimen ${unit?.sku || collectibleUnitId} is not reserved for checkout`);
      const listing = requireExactlyOne(listings, "published fixed-price listing for the serialized unit");
      if (listing.inventoryUnit?.id !== collectibleUnitId) {
        throw new Error("Fixed-price listing does not own the checkout unit");
      }
      collectibleSnapshot = {
        inventoryUnit: { id: unit.id, sku: unit.sku, ownershipBasis: unit.ownershipBasis },
        specimen: unit.specimen,
        listing,
        disclosure: "Condition, grading, provenance, and valuation fields are attributed checkout-time observations, not Openfront guarantees.",
        capturedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    prepared.push({ line, price, thumbnail, collectibleSnapshot });
  }
  const userId = cart.user?.id || cart.shippingAddress?.user?.id;
  const orderWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "order.created",
    userId
  );
  const secretKey = userId ? "" : import_node_crypto5.default.randomBytes(32).toString("hex");
  const commercialSnapshot = {
    version: 1,
    discounts: (cart.discounts || []).map((discount) => {
      if (!discount.discountRule) throw new Error("Accepted discount policy is unavailable");
      return { discountRule: { type: discount.discountRule.type, value: discount.discountRule.value, allocation: discount.discountRule.allocation ?? null } };
    }),
    currency: cart.region.currency.code,
    tax: {
      rate: cart.region.taxRate || 0,
      regionId: cart.region.id,
      destinationCountry: cart.shippingAddress?.country?.iso2 || null
    },
    acceptedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const webhookTotals = orderWebhookEndpointIds.length ? await sudo.query.Cart.findOne({ where: { id: cart.id }, query: "subtotal shipping discount tax total" }).catch(() => null) : null;
  const commit = await sudo.prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({ where: { cart: { id: cart.id } }, select: { id: true } });
    if (existing) return { orderId: existing.id, webhookEventIds: [] };
    const checkoutKey2 = `checkout:${cart.id}`;
    const checkoutAttempt = await tx.idempotencyKey.findUnique({
      where: { id: checkoutAttemptId },
      select: { id: true, idempotencyKey: true, requestPath: true, requestParams: true, recoveryPoint: true }
    });
    assertCheckoutCommitAttemptFence(checkoutAttempt, {
      attemptId: checkoutAttemptId,
      idempotencyKey: checkoutKey2,
      cartId: cart.id
    });
    const committedAt = /* @__PURE__ */ new Date();
    const lineItemIds = [];
    const webhookLineItems = [];
    for (const { line, price, thumbnail, collectibleSnapshot } of prepared) {
      const money = await tx.orderMoneyAmount.create({
        data: {
          amount: price.calculatedAmount,
          originalAmount: price.originalAmount,
          currencyId: cart.region.currency.id,
          regionId: cart.region.id,
          priceData: {
            prices: line.productVariant.prices,
            currencyCode: cart.region.currency.code,
            regionId: cart.region.id,
            taxRate: cart.region.taxRate
          },
          metadata: line.metadata
        }
      });
      const item = await tx.orderLineItem.create({
        data: {
          quantity: line.quantity,
          title: line.productVariant.product.title,
          sku: line.productVariant.sku,
          metadata: line.metadata,
          productData: {
            id: line.productVariant.product.id,
            title: line.productVariant.product.title,
            thumbnail,
            description: line.productVariant.product.description,
            metadata: line.productVariant.product.metadata,
            ...collectibleSnapshot ? { collectible: collectibleSnapshot } : {}
          },
          variantData: {
            id: line.productVariant.id,
            sku: line.productVariant.sku,
            title: line.productVariant.title,
            measurements: line.productVariant.measurements || []
          },
          variantTitle: line.productVariant.title,
          formattedUnitPrice: line.unitPrice,
          formattedTotal: line.total,
          productVariantId: line.productVariant.id,
          originalLineItemId: line.id,
          moneyAmountId: money.id
        }
      });
      if (collectibleSnapshot) {
        const unitId = collectibleSnapshot.inventoryUnit.id;
        const listingId = collectibleSnapshot.listing?.id;
        if (!listingId || line.quantity !== 1) {
          throw new Error("Serialized order line is missing its exact unit listing or quantity");
        }
        await convertCheckoutReservation(tx, {
          cartId: cart.id,
          idempotencyKey: checkoutKey2,
          unitId,
          variantId: line.productVariant.id,
          listingId,
          now: committedAt
        });
        await tx.inventoryMovement.create({ data: { inventoryUnitId: unitId, type: "sell", fromStatus: "reserved", toStatus: "sold", reason: "checkout_order_created", occurredAt: committedAt, idempotencyKey: `order:${cart.id}:${unitId}` } });
      }
      lineItemIds.push(item.id);
      webhookLineItems.push({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        sku: item.sku,
        thumbnail,
        moneyAmount: {
          amount: price.calculatedAmount,
          originalAmount: price.originalAmount
        },
        productVariant: {
          id: line.productVariant.id,
          title: line.productVariant.title,
          sku: line.productVariant.sku,
          product: {
            id: line.productVariant.product.id,
            title: line.productVariant.product.title,
            thumbnail
          }
        }
      });
    }
    const order = await tx.order.create({
      data: {
        cart: { connect: { id: cart.id } },
        email: cart.email,
        userId,
        regionId: cart.region.id,
        currencyId: cart.region.currency.id,
        billingAddressId: cart.billingAddress.id,
        shippingAddressId: cart.shippingAddress.id,
        discounts: { connect: (cart.discounts || []).map((item) => ({ id: item.id })) },
        shippingMethods: { connect: (cart.shippingMethods || []).map((item) => ({ id: item.id })) },
        lineItems: { connect: lineItemIds.map((id3) => ({ id: id3 })) },
        status: "pending",
        displayId: Math.floor(Date.now() / 1e3),
        taxRate: cart.region.taxRate || 0,
        metadata: { ...cart.metadata || {}, commercialSnapshot },
        secretKey,
        events: {
          create: {
            type: "ORDER_PLACED",
            data: { cartId: cart.id, isGuestOrder: !userId }
          }
        }
      }
    });
    await tx.cart.update({ where: { id: cart.id }, data: { orderId: order.id } });
    const webhookAddress = (id3) => orderWebhookEndpointIds.length ? tx.address.findUnique({ where: { id: id3 }, select: WEBHOOK_ADDRESS_SELECT }) : null;
    const shippingAddress = await webhookAddress(cart.shippingAddress.id);
    const billingAddress = await webhookAddress(cart.billingAddress.id);
    const webhookEventIds = await enqueueWebhookOutbox(
      tx,
      orderWebhookEndpointIds,
      "order.created",
      "Order",
      order.id,
      {
        id: order.id,
        cartId: cart.id,
        displayId: order.displayId,
        email: order.email,
        status: order.status,
        rawTotal: cart.rawTotal,
        subtotal: webhookTotals?.subtotal ?? null,
        shipping: webhookTotals?.shipping ?? null,
        discount: webhookTotals?.discount ?? null,
        tax: webhookTotals?.tax ?? null,
        total: webhookTotals?.total ?? null,
        currency: { id: cart.region.currency.id, code: cart.region.currency.code },
        shippingAddress,
        billingAddress,
        lineItems: webhookLineItems
      }
    );
    if (cart.email) {
      await tx.notification.create({
        data: {
          eventName: "ORDER_CONFIRMATION",
          resourceType: "Order",
          resourceId: order.id,
          to: cart.email,
          userId: userId || null,
          data: { orderId: order.id, status: "pending_delivery" }
        }
      });
    }
    return { orderId: order.id, webhookEventIds };
  });
  if (commit.webhookEventIds.length) {
    try {
      await deliverWebhookEventsById(sudo, commit.webhookEventIds);
    } catch (error) {
      console.error(
        "Immediate order webhook delivery failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  return sudo.query.Order.findOne({
    where: { id: commit.orderId },
    query: `
      id status displayId secretKey subtotal total shipping discount tax paymentDetails
      shippingAddress { id firstName lastName company address1 address2 city province postalCode country { id iso2 } phone }
    `
  });
}

// features/keystone/payments/provider-capture-key.ts
function providerCaptureKey(providerId, transactionId) {
  if (typeof providerId !== "string" || !providerId.trim() || providerId.length > 255 || !/^[A-Za-z0-9._:-]+$/.test(providerId.trim())) {
    throw new Error("Payment provider identity is required for capture reconciliation");
  }
  if (typeof transactionId !== "string" || !transactionId.trim() || transactionId.length > 512 || !/^[A-Za-z0-9._:-]+$/.test(transactionId.trim())) {
    throw new Error("Provider capture identity is required for capture reconciliation");
  }
  const provider = providerId.trim();
  const transaction = transactionId.trim();
  return `v1:${provider.length}:${provider}:${transaction}`;
}

// features/keystone/mutations/completeActiveCart.ts
async function completeActiveCart(root, { cartId, paymentSessionId }, context) {
  await assertCartAccess(context, cartId, { allowCompleted: true });
  if (paymentSessionId) {
    await assertPaymentSessionBelongsToCart(context, cartId, paymentSessionId);
  }
  const sudoContext = context.sudo();
  const user = context.session?.itemId;
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      email
      rawTotal
      metadata
      order {
        id
        status
        displayId
        secretKey
        payments { id }
        account { id }
        shippingAddress { country { iso2 } }
      }
      user {
        id
        hasAccount
      }
      shippingAddress {
        id
        country { iso2 }
        user {
          id
          hasAccount
        }
      }
      region {
        id
        taxRate
        currency {
          code
          id
        }
      }
      billingAddress {
        id
      }
      shippingAddress {
        id
      }
      discounts(take: 101) {
        id
        code
        discountRule { type value allocation }
      }
      giftCards { id }
      shippingMethods {
        id
      }
      lineItems {
        id
        quantity
        metadata
        unitPrice
        total
        productVariant {
          id
          sku
          title
          inventoryQuantity
          manageInventory
          allowBackorder
          collectibleInventoryUnit { id sku status version }
          primaryImage {
            image {
              url
            }
            imagePath
          }
          product {
            id
            title
            thumbnail
            productTags { id }
            description {
              document
            }
            metadata
          }
          prices {
            id
            amount
            compareAmount
            currency {
              code
            }
            calculatedPrice {
              calculatedAmount
              originalAmount
              currencyCode
            }
          }
          measurements {
            id
            value
            unit
            type
          }
        }
      }
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          amount
          data
          paymentProvider {
            id
            code
            capturePaymentFunction
            getPaymentStatusFunction
            credentials
          }
        }
      }
    `
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  if (cart.order?.id) {
    const existingAttempt = await sudoContext.prisma.idempotencyKey.findUnique({
      where: { idempotencyKey: checkoutKey(cartId) }
    });
    if (paymentSessionId && !cart.order.payments?.length) {
      const selectedSession = cart.paymentCollection?.paymentSessions?.find(
        (session) => session.id === paymentSessionId
      );
      const paymentResult = existingAttempt?.responseBody?.paymentResult;
      if (!selectedSession || !paymentResult || existingAttempt.recoveryPoint !== "payment_confirmed") {
        throw new Error("Checkout requires payment reconciliation");
      }
      await createPaymentRecord(paymentResult, selectedSession, cart.order, cart, sudoContext);
    } else if (!paymentSessionId && !cart.order.account?.id) {
      if (!user) throw new Error("Checkout requires account reconciliation");
      const accounts = await sudoContext.query.Account.findMany({
        where: {
          user: { id: { equals: user } },
          accountType: { equals: "business" },
          status: { equals: "active" }
        },
        take: 1,
        query: "id"
      });
      if (!accounts[0]) throw new Error("Checkout requires account reconciliation");
      await addOrderToAccount(accounts[0].id, cart.order, sudoContext);
    }
    if (existingAttempt) {
      await updateCheckoutAttempt(
        sudoContext.prisma,
        existingAttempt.id,
        "completed",
        { orderId: cart.order.id },
        200
      );
    }
    return sudoContext.query.Order.findOne({
      where: { id: cart.order.id },
      query: "id status displayId secretKey shippingAddress { country { iso2 } }"
    });
  }
  const attempt = await getOrCreateCheckoutAttempt(
    sudoContext.prisma,
    cartId,
    paymentSessionId
  );
  if (attempt.recoveryPoint === "completed" && attempt.responseBody?.orderId) {
    return sudoContext.query.Order.findOne({
      where: { id: attempt.responseBody.orderId },
      query: "id status displayId secretKey shippingAddress { country { iso2 } }"
    });
  }
  let inventoryReserved = attempt.recoveryPoint !== "started";
  let discountsReserved = [
    "resources_reserved",
    "payment_unknown",
    "order_created",
    "payment_confirmed"
  ].includes(attempt.recoveryPoint);
  try {
    if (!inventoryReserved) {
      await reserveCartInventory(
        sudoContext.prisma,
        cart.lineItems,
        checkoutKey(cartId),
        attempt.id
      );
      inventoryReserved = true;
      attempt.recoveryPoint = "stock_reserved";
    }
    if (!discountsReserved) {
      await reserveDiscountUsage(
        sudoContext.prisma,
        cart.discounts || [],
        attempt.id
      );
      discountsReserved = true;
      attempt.recoveryPoint = "resources_reserved";
    }
    const order = !paymentSessionId ? await handleAccountOrder(cart, user, sudoContext, attempt) : await handlePaidOrder(cart, paymentSessionId, sudoContext, attempt);
    await updateCheckoutAttempt(
      sudoContext.prisma,
      attempt.id,
      "completed",
      { orderId: order.id },
      200
    );
    return order;
  } catch (error) {
    if (inventoryReserved && !["payment_unknown", "order_created", "payment_confirmed"].includes(attempt.recoveryPoint)) {
      await releaseCheckoutResources(
        sudoContext.prisma,
        cart.lineItems,
        discountsReserved ? cart.discounts || [] : [],
        checkoutKey(cartId),
        attempt.id,
        error instanceof Error ? error.message : "Checkout failed"
      );
    }
    throw error;
  }
}
async function handleAccountOrder(cart, user, sudoContext, attempt) {
  if (!user) {
    throw new Error("Authentication required for account orders");
  }
  const cartCurrency = cart.region?.currency?.code;
  if (!cartCurrency) {
    throw new Error("Cart region or currency not found");
  }
  const accounts = await sudoContext.query.Account.findMany({
    where: {
      user: { id: { equals: user } },
      accountType: { equals: "business" },
      status: { equals: "active" }
    },
    query: `
      id
      totalAmount
      paidAmount
      creditLimit
      currency {
        id
        code
        noDivisionCurrency
      }
      user {
        id
        email
      }
    `
  });
  const activeAccount = accounts[0];
  if (!activeAccount) {
    throw new Error(`No active business account found. Contact administrator to set up business account access.`);
  }
  if (cartCurrency !== activeAccount.currency.code) {
    throw new Error("Cross-currency account orders are outside the supported launch boundary");
  }
  const orderInAccountCurrency = cart.rawTotal;
  const order = await createOrderFromCartAtomically(cart, sudoContext, attempt.id);
  await updateCheckoutAttempt(
    sudoContext.prisma,
    attempt.id,
    "order_created",
    { orderId: order.id }
  );
  attempt.recoveryPoint = "order_created";
  await addOrderToAccount(activeAccount.id, order, sudoContext);
  return order;
}
async function handlePaidOrder(cart, paymentSessionId, sudoContext, attempt) {
  const selectedSession = cart.paymentCollection?.paymentSessions?.find(
    (session) => session.id === paymentSessionId
  );
  if (!selectedSession) {
    throw new Error(`Payment session not found. Looking for session ID: ${paymentSessionId}`);
  }
  if (!selectedSession.paymentProvider) {
    throw new Error("Payment provider not found in session");
  }
  if (!selectedSession.paymentProvider.code) {
    throw new Error("Payment provider code is missing");
  }
  if (selectedSession.amount !== cart.rawTotal) {
    throw new Error("Payment session amount no longer matches cart total");
  }
  let paymentResult = attempt.responseBody?.paymentResult;
  if (attempt.recoveryPoint !== "payment_confirmed" || !paymentResult) {
    try {
      paymentResult = await settlePaymentSession(selectedSession, cart);
    } catch (error) {
      await updateCheckoutAttempt(
        sudoContext.prisma,
        attempt.id,
        "payment_unknown",
        { error: error instanceof Error ? error.message : String(error) }
      );
      attempt.recoveryPoint = "payment_unknown";
      throw error;
    }
    if (paymentResult.status !== "succeeded") {
      await updateCheckoutAttempt(
        sudoContext.prisma,
        attempt.id,
        "resources_reserved",
        { paymentResult }
      );
      attempt.recoveryPoint = "resources_reserved";
      throw new Error(`Payment failed: ${paymentResult.error || paymentResult.status}`);
    }
    await updateCheckoutAttempt(
      sudoContext.prisma,
      attempt.id,
      "payment_confirmed",
      { paymentResult }
    );
    attempt.recoveryPoint = "payment_confirmed";
    attempt.responseBody = { paymentResult };
  }
  const order = await createOrderFromCartAtomically(cart, sudoContext, attempt.id);
  await createPaymentRecord(paymentResult, selectedSession, order, cart, sudoContext);
  return order;
}
async function settlePaymentSession(session, cart) {
  const provider = session.paymentProvider;
  if (provider.code === "pp_system_default") {
    throw new Error("Manual tender cannot complete storefront checkout");
  }
  const paymentId = session.data?.paymentIntentId || session.data?.clientSecret?.split("_secret_")[0] || session.data?.orderId;
  if (!paymentId) throw new Error("Payment provider reference is missing");
  let result = await getPaymentStatus({ provider, paymentId });
  const normalizedStatus = String(result.status || "").toLowerCase();
  if (["requires_capture", "approved", "authorized"].includes(normalizedStatus)) {
    result = await capturePayment({
      provider,
      paymentId,
      amount: cart.rawTotal,
      currency: cart.region.currency.code,
      idempotencyKey: checkoutKey(cart.id)
    });
  }
  const finalStatus = String(result.status || "").toLowerCase();
  const succeeded = ["succeeded", "completed", "captured"].includes(finalStatus);
  const resultAmount = Number(result.amount);
  const expectedCurrency = String(cart.region.currency.code).toUpperCase();
  const resultCurrency = result.currency.toUpperCase();
  if (!succeeded) {
    return { status: "failed", paymentIntentId: paymentId, error: `Payment status: ${result.status}` };
  }
  if (!Number.isInteger(resultAmount) || resultAmount !== cart.rawTotal) {
    throw new Error("Provider payment amount does not match cart total");
  }
  if (resultCurrency !== expectedCurrency) {
    throw new Error("Provider payment currency does not match cart currency");
  }
  return {
    status: "succeeded",
    paymentIntentId: paymentId,
    amount: resultAmount,
    currency: resultCurrency,
    data: result.data
  };
}
async function addOrderToAccount(accountId, order, sudoContext) {
  const orderDetails = await sudoContext.query.Order.findOne({
    where: { id: order.id },
    query: `
      id
      displayId
      rawTotal
      region {
        id
        name
        currency {
          code
        }
      }
      currency {
        code
      }
      lineItems {
        id
      }
    `
  });
  try {
    await sudoContext.prisma.$transaction(async (tx) => {
      const existing = await tx.accountLineItem.findUnique({
        where: { orderKey: order.id },
        select: { id: true, accountId: true }
      });
      if (existing && existing.accountId !== accountId) {
        throw new Error("Order is already posted to a different account");
      }
      if (!existing) {
        const amount = orderDetails.rawTotal || 0;
        const accountRows = await tx.$queryRaw`SELECT id, status, "totalAmount", "paidAmount", "creditLimit", "currency" AS "currencyId" FROM "Account" WHERE id = ${accountId} FOR UPDATE`;
        const account = accountRows[0];
        if (!account || account.status !== "active") {
          throw new Error("Business account is not active");
        }
        const currency = account.currencyId ? await tx.currency.findUnique({ where: { id: account.currencyId }, select: { code: true } }) : null;
        if (!currency?.code || currency.code.toUpperCase() !== orderDetails.currency?.code?.toUpperCase()) throw new Error("Account and order currencies must match");
        if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid accepted order amount");
        const availableCredit = account.creditLimit - ((account.totalAmount || 0) - (account.paidAmount || 0));
        if (amount > availableCredit) throw new Error("Insufficient account credit");
        await tx.account.update({
          where: { id: accountId },
          data: { totalAmount: { increment: amount } }
        });
        await tx.accountLineItem.create({
          data: {
            accountId,
            orderId: order.id,
            orderKey: order.id,
            regionId: orderDetails.region.id,
            description: `Order #${orderDetails.displayId} - ${orderDetails.lineItems?.length || 0} items`,
            amount,
            orderDisplayId: String(orderDetails.displayId),
            itemCount: orderDetails.lineItems?.length || 0,
            paymentStatus: "unpaid"
          }
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { accountId }
      });
    }, { isolationLevel: "Serializable" });
    console.log(`Order #${orderDetails.displayId} added to account ${accountId} for ${orderDetails.rawTotal} ${orderDetails.currency.code}`);
  } catch (error) {
    console.error("Error adding order to account:", error);
    throw new Error(
      `Failed to add order to account: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function createPaymentRecord(paymentResult, selectedSession, order, cart, sudoContext) {
  const paymentWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudoContext,
    "payment.captured"
  );
  await sudoContext.prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({
      where: { orderId: order.id, paymentCollectionId: cart.paymentCollection.id }
    });
    if (existing) return;
    const payment = await tx.payment.create({
      data: {
        status: "captured",
        amount: cart.rawTotal,
        currencyCode: cart.region.currency.code,
        data: {
          ...selectedSession.data,
          ...paymentResult.data,
          paymentProviderId: selectedSession.paymentProvider.id,
          paymentIntentId: paymentResult.paymentIntentId
        },
        metadata: { checkoutIdempotencyKey: checkoutKey(cart.id) },
        idempotencyKey: checkoutKey(cart.id),
        capturedAt: /* @__PURE__ */ new Date(),
        paymentCollectionId: cart.paymentCollection.id,
        orderId: order.id,
        userId: cart.user?.id || cart.shippingAddress?.user?.id || null
      }
    });
    await tx.capture.create({
      data: {
        amount: cart.rawTotal,
        paymentId: payment.id,
        providerCaptureKey: providerCaptureKey(selectedSession.paymentProvider.id, paymentResult.paymentIntentId),
        metadata: {
          paymentProviderId: selectedSession.paymentProvider.id,
          paymentIntentId: paymentResult.paymentIntentId
        },
        createdBy: "checkout"
      }
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_CAPTURED",
        data: {
          paymentId: payment.id,
          amount: cart.rawTotal,
          currencyCode: cart.region.currency.code,
          source: "checkout"
        }
      }
    });
    await enqueueWebhookOutbox(
      tx,
      paymentWebhookEndpointIds,
      "payment.captured",
      "Payment",
      payment.id,
      { id: payment.id, orderId: order.id, amount: cart.rawTotal, currencyCode: cart.region.currency.code }
    );
  });
}
var completeActiveCart_default = completeActiveCart;

// features/keystone/mutations/addActiveCartShippingMethod.ts
async function addActiveCartShippingMethod(root, { cartId, shippingMethodId }, context) {
  await assertCartAccess(context, cartId);
  const sudo = context.sudo();
  const cart = await sudo.query.Cart.findOne({
    where: { id: cartId },
    query: "id region { id }"
  });
  const option = await sudo.query.ShippingOption.findOne({
    where: { id: shippingMethodId },
    query: "id amount name region { id } adminOnly isReturn"
  });
  if (!cart || !option || option.region?.id !== cart.region?.id || option.adminOnly || option.isReturn) {
    throw new Error("Shipping option not found");
  }
  await sudo.prisma.$transaction(async (tx) => {
    await tx.shippingMethod.deleteMany({ where: { cartId } });
    await tx.shippingMethod.create({
      data: {
        cartId,
        shippingOptionId: option.id,
        price: option.amount,
        data: { name: option.name }
      }
    });
    await tx.cart.update({
      where: { id: cartId },
      data: { paymentCollectionId: null }
    });
  });
  return sudo.query.Cart.findOne({
    where: { id: cartId },
    query: "id shippingMethods { id price data shippingOption { id name } }"
  });
}
var addActiveCartShippingMethod_default = addActiveCartShippingMethod;

// features/keystone/queries/activeCartShippingOptions.ts
async function activeCartShippingOptions(root, { cartId }, context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      region {
        id
        currency {
          code
          noDivisionCurrency
        }
      }
      shippingAddress {
        id
      }
      subtotal
    `
  });
  if (!cart?.region?.id) return [];
  const shippingOptions = await sudoContext.query.ShippingOption.findMany({
    where: {
      AND: [
        { region: { id: { equals: cart.region.id } } },
        { isReturn: { equals: false } },
        { adminOnly: { equals: false } }
      ]
    },
    query: `
      id
      name
      amount
      priceType
      data
      shippingOptionRequirements {
        id
        type
        amount
      }
      taxRates {
        id
        rate
      }
    `
  });
  const currencyCode = cart.region?.currency?.code || "USD";
  const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
  return shippingOptions.map((option) => {
    const taxRate = option.taxRates?.[0]?.rate || 0;
    const baseAmount = option.amount;
    const calculatedAmount = baseAmount * (1 + taxRate);
    return {
      ...option,
      amount: baseAmount,
      calculatedAmount: formatAmount(calculatedAmount / divisor, currencyCode),
      isTaxInclusive: true
    };
  });
}
function formatAmount(amount, currencyCode) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(amount);
}
var activeCartShippingOptions_default = activeCartShippingOptions;

// features/keystone/queries/activeCartPaymentProviders.ts
async function activeCartPaymentProviders(root, { regionId }, context, info) {
  if (!regionId) {
    throw new Error("Region ID is required");
  }
  const providers = await context.sudo().query.PaymentProvider.findMany({
    where: {
      isInstalled: { equals: true },
      regions: { some: { id: { equals: regionId } } }
    },
    query: `
      id
      name
      code
      isInstalled
    `
  });
  return providers.filter(
    (provider) => isPaymentProviderConfigured(provider.code || "")
  );
}
var activeCartPaymentProviders_default = activeCartPaymentProviders;

// features/keystone/queries/activeCartRegion.ts
async function activeCartRegion(root, { countryCode }, context) {
  const sudoContext = context.sudo();
  const regions = await sudoContext.query.Region.findMany({
    where: {
      countries: {
        some: {
          iso2: { equals: countryCode }
        }
      }
    },
    query: `
      id
      name
      currency {
        code
        noDivisionCurrency
      }
      countries {
        id
        name
        iso2
      }
      paymentProviders {
        id
        code
        isInstalled
      }
      shippingOptions {
        id
        name
        amount
        priceType
      }
    `
  });
  return regions[0] || null;
}
var activeCartRegion_default = activeCartRegion;

// features/keystone/mutations/initiatePaymentSession.ts
async function initiatePaymentSession(root, { cartId, paymentProviderId }, context) {
  await assertCartAccess(context, cartId);
  const sudoContext = context.sudo();
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      rawTotal
      metadata
      shippingAddress { id country { iso2 } }
      billingAddress { id }
      lineItems { productVariant { id collectibleInventoryUnit { id } product { productTags { id } } } }
      region {
        id
        taxRate
        paymentProviders { id }
        currency {
          code
          noDivisionCurrency
        }
      }
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          isSelected
          isInitiated
          amount
          paymentProvider {
            id
            code
          }
          data
        }
      }
    `
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  if (!cart.shippingAddress?.id || !cart.billingAddress?.id || cart.rawTotal <= 0) {
    throw new Error("A positive cart with billing and shipping addresses is required");
  }
  const provider = await sudoContext.query.PaymentProvider.findOne({
    where: { code: paymentProviderId },
    query: `
      id 
      code 
      isInstalled
      createPaymentFunction
      capturePaymentFunction
      refundPaymentFunction
      getPaymentStatusFunction
      generatePaymentLinkFunction
      credentials
    `
  });
  if (!provider || !provider.isInstalled || !isPaymentProviderConfigured(provider.code) || !cart.region.paymentProviders?.some((item) => item.id === provider.id)) {
    throw new Error("Payment provider not found, installed, and configured for this region");
  }
  if (!cart.paymentCollection) {
    cart.paymentCollection = await sudoContext.query.PaymentCollection.createOne({
      data: {
        cart: { connect: { id: cart.id } },
        amount: cart.rawTotal,
        description: "default"
      },
      query: "id"
    });
  }
  const existingSession = cart.paymentCollection?.paymentSessions?.find(
    (session) => session.paymentProvider.code === paymentProviderId
  );
  if (existingSession?.isInitiated && existingSession.amount === cart.rawTotal && existingSession.data && Object.keys(existingSession.data).length) {
    await sudoContext.prisma.$transaction(async (tx) => {
      await tx.paymentSession.updateMany({
        where: { paymentCollectionId: cart.paymentCollection.id },
        data: { isSelected: false }
      });
      await tx.paymentSession.update({
        where: { id: existingSession.id },
        data: { isSelected: true }
      });
    });
    return { ...existingSession, isSelected: true };
  }
  if (existingSession) {
    const sessionData = await createPayment({
      provider,
      cart,
      amount: cart.rawTotal,
      currency: cart.region.currency.code
    });
    await sudoContext.prisma.$transaction(async (tx) => {
      await tx.paymentSession.updateMany({
        where: { paymentCollectionId: cart.paymentCollection.id },
        data: { isSelected: false }
      });
      await tx.paymentSession.update({
        where: { id: existingSession.id },
        data: {
          isSelected: true,
          isInitiated: true,
          amount: cart.rawTotal,
          data: sessionData
        }
      });
      await tx.paymentCollection.update({
        where: { id: cart.paymentCollection.id },
        data: { amount: cart.rawTotal }
      });
    });
    return { ...existingSession, amount: cart.rawTotal, data: sessionData, isInitiated: true };
  }
  try {
    const sessionData = await createPayment({
      provider,
      cart,
      amount: cart.rawTotal,
      currency: cart.region.currency.code
    });
    const newSession = await sudoContext.prisma.$transaction(async (tx) => {
      await tx.paymentSession.updateMany({
        where: { paymentCollectionId: cart.paymentCollection.id },
        data: { isSelected: false }
      });
      await tx.paymentCollection.update({
        where: { id: cart.paymentCollection.id },
        data: { amount: cart.rawTotal }
      });
      return tx.paymentSession.create({
        data: {
          paymentCollectionId: cart.paymentCollection.id,
          paymentProviderId: provider.id,
          amount: cart.rawTotal,
          isSelected: true,
          isInitiated: true,
          data: sessionData
        }
      });
    });
    return newSession;
  } catch (error) {
    console.error("Payment session creation failed:", error);
    throw error;
  }
}
var initiatePaymentSession_default = initiatePaymentSession;

// features/keystone/orders/order-lifecycle.ts
async function reconcileOrderFulfillmentStatus(tx, orderId, { reason, actorId = null, paymentRecovered = false }) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      lineItems: { select: { id: true, quantity: true } },
      fulfillments: {
        where: { canceledAt: null },
        select: {
          fulfillmentItems: { select: { lineItemId: true, quantity: true } }
        }
      }
    }
  });
  if (!order) throw new Error("Order not found");
  const fulfilledByLine = /* @__PURE__ */ new Map();
  for (const fulfillment of order.fulfillments) {
    for (const item of fulfillment.fulfillmentItems) {
      if (!item.lineItemId) continue;
      fulfilledByLine.set(
        item.lineItemId,
        (fulfilledByLine.get(item.lineItemId) || 0) + item.quantity
      );
    }
  }
  const fullyFulfilled = order.lineItems.length > 0 && order.lineItems.every(
    (line) => (fulfilledByLine.get(line.id) || 0) >= line.quantity
  );
  let status = order.status;
  if (!["canceled", "archived"].includes(order.status)) {
    if (fullyFulfilled) {
      status = "completed";
    } else if (order.status === "completed" || paymentRecovered && order.status === "requires_action") {
      status = "pending";
    }
  }
  if (status !== order.status) {
    await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "STATUS_CHANGE",
        data: {
          previousStatus: order.status,
          newStatus: status,
          reason,
          projection: "active_fulfillment_quantities"
        },
        ...actorId ? { userId: actorId, createdById: actorId } : {}
      }
    });
  }
  return { previousStatus: order.status, status, fullyFulfilled };
}

// features/keystone/mutations/handlePaymentProviderWebhook.ts
var NO_DIVISION_CURRENCIES2 = /* @__PURE__ */ new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "PYG",
  "XAF",
  "XOF",
  "BIF",
  "DJF",
  "GNF",
  "KMF",
  "MGA",
  "RWF",
  "XPF",
  "HTG",
  "VUV",
  "XAG",
  "XDR",
  "XAU"
]);
function assertProviderAmount(providerCode, resource, payment) {
  const expectedCurrency = String(payment.currencyCode).toUpperCase();
  if (providerCode.includes("stripe")) {
    const amount = Number(resource.amount_received ?? resource.amount);
    if (amount !== payment.amount || String(resource.currency).toUpperCase() !== expectedCurrency) {
      throw new Error("Provider webhook amount or currency mismatch");
    }
    return;
  }
  if (providerCode.includes("paypal")) {
    const evidence = resource.amount;
    const divisor = NO_DIVISION_CURRENCIES2.has(expectedCurrency) ? 1 : 100;
    if (!evidence || parseMajorToMinor(evidence.value, expectedCurrency) !== payment.amount || String(evidence.currency_code).toUpperCase() !== expectedCurrency) {
      throw new Error("Provider webhook amount or currency mismatch");
    }
  }
}
function normalizedHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value) ? String(value[0] || "") : String(value || "")
    ])
  );
}
async function handlePaymentProviderWebhook(root, { providerId, event, headers }, context) {
  const sudo = context.sudo();
  const provider = await sudo.query.PaymentProvider.findOne({
    where: { id: providerId },
    query: `
      id code isInstalled handleWebhookFunction credentials
    `
  });
  if (!provider?.isInstalled) throw new Error("Payment provider not found");
  const verified = await handleWebhook({
    provider,
    event,
    headers: normalizedHeaders(headers)
  });
  const type = String(verified.type || "");
  const resource = verified.resource || {};
  const providerEventId = verified.event.id;
  if (!providerEventId) throw new Error("Provider event ID is required");
  const dedupeKey = `provider-webhook:${provider.id}:${providerEventId}`;
  const existing = await sudo.prisma.idempotencyKey.findUnique({
    where: { idempotencyKey: dedupeKey }
  });
  if (existing?.recoveryPoint === "completed") {
    return { success: true, message: "Duplicate event acknowledged" };
  }
  let attempt = existing;
  if (attempt) {
    const acquired = await sudo.prisma.idempotencyKey.updateMany({
      where: {
        id: attempt.id,
        OR: [
          { lockedAt: null },
          { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1e3) } }
        ]
      },
      data: { lockedAt: /* @__PURE__ */ new Date() }
    });
    if (acquired.count !== 1) {
      throw new Error("Event is already being processed");
    }
  }
  if (!attempt) {
    try {
      attempt = await sudo.prisma.idempotencyKey.create({
        data: {
          idempotencyKey: dedupeKey,
          requestMethod: "POST",
          requestPath: "payment-provider-webhook",
          requestParams: { providerId: provider.id, providerEventId, type },
          recoveryPoint: "verified",
          lockedAt: /* @__PURE__ */ new Date()
        }
      });
    } catch (error) {
      attempt = await sudo.prisma.idempotencyKey.findUnique({
        where: { idempotencyKey: dedupeKey }
      });
      if (attempt?.recoveryPoint === "completed") {
        return { success: true, message: "Duplicate event acknowledged" };
      }
      if (attempt) {
        throw new Error("Event is already being processed");
      }
      throw error;
    }
  }
  const succeeded = /payment_intent\.succeeded|PAYMENT\.CAPTURE\.COMPLETED/.test(type);
  const failed = /payment_intent\.payment_failed|PAYMENT\.CAPTURE\.DENIED/.test(type);
  const authorized2 = /payment_intent\.amount_capturable_updated|PAYMENT\.AUTHORIZATION\.CREATED/.test(type);
  const voided = /payment_intent\.canceled|PAYMENT\.AUTHORIZATION\.VOIDED/.test(type);
  const cartId = resource.metadata?.cartId || resource.custom_id;
  const explicitPaymentId = resource.metadata?.paymentId;
  let orderId = resource.metadata?.orderId;
  let paymentId = explicitPaymentId;
  let checkoutAttemptId;
  let checkoutPaymentResult;
  if (cartId && (!paymentId || !orderId)) {
    const cart = await sudo.query.Cart.findOne({
      where: { id: cartId },
      query: `
        id rawTotal
        region { currency { code } }
        paymentCollection {
          paymentSessions { id amount data isSelected paymentProvider { id } }
        }
        order {
          id payments { id data paymentCollection { paymentSessions { isSelected paymentProvider { id } } } }
        }
      `
    });
    orderId ||= cart?.order?.id;
    paymentId ||= cart?.order?.payments?.find(
      (payment) => payment.paymentCollection?.paymentSessions?.some(
        (session) => session.isSelected && session.paymentProvider?.id === provider.id
      )
    )?.id;
    if (succeeded && !paymentId) {
      const selectedSession = cart?.paymentCollection?.paymentSessions?.find(
        (session) => session.isSelected && session.paymentProvider?.id === provider.id
      );
      if (selectedSession) {
        assertProviderAmount(provider.code, resource, {
          amount: selectedSession.amount,
          currencyCode: cart.region.currency.code
        });
        const checkoutAttempt = await sudo.prisma.idempotencyKey.findUnique({
          where: { idempotencyKey: `checkout:${cartId}` }
        });
        checkoutAttemptId = checkoutAttempt?.id;
        checkoutPaymentResult = {
          status: "succeeded",
          paymentIntentId: selectedSession.data?.paymentIntentId || selectedSession.data?.orderId || resource.id,
          amount: selectedSession.amount,
          currency: cart.region.currency.code,
          data: resource
        };
      }
    }
  }
  await sudo.prisma.$transaction(async (tx) => {
    if (succeeded && checkoutAttemptId && checkoutPaymentResult) {
      await tx.idempotencyKey.update({
        where: { id: checkoutAttemptId },
        data: {
          recoveryPoint: "payment_confirmed",
          responseBody: { paymentResult: checkoutPaymentResult },
          lockedAt: null
        }
      });
    }
    if (paymentId) {
      if (succeeded) {
        const currentPayment = await tx.payment.findUnique({
          where: { id: paymentId },
          select: { amount: true, currencyCode: true, data: true }
        });
        if (!currentPayment) throw new Error("Payment not found for provider event");
        assertProviderAmount(provider.code, resource, currentPayment);
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "captured",
            capturedAt: /* @__PURE__ */ new Date(),
            data: resource
          }
        });
        const canonicalTransactionId = String(currentPayment.data?.paymentIntentId || resource.id || "");
        const captureKey = providerCaptureKey(provider.id, canonicalTransactionId);
        await tx.capture.upsert({
          where: { providerCaptureKey: captureKey },
          create: {
            amount: currentPayment.amount,
            paymentId,
            providerCaptureKey: captureKey,
            metadata: { providerId: provider.id, providerEventId, resourceId: resource.id },
            createdBy: "provider-webhook"
          },
          update: {}
        });
      } else if (failed) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "failed", data: resource }
        });
      } else if (authorized2) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "authorized", data: resource }
        });
      } else if (voided) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "canceled", canceledAt: /* @__PURE__ */ new Date(), data: resource }
        });
      }
    }
    if (orderId) {
      if (succeeded) {
        await reconcileOrderFulfillmentStatus(tx, orderId, {
          reason: "payment_provider_capture_reconciled",
          paymentRecovered: true
        });
        await tx.orderEvent.create({
          data: {
            orderId,
            type: "PAYMENT_CAPTURED",
            data: { paymentId: paymentId || null, providerId: provider.id, providerEventId }
          }
        });
      } else if (failed || voided) {
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
          select: { status: true }
        });
        if (currentOrder && !["completed", "canceled", "archived"].includes(currentOrder.status)) {
          await tx.order.update({ where: { id: orderId }, data: { status: "requires_action" } });
          if (currentOrder.status !== "requires_action") {
            await tx.orderEvent.create({
              data: {
                orderId,
                type: "STATUS_CHANGE",
                data: {
                  previousStatus: currentOrder.status,
                  newStatus: "requires_action",
                  reason: failed ? "payment_provider_failed" : "payment_provider_voided",
                  providerEventId
                }
              }
            });
          }
        }
      }
    }
    await tx.idempotencyKey.update({
      where: { id: attempt.id },
      data: {
        recoveryPoint: "completed",
        responseCode: 200,
        responseBody: { providerEventId, type, paymentId: paymentId || null, orderId: orderId || null },
        lockedAt: null
      }
    });
  });
  return {
    success: true,
    message: paymentId || orderId ? "Provider event reconciled" : "Provider event recorded for manual reconciliation"
  };
}
var handlePaymentProviderWebhook_default = handlePaymentProviderWebhook;

// features/keystone/lib/customer-order-projection.ts
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function boundedString(value, maxLength) {
  if (value === null) return null;
  if (typeof value !== "string") return void 0;
  return value.slice(0, maxLength);
}
function nonNegativeInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : void 0;
}
function projectCustomerProductData(value) {
  if (!isRecord(value)) return null;
  const projected = {};
  const id3 = boundedString(value.id, 128);
  const title = boundedString(value.title, 500);
  const thumbnail = boundedString(value.thumbnail, 2048);
  if (id3 !== void 0) projected.id = id3;
  if (title !== void 0) projected.title = title;
  if (thumbnail !== void 0) projected.thumbnail = thumbnail;
  return projected;
}
function projectCustomerLineItem(value) {
  if (!isRecord(value)) return null;
  const projected = {};
  for (const key of ["id", "title", "sku", "thumbnail", "variantTitle", "formattedUnitPrice", "formattedTotal"]) {
    const maxLength = key === "thumbnail" ? 2048 : key === "title" ? 500 : 256;
    const field = boundedString(value[key], maxLength);
    if (field !== void 0) projected[key] = field;
  }
  for (const key of ["quantity", "totalQuantity", "fulfilledQuantity"]) {
    const field = nonNegativeInteger(value[key]);
    if (field !== void 0) projected[key] = field;
  }
  if (Object.hasOwn(value, "productData")) {
    projected.productData = projectCustomerProductData(value.productData);
  }
  if (isRecord(value.moneyAmount)) {
    const moneyAmount = {};
    for (const key of ["amount", "originalAmount"]) {
      const field = nonNegativeInteger(value.moneyAmount[key]);
      if (field !== void 0) moneyAmount[key] = field;
    }
    projected.moneyAmount = moneyAmount;
  }
  return projected;
}
function projectShippingLabels(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const label = {};
    for (const key of ["id", "labelUrl", "trackingNumber", "trackingUrl", "url", "carrier"]) {
      const field = boundedString(entry[key], key.toLowerCase().includes("url") ? 2048 : 256);
      if (field !== void 0) label[key] = field;
    }
    return [label];
  });
}
function projectFulfillmentItems(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    return [{
      id: boundedString(entry.id, 128) ?? null,
      quantity: nonNegativeInteger(entry.quantity) ?? null,
      lineItem: projectCustomerLineItem(entry.lineItem)
    }];
  });
}
function projectPaymentData(value) {
  if (!isRecord(value)) return null;
  const projected = {};
  const provider = boundedString(value.provider, 128);
  if (provider !== void 0) projected.provider = provider;
  if (typeof value.cardLast4 === "string" && /^\d{4}$/.test(value.cardLast4)) {
    projected.cardLast4 = value.cardLast4;
  }
  return projected;
}
function projectPayment(value) {
  if (!isRecord(value)) return null;
  const projected = {};
  const id3 = boundedString(value.id, 128);
  const status = boundedString(value.status, 64);
  const createdAt = boundedString(value.createdAt, 64);
  const amount = nonNegativeInteger(value.amount);
  if (id3 !== void 0) projected.id = id3;
  if (status !== void 0) projected.status = status;
  if (createdAt !== void 0) projected.createdAt = createdAt;
  if (amount !== void 0) projected.amount = amount;
  projected.data = projectPaymentData(value.data);
  if (isRecord(value.paymentCollection)) {
    const paymentSessions = Array.isArray(value.paymentCollection.paymentSessions) ? value.paymentCollection.paymentSessions.flatMap((session) => {
      if (!isRecord(session)) return [];
      const sessionId = boundedString(session.id, 128);
      const paymentProvider = isRecord(session.paymentProvider) ? {
        ...boundedString(session.paymentProvider.id, 128) !== void 0 ? { id: boundedString(session.paymentProvider.id, 128) } : {},
        ...boundedString(session.paymentProvider.code, 128) !== void 0 ? { code: boundedString(session.paymentProvider.code, 128) } : {}
      } : null;
      return [{
        ...sessionId !== void 0 ? { id: sessionId } : {},
        isSelected: session.isSelected === true,
        paymentProvider
      }];
    }) : [];
    projected.paymentCollection = { paymentSessions };
  }
  return projected;
}
function projectFulfillmentDetails(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const items = Array.isArray(entry.items) ? entry.items.flatMap((item) => {
      if (!isRecord(item)) return [];
      return [{
        id: boundedString(item.id, 128) ?? null,
        quantity: nonNegativeInteger(item.quantity) ?? null,
        lineItem: projectCustomerLineItem(item.lineItem)
      }];
    }) : [];
    const createdAt = boundedString(entry.createdAt, 64);
    const canceledAt = boundedString(entry.canceledAt, 64);
    return [{
      id: boundedString(entry.id, 128) ?? null,
      ...createdAt !== void 0 ? { createdAt } : {},
      ...canceledAt !== void 0 ? { canceledAt } : {},
      shippingLabels: projectShippingLabels(entry.shippingLabels),
      items
    }];
  });
}
function projectCustomerOrderForRead(order) {
  if (!isRecord(order)) return null;
  const projected = { ...order };
  delete projected.secretKey;
  if (Object.hasOwn(order, "lineItems")) {
    projected.lineItems = Array.isArray(order.lineItems) ? order.lineItems.map(projectCustomerLineItem) : [];
  }
  if (Object.hasOwn(order, "fulfillments")) {
    projected.fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments.flatMap((fulfillment) => {
      if (!isRecord(fulfillment)) return [];
      const createdAt = boundedString(fulfillment.createdAt, 64);
      const canceledAt = boundedString(fulfillment.canceledAt, 64);
      return [{
        id: boundedString(fulfillment.id, 128) ?? null,
        ...createdAt !== void 0 ? { createdAt } : {},
        ...canceledAt !== void 0 ? { canceledAt } : {},
        shippingLabels: projectShippingLabels(fulfillment.shippingLabels),
        fulfillmentItems: projectFulfillmentItems(fulfillment.fulfillmentItems)
      }];
    }) : [];
  }
  if (Object.hasOwn(order, "fulfillmentDetails")) {
    projected.fulfillmentDetails = projectFulfillmentDetails(order.fulfillmentDetails);
  }
  if (Object.hasOwn(order, "payments")) {
    projected.payments = Array.isArray(order.payments) ? order.payments.map(projectPayment) : [];
  }
  if (Object.hasOwn(order, "unfulfilled")) {
    projected.unfulfilled = Array.isArray(order.unfulfilled) ? order.unfulfilled.map(projectCustomerLineItem) : [];
  }
  return projected;
}

// features/keystone/mutations/getCustomerOrder.ts
var CUSTOMER_ORDER_PREFLIGHT_QUERY = `
  id
  secretKey
  user { id }
`;
var CUSTOMER_ORDER_DETAIL_QUERY = `
  id
  secretKey
  displayId
  status
  fulfillmentStatus
  fulfillmentDetails
  paymentDetails
  total
  formattedTotalPaid
  subtotal
  shipping
  discount
  tax
  createdAt
  email
  unfulfilled
  fulfillments {
    id
    createdAt
    canceledAt
    fulfillmentItems {
      id
      quantity
      lineItem {
        id
        quantity
        title
        sku
        thumbnail
        metadata
        variantTitle
        formattedUnitPrice
        formattedTotal
        productData
        variantData
      }
    }
    shippingLabels {
      id
      labelUrl
      trackingNumber
      trackingUrl
      carrier
    }
  }
  user {
    id
    name
    email
  }
  shippingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    postalCode
    country {
      id
      iso2
      name
    }
    phone
  }
  billingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    postalCode
    country {
      id
      iso2
      name
    }
    phone
  }
  shippingMethods {
    id
    price
    shippingOption {
      name
    }
  }
  payments {
    id
    amount
    status
    data
    createdAt
    paymentCollection {
      paymentSessions {
        id
        isSelected
        paymentProvider {
          id
          code
        }
      }
    }
  }
  lineItems {
    id
    title
    quantity
    thumbnail
    variantTitle
    formattedUnitPrice
    formattedTotal
    variantData
    productData
  }
  region {
    id
    name
    currency {
      code
    }
  }
`;
function notFound() {
  throw new Error("Order not found");
}
async function getCustomerOrder(root, { orderId, secretKey }, context) {
  const ownerId = typeof context.session?.itemId === "string" && context.session.itemId ? context.session.itemId : null;
  const hasSecretKey = secretKey !== void 0 && secretKey !== null;
  if (typeof orderId !== "string" || orderId.length === 0 || hasSecretKey && typeof secretKey !== "string") {
    return notFound();
  }
  if (!hasSecretKey && ownerId === null) return notFound();
  const sudoContext = context.sudo();
  const authorizationRecord = await sudoContext.query.Order.findOne({
    where: { id: orderId },
    query: CUSTOMER_ORDER_PREFLIGHT_QUERY
  });
  if (!authorizationRecord) return notFound();
  const authorizedBySecret = hasSecretKey && authorizationRecord.secretKey === secretKey;
  const authorizedByOwner = !hasSecretKey && ownerId !== null && authorizationRecord.user?.id === ownerId;
  if (!authorizedBySecret && !authorizedByOwner) return notFound();
  const order = await sudoContext.query.Order.findOne({
    where: { id: orderId },
    query: CUSTOMER_ORDER_DETAIL_QUERY
  });
  if (!order) return notFound();
  const stillAuthorized = hasSecretKey ? order.secretKey === secretKey : ownerId !== null && order.user?.id === ownerId;
  if (!stillAuthorized) return notFound();
  const { secretKey: _secretKey, ...customerOrder } = order;
  return projectCustomerOrderForRead(customerOrder);
}
var getCustomerOrder_default = getCustomerOrder;

// features/keystone/security/customer-order-pagination.ts
var DEFAULT_CUSTOMER_ORDER_LIMIT = 10;
var MAX_CUSTOMER_ORDER_LIMIT = 50;
var MAX_CUSTOMER_ORDER_OFFSET = 1e5;
var MAX_CUSTOMER_ORDER_LINE_ITEMS = 100;
function requireCustomerOrderPagination(limit, offset) {
  const normalizedLimit = limit === void 0 || limit === null ? DEFAULT_CUSTOMER_ORDER_LIMIT : limit;
  const normalizedOffset = offset === void 0 || offset === null ? 0 : offset;
  if (!Number.isSafeInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > MAX_CUSTOMER_ORDER_LIMIT) {
    throw new Error(`Order limit must be a safe integer from 1 to ${MAX_CUSTOMER_ORDER_LIMIT}`);
  }
  if (!Number.isSafeInteger(normalizedOffset) || normalizedOffset < 0 || normalizedOffset > MAX_CUSTOMER_ORDER_OFFSET) {
    throw new Error(`Order offset must be a safe integer from 0 to ${MAX_CUSTOMER_ORDER_OFFSET}`);
  }
  return { limit: normalizedLimit, offset: normalizedOffset };
}

// features/keystone/mutations/getCustomerOrders.ts
async function getCustomerOrders(root, { limit, offset }, context) {
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }
  const page = requireCustomerOrderPagination(limit, offset);
  const sudoContext = context.sudo();
  const orders = await sudoContext.query.Order.findMany({
    where: {
      user: { id: { equals: context.session.itemId } }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      displayId
      status
      fulfillmentStatus
      total
      formattedTotalPaid
      createdAt
      shippingAddress {
        country {
          id
          iso2
        }
      }
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ORDER_LINE_ITEMS}) {
        id
        title
        quantity
        thumbnail
      }
      region {
        id
        currency {
          code
        }
      }
    `
  });
  return orders.map((order) => {
    const hasBoundedRows = Array.isArray(order.lineItems);
    const hasKnownCount = Number.isSafeInteger(order.lineItemsCount) && order.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && order.lineItemsCount >= order.lineItems.length ? order.lineItemsCount > order.lineItems.length : null;
    return { ...order, lineItemsHasMore };
  });
}
var getCustomerOrders_default = getCustomerOrders;

// features/keystone/queries/getFinanceClose.ts
var import_node_crypto6 = __toESM(require("node:crypto"));
function record2(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function minor(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid recorded minor-unit money");
  return value;
}
function sum(values) {
  const result = values.reduce((total, value) => total + minor(value), 0);
  if (!Number.isSafeInteger(result)) throw new Error("Reporting amount exceeds the safe integer range");
  return result;
}
function groupFinanceRows(rows2) {
  const result = /* @__PURE__ */ new Map();
  for (const row of rows2) {
    const current = result.get(row.currency) ?? { currency: row.currency, exponent: currencyExponent(row.currency), captured: 0, refunded: 0, netTender: 0, count: 0 };
    current.captured = sum([current.captured, row.captured]);
    current.refunded = sum([current.refunded, row.refunded]);
    current.netTender = current.captured - current.refunded;
    current.count += 1;
    result.set(row.currency, current);
  }
  return [...result.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}
async function getFinanceClose(_root, { start, end }, context) {
  if (!context.session?.itemId || !permissions.canReadPayments({ session: context.session })) throw new Error("Access denied");
  const startAt = new Date(start), endAt = new Date(end);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || startAt >= endAt || endAt.getTime() - startAt.getTime() > 31 * 864e5) throw new Error("Finance close range must be valid and no longer than 31 days");
  const payments = await context.sudo().prisma.payment.findMany({
    where: { createdAt: { gte: startAt, lt: endAt } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 5001,
    select: {
      id: true,
      status: true,
      amount: true,
      currencyCode: true,
      capturedAt: true,
      data: true,
      captures: { take: 501, select: { amount: true, providerCaptureKey: true } },
      refunds: { take: 501, select: { amount: true } },
      order: { select: { id: true, displayId: true, metadata: true } }
    }
  });
  if (payments.length > 5e3 || payments.some((payment) => payment.captures.length > 500 || payment.refunds.length > 500)) throw new Error("Finance close exceeds the bounded reporting limit");
  const rows2 = payments.map((payment) => {
    const currency = payment.currencyCode.toUpperCase();
    currencyExponent(currency);
    const captured = sum(payment.captures.map((capture) => capture.amount));
    const refunded = sum(payment.refunds.map((refund) => refund.amount));
    const data = record2(payment.data) ? payment.data : {};
    const reference = data.paymentIntentId ?? data.orderId ?? data.id;
    const providerReference2 = typeof reference === "string" ? reference.slice(0, 500) : null;
    const metadata = record2(payment.order?.metadata) ? payment.order.metadata : {};
    const snapshot2 = record2(metadata.commercialSnapshot) ? metadata.commercialSnapshot : {};
    const exception = payment.status === "captured" && (!providerReference2 || captured !== minor(payment.amount)) || payment.captures.some((capture) => !capture.providerCaptureKey) || refunded > captured ? "TENDER_EVIDENCE_MISMATCH" : null;
    return {
      paymentId: payment.id,
      orderId: payment.order?.id ?? null,
      orderDisplayId: payment.order?.displayId ?? null,
      currency,
      status: payment.status,
      captured,
      refunded,
      netTender: captured - refunded,
      providerReference: providerReference2,
      capturedAt: payment.capturedAt?.toISOString() ?? null,
      accountingPolicyVersion: typeof snapshot2.accountingPolicyVersion === "string" ? snapshot2.accountingPolicyVersion : null,
      exception
    };
  });
  const byCurrency = groupFinanceRows(rows2), range = { start: startAt.toISOString(), end: endAt.toISOString() };
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    range,
    legalEntityId: null,
    reportingCurrency: byCurrency.length === 1 ? byCurrency[0].currency : null,
    accountingPolicyVersion: null,
    providerSettlementStatus: "not_reconciled",
    rows: rows2,
    byCurrency,
    exceptions: rows2.filter((row) => row.exception),
    control: { rowCount: rows2.length, sha256: import_node_crypto6.default.createHash("sha256").update(JSON.stringify({ range, byCurrency, rows: rows2 })).digest("hex") }
  };
}

// features/keystone/mutations/getAnalytics.ts
async function getAnalytics(_root, { timeframe = "7d" }, context) {
  if (!context.session?.itemId || !permissions.canReadOrders({ session: context.session }) || !permissions.canReadProducts({ session: context.session }) || !permissions.canReadPayments({ session: context.session })) throw new Error("Access denied");
  const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : null;
  if (days === null) throw new Error("Invalid timeframe");
  const end = /* @__PURE__ */ new Date(), start = new Date(end.getTime() - days * 864e5), range = { gte: start, lt: end };
  const sudo = context.sudo();
  const [orders, products, totalCustomers, newCustomers] = await Promise.all([
    sudo.prisma.order.findMany({ where: { createdAt: range }, take: 5001, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, status: true, createdAt: true, userId: true } }),
    sudo.prisma.product.findMany({ take: 5001, orderBy: { id: "asc" }, select: { id: true, title: true, status: true, productVariants: { take: 501, select: { inventoryQuantity: true } } } }),
    sudo.prisma.user.count({ where: { orders: { some: {} } } }),
    sudo.prisma.user.count({ where: { createdAt: range, orders: { some: {} } } })
  ]);
  if (orders.length > 5e3 || products.length > 5e3 || products.some((product) => product.productVariants.length > 500)) throw new Error("Analytics exceeds the bounded reporting limit");
  const financeRows = [];
  for (let cursor = start.getTime(); cursor < end.getTime(); ) {
    const next = Math.min(cursor + 31 * 864e5, end.getTime());
    const close = await getFinanceClose(null, { start: new Date(cursor).toISOString(), end: new Date(next).toISOString() }, context);
    financeRows.push(...close.rows);
    cursor = next;
  }
  const byStatus = {}, byDay = {};
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    const date = order.createdAt.toISOString().slice(0, 10);
    byDay[date] = (byDay[date] ?? 0) + 1;
  }
  const stock = products.map((product) => ({ id: product.id, title: product.title, status: product.status, variants: product.productVariants.length, quantity: product.productVariants.reduce((sum2, variant) => sum2 + variant.inventoryQuantity, 0) }));
  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    orders: { total: orders.length, byStatus, timeline: Object.entries(byDay).map(([date, count]) => ({ date, count })) },
    inventory: { total: products.length, products: stock, totalStock: stock.reduce((sum2, product) => sum2 + product.quantity, 0) },
    customers: { total: totalCustomers, new: newCustomers, active: new Set(orders.flatMap((order) => order.userId ? [order.userId] : [])).size },
    payments: { byCurrency: groupFinanceRows(financeRows), exceptions: financeRows.filter((row) => row.exception).map((row) => ({ paymentId: row.paymentId, currency: row.currency, exception: row.exception })), settlementStatus: "not_reconciled" }
  };
}

// features/keystone/mutations/importInventory.ts
async function importInventory(_root, _args, context) {
  if (!permissions.canManageInventory({ session: context.session })) throw new Error("Not authorized");
  throw new Error("Inventory import requires a reviewed file workflow");
}

// features/keystone/mutations/adjustInventory.ts
async function adjustInventory(root, { variantId, delta, reason, note }, context) {
  if (!permissions.canManageProducts({ session: context.session })) {
    throw new Error("Access denied");
  }
  if (!variantId || !Number.isInteger(delta) || delta === 0) {
    throw new Error("A non-zero integer inventory delta is required");
  }
  if (!reason?.trim()) throw new Error("Inventory adjustment reason is required");
  await context.sudo().prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, inventoryQuantity: true, allowBackorder: true }
    });
    if (!variant) throw new Error("Product variant not found");
    const adjusted = await tx.productVariant.updateMany({
      where: {
        id: variantId,
        ...delta < 0 && !variant.allowBackorder ? { inventoryQuantity: { gte: Math.abs(delta) } } : {}
      },
      data: { inventoryQuantity: { increment: delta } }
    });
    if (adjusted.count !== 1) {
      throw new Error("Inventory adjustment would make stock negative");
    }
    await tx.stockMovement.create({
      data: {
        type: delta > 0 ? "RECEIVE" : "REMOVE",
        quantity: Math.abs(delta),
        reason: reason.trim(),
        note: note?.trim() || "",
        variantId
      }
    });
  });
  return context.query.ProductVariant.findOne({
    where: { id: variantId },
    query: "id title sku inventoryQuantity"
  });
}
var adjustInventory_default = adjustInventory;

// features/keystone/utils/shippingProviderAdapter.ts
var import_zod6 = require("zod");
init_contracts();

// features/integrations/shipping/index.ts
var shippingProviderAdapters = {
  shippo: () => Promise.resolve().then(() => (init_shippo(), shippo_exports)),
  shipengine: () => Promise.resolve().then(() => (init_shipengine(), shipengine_exports)),
  manual: () => Promise.resolve().then(() => (init_manual2(), manual_exports2))
};

// features/keystone/utils/shippingProviderAdapter.ts
async function executeAdapterFunction2({
  provider,
  functionName,
  args
}) {
  const adapterKey = provider?.[functionName];
  if (typeof adapterKey === "string" && adapterKey.startsWith("http")) {
    const response = await fetch(adapterKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  if (typeof adapterKey !== "string" || !Object.prototype.hasOwnProperty.call(shippingProviderAdapters, adapterKey)) {
    throw new Error("Shipping provider adapter is not registered");
  }
  const adapter = await shippingProviderAdapters[adapterKey]();
  const fn = adapter[functionName];
  if (typeof fn !== "function") throw new Error("Shipping provider operation is not registered");
  try {
    const operation = fn;
    return await operation({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${adapterKey}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function createLabel({ provider, order, rateId, dimensions, lineItems, idempotencyKey }) {
  return executeAdapterFunction2({
    provider,
    functionName: "createLabelFunction",
    args: { order, rateId, dimensions, lineItems, idempotencyKey }
  });
}
async function getRates({ provider, order, dimensions }) {
  const result = await executeAdapterFunction2({
    provider,
    functionName: "getRatesFunction",
    args: { order, dimensions }
  });
  return import_zod6.z.array(rateSchema).max(1e3).parse(result);
}
async function validateAddress({ provider, address }) {
  return executeAdapterFunction2({
    provider,
    functionName: "validateAddressFunction",
    args: { address }
  });
}
async function trackShipment({ provider, trackingNumber }) {
  return executeAdapterFunction2({
    provider,
    functionName: "trackShipmentFunction",
    args: { trackingNumber }
  });
}
async function cancelLabel({ provider, labelId }) {
  return executeAdapterFunction2({
    provider,
    functionName: "cancelLabelFunction",
    args: { labelId }
  });
}

// features/keystone/mutations/getRatesForOrder.ts
async function getRatesForOrder(root, { orderId, providerId, dimensions }, context) {
  const hasAccess = permissions.canReadOrders({ session: context.session }) || permissions.canManageOrders({ session: context.session });
  if (!hasAccess) {
    throw new Error(
      "Access denied: You do not have permission to get shipping rates"
    );
  }
  const sudoContext = context.sudo();
  try {
    const [order, provider] = await Promise.all([
      sudoContext.query.Order.findOne({
        where: { id: orderId },
        query: `
          id
          shippingAddress {
            firstName
            lastName
            company
            address1
            address2
            city
            province
            postalCode
            country {
              iso2
            }
            phone
          }
          lineItems {
            id
            quantity
            variantData
          }
        `
      }),
      sudoContext.query.ShippingProvider.findOne({
        where: { id: providerId },
        query: `
          id
          name
          accessToken
          getRatesFunction
          isActive
          fromAddress {
            firstName
            lastName
            company
            address1
            address2
            city
            province
            postalCode
            country {
              iso2
            }
            phone
          }
        `
      })
    ]);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    if (!provider) {
      throw new Error(`Shipping provider not found: ${providerId}`);
    }
    if (!provider.isActive) {
      throw new Error(`Shipping provider ${provider.id} is not active`);
    }
    if (!provider.accessToken) {
      throw new Error(`Shipping provider ${provider.id} has no access token configured`);
    }
    let packageDimensions = dimensions;
    if (!packageDimensions) {
      let maxLength = 0;
      let maxWidth = 0;
      let maxHeight = 0;
      let totalWeight = 0;
      let hasDimensions = false;
      let weightUnit = null;
      let dimensionUnit = null;
      order.lineItems.forEach((item) => {
        const variant = item.variantData;
        if (variant?.measurements?.length) {
          hasDimensions = true;
          variant.measurements.forEach((measurement) => {
            const { type, value, unit } = measurement;
            switch (type) {
              case "weight":
                totalWeight += value * item.quantity;
                weightUnit = unit;
                break;
              case "length":
                maxLength = Math.max(maxLength, value);
                dimensionUnit = unit;
                break;
              case "width":
                maxWidth = Math.max(maxWidth, value);
                dimensionUnit = unit;
                break;
              case "height":
                maxHeight = Math.max(maxHeight, value);
                dimensionUnit = unit;
                break;
            }
          });
        }
      });
      if (!hasDimensions) {
        throw new Error("No dimensions found for line items. Dimensions must be provided to get shipping rates.");
      }
      packageDimensions = {
        length: maxLength,
        width: maxWidth,
        height: maxHeight,
        weight: totalWeight,
        unit: dimensionUnit || "cm",
        // Default unit
        weightUnit: weightUnit || "kg"
        // Default weight unit
      };
    }
    const rates = await getRates({
      provider: {
        ...provider,
        id: provider.id,
        accessToken: provider.accessToken
      },
      order,
      dimensions: packageDimensions
    });
    return rates.map((rate) => ({
      id: rate.id,
      provider: provider.name,
      service: rate.service,
      carrier: rate.carrier,
      price: rate.price,
      estimatedDays: rate.estimatedDays
    }));
  } catch (error) {
    console.error("Getting shipping rates failed:", error);
    throw error;
  }
}
var getRatesForOrder_default = getRatesForOrder;

// features/keystone/mutations/validateShippingAddress.ts
async function validateShippingAddress(root, { providerId, address }, context) {
  const hasAccess = permissions.canReadOrders({ session: context.session }) || permissions.canManageOrders({ session: context.session });
  if (!hasAccess) {
    throw new Error(
      "Access denied: You do not have permission to validate shipping addresses"
    );
  }
  const provider = await context.db.ShippingProvider.findOne({
    where: { id: providerId }
  });
  if (!provider) throw new Error("Provider not found");
  if (!provider.isActive) {
    throw new Error(`Shipping provider ${provider.id} is not active`);
  }
  if (!provider.accessToken) {
    throw new Error(`Shipping provider ${provider.id} has no access token configured`);
  }
  return validateAddress({
    provider: {
      ...provider,
      accessToken: provider.accessToken
    },
    address
  });
}
var validateShippingAddress_default = validateShippingAddress;

// features/keystone/mutations/trackShipment.ts
async function trackShipment2(root, { providerId, trackingNumber }, context) {
  const hasAccess = permissions.canReadOrders({ session: context.session }) || permissions.canManageOrders({ session: context.session });
  if (!hasAccess) {
    throw new Error(
      "Access denied: You do not have permission to track shipments"
    );
  }
  const provider = await context.db.ShippingProvider.findOne({
    where: { id: providerId }
  });
  if (!provider) throw new Error("Provider not found");
  if (!provider.isActive) {
    throw new Error(`Shipping provider ${provider.id} is not active`);
  }
  if (!provider.accessToken) {
    throw new Error(`Shipping provider ${provider.id} has no access token configured`);
  }
  return trackShipment({
    provider: {
      ...provider,
      accessToken: provider.accessToken
    },
    trackingNumber
  });
}
var trackShipment_default = trackShipment2;

// features/keystone/mutations/cancelShippingLabel.ts
async function cancelShippingLabel(root, { providerId, labelId }, context) {
  const hasAccess = permissions.canManageFulfillments({ session: context.session });
  if (!hasAccess) {
    throw new Error(
      "Access denied: You do not have permission to cancel shipping labels"
    );
  }
  const sudo = context.sudo();
  const localLabel = await sudo.query.ShippingLabel.findOne({
    where: { id: labelId },
    query: "id data metadata provider { id }"
  });
  if (!localLabel || localLabel.provider?.id !== providerId) {
    throw new Error("Shipping label not found");
  }
  const provider = await sudo.db.ShippingProvider.findOne({
    where: { id: providerId },
    query: `
      id
      accessToken
      metadata
      cancelLabelFunction
      isActive
    `
  });
  if (!provider) throw new Error("Provider not found");
  if (!provider.isActive) {
    throw new Error(`Shipping provider ${provider.id} is not active`);
  }
  if (!provider.accessToken) {
    throw new Error(`Shipping provider ${provider.id} has no access token configured`);
  }
  const labelData = localLabel.data;
  const providerLabelId = labelData?.label_id || labelData?.object_id || labelData?.id;
  if (!providerLabelId) throw new Error("Provider label reference is missing");
  const result = await cancelLabel({
    provider: {
      ...provider,
      accessToken: provider.accessToken
    },
    labelId: providerLabelId
  });
  await sudo.query.ShippingLabel.updateOne({
    where: { id: labelId },
    data: {
      metadata: {
        ...localLabel.metadata || {},
        cancellation: {
          status: result?.success && (!result?.refundStatus || result.refundStatus === "SUCCESS") ? "confirmed" : result?.success ? "pending" : "unknown",
          refundStatus: result?.refundStatus || null,
          canceledById: context.session.itemId,
          recordedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    }
  });
  return result;
}
var cancelShippingLabel_default = cancelShippingLabel;

// features/keystone/mutations/createOrderFulfillment.ts
var import_node_crypto7 = __toESM(require("node:crypto"));
function trackingUrl(carrier, number) {
  const value = encodeURIComponent(number);
  switch (carrier.toLowerCase()) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${value}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${value}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${value}`;
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${value}`;
    default:
      return "";
  }
}
async function createOrderFulfillment(root, {
  orderId,
  lineItems,
  trackingNumber,
  carrier,
  noNotification = false,
  idempotencyKey,
  deferWebhookDelivery = false,
  suppressWebhookEnqueue = false,
  deferLifecycleProjection = false
}, context) {
  if (!permissions.canManageFulfillments({ session: context.session })) {
    throw new Error("Access denied");
  }
  if (!Array.isArray(lineItems) || !lineItems.length) throw new Error("Line items are required");
  const requested = /* @__PURE__ */ new Map();
  for (const item of lineItems) {
    if (!item?.lineItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Fulfillment quantities must be positive integers");
    }
    requested.set(item.lineItemId, (requested.get(item.lineItemId) || 0) + item.quantity);
  }
  if (Boolean(trackingNumber) !== Boolean(carrier)) {
    throw new Error("Carrier and tracking number must be provided together");
  }
  const normalized = [...requested.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (!idempotencyKey?.trim()) throw new Error("Fulfillment idempotency key is required");
  const normalizedIdempotencyKey = idempotencyKey.trim();
  const isIntegrationTrackingRelay = normalizedIdempotencyKey.startsWith("openship-tracking:");
  const businessKey = `fulfillment:${orderId}:${import_node_crypto7.default.createHash("sha256").update(normalizedIdempotencyKey).digest("hex")}`;
  const sudo = context.sudo();
  const orderIdentity = await sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id user { id }"
  });
  if (!orderIdentity) throw new Error("Order not found");
  const fulfillmentWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "fulfillment.created",
    orderIdentity.user?.id
  );
  const fulfillmentResult = await sudo.prisma.$transaction(async (tx) => {
    const existing = await tx.fulfillment.findFirst({
      where: { idempotencyKey: businessKey, canceledAt: null },
      select: { id: true }
    });
    if (existing) return { fulfillmentId: existing.id, webhookEventIds: [] };
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });
    if (!order || !["pending", "completed"].includes(order.status)) {
      throw new Error("Order is not fulfillable");
    }
    const orderLines = await tx.orderLineItem.findMany({
      where: { orderId, id: { in: normalized.map(([id3]) => id3) } },
      select: { id: true, quantity: true, metadata: true }
    });
    if (orderLines.length !== normalized.length) throw new Error("Order line item not found");
    const fulfilled = await tx.fulfillmentItem.groupBy({
      by: ["lineItemId"],
      where: { lineItemId: { in: normalized.map(([id3]) => id3) }, fulfillment: { canceledAt: null } },
      _sum: { quantity: true }
    });
    const fulfilledByLine = new Map(
      fulfilled.map(
        (item) => [item.lineItemId, item._sum.quantity || 0]
      )
    );
    for (const line of orderLines) {
      const quantity = requested.get(line.id);
      if (quantity > line.quantity - (fulfilledByLine.get(line.id) || 0)) {
        throw new Error(`Fulfillment exceeds remaining quantity for line ${line.id}`);
      }
    }
    const orderLinesById = new Map(
      orderLines.map((line) => [line.id, line])
    );
    const webhookLineItems = normalized.map(([lineItemId, quantity]) => {
      const metadata = orderLinesById.get(lineItemId)?.metadata;
      const cartItemId = String(metadata?.openshipCartItemId || "").trim();
      return {
        lineItemId,
        quantity,
        ...cartItemId ? { cartItemId } : {}
      };
    });
    const fulfillmentProvider = await tx.fulfillmentProvider.findUnique({
      where: { code: "fp_manual" },
      select: { id: true }
    });
    if (!fulfillmentProvider) throw new Error("Manual fulfillment provider is not configured");
    const fulfillment = await tx.fulfillment.create({
      data: {
        orderId,
        fulfillmentProviderId: fulfillmentProvider.id,
        idempotencyKey: businessKey,
        noNotification,
        metadata: {
          source: isIntegrationTrackingRelay ? "openship-tracking-relay" : "operator-command",
          createdById: context.session.itemId
        },
        fulfillmentItems: {
          create: normalized.map(([lineItemId, quantity]) => ({
            quantity,
            lineItem: { connect: { id: lineItemId } }
          }))
        },
        ...trackingNumber && carrier ? {
          shippingLabels: {
            create: {
              status: "created",
              carrier,
              trackingNumber,
              trackingUrl: trackingUrl(carrier, trackingNumber),
              order: { connect: { id: orderId } },
              metadata: { source: "operator-command" }
            }
          }
        } : {}
      }
    });
    const webhookEventIds = isIntegrationTrackingRelay || suppressWebhookEnqueue ? [] : await enqueueWebhookOutbox(
      tx,
      fulfillmentWebhookEndpointIds,
      "fulfillment.created",
      "Fulfillment",
      fulfillment.id,
      {
        id: fulfillment.id,
        orderId,
        order: { id: orderId },
        lineItems: webhookLineItems,
        trackingNumber: trackingNumber || null,
        trackingCompany: carrier || null
      }
    );
    if (!noNotification) {
      await tx.notification.create({
        data: {
          eventName: "FULFILLMENT_CREATED",
          resourceType: "Fulfillment",
          resourceId: fulfillment.id,
          to: "notification-operations",
          data: { orderId, fulfillmentId: fulfillment.id, status: "pending_delivery" }
        }
      });
    }
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "FULFILLMENT_STATUS_CHANGE",
        data: {
          fulfillmentId: fulfillment.id,
          action: "created",
          lineItems: normalized,
          trackingNumber: trackingNumber || null,
          carrier: carrier || null
        },
        userId: context.session.itemId,
        createdById: context.session.itemId
      }
    });
    if (!deferLifecycleProjection) {
      await reconcileOrderFulfillmentStatus(tx, orderId, {
        reason: "fulfillment_created",
        actorId: context.session.itemId
      });
    }
    return { fulfillmentId: fulfillment.id, webhookEventIds };
  }, { isolationLevel: "Serializable" });
  if (!deferWebhookDelivery && fulfillmentResult.webhookEventIds.length) {
    try {
      await deliverWebhookEventsById(sudo, fulfillmentResult.webhookEventIds);
    } catch (error) {
      console.error(
        "Immediate fulfillment webhook delivery failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  return sudo.query.Fulfillment.findOne({
    where: { id: fulfillmentResult.fulfillmentId },
    query: "id idempotencyKey fulfillmentItems { id quantity lineItem { id } } shippingLabels { id status trackingNumber trackingUrl carrier }"
  });
}
var createOrderFulfillment_default = createOrderFulfillment;

// features/keystone/mutations/createProviderShippingLabel.ts
async function createProviderShippingLabel(root, { orderId, providerId, rateId, dimensions, lineItems, idempotencyKey }, context) {
  const hasAccess = permissions.canManageFulfillments({ session: context.session });
  if (!hasAccess) {
    throw new Error("Access denied: You do not have permission to create shipping labels");
  }
  const sudo = context.sudo();
  const order = await sudo.query.Order.findOne({
    where: { id: orderId },
    query: `
      id
      user { id }
      lineItems {
        id
        quantity
        metadata
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
      shippingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        province
        postalCode
        country {
          iso2
        }
        phone
      }
    `
  });
  if (!order?.lineItems) {
    throw new Error("Order not found or has no line items");
  }
  if (!lineItems?.length) {
    throw new Error("No items to fulfill");
  }
  const unfulfilledQuantities = {};
  order.lineItems.forEach((item) => {
    unfulfilledQuantities[item.id] = item.quantity;
  });
  order.fulfillments?.forEach((fulfillment2) => {
    if (fulfillment2.canceledAt) {
      return;
    }
    fulfillment2.fulfillmentItems?.forEach((item) => {
      unfulfilledQuantities[item.lineItem.id] -= item.quantity;
    });
  });
  for (const item of lineItems) {
    const availableQuantity = unfulfilledQuantities[item.lineItemId] || 0;
    if (availableQuantity <= 0) {
      throw new Error(`Line item ${item.lineItemId} has no unfulfilled quantity`);
    }
    if (item.quantity > availableQuantity) {
      throw new Error(`Cannot fulfill more than ${availableQuantity} items for line item ${item.lineItemId}`);
    }
  }
  const provider = await sudo.query.ShippingProvider.findOne({
    where: { id: providerId },
    query: `
        id 
        name 
        createLabelFunction
        accessToken
        isActive
        fromAddress {
          firstName
          lastName
          company
          address1
          address2
          city
          province
          postalCode
          country {
            iso2
          }
          phone
        }
      `
  });
  if (!provider) {
    throw new Error(`Shipping provider not found: ${providerId}`);
  }
  if (!provider.isActive) {
    throw new Error(`Shipping provider ${provider.id} is not active`);
  }
  if (!provider.accessToken) {
    throw new Error(`Shipping provider ${provider.id} has no access token configured`);
  }
  const fulfillmentWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "fulfillment.created",
    order.user?.id
  );
  const fulfillment = await createOrderFulfillment_default(
    null,
    {
      orderId,
      lineItems,
      noNotification: true,
      idempotencyKey,
      deferWebhookDelivery: true,
      suppressWebhookEnqueue: true,
      deferLifecycleProjection: true
    },
    context
  );
  const existingLabel = fulfillment.shippingLabels?.[0];
  if (existingLabel) return existingLabel;
  let labelData;
  try {
    labelData = await createLabel({
      provider,
      order,
      rateId,
      dimensions,
      lineItems,
      idempotencyKey
    });
  } catch (error) {
    await sudo.prisma.fulfillment.update({
      where: { id: fulfillment.id },
      data: {
        metadata: {
          source: "provider-command",
          labelStatus: "unknown",
          providerId,
          rateId,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    });
    throw new Error(
      `Label outcome is unknown; fulfillment ${fulfillment.id} remains reserved for reconciliation`
    );
  }
  const finalized = await sudo.prisma.$transaction(async (tx) => {
    const label = await tx.shippingLabel.create({
      data: {
        status: "purchased",
        providerId,
        fulfillmentId: fulfillment.id,
        orderId,
        labelUrl: labelData.labelUrl,
        carrier: labelData.carrier,
        service: labelData.service,
        trackingNumber: labelData.trackingNumber,
        trackingUrl: labelData.trackingUrl,
        rate: labelData.rate,
        data: labelData.data,
        metadata: { rateId, source: "provider-command" }
      }
    });
    await tx.fulfillment.update({
      where: { id: fulfillment.id },
      data: {
        metadata: {
          source: "provider-command",
          labelStatus: "purchased",
          providerId,
          rateId
        }
      }
    });
    await reconcileOrderFulfillmentStatus(tx, orderId, {
      reason: "provider_shipping_label_purchased",
      actorId: context.session.itemId
    });
    const webhookEventIds = await enqueueWebhookOutbox(
      tx,
      fulfillmentWebhookEndpointIds,
      "fulfillment.created",
      "Fulfillment",
      fulfillment.id,
      {
        id: fulfillment.id,
        orderId,
        order: { id: orderId },
        lineItems: lineItems.map((item) => {
          const sourceLine = order.lineItems.find((line) => line.id === item.lineItemId);
          const cartItemId = String(sourceLine?.metadata?.openshipCartItemId || "").trim();
          return {
            lineItemId: item.lineItemId,
            quantity: item.quantity,
            ...cartItemId ? { cartItemId } : {}
          };
        }),
        trackingNumber: labelData.trackingNumber || null,
        trackingCompany: labelData.carrier || null
      }
    );
    return { label, webhookEventIds };
  });
  if (finalized.webhookEventIds.length) {
    await deliverWebhookEventsById(sudo, finalized.webhookEventIds);
  }
  return finalized.label;
}
var createProviderShippingLabel_default = createProviderShippingLabel;

// features/keystone/mutations/cancelOrderFulfillment.ts
async function cancelOrderFulfillment(root, { fulfillmentId, reason }, context) {
  if (!permissions.canManageFulfillments({ session: context.session })) {
    throw new Error("Access denied");
  }
  if (!reason?.trim()) throw new Error("Cancellation reason is required");
  const sudo = context.sudo();
  const endpointIds = await subscribedWebhookEndpointIds(sudo, "fulfillment.canceled");
  const result = await sudo.prisma.$transaction(async (tx) => {
    const current = await tx.fulfillment.findUnique({
      where: { id: fulfillmentId },
      select: {
        id: true,
        orderId: true,
        canceledAt: true,
        metadata: true,
        shippingLabels: { select: { id: true, metadata: true, providerId: true } }
      }
    });
    if (!current) throw new Error("Fulfillment not found");
    if (current.canceledAt) return current;
    if (current.shippingLabels.some(
      (label) => label.providerId && label.metadata?.cancellation?.status !== "confirmed"
    )) {
      throw new Error("Cancel the purchased shipping label before canceling fulfillment");
    }
    const canceled = await tx.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        canceledAt: /* @__PURE__ */ new Date(),
        metadata: {
          ...current.metadata || {},
          cancellationReason: reason.trim(),
          canceledById: context.session.itemId
        }
      }
    });
    await enqueueWebhookOutbox(
      tx,
      endpointIds,
      "fulfillment.canceled",
      "Fulfillment",
      fulfillmentId,
      { id: fulfillmentId, orderId: current.orderId, reason: reason.trim() }
    );
    await tx.orderEvent.create({
      data: {
        orderId: current.orderId,
        type: "FULFILLMENT_STATUS_CHANGE",
        data: { fulfillmentId, action: "canceled", reason: reason.trim() },
        userId: context.session.itemId,
        createdById: context.session.itemId
      }
    });
    await reconcileOrderFulfillmentStatus(tx, current.orderId, {
      reason: "fulfillment_canceled",
      actorId: context.session.itemId
    });
    return canceled;
  });
  return { id: result.id, canceledAt: result.canceledAt };
}
var cancelOrderFulfillment_default = cancelOrderFulfillment;

// features/keystone/mutations/transitionOrderStatus.ts
async function transitionOrderStatus(root, { orderId, status, reason }, context) {
  if (!permissions.canManageOrders({ session: context.session })) throw new Error("Access denied");
  if (!reason?.trim()) throw new Error("Transition reason is required");
  if (!["canceled", "archived"].includes(status)) {
    throw new Error("Order status is controlled by payment and fulfillment commands");
  }
  const sudo = context.sudo();
  const endpointIds = await subscribedWebhookEndpointIds(sudo, `order.${status}`);
  await sudo.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          select: { amount: true, amountRefunded: true, refunds: { select: { amount: true } } }
        },
        fulfillments: { where: { canceledAt: null }, select: { id: true } },
        accountLineItems: {
          select: {
            id: true,
            accountId: true,
            amount: true,
            paymentStatus: true,
            invoiceLineItems: { select: { id: true } }
          }
        },
        discounts: { select: { id: true } },
        lineItems: {
          select: {
            quantity: true,
            productVariant: {
              select: { id: true, manageInventory: true }
            }
          }
        }
      }
    });
    if (!order) throw new Error("Order not found");
    if (order.status === status) return;
    if (status === "archived") {
      if (order.status !== "completed") throw new Error("Only completed orders can be archived");
    } else {
      if (!["pending", "completed", "requires_action"].includes(order.status)) {
        throw new Error("Order cannot be canceled from its current state");
      }
      if (order.fulfillments.length) throw new Error("Cancel active fulfillments before canceling the order");
      if (order.payments.some(
        (payment) => payment.refunds.reduce((sum2, refund) => sum2 + refund.amount, 0) < payment.amount
      )) {
        throw new Error("Captured payments must be fully refunded before cancellation");
      }
      for (const line of order.lineItems) {
        if (!line.productVariant?.manageInventory) continue;
        await tx.productVariant.update({
          where: { id: line.productVariant.id },
          data: { inventoryQuantity: { increment: line.quantity } }
        });
        await tx.stockMovement.create({
          data: {
            type: "RECEIVE",
            quantity: line.quantity,
            reason: "order_cancellation",
            note: `order:${orderId}`,
            variantId: line.productVariant.id
          }
        });
      }
      if (order.accountLineItems.some(
        (item) => item.paymentStatus !== "unpaid" || item.invoiceLineItems.length
      )) {
        throw new Error("Invoiced account orders require an approved credit-note workflow");
      }
      for (const item of order.accountLineItems) {
        await tx.accountLineItem.update({
          where: { id: item.id },
          data: { paymentStatus: "canceled" }
        });
        if (item.accountId) {
          const adjustedAccount = await tx.account.updateMany({
            where: { id: item.accountId, totalAmount: { gte: item.amount } },
            data: { totalAmount: { decrement: item.amount } }
          });
          if (adjustedAccount.count !== 1) {
            throw new Error("Account balance is inconsistent; cancellation stopped");
          }
        }
      }
      for (const discount of order.discounts) {
        await tx.discount.updateMany({
          where: { id: discount.id, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } }
        });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...status === "canceled" ? { canceledAt: /* @__PURE__ */ new Date() } : {}
      }
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        type: "STATUS_CHANGE",
        data: { previousStatus: order.status, newStatus: status, reason: reason.trim() },
        userId: context.session.itemId,
        createdById: context.session.itemId
      }
    });
    await enqueueWebhookOutbox(
      tx,
      endpointIds,
      `order.${status}`,
      "Order",
      orderId,
      { id: orderId, previousStatus: order.status, status, reason: reason.trim() }
    );
  }, { isolationLevel: "Serializable" });
  return sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id status canceledAt displayId"
  });
}
var transitionOrderStatus_default = transitionOrderStatus;

// features/keystone/mutations/regenerateCustomerToken.ts
async function regenerateCustomerToken(root, args, context) {
  const userId = requireHumanOwnerId(context.session);
  if (!userId) {
    throw new Error("Authentication required");
  }
  const sudoContext = context.sudo();
  try {
    const accounts = await sudoContext.query.Account.findMany({
      where: {
        user: { id: { equals: userId } },
        status: { equals: "active" },
        accountType: { equals: "business" }
      },
      query: "id"
    });
    const activeAccount = accounts[0];
    if (!activeAccount) {
      throw new Error("No active account found. Customer token can only be regenerated for users with active accounts.");
    }
    const newToken = generateOpaqueToken("ctok_");
    await sudoContext.query.User.updateOne({
      where: { id: userId },
      data: {
        customerToken: customerTokenDigest(newToken),
        tokenGeneratedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    return {
      success: true,
      token: newToken
    };
  } catch (error) {
    console.error("Error regenerating customer token:", error);
    throw error;
  }
}
var regenerateCustomerToken_default = regenerateCustomerToken;

// features/keystone/security/customer-account-pagination.ts
var DEFAULT_CUSTOMER_ACCOUNT_LIMIT = 10;
var MAX_CUSTOMER_ACCOUNT_LIMIT = 50;
var MAX_CUSTOMER_ACCOUNT_OFFSET = 1e5;
var MAX_CUSTOMER_ACCOUNT_LINE_ITEMS = 100;
function getCustomerAccountPagination(limit, offset) {
  const normalizedLimit = limit === void 0 || limit === null ? DEFAULT_CUSTOMER_ACCOUNT_LIMIT : limit;
  const normalizedOffset = offset === void 0 || offset === null ? 0 : offset;
  if (!Number.isSafeInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > MAX_CUSTOMER_ACCOUNT_LIMIT) {
    throw new Error(`Customer account limit must be a safe integer from 1 to ${MAX_CUSTOMER_ACCOUNT_LIMIT}`);
  }
  if (!Number.isSafeInteger(normalizedOffset) || normalizedOffset < 0 || normalizedOffset > MAX_CUSTOMER_ACCOUNT_OFFSET) {
    throw new Error(`Customer account offset must be a safe integer from 0 to ${MAX_CUSTOMER_ACCOUNT_OFFSET}`);
  }
  return { limit: normalizedLimit, offset: normalizedOffset };
}

// features/keystone/mutations/getCustomerAccount.ts
var MAX_CUSTOMER_ACCOUNT_ORDERS = 50;
var MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS = 100;
var CUSTOMER_ACCOUNT_PREFLIGHT_QUERY = `
  id
  user { id }
`;
var CUSTOMER_ACCOUNT_DETAIL_QUERY = `
  id
  accountNumber
  title
  description
  status
  totalAmount
  paidAmount
  creditLimit
  formattedTotal
  formattedBalance
  formattedCreditLimit
  availableCredit
  formattedAvailableCredit
  balanceDue
  dueDate
  paidAt
  createdAt
  accountType
  currency {
    id
    code
    symbol
  }
  user {
    id
    email
    name
  }
  ordersCount
  orders(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDERS}) {
    id
    displayId
    status
    total
    createdAt
    lineItemsCount
    lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS}) {
      id
      title
      quantity
      thumbnail
    }
  }
  lineItemsCount
  lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_LINE_ITEMS}) {
    id
    description
    amount
    formattedAmount
    orderDisplayId
    itemCount
    paymentStatus
    createdAt
    order {
      id
      displayId
      status
      email
      createdAt
      total
      subtotal
      shipping
      tax
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_ORDER_LINE_ITEMS}) {
        id
        title
        quantity
        sku
        variantTitle
        formattedUnitPrice
        formattedTotal
        thumbnail
      }
    }
  }
`;
function hasMoreRows(count, rows2) {
  if (!Array.isArray(rows2) || !Number.isSafeInteger(count) || count < rows2.length) {
    return null;
  }
  return count > rows2.length;
}
function projectOrderLineItems(order) {
  if (!order || typeof order !== "object") return order;
  return {
    ...order,
    lineItemsHasMore: hasMoreRows(order.lineItemsCount, order.lineItems)
  };
}
async function getCustomerAccount(root, { accountId }, context) {
  const ownerId = typeof context.session?.itemId === "string" && context.session.itemId ? context.session.itemId : null;
  if (!ownerId) throw new Error("Not authenticated");
  if (typeof accountId !== "string" || accountId.length === 0) {
    throw new Error("Account not found");
  }
  const sudoContext = context.sudo();
  const authorizationRecord = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: CUSTOMER_ACCOUNT_PREFLIGHT_QUERY
  });
  if (authorizationRecord?.user?.id !== ownerId) {
    throw new Error("Account not found");
  }
  const account = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: CUSTOMER_ACCOUNT_DETAIL_QUERY
  });
  if (account?.user?.id !== ownerId) {
    throw new Error("Account not found");
  }
  const orders = Array.isArray(account.orders) ? account.orders : [];
  const lineItems = Array.isArray(account.lineItems) ? account.lineItems : [];
  return {
    ...account,
    orders: orders.map(projectOrderLineItems),
    ordersHasMore: hasMoreRows(account.ordersCount, account.orders),
    lineItems: lineItems.map((lineItem) => {
      const { order, ...accountLineItem } = lineItem;
      return {
        ...accountLineItem,
        orderDetails: projectOrderLineItems(order)
      };
    }),
    lineItemsHasMore: hasMoreRows(account.lineItemsCount, account.lineItems)
  };
}
var getCustomerAccount_default = getCustomerAccount;

// features/keystone/mutations/getCustomerAccounts.ts
async function getCustomerAccounts(root, { limit, offset }, context) {
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }
  const page = getCustomerAccountPagination(limit, offset);
  const sudoContext = context.sudo();
  const accounts = await sudoContext.query.Account.findMany({
    where: {
      user: { id: { equals: context.session.itemId } }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      accountNumber
      title
      status
      totalAmount
      paidAmount
      creditLimit
      formattedTotal
      formattedCreditLimit
      availableCredit
      totalOwedInAccountCurrency
      formattedTotalOwedInAccountCurrency
      availableCreditInAccountCurrency
      formattedAvailableCreditInAccountCurrency
      balanceDue
      dueDate
      createdAt
      accountType
      currency {
        id
        code
        symbol
      }
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_ACCOUNT_LINE_ITEMS}) {
        id
        description
        amount
        formattedAmount
        orderDisplayId
        itemCount
        paymentStatus
        createdAt
        order {
          id
        }
      }
    `
  });
  return accounts.map((account) => {
    const hasBoundedRows = Array.isArray(account.lineItems);
    const hasKnownCount = Number.isSafeInteger(account.lineItemsCount) && account.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && account.lineItemsCount >= account.lineItems.length ? account.lineItemsCount > account.lineItems.length : null;
    return { ...account, lineItemsHasMore };
  });
}
var getCustomerAccounts_default = getCustomerAccounts;

// features/keystone/mutations/createInvoiceFromLineItems.ts
var import_node_crypto8 = __toESM(require("node:crypto"));
async function createInvoiceFromLineItems(root, { accountId, regionId, lineItemIds, dueDate }, context) {
  if (!lineItemIds?.length || new Set(lineItemIds).size !== lineItemIds.length) {
    throw new Error("Unique line item IDs are required");
  }
  if (dueDate && !Number.isFinite(new Date(dueDate).getTime())) {
    throw new Error("Due date is invalid");
  }
  const sudoContext = context.sudo();
  if (!context.session?.itemId) {
    throw new Error("Authentication required");
  }
  const account = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: `
      id
      user {
        id
        email
      }
      currency {
        id
        code
        symbol
        noDivisionCurrency
      }
      totalAmount
      paidAmount
    `
  });
  if (!account) {
    throw new Error("Account not found");
  }
  const canManagePayments = permissions.canManagePayments({ session: context.session });
  if (!canManagePayments && account.user?.id !== context.session.itemId) {
    throw new Error("Account not found");
  }
  const region2 = await sudoContext.query.Region.findOne({
    where: { id: regionId },
    query: `
      id
      name
      currency {
        id
        code
        symbol
        noDivisionCurrency
      }
    `
  });
  if (!region2) {
    throw new Error("Region not found");
  }
  if (region2.currency.code !== account.currency.code) {
    throw new Error("Cross-currency invoicing is outside the supported launch boundary");
  }
  const lineItems = await sudoContext.query.AccountLineItem.findMany({
    where: {
      id: { in: lineItemIds },
      account: { id: { equals: accountId } },
      region: { id: { equals: regionId } },
      paymentStatus: { equals: "unpaid" }
    },
    query: `
      id
      amount
      description
      orderDisplayId
      itemCount
      paymentStatus
      createdAt
      region {
        id
        currency {
          code
        }
      }
    `
  });
  if (!lineItems.length) {
    throw new Error("No valid unpaid line items found");
  }
  if (lineItems.length !== lineItemIds.length) {
    throw new Error(`Some line items were not found, are already paid, or are not from ${region2.name} region`);
  }
  const totalAmount = lineItems.reduce(
    (sum2, item) => sum2 + (item.amount || 0),
    0
  );
  if (totalAmount <= 0) {
    throw new Error("Invoice total must be greater than zero");
  }
  try {
    const result = await sudoContext.prisma.$transaction(async (tx) => {
      const currentItems = await tx.accountLineItem.findMany({
        where: {
          id: { in: lineItemIds },
          accountId,
          regionId,
          paymentStatus: "unpaid"
        },
        select: { id: true, amount: true }
      });
      if (currentItems.length !== lineItemIds.length) {
        throw new Error("Invoice line items changed; reload and retry");
      }
      const existingInvoiceLines = await tx.invoiceLineItem.findMany({
        where: { accountLineItemId: { in: lineItemIds } },
        select: { id: true, invoiceId: true, accountLineItemId: true }
      });
      if (existingInvoiceLines.length) {
        const invoiceIds = new Set(existingInvoiceLines.map((item) => item.invoiceId));
        const linkedItemIds = new Set(existingInvoiceLines.map((item) => item.accountLineItemId));
        if (existingInvoiceLines.length === lineItemIds.length && invoiceIds.size === 1 && lineItemIds.every((id3) => linkedItemIds.has(id3))) {
          const existingInvoice = await tx.invoice.findUnique({
            where: { id: [...invoiceIds][0] },
            include: { lineItems: true }
          });
          if (existingInvoice?.accountId === accountId && existingInvoice.totalAmount === totalAmount && existingInvoice.status === "sent") {
            return { invoice: existingInvoice, reused: true };
          }
        }
        throw new Error("One or more line items are already invoiced");
      }
      const transactionTotal = currentItems.reduce(
        (sum2, item) => sum2 + item.amount,
        0
      );
      if (transactionTotal !== totalAmount) throw new Error("Invoice amount changed; reload and retry");
      const invoice = await tx.invoice.create({
        data: {
          userId: account.user.id,
          accountId,
          invoiceNumber: `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${import_node_crypto8.default.randomBytes(4).toString("hex").toUpperCase()}`,
          currencyId: region2.currency.id,
          totalAmount,
          title: `${region2.name} Invoice for Account ${account.id}`,
          description: `Payment invoice for ${lineItems.length} ${region2.name} orders (${lineItems.map((item) => `#${item.orderDisplayId}`).join(", ")})`,
          status: "sent",
          paidAt: null,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
          metadata: {
            regionId,
            regionName: region2.name,
            createdFromLineItems: lineItemIds,
            orderDisplayIds: lineItems.map((item) => item.orderDisplayId),
            itemCount: lineItems.reduce(
              (sum2, item) => sum2 + (item.itemCount || 0),
              0
            )
          }
        }
      });
      const invoiceLineItems = [];
      for (const lineItem of lineItems) {
        invoiceLineItems.push(await tx.invoiceLineItem.create({
          data: { invoiceId: invoice.id, accountLineItemId: lineItem.id }
        }));
      }
      return { invoice: { ...invoice, lineItems: invoiceLineItems } };
    }, { isolationLevel: "Serializable" });
    return {
      success: true,
      invoiceId: result.invoice.id,
      message: `Invoice created with ${lineItems.length} orders`
    };
  } catch (error) {
    throw new Error(
      `Failed to create invoice: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
var createInvoiceFromLineItems_default = createInvoiceFromLineItems;

// features/keystone/security/invoice-access.ts
async function assertInvoiceAccess(context, invoiceId) {
  if (!context.session?.itemId) throw new Error("Invoice not found");
  const invoice = await context.sudo().query.Invoice.findOne({
    where: { id: invoiceId },
    query: "id status account { user { id } } user { id }"
  });
  if (!invoice) throw new Error("Invoice not found");
  const canManage5 = permissions.canManagePayments({ session: context.session }) || permissions.canManageOrders({ session: context.session });
  const ownerId = invoice.account?.user?.id || invoice.user?.id;
  if (!canManage5 && ownerId !== context.session.itemId) {
    throw new Error("Invoice not found");
  }
  return invoice;
}

// features/keystone/mutations/getInvoicePaymentSessions.ts
async function getInvoicePaymentSessions(_root, { invoiceId }, context) {
  await assertInvoiceAccess(context, invoiceId);
  const sessions = await context.sudo().db.PaymentSession.findMany({
    where: { paymentCollection: { invoice: { id: { equals: invoiceId } } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 101
  });
  if (sessions.length > 100) throw new Error("Payment-session limit exceeded");
  return sessions;
}

// features/keystone/mutations/getUnpaidLineItemsByRegion.ts
async function getUnpaidLineItemsByRegion(root, { accountId }, context) {
  const ownerId = requireHumanOwnerId(context.session);
  const sudoContext = context.sudo();
  if (!context.session?.itemId) {
    throw new Error("Authentication required");
  }
  const account = await sudoContext.query.Account.findOne({
    where: { id: accountId },
    query: `
      id
      user {
        id
        email
      }
    `
  });
  if (!account) {
    throw new Error("Account not found");
  }
  if (account.user.id !== ownerId) {
    throw new Error("Unauthorized access to account");
  }
  try {
    const unpaidLineItems = await sudoContext.query.AccountLineItem.findMany({
      where: {
        account: { id: { equals: accountId } },
        paymentStatus: { equals: "unpaid" }
      },
      query: `
        id
        amount
        description
        orderDisplayId
        itemCount
        createdAt
        order {
          id
          currency { code }
        }
        region {
          id
          name
          currency {
            id
            code
            symbol
            noDivisionCurrency
          }
        }
      `,
      take: 1001,
      orderBy: { createdAt: "desc" }
    });
    if (unpaidLineItems.length > 1e3) throw new Error("Outstanding balance exceeds the supported page");
    for (const item of unpaidLineItems) {
      if (!Number.isSafeInteger(item.amount) || item.amount < 0 || !item.order?.currency?.code || item.order.currency.code.toUpperCase() !== item.region?.currency?.code?.toUpperCase()) throw new Error("Recorded charge currency is unavailable or inconsistent");
    }
    const lineItemsByRegion = unpaidLineItems.reduce((acc, item) => {
      const regionId = item.region.id;
      const regionName = item.region.name;
      const currency = item.region.currency;
      if (!acc[regionId]) {
        acc[regionId] = {
          region: {
            id: regionId,
            name: regionName,
            currency
          },
          lineItems: [],
          totalAmount: 0,
          itemCount: 0
        };
      }
      acc[regionId].lineItems.push({
        id: item.id,
        amount: item.amount,
        description: item.description,
        orderDisplayId: item.orderDisplayId,
        itemCount: item.itemCount,
        createdAt: item.createdAt,
        formattedAmount: formatCurrencyAmount(item.amount, currency.code),
        order: item.order
      });
      acc[regionId].totalAmount += item.amount;
      if (!Number.isSafeInteger(acc[regionId].totalAmount)) throw new Error("Outstanding balance exceeds the integer range");
      acc[regionId].itemCount += 1;
      return acc;
    }, {});
    const regionsWithLineItems = Object.values(lineItemsByRegion).map((regionData) => ({
      ...regionData,
      formattedTotalAmount: formatCurrencyAmount(
        regionData.totalAmount,
        regionData.region.currency.code
      )
    }));
    regionsWithLineItems.sort((a, b) => b.totalAmount - a.totalAmount);
    return {
      success: true,
      regions: regionsWithLineItems,
      totalRegions: regionsWithLineItems.length,
      totalUnpaidItems: unpaidLineItems.length,
      message: `Found ${unpaidLineItems.length} unpaid orders across ${regionsWithLineItems.length} regions`
    };
  } catch (error) {
    throw new Error(`Failed to get unpaid line items: ${error instanceof Error ? error.message : "Outstanding items unavailable"}`);
  }
}
function formatCurrencyAmount(amount, currencyCode) {
  const currency = currencyCode.toUpperCase();
  const exponent = currencyExponent(currency);
  if (exponent !== 0 && exponent !== 2) throw new Error("Unsupported recorded currency precision");
  const divisor = 10 ** exponent;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount / divisor);
}
var getUnpaidLineItemsByRegion_default = getUnpaidLineItemsByRegion;

// features/keystone/mutations/createInvoicePaymentSessions.ts
async function createInvoicePaymentSessions(root, { invoiceId }, context) {
  await assertInvoiceAccess(context, invoiceId);
  const sudoContext = context.sudo();
  const invoice = await sudoContext.query.Invoice.findOne({
    where: { id: invoiceId },
    query: `
      id
      totalAmount
      currency {
        id
        code
      }
      account {
        id
        user {
          id
        }
      }
      paymentCollection {
        id
        paymentSessions {
          id
          paymentProvider {
            id
          }
        }
      }
    `
  });
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  const invoiceLineItems = await sudoContext.query.InvoiceLineItem.findMany({
    where: { invoice: { id: { equals: invoiceId } } },
    query: `
      accountLineItem {
        region {
          id
          paymentProviders {
            id
            code
            isInstalled
          }
        }
      }
    `
  });
  const invoiceLineItem = invoiceLineItems[0];
  const availableProviders = invoiceLineItem?.accountLineItem?.region?.paymentProviders?.filter(
    (provider) => provider.isInstalled && isPaymentProviderConfigured(provider.code || "")
  ) || [];
  if (availableProviders.length === 0) {
    throw new Error("No payment providers are available for this region");
  }
  let paymentCollection = invoice.paymentCollection;
  if (!paymentCollection) {
    paymentCollection = await sudoContext.db.PaymentCollection.createOne({
      data: {
        description: "default",
        amount: invoice.totalAmount || 0
      }
    });
    await sudoContext.db.Invoice.updateOne({
      where: { id: invoiceId },
      data: { paymentCollection: { connect: { id: paymentCollection.id } } }
    });
  }
  for (let i = 0; i < availableProviders.length; i++) {
    const provider = availableProviders[i];
    const existingSession = invoice.paymentCollection?.paymentSessions?.find(
      (s) => s.paymentProvider.id === provider.id
    );
    if (!existingSession) {
      const newSession = await sudoContext.db.PaymentSession.createOne({
        data: {
          paymentCollection: { connect: { id: paymentCollection.id } },
          paymentProvider: { connect: { id: provider.id } },
          amount: invoice.totalAmount || 0,
          data: {},
          // Initialize with empty data object
          isSelected: i === 0,
          // Only select the first provider by default
          isInitiated: false
        }
      });
    }
  }
  return sudoContext.db.Invoice.findOne({ where: { id: invoiceId } });
}
var createInvoicePaymentSessions_default = createInvoicePaymentSessions;

// features/keystone/payments/invoice-payment-recovery.ts
var STALE_LOCK_MS = 5 * 60 * 1e3;
function invoicePaymentKey(paymentSessionId) {
  return `invoice-payment:${paymentSessionId}`;
}
async function getOrCreateInvoicePaymentAttempt(prisma, invoiceId, paymentSessionId) {
  const { attempt, replay } = await getOrCreateIdempotencyAttempt(prisma, {
    key: invoicePaymentKey(paymentSessionId),
    requestPath: "completeInvoicePayment",
    requestParams: { invoiceId, paymentSessionId }
  });
  if (!replay || attempt.recoveryPoint === "completed") return attempt;
  const acquired = await prisma.idempotencyKey.updateMany({
    where: {
      id: attempt.id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: new Date(Date.now() - STALE_LOCK_MS) } }
      ]
    },
    data: { lockedAt: /* @__PURE__ */ new Date() }
  });
  if (acquired.count !== 1) {
    throw new Error("Invoice payment is already in progress");
  }
  return prisma.idempotencyKey.findUnique({ where: { id: attempt.id } });
}
async function claimInvoicePaymentCommit(tx, invoiceId, paidAt) {
  const claimed = await tx.invoice.updateMany({
    where: {
      id: invoiceId,
      status: { in: ["sent", "overdue"] }
    },
    data: { status: "paid", paidAt }
  });
  return claimed.count === 1;
}

// features/keystone/mutations/completeInvoicePayment.ts
var SUCCESS = /* @__PURE__ */ new Set(["succeeded", "captured", "completed", "paid"]);
var AUTHORIZED = /* @__PURE__ */ new Set(["authorized", "requires_capture", "approved"]);
function providerReference(data) {
  return data?.paymentIntentId || data?.payment_intent_id || data?.orderId || data?.id;
}
async function completeInvoicePayment(root, { paymentSessionId }, context) {
  const sudo = context.sudo();
  const session = await sudo.query.PaymentSession.findOne({
    where: { id: paymentSessionId },
    query: `
      id amount data
      paymentProvider { id code capturePaymentFunction getPaymentStatusFunction credentials }
      paymentCollection {
        id payments { id }
        invoice {
          id invoiceNumber totalAmount status
          currency { code }
          account { id paidAmount currency { code } user { id } }
          lineItems { accountLineItem { id paymentStatus } }
        }
      }
    `
  });
  const invoice = session?.paymentCollection?.invoice;
  if (!invoice) throw new Error("Invoice not found");
  await assertInvoiceAccess(context, invoice.id);
  if (invoice.status === "paid") {
    return { id: invoice.id, status: "succeeded", success: true, message: "Invoice is already paid" };
  }
  if (!["sent", "overdue"].includes(invoice.status)) {
    throw new Error("Invoice is not payable");
  }
  if (session.amount !== invoice.totalAmount) throw new Error("Invoice payment amount mismatch");
  if (invoice.currency.code !== invoice.account.currency.code) {
    throw new Error("Cross-currency invoices require an approved accounting conversion workflow");
  }
  const provider = session.paymentProvider;
  if (!provider?.code || provider.code.includes("manual")) {
    throw new Error("Manual invoice tenders require operator verification");
  }
  const reference = providerReference(session.data);
  if (!reference) throw new Error("Provider payment reference is missing");
  const key = invoicePaymentKey(session.id);
  const attempt = await getOrCreateInvoicePaymentAttempt(
    sudo.prisma,
    invoice.id,
    paymentSessionId
  );
  if (attempt.recoveryPoint === "completed") {
    return { id: invoice.id, status: "succeeded", success: true, message: "Invoice is already paid" };
  }
  let result = attempt.responseBody?.providerResult;
  if (attempt.recoveryPoint !== "provider_captured" || !result) {
    result = await getPaymentStatus({ provider, paymentId: reference });
    if (AUTHORIZED.has(String(result.status).toLowerCase())) {
      result = await capturePayment({
        provider,
        paymentId: reference,
        amount: invoice.totalAmount,
        currency: invoice.currency.code,
        idempotencyKey: key
      });
    }
    if (!SUCCESS.has(String(result.status).toLowerCase())) {
      throw new Error(`Provider payment is not complete: ${result.status}`);
    }
    if (Number(result.amount) !== invoice.totalAmount) throw new Error("Provider amount mismatch");
    if (String(result.currency).toUpperCase() !== invoice.currency.code.toUpperCase()) {
      throw new Error("Provider currency mismatch");
    }
    await sudo.prisma.idempotencyKey.update({
      where: { id: attempt.id },
      data: { recoveryPoint: "provider_captured", responseBody: { providerResult: result } }
    });
  }
  const paymentWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "payment.captured"
  );
  await sudo.prisma.$transaction(async (tx) => {
    const paidAt = /* @__PURE__ */ new Date();
    const claimed = await claimInvoicePaymentCommit(tx, invoice.id, paidAt);
    if (!claimed) {
      const existingPayment = await tx.payment.findFirst({
        where: {
          paymentCollectionId: session.paymentCollection.id,
          metadata: { path: ["idempotencyKey"], equals: key }
        },
        select: { id: true }
      });
      if (!existingPayment) {
        throw new Error("Invoice is not payable or payment reconciliation is required");
      }
      await tx.idempotencyKey.update({
        where: { id: attempt.id },
        data: {
          recoveryPoint: "completed",
          responseCode: 200,
          responseBody: { providerResult: result, paymentId: existingPayment.id },
          lockedAt: null
        }
      });
      return { paymentId: existingPayment.id };
    }
    const payment = await tx.payment.create({
      data: {
        status: "captured",
        amount: invoice.totalAmount,
        currencyCode: invoice.currency.code,
        data: result,
        metadata: { invoiceId: invoice.id, idempotencyKey: key },
        capturedAt: /* @__PURE__ */ new Date(),
        userId: invoice.account.user.id,
        paymentCollectionId: session.paymentCollection.id
      }
    });
    await tx.capture.create({
      data: {
        amount: invoice.totalAmount,
        paymentId: payment.id,
        metadata: { invoiceId: invoice.id, idempotencyKey: key },
        createdBy: "invoice-checkout"
      }
    });
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        metadata: { providerResult: result, paymentId: payment.id, paidAt: paidAt.toISOString() }
      }
    });
    const ids = invoice.lineItems.map((item) => item.accountLineItem?.id).filter(Boolean);
    await tx.accountLineItem.updateMany({ where: { id: { in: ids } }, data: { paymentStatus: "paid" } });
    await tx.account.update({
      where: { id: invoice.account.id },
      data: { paidAmount: { increment: invoice.totalAmount } }
    });
    await enqueueWebhookOutbox(
      tx,
      paymentWebhookEndpointIds,
      "payment.captured",
      "Payment",
      payment.id,
      { id: payment.id, invoiceId: invoice.id, amount: invoice.totalAmount, currencyCode: invoice.currency.code }
    );
    await tx.idempotencyKey.update({
      where: { id: attempt.id },
      data: {
        recoveryPoint: "completed",
        responseCode: 200,
        responseBody: { providerResult: result, paymentId: payment.id },
        lockedAt: null
      }
    });
    return { paymentId: payment.id };
  });
  return {
    id: invoice.id,
    status: "succeeded",
    success: true,
    message: `Invoice ${invoice.invoiceNumber} paid`
  };
}
var completeInvoicePayment_default = completeInvoicePayment;

// features/keystone/mutations/initiateInvoicePaymentSession.ts
async function initiateInvoicePaymentSession(root, { invoiceId, paymentProviderId }, context) {
  await assertInvoiceAccess(context, invoiceId);
  const sudoContext = context.sudo();
  const invoice = await sudoContext.query.Invoice.findOne({
    where: { id: invoiceId },
    query: `
      id
      totalAmount
      currency {
        code
        noDivisionCurrency
      }
      account {
        id
        user {
          id
        }
      }
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          isSelected
          isInitiated
          paymentProvider {
            id
            code
          }
          data
        }
      }
    `
  });
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  const provider = await sudoContext.query.PaymentProvider.findOne({
    where: { code: paymentProviderId },
    query: `
      id 
      code 
      isInstalled
      createPaymentFunction
      capturePaymentFunction
      refundPaymentFunction
      getPaymentStatusFunction
      generatePaymentLinkFunction
      credentials
    `
  });
  if (!provider || !provider.isInstalled || !isPaymentProviderConfigured(provider.code)) {
    throw new Error("Payment provider not found, installed, and configured");
  }
  if (!invoice.paymentCollection) {
    invoice.paymentCollection = await sudoContext.db.PaymentCollection.createOne({
      data: {
        invoice: { connect: { id: invoice.id } },
        amount: invoice.totalAmount,
        description: "default"
      }
    });
  }
  const existingSession = invoice.paymentCollection?.paymentSessions?.find(
    (s) => s.paymentProvider.code === paymentProviderId && !s.isInitiated
  );
  if (existingSession) {
    const needsInitialization = !existingSession.data || Object.keys(existingSession.data).length === 0;
    let sessionData = existingSession.data;
    if (needsInitialization) {
      try {
        sessionData = await createPayment({
          provider,
          cart: invoice,
          amount: invoice.totalAmount,
          currency: invoice.currency.code
        });
        await sudoContext.query.PaymentSession.updateOne({
          where: { id: existingSession.id },
          data: {
            data: jsonTransport(sessionData),
            isInitiated: true
          }
        });
      } catch (error) {
        throw error;
      }
    }
    const otherSessions = (invoice.paymentCollection.paymentSessions ?? []).filter(
      (s) => s.id !== existingSession.id && s.isSelected
    );
    for (const session of otherSessions) {
      await sudoContext.query.PaymentSession.updateOne({
        where: { id: session.id },
        data: { isSelected: false }
      });
    }
    await sudoContext.query.PaymentSession.updateOne({
      where: { id: existingSession.id },
      data: { isSelected: true }
    });
    return sudoContext.db.PaymentSession.findOne({ where: { id: existingSession.id } });
  }
  try {
    const sessionData = await createPayment({
      provider,
      cart: invoice,
      // Pass invoice as cart parameter
      amount: invoice.totalAmount,
      currency: invoice.currency.code
    });
    const existingSelectedSessions = invoice.paymentCollection.paymentSessions?.filter(
      (s) => s.isSelected
    ) || [];
    for (const session of existingSelectedSessions) {
      await sudoContext.query.PaymentSession.updateOne({
        where: { id: session.id },
        data: { isSelected: false }
      });
    }
    const newSession = await sudoContext.query.PaymentSession.createOne({
      data: {
        paymentCollection: { connect: { id: invoice.paymentCollection.id } },
        paymentProvider: { connect: { id: provider.id } },
        amount: invoice.totalAmount,
        isSelected: true,
        isInitiated: true,
        data: jsonTransport(sessionData)
      },
      query: `
        id
        data
        amount
        isInitiated
      `
    });
    return sudoContext.db.PaymentSession.findOne({ where: { id: newSession.id } });
  } catch (error) {
    throw error;
  }
}
var initiateInvoicePaymentSession_default = initiateInvoicePaymentSession;

// features/keystone/mutations/setInvoicePaymentSession.ts
async function setInvoicePaymentSession(root, { invoiceId, providerId }, context) {
  await assertInvoiceAccess(context, invoiceId);
  const sudoContext = context.sudo();
  const invoice = await sudoContext.query.Invoice.findOne({
    where: { id: invoiceId },
    query: `
      id
      paymentCollection {
        id
        paymentSessions {
          id
          paymentProvider {
            id
          }
        }
      }
    `
  });
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  if (!invoice.paymentCollection) {
    throw new Error("Invoice has no payment collection");
  }
  for (const session of invoice.paymentCollection.paymentSessions || []) {
    await sudoContext.db.PaymentSession.updateOne({
      where: { id: session.id },
      data: { isSelected: false }
    });
  }
  const selectedSession = invoice.paymentCollection.paymentSessions?.find(
    (s) => s.paymentProvider.id === providerId
  );
  if (!selectedSession) {
    throw new Error("Payment session not found");
  }
  await sudoContext.db.PaymentSession.updateOne({
    where: { id: selectedSession.id },
    data: { isSelected: true }
  });
  return await sudoContext.db.Invoice.findOne({
    where: { id: invoiceId }
  });
}
var setInvoicePaymentSession_default = setInvoicePaymentSession;

// features/keystone/mutations/activeInvoice.ts
async function activeInvoice(root, { invoiceId }, context) {
  if (!invoiceId) {
    throw new Error("Invoice ID is required");
  }
  await assertInvoiceAccess(context, invoiceId);
  const sudoContext = context.sudo();
  const invoice = await sudoContext.query.Invoice.findOne({
    where: { id: invoiceId },
    query: `
      id
      invoiceNumber
      status
      totalAmount
      currency {
        code
        noDivisionCurrency
      }
      account {
        id
        user {
          id
        }
      }
      lineItems {
        id
        accountLineItem {
          id
          description
          orderDisplayId
          itemCount
          formattedAmount
          createdAt
          order {
            id
            displayId
            createdAt
            total
          }
          region {
            id
            name
            countries {
              id
              name
              iso2
              region {
                id
              }
            }
            currency {
              code
              noDivisionCurrency
            }
            taxRate
          }
        }
      }
      paymentCollection {
        id
        paymentSessions {
          id
          data
          isSelected
          paymentProvider {
            id
            code
            isInstalled
          }
        }
      }
    `
  });
  if (!invoice) {
    return null;
  }
  return invoice;
}
var activeInvoice_default = activeInvoice;

// features/keystone/security/customer-paid-invoice-pagination.ts
var DEFAULT_CUSTOMER_PAID_INVOICE_LIMIT = 10;
var MAX_CUSTOMER_PAID_INVOICE_LIMIT = 50;
var MAX_CUSTOMER_PAID_INVOICE_OFFSET = 1e5;
function requireCustomerPaidInvoicePagination(limit, offset) {
  const normalizedLimit = limit === void 0 || limit === null ? DEFAULT_CUSTOMER_PAID_INVOICE_LIMIT : limit;
  const normalizedOffset = offset === void 0 || offset === null ? 0 : offset;
  if (!Number.isSafeInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > MAX_CUSTOMER_PAID_INVOICE_LIMIT) {
    throw new Error(`Invoice limit must be a safe integer from 1 to ${MAX_CUSTOMER_PAID_INVOICE_LIMIT}`);
  }
  if (!Number.isSafeInteger(normalizedOffset) || normalizedOffset < 0 || normalizedOffset > MAX_CUSTOMER_PAID_INVOICE_OFFSET) {
    throw new Error(`Invoice offset must be a safe integer from 0 to ${MAX_CUSTOMER_PAID_INVOICE_OFFSET}`);
  }
  return { limit: normalizedLimit, offset: normalizedOffset };
}

// features/keystone/mutations/getCustomerPaidInvoices.ts
var MAX_CUSTOMER_PAID_INVOICE_LINE_ITEMS = 100;
async function getCustomerPaidInvoices(root, { limit, offset }, context) {
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }
  const page = requireCustomerPaidInvoicePagination(limit, offset);
  const sudoContext = context.sudo();
  const invoices = await sudoContext.query.Invoice.findMany({
    where: {
      account: {
        user: { id: { equals: context.session.itemId } }
      },
      status: { equals: "paid" }
    },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
    take: page.limit,
    skip: page.offset,
    query: `
      id
      invoiceNumber
      totalAmount
      status
      paidAt
      dueDate
      createdAt
      currency {
        id
        code
        symbol
        noDivisionCurrency
      }
      account {
        id
        accountNumber
        title
      }
      formattedTotal
      lineItemsCount
      lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_CUSTOMER_PAID_INVOICE_LINE_ITEMS}) {
        id
        orderDisplayId
        formattedAmount
        accountLineItem {
          id
          orderDisplayId
          itemCount
          paymentStatus
          description
          amount
          order {
            id
            displayId
            createdAt
            total
          }
        }
      }
    `
  });
  return invoices.map((invoice) => {
    const hasBoundedRows = Array.isArray(invoice.lineItems);
    const hasKnownCount = Number.isSafeInteger(invoice.lineItemsCount) && invoice.lineItemsCount >= 0;
    const lineItemsHasMore = hasBoundedRows && hasKnownCount && invoice.lineItemsCount >= invoice.lineItems.length ? invoice.lineItemsCount > invoice.lineItems.length : null;
    return { ...invoice, lineItemsHasMore };
  });
}
var getCustomerPaidInvoices_default = getCustomerPaidInvoices;

// features/keystone/queries/getProductsSortedByPrice.ts
var MAX_PAGE_SIZE = 100;
var MAX_OFFSET = 1e5;
var MAX_ID_LENGTH2 = 128;
var MAX_GRAPHQL_INT = 2147483647;
function optionalId(value, label) {
  if (value === void 0 || value === null || value === "") return void 0;
  if (typeof value !== "string" || value.length > MAX_ID_LENGTH2) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}
function boundedGraphQLCount(value) {
  let count;
  if (typeof value === "bigint") {
    count = value;
  } else if (typeof value === "number" && Number.isSafeInteger(value)) {
    count = BigInt(value);
  } else {
    throw new Error("Product count is invalid");
  }
  if (count < BigInt(0) || count > BigInt(MAX_GRAPHQL_INT)) {
    throw new Error("Product count is outside the supported range");
  }
  return Number(count);
}
async function getProductsSortedByPrice(_root, args, context) {
  const countryCode = String(args.countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("Country code is invalid");
  const limit = Number(args.limit);
  const offset = Number(args.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new Error(`Limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
    throw new Error(`Offset must be an integer between 0 and ${MAX_OFFSET}`);
  }
  const collectionId = optionalId(args.collectionId, "Collection ID");
  const categoryId = optionalId(args.categoryId, "Category ID");
  const orderDirection = args.priceOrder === "asc" ? "ASC" : args.priceOrder === "desc" ? "DESC" : void 0;
  if (!orderDirection) throw new Error("Price order is invalid");
  const prisma = context.prisma;
  const region2 = await prisma.region.findFirst({
    where: { countries: { some: { iso2: countryCode } } },
    select: { id: true }
  });
  if (!region2) return { products: [], count: 0 };
  const conditions = [`p."status" = 'published'`, `ma."region" = $1`];
  const parameters = [region2.id];
  if (collectionId) {
    parameters.push(collectionId);
    conditions.push(`EXISTS (
      SELECT 1 FROM "_Product_productCollections" ptpc
      WHERE ptpc."A" = p."id" AND ptpc."B" = $${parameters.length}
    )`);
  }
  if (categoryId) {
    parameters.push(categoryId);
    conditions.push(`EXISTS (
      SELECT 1 FROM "_Product_productCategories" ptpc
      WHERE ptpc."A" = p."id" AND ptpc."B" = $${parameters.length}
    )`);
  }
  const whereSql = conditions.join(" AND ");
  const rowsParameters = [...parameters, limit, offset];
  const sortedProductIds = await prisma.$queryRawUnsafe(
    `
        SELECT p."id", MIN(ma."amount") as min_price
        FROM "Product" p
        INNER JOIN "ProductVariant" pv ON pv."product" = p."id"
        INNER JOIN "MoneyAmount" ma ON ma."productVariant" = pv."id"
        WHERE ${whereSql}
        GROUP BY p."id"
        ORDER BY min_price ${orderDirection}
        LIMIT $${parameters.length + 1}
        OFFSET $${parameters.length + 2}
      `,
    ...rowsParameters
  );
  const countRows = await prisma.$queryRawUnsafe(
    `
      SELECT COUNT(DISTINCT p."id") as count
      FROM "Product" p
      INNER JOIN "ProductVariant" pv ON pv."product" = p."id"
      INNER JOIN "MoneyAmount" ma ON ma."productVariant" = pv."id"
      WHERE ${whereSql}
    `,
    ...parameters
  );
  const totalCount = boundedGraphQLCount(countRows[0]?.count);
  if (!sortedProductIds.length) return { products: [], count: totalCount };
  const productIds = sortedProductIds.map(({ id: id3 }) => id3);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "published" },
    include: {
      productVariants: {
        include: {
          prices: {
            where: {
              region: { countries: { some: { iso2: countryCode } } }
            },
            include: { currency: true }
          }
        }
      }
    }
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  return {
    products: productIds.map((id3) => productMap.get(id3)).filter(Boolean),
    count: totalCount
  };
}

// features/keystone/mutations/processReturnRefund.ts
function providerPaymentReference(payment) {
  return payment.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || payment.data?.payment_intent_id || payment.data?.paymentIntentId || payment.data?.orderId || payment.data?.id;
}
async function processReturnRefund(root, { returnId, paymentId, idempotencyKey }, context) {
  if (!permissions.canManageReturns({ session: context.session }) || !permissions.canManagePayments({ session: context.session })) {
    throw new Error("Access denied");
  }
  if (!idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  const sudo = context.sudo();
  const businessKey = `refund:${idempotencyKey.trim()}`;
  const idempotencyRequest = {
    key: businessKey,
    requestPath: "processReturnRefund",
    requestParams: { returnId, paymentId }
  };
  const priorAttempt = await findIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (priorAttempt?.recoveryPoint === "completed" && priorAttempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({
      where: { id: priorAttempt.responseBody.refundId },
      query: "id amount reason idempotencyKey payment { id amount amountRefunded }"
    });
  }
  const returnRecord = await sudo.query.Return.findOne({
    where: { id: returnId },
    query: `id status refundAmount metadata order { id payments { id } }`
  });
  if (!returnRecord?.order?.id || returnRecord.refundAmount <= 0) {
    throw new Error("Return is not refundable");
  }
  if (!returnRecord.order.payments?.some((payment2) => payment2.id === paymentId)) {
    throw new Error("Payment does not belong to return order");
  }
  const payment = await sudo.query.Payment.findOne({
    where: { id: paymentId },
    query: `
      id amount amountRefunded currencyCode data
      refunds { id amount idempotencyKey }
      paymentCollection {
        paymentSessions {
          isSelected
          paymentProvider {
            id code refundPaymentFunction credentials
          }
        }
      }
    `
  });
  if (!payment) throw new Error("Payment not found");
  const alreadyRefunded = payment.refunds?.reduce((sum2, refund2) => sum2 + refund2.amount, 0) || 0;
  if (alreadyRefunded + returnRecord.refundAmount > payment.amount) {
    throw new Error("Refund exceeds captured payment amount");
  }
  const provider = payment.paymentCollection?.paymentSessions?.find((session) => session.isSelected)?.paymentProvider || payment.paymentCollection?.paymentSessions?.[0]?.paymentProvider;
  const providerReference2 = providerPaymentReference(payment);
  if (!provider || !providerReference2) throw new Error("Refund provider reference is missing");
  if (provider.code?.includes("manual")) {
    throw new Error("Manual tender refunds require operator verification");
  }
  const { attempt, replay } = priorAttempt ? { attempt: priorAttempt, replay: true } : await getOrCreateIdempotencyAttempt(sudo.prisma, idempotencyRequest);
  if (attempt.recoveryPoint === "completed" && attempt.responseBody?.refundId) {
    return sudo.query.Refund.findOne({
      where: { id: attempt.responseBody.refundId },
      query: "id amount reason idempotencyKey payment { id amount amountRefunded }"
    });
  }
  if (replay) {
    const acquired = await sudo.prisma.idempotencyKey.updateMany({
      where: {
        id: attempt.id,
        OR: [
          { lockedAt: null },
          { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1e3) } }
        ]
      },
      data: { lockedAt: /* @__PURE__ */ new Date() }
    });
    if (acquired.count !== 1) throw new Error("Refund is already in progress");
  }
  if (attempt.recoveryPoint === "started") {
    await sudo.prisma.$transaction(async (tx) => {
      const reserved = await tx.payment.updateMany({
        where: {
          id: paymentId,
          amountRefunded: { lte: payment.amount - returnRecord.refundAmount }
        },
        data: { amountRefunded: { increment: returnRecord.refundAmount } }
      });
      if (reserved.count !== 1) {
        throw new Error("Concurrent refund exceeds captured payment amount");
      }
      await tx.idempotencyKey.update({
        where: { id: attempt.id },
        data: { recoveryPoint: "amount_reserved", lockedAt: /* @__PURE__ */ new Date() }
      });
    });
    attempt.recoveryPoint = "amount_reserved";
  }
  let providerResult = attempt.responseBody?.providerResult;
  if (attempt.recoveryPoint !== "provider_refunded" || !providerResult) {
    providerResult = await refundPayment({
      provider,
      paymentId: providerReference2,
      amount: returnRecord.refundAmount,
      currency: payment.currencyCode,
      idempotencyKey: businessKey
    });
    const status = String(providerResult.status || "").toLowerCase();
    if (!["succeeded", "completed", "refunded"].includes(status)) {
      throw new Error(`Provider refund is not complete: ${providerResult.status}`);
    }
    if (Number(providerResult.amount) !== returnRecord.refundAmount) {
      throw new Error("Provider refund amount mismatch");
    }
    if (providerResult.currency && String(providerResult.currency).toUpperCase() !== String(payment.currencyCode).toUpperCase()) {
      throw new Error("Provider refund currency mismatch");
    }
    await sudo.prisma.idempotencyKey.update({
      where: { id: attempt.id },
      data: {
        recoveryPoint: "provider_refunded",
        responseBody: { providerResult },
        lockedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  const refundWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    "refund.created"
  );
  const refund = await sudo.prisma.$transaction(async (tx) => {
    const duplicate = await tx.refund.findFirst({
      where: { idempotencyKey: businessKey }
    });
    if (duplicate) return duplicate;
    const created = await tx.refund.create({
      data: {
        amount: returnRecord.refundAmount,
        reason: "return",
        note: `Return ${returnId}`,
        idempotencyKey: businessKey,
        paymentId,
        metadata: { providerId: provider.id, providerResult }
      }
    });
    await tx.return.update({
      where: { id: returnId },
      data: {
        status: "received",
        receivedAt: /* @__PURE__ */ new Date(),
        metadata: {
          ...returnRecord.metadata || {},
          refundId: created.id,
          refundStatus: "completed"
        }
      }
    });
    await tx.orderEvent.create({
      data: {
        orderId: returnRecord.order.id,
        type: "REFUND_PROCESSED",
        data: { returnId, refundId: created.id, amount: created.amount },
        time: /* @__PURE__ */ new Date(),
        userId: context.session.itemId,
        createdById: context.session.itemId
      }
    });
    await enqueueWebhookOutbox(
      tx,
      refundWebhookEndpointIds,
      "refund.created",
      "Refund",
      created.id,
      { id: created.id, returnId, paymentId, orderId: returnRecord.order.id, amount: created.amount }
    );
    return created;
  });
  await sudo.prisma.idempotencyKey.update({
    where: { id: attempt.id },
    data: {
      recoveryPoint: "completed",
      responseCode: 200,
      responseBody: { refundId: refund.id, providerResult },
      lockedAt: null
    }
  });
  return sudo.query.Refund.findOne({
    where: { id: refund.id },
    query: "id amount reason idempotencyKey payment { id amount amountRefunded }"
  });
}
var processReturnRefund_default = processReturnRefund;

// features/keystone/mutations/retryWebhookDeliveries.ts
async function retryWebhookDeliveries(root, { limit = 25 }, context) {
  if (!permissions.canManageWebhooks({ session: context.session })) {
    throw new Error("Access denied");
  }
  return retryPendingWebhookDeliveries(context, limit);
}
var retryWebhookDeliveries_default = retryWebhookDeliveries;

// features/keystone/models/WebhookEndpoint.ts
var import_core = require("@keystone-6/core");
var import_fields3 = require("@keystone-6/core/fields");
var import_node_crypto10 = __toESM(require("node:crypto"));

// features/webhooks/subscriptions.ts
var import_node_crypto9 = __toESM(require("node:crypto"));
function normalizeWebhookUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw new Error("Webhook URL must be an absolute URL");
  }
  const localDevelopment = process.env.NODE_ENV !== "production" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname.endsWith(".local"));
  if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) {
    throw new Error("Webhook URL must use HTTPS");
  }
  if (url.username || url.password || url.hash) {
    throw new Error("Webhook URL cannot contain credentials or a fragment");
  }
  return url.toString();
}
function normalizeWebhookEvents(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one webhook event is required");
  }
  const events = value.map((event) => String(event || "").trim()).filter(Boolean);
  if (events.length !== value.length) throw new Error("Webhook event names cannot be empty");
  return [...new Set(events)].sort();
}
function normalizeWebhookRegistrationKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > 255) {
    throw new Error("Webhook registration key must be between 1 and 255 characters");
  }
  return key;
}
function requireWebhookScope(actual, required) {
  if (required === void 0 || required === null || required === "") return;
  const expected = String(required).trim().toUpperCase();
  if (expected !== "STORE" && expected !== "USER") {
    throw new Error("Required webhook scope must be STORE or USER");
  }
  if (expected !== actual) {
    throw new Error(`Webhook registration requires ${expected} scope`);
  }
}
function webhookSubscriptionKey(scope, ownerId, registrationKey) {
  if (scope === "USER" && !ownerId) throw new Error("USER webhook subscriptions require an owner");
  const principal = scope === "USER" ? ownerId : "store";
  return import_node_crypto9.default.createHash("sha256").update(`webhook-subscription:v1\0${scope}\0${principal}\0${registrationKey}`).digest("hex");
}

// features/keystone/models/WebhookEndpoint.ts
var CUSTOMER_WEBHOOK_EVENTS = /* @__PURE__ */ new Set(["fulfillment.created"]);
function isCustomerTokenSession(session) {
  return Boolean(session?.customerToken && session?.itemId);
}
function customerEndpointFilter(session) {
  return {
    scope: { equals: "USER" },
    user: { id: { equals: session.itemId } }
  };
}
function canReadEndpoints({ session }) {
  return permissions.canReadWebhooks({ session }) || isCustomerTokenSession(session);
}
function canManageEndpoints({ session }) {
  return permissions.canManageWebhooks({ session }) || isCustomerTokenSession(session);
}
function readEndpointFilter({ session }) {
  if (permissions.canReadWebhooks({ session })) return true;
  return isCustomerTokenSession(session) ? customerEndpointFilter(session) : false;
}
function manageEndpointFilter({ session }) {
  if (permissions.canManageWebhooks({ session })) return true;
  return isCustomerTokenSession(session) ? customerEndpointFilter(session) : false;
}
function validateCustomerEndpoint(urlValue, eventsValue, addValidationError) {
  try {
    normalizeWebhookUrl(urlValue);
  } catch (error) {
    addValidationError(error instanceof Error ? error.message : "Invalid webhook URL");
  }
  let events = [];
  try {
    events = normalizeWebhookEvents(eventsValue);
  } catch (error) {
    addValidationError(error instanceof Error ? error.message : "Invalid webhook events");
  }
  if (events.some((event) => !CUSTOMER_WEBHOOK_EVENTS.has(event))) {
    addValidationError("Customer tokens may subscribe only to fulfillment.created");
  }
}
var WebhookEndpoint = (0, import_core.list)({
  access: {
    operation: {
      query: canReadEndpoints,
      create: canManageEndpoints,
      update: canManageEndpoints,
      delete: canManageEndpoints
    },
    filter: {
      query: readEndpointFilter,
      update: manageEndpointFilter,
      delete: manageEndpointFilter
    }
  },
  hooks: {
    resolveInput: {
      create: ({ context, resolvedData }) => {
        if (!context.session?.itemId) return resolvedData;
        const scope = isCustomerTokenSession(context.session) ? "USER" : "STORE";
        const registrationKey = normalizeWebhookRegistrationKey(
          resolvedData.registrationKey || `manual:${import_node_crypto10.default.randomUUID()}`
        );
        return {
          ...resolvedData,
          url: normalizeWebhookUrl(resolvedData.url),
          events: normalizeWebhookEvents(resolvedData.events),
          registrationKey,
          subscriptionKey: webhookSubscriptionKey(
            scope,
            scope === "USER" ? context.session.itemId : null,
            registrationKey
          ),
          scope,
          user: { connect: { id: context.session.itemId } }
        };
      },
      update: ({ context, resolvedData }) => ({
        ...resolvedData,
        ...resolvedData.url !== void 0 ? { url: normalizeWebhookUrl(resolvedData.url) } : {},
        ...resolvedData.events !== void 0 ? { events: normalizeWebhookEvents(resolvedData.events) } : {},
        ...isCustomerTokenSession(context.session) ? { scope: "USER", user: { connect: { id: context.session.itemId } } } : {}
      })
    },
    validateInput: async ({ context, resolvedData, item, addValidationError }) => {
      if (!isCustomerTokenSession(context.session)) return;
      validateCustomerEndpoint(
        resolvedData.url ?? item?.url,
        resolvedData.events ?? item?.events,
        addValidationError
      );
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageWebhooks(args),
    hideDelete: (args) => !permissions.canManageWebhooks(args),
    listView: {
      initialColumns: ["url", "scope", "isActive", "events", "lastTriggered", "failureCount"]
    }
  },
  fields: {
    url: (0, import_fields3.text)({
      validation: { isRequired: true },
      ui: { description: "The URL where webhook events will be sent" }
    }),
    registrationKey: (0, import_fields3.text)({
      db: { isNullable: true },
      access: { read: () => false, create: () => false, update: () => false },
      ui: { itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } }
    }),
    subscriptionKey: (0, import_fields3.text)({
      db: { isNullable: true },
      isIndexed: "unique",
      access: { read: () => false, create: () => false, update: () => false },
      ui: { itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } }
    }),
    events: (0, import_fields3.json)({
      defaultValue: [],
      ui: {
        description: 'Events to subscribe to, e.g. ["order.created", "fulfillment.created"]'
      }
    }),
    scope: (0, import_fields3.select)({
      options: [
        { label: "Store", value: "STORE" },
        { label: "User", value: "USER" }
      ],
      defaultValue: "STORE",
      validation: { isRequired: true },
      access: { create: () => false, update: () => false },
      ui: { itemView: { fieldMode: "read" } }
    }),
    user: (0, import_fields3.relationship)({
      ref: "User.webhookEndpoints",
      access: { create: () => false, update: () => false },
      ui: { itemView: { fieldMode: "read" } }
    }),
    isActive: (0, import_fields3.checkbox)({
      defaultValue: true,
      ui: { description: "Whether this webhook endpoint is currently active" }
    }),
    secret: (0, import_fields3.text)({
      access: { read: () => false },
      ui: {
        itemView: { fieldMode: "hidden" },
        description: "Secret key for webhook signature verification (auto-generated)"
      },
      hooks: {
        resolveInput: ({ resolvedData, operation }) => {
          if (operation === "create" && !resolvedData.secret) {
            return import_node_crypto10.default.randomBytes(32).toString("hex");
          }
          return resolvedData.secret;
        }
      }
    }),
    lastTriggered: (0, import_fields3.timestamp)({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Last time this webhook was triggered"
      }
    }),
    failureCount: (0, import_fields3.integer)({
      defaultValue: 0,
      ui: {
        itemView: { fieldMode: "read" },
        description: "Number of consecutive delivery failures"
      }
    }),
    webhookEvents: (0, import_fields3.relationship)({
      ref: "WebhookEvent.endpoint",
      many: true,
      ui: {
        displayMode: "count",
        description: "Events sent to this endpoint"
      }
    }),
    createdAt: (0, import_fields3.timestamp)({
      defaultValue: { kind: "now" },
      ui: { itemView: { fieldMode: "read" } }
    }),
    updatedAt: (0, import_fields3.timestamp)({
      db: { updatedAt: true },
      ui: { itemView: { fieldMode: "read" } }
    })
  }
});

// features/keystone/mutations/registerWebhookEndpoint.ts
var CUSTOMER_WEBHOOK_EVENTS2 = /* @__PURE__ */ new Set(["fulfillment.created"]);
async function registerWebhookEndpoint(_root, {
  registrationKey: registrationKeyInput,
  url: urlInput,
  events: eventsInput,
  secret: secretInput,
  requiredScope: requiredScopeInput
}, context) {
  const session = context.session;
  const customerSession = isCustomerTokenSession(session);
  if (!session?.itemId || !customerSession && !permissions.canManageWebhooks({ session })) {
    throw new Error("Webhook management permission required");
  }
  const scope = customerSession ? "USER" : "STORE";
  requireWebhookScope(scope, requiredScopeInput);
  const ownerId = customerSession ? session.itemId : null;
  const registrationKey = normalizeWebhookRegistrationKey(registrationKeyInput);
  const subscriptionKey = webhookSubscriptionKey(scope, ownerId, registrationKey);
  const url = normalizeWebhookUrl(urlInput);
  const events = normalizeWebhookEvents(eventsInput);
  const secret = String(secretInput || "").trim();
  if (!secret) throw new Error("Webhook signing secret is required");
  if (customerSession && events.some((event) => !CUSTOMER_WEBHOOK_EVENTS2.has(event))) {
    throw new Error("Customer tokens may subscribe only to fulfillment.created");
  }
  const sudo = context.sudo();
  const endpoint2 = await sudo.prisma.$transaction(async (tx) => {
    const saved = await tx.webhookEndpoint.upsert({
      where: { subscriptionKey },
      create: {
        registrationKey,
        subscriptionKey,
        url,
        events,
        scope,
        userId: session.itemId,
        isActive: true,
        secret,
        failureCount: 0
      },
      update: {
        url,
        events,
        isActive: true,
        secret
      },
      select: { id: true }
    });
    await tx.webhookEndpoint.updateMany({
      where: {
        id: { not: saved.id },
        scope,
        url,
        registrationKey: { startsWith: "legacy:" },
        ...scope === "USER" ? { userId: session.itemId } : {}
      },
      data: { isActive: false }
    });
    return saved;
  });
  return context.db.WebhookEndpoint.findOne({ where: { id: endpoint2.id } });
}
var registerWebhookEndpoint_default = registerWebhookEndpoint;

// features/keystone/mutations/privacy.ts
var allowedActions = /* @__PURE__ */ new Set(["access", "correct", "delete", "restrict", "object"]);
async function updatePrivacyPreferences(root, { preferences }, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("Authentication required");
  const analytics = preferences?.analytics;
  const marketingEmail = preferences?.marketingEmail;
  if (typeof analytics !== "boolean" || typeof marketingEmail !== "boolean") {
    throw new Error("Privacy preferences must contain boolean analytics and marketingEmail values");
  }
  const receipt = {
    analytics,
    marketingEmail,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "customer-account"
  };
  const sudo = context.sudo();
  const user = await sudo.query.User.findOne({
    where: { id: userId },
    query: "id userField { id preferences }"
  });
  if (!user) throw new Error("User not found");
  if (user.userField?.id) {
    await sudo.query.UserField.updateOne({
      where: { id: user.userField.id },
      data: {
        preferences: {
          ...user.userField.preferences || {},
          privacy: receipt
        }
      }
    });
  } else {
    await sudo.query.UserField.createOne({
      data: {
        user: { connect: { id: userId } },
        preferences: { privacy: receipt }
      }
    });
  }
  return receipt;
}
async function requestPrivacyAction(root, { action, details }, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("Authentication required");
  if (!allowedActions.has(action)) throw new Error("Unsupported privacy action");
  const request = await context.sudo().query.Notification.createOne({
    data: {
      eventName: "PRIVACY_REQUEST",
      resourceType: "User",
      resourceId: userId,
      to: "privacy-operations",
      user: { connect: { id: userId } },
      data: {
        action,
        details: typeof details === "string" ? details.slice(0, 2e3) : null,
        status: "pending_identity_verification",
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    },
    query: "id eventName createdAt data"
  });
  return request;
}
async function getMyPrivacyData(root, args, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("Authentication required");
  const user = await context.sudo().query.User.findOne({
    where: { id: userId },
    query: `
      id name email phone createdAt updatedAt onboardingStatus
      addresses { id firstName lastName company address1 address2 city province postalCode phone country { iso2 } }
      userField { preferences }
      orders(orderBy: { createdAt: desc }, take: 250) { id displayId status createdAt email }
    `
  });
  if (!user) throw new Error("User not found");
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    user
  };
}

// features/keystone/lib/collectibles-domain.ts
function isAuctionOpenAt(auction, now) {
  const timestamp34 = (value) => {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.getTime();
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const startAt = timestamp34(auction?.startAt);
  const endAt = timestamp34(auction?.endAt);
  return auction?.status === "active" && startAt !== null && endAt !== null && startAt < endAt && Number.isFinite(now.getTime()) && now.getTime() >= startAt && now.getTime() < endAt;
}
function isPublicListingAvailable(listing, now) {
  const inventoryStatus = listing?.inventoryUnit?.status;
  if (listing?.format === "fixed_price") return inventoryStatus === "available";
  return listing?.format === "auction" && ["available", "reserved"].includes(inventoryStatus) && isAuctionOpenAt(listing?.auction, now);
}
function nonNegativeMinor(value, label) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative integer in minor units`);
  }
  return amount;
}
function minimumNextBid(auction) {
  const opening = nonNegativeMinor(auction.openingAmountMinor, "Opening amount");
  const current = nonNegativeMinor(auction.currentAmountMinor, "Current amount");
  const increment = nonNegativeMinor(auction.minimumIncrementMinor, "Minimum increment");
  if (increment < 1) throw new Error("Minimum increment must be at least one minor unit");
  return auction.leadingBidderId ? current + increment : Math.max(opening, current);
}
function evaluateAuctionBid(auction, input) {
  if (auction.status !== "active") throw new Error("Auction is not active");
  if (input.now < auction.startAt) throw new Error("Auction has not started");
  if (input.now >= auction.endAt) throw new Error("Auction has ended");
  if (!input.bidderId) throw new Error("Authenticated bidder is required");
  if (auction.leadingBidderId === input.bidderId) throw new Error("The current leader cannot bid against their own leading bid");
  const amount = nonNegativeMinor(input.amountMinor, "Bid amount");
  const minimumAcceptedMinor = minimumNextBid(auction);
  if (amount < minimumAcceptedMinor) {
    throw new Error(`Bid must be at least ${minimumAcceptedMinor} minor units`);
  }
  const extensionWindow = Math.max(0, Number(auction.extensionWindowSeconds || 0));
  const extensionSeconds = Math.max(0, Number(auction.extensionSeconds || 0));
  const maximumExtensions = Math.max(0, Number(auction.maximumExtensions || 0));
  const extensionCount = Math.max(0, Number(auction.extensionCount || 0));
  const remainingMs = auction.endAt.getTime() - input.now.getTime();
  const shouldExtend = extensionSeconds > 0 && extensionCount < maximumExtensions && remainingMs <= extensionWindow * 1e3;
  return {
    minimumAcceptedMinor,
    nextEndAt: shouldExtend ? new Date(auction.endAt.getTime() + extensionSeconds * 1e3) : auction.endAt,
    nextExtensionCount: shouldExtend ? extensionCount + 1 : extensionCount
  };
}
function assertOfferAmount(input) {
  const amountMinor = nonNegativeMinor(input.amountMinor, "Offer amount");
  if (amountMinor < 1) throw new Error("Offer amount must be positive");
  if (input.minimumOfferMinor != null && amountMinor < input.minimumOfferMinor) {
    throw new Error(`Offer must be at least ${input.minimumOfferMinor} minor units`);
  }
  return amountMinor;
}

// features/keystone/lib/public-attributes.ts
function projectPublicAttributes(values, definitions) {
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};
  const source = values;
  const output = {};
  for (const definition of definitions || []) {
    const key = String(definition?.key || "");
    if (definition?.public !== true || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/.test(key) || !(key in source)) continue;
    const value = source[key];
    const options = Array.isArray(definition.options) ? definition.options.filter((entry) => typeof entry === "string").slice(0, 200) : [];
    switch (definition.valueType) {
      case "text":
        if (typeof value === "string") output[key] = value.slice(0, 500);
        break;
      case "integer":
        if (Number.isSafeInteger(value)) output[key] = value;
        break;
      case "decimal":
        if (typeof value === "number" && Number.isFinite(value)) output[key] = value;
        break;
      case "boolean":
        if (typeof value === "boolean") output[key] = value;
        break;
      case "date":
        if (typeof value === "string" && Number.isFinite(Date.parse(value))) output[key] = value.slice(0, 40);
        break;
      case "select":
        if (typeof value === "string" && options.includes(value)) output[key] = value;
        break;
      case "multiselect":
        if (Array.isArray(value) && value.length <= 30 && value.every((entry) => typeof entry === "string" && options.includes(entry))) output[key] = value;
        break;
    }
  }
  return output;
}

// features/keystone/mutations/collectibles-public-projection.ts
var conditionSources = /* @__PURE__ */ new Set(["operator", "seller", "buyer", "provider", "import"]);
var conditionStatuses = /* @__PURE__ */ new Set(["reported", "reviewed", "superseded", "disputed"]);
var verificationStates = /* @__PURE__ */ new Set(["not_checked", "provider_reported", "matched", "mismatch", "unavailable", "manual_review"]);
var provenanceTypes = /* @__PURE__ */ new Set(["claimed_origin", "ownership", "sale", "exhibition", "publication", "restoration", "loss", "recovery", "other"]);
var confidenceValues = /* @__PURE__ */ new Set(["unreviewed", "low", "medium", "high", "provider_reported"]);
var reviewStates = /* @__PURE__ */ new Set(["reported", "reviewed", "disputed", "rejected"]);
var valuationSources = /* @__PURE__ */ new Set(["operator", "comparable_sale", "price_guide", "auction_result", "provider", "seller", "other"]);
function dateValue(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return null;
}
function enumValue(value, choices) {
  return typeof value === "string" && choices.has(value) ? value : null;
}
function rows(value) {
  return Array.isArray(value) ? value : [];
}
function projectPublicObservations(specimen) {
  const condition = rows(specimen?.conditionObservations).flatMap((row) => {
    const sourceType = enumValue(row?.sourceType, conditionSources);
    const status = enumValue(row?.status, conditionStatuses);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== "string" || !sourceType || !status || !observedAt || typeof row?.label !== "string") return [];
    return [{ id: row.id, sourceType, scale: typeof row.scale === "string" ? row.scale : null, label: row.label, score: typeof row.score === "string" ? row.score : null, observedAt, status }];
  });
  const grading = rows(specimen?.gradeObservations).flatMap((row) => {
    const verificationState = enumValue(row?.verificationState, verificationStates);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== "string" || typeof row?.reportedGrade !== "string" || !verificationState || !observedAt || typeof row?.disclaimer !== "string") return [];
    const company = row.gradingCompany && typeof row.gradingCompany.id === "string" && typeof row.gradingCompany.name === "string" && typeof row.gradingCompany.code === "string" ? { id: row.gradingCompany.id, name: row.gradingCompany.name, code: row.gradingCompany.code } : null;
    return [{ id: row.id, reportedGrade: row.reportedGrade, reportedLabel: typeof row.reportedLabel === "string" ? row.reportedLabel : null, certificateReference: typeof row.certificateReference === "string" ? row.certificateReference : null, observedAt, verificationState, disclaimer: row.disclaimer, gradingCompany: company }];
  });
  const provenance = rows(specimen?.provenanceEvents).flatMap((row) => {
    const eventType = enumValue(row?.eventType, provenanceTypes);
    const confidence = enumValue(row?.confidence, confidenceValues);
    const reviewState = enumValue(row?.reviewState, reviewStates);
    if (typeof row?.id !== "string" || !eventType || !confidence || !reviewState) return [];
    return [{ id: row.id, eventType, occurredAt: dateValue(row.occurredAt), confidence, reviewState }];
  });
  const valuation = rows(specimen?.valuationObservations).flatMap((row) => {
    const sourceType = enumValue(row?.sourceType, valuationSources);
    const confidence = enumValue(row?.confidence, confidenceValues);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== "string" || !Number.isSafeInteger(row?.amountMinor) || row.amountMinor < 0 || !/^[A-Z]{3}$/.test(String(row?.currencyCode || "")) || !sourceType || typeof row?.sourceName !== "string" || !observedAt || !confidence || typeof row?.disclaimer !== "string") return [];
    return [{ id: row.id, amountMinor: row.amountMinor, currencyCode: row.currencyCode, sourceType, sourceName: row.sourceName, observedAt, confidence, disclaimer: row.disclaimer }];
  });
  return { condition, grading, provenance, valuation };
}

// features/keystone/lib/collectibles-public-listing.ts
function projectPublicListingExtension(listing) {
  const specimen = listing?.inventoryUnit?.specimen;
  if (typeof listing?.id !== "string" || !listing.id || typeof specimen?.id !== "string" || !specimen.id) return null;
  if (!["fixed_price", "auction"].includes(listing.format)) return null;
  if (typeof listing.currencyCode !== "string" || !/^[A-Z]{3}$/.test(listing.currencyCode)) return null;
  if (listing.priceMinor != null && (!Number.isSafeInteger(listing.priceMinor) || listing.priceMinor < 0)) return null;
  const definitions = specimen.catalogItem?.category?.attributeDefinitions || [];
  return {
    schema: "openfront.collectibles.specimen-listing/v1",
    value: {
      listing: {
        id: listing.id,
        title: typeof listing.title === "string" ? listing.title : "",
        format: listing.format,
        priceMinor: listing.priceMinor ?? null,
        currencyCode: listing.currencyCode
      },
      specimen: {
        id: specimen.id,
        displayName: typeof specimen.displayName === "string" ? specimen.displayName : "",
        category: typeof specimen.catalogItem?.category?.name === "string" ? specimen.catalogItem.category.name : "Uncategorized",
        catalogReference: typeof specimen.catalogItem?.handle === "string" ? specimen.catalogItem.handle : null,
        attributes: {
          ...projectPublicAttributes(specimen.catalogItem?.attributeValues, definitions),
          ...projectPublicAttributes(specimen.attributeValues, definitions)
        }
      },
      observations: projectPublicObservations(specimen)
    }
  };
}

// features/keystone/lib/public-collectibles-discovery-page.ts
var MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET = 1e5;
function buildPublicCollectiblesDiscoveryPageQuery({
  criteria,
  query,
  limit,
  offset
}) {
  const values = [];
  const bind = (value) => {
    values.push(value);
    return `$${values.length}`;
  };
  const conditions = [
    `l.status = 'published'`,
    `l.format IN ('fixed_price', 'auction')`,
    `l."currencyCode" ~ '^[A-Z]{3}$'`,
    `(l."priceMinor" IS NULL OR l."priceMinor" >= 0)`,
    `p.status = 'published'`,
    `COALESCE(iu.quantity, 0) > 0`,
    `((l.format = 'fixed_price' AND iu.status = 'available') OR (l.format = 'auction' AND iu.status IN ('available', 'reserved') AND a.status = 'active' AND a."startAt" <= discovery_clock.observed_at AND a."endAt" > discovery_clock.observed_at))`
  ];
  if (criteria.listingId !== void 0) conditions.push(`l.id = ${bind(criteria.listingId)}`);
  if (criteria.productVariantId !== void 0) conditions.push(`pv.id = ${bind(criteria.productVariantId)}`);
  if (criteria.category !== void 0) conditions.push(`cc.handle = ${bind(criteria.category)}`);
  if (criteria.format !== void 0) conditions.push(`l.format = ${bind(criteria.format)}`);
  if (criteria.minPriceMinor !== void 0) conditions.push(`l."priceMinor" >= ${bind(criteria.minPriceMinor)}`);
  if (criteria.maxPriceMinor !== void 0) conditions.push(`l."priceMinor" <= ${bind(criteria.maxPriceMinor)}`);
  if (query) {
    const search = bind(query);
    conditions.push(`(
      POSITION(${search} IN LOWER(COALESCE(l.title, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(l."publicSummary", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(s."displayName", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci.title, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci."catalogNumber", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci.maker, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(cc.name, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(f.name, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(cs.name, ''))) > 0
    )`);
  }
  const limitParameter = bind(limit);
  const offsetParameter = bind(offset);
  return {
    sql: `
      WITH discovery_clock AS (
        SELECT CURRENT_TIMESTAMP AS observed_at
      ), published_listing_counts AS (
        SELECT "inventoryUnit", COUNT(*) AS listing_count
        FROM "Listing"
        WHERE status = 'published' AND "inventoryUnit" IS NOT NULL
        GROUP BY "inventoryUnit"
      ), matching AS (
        SELECT l.id, l."publishedAt" AS published_at
        FROM "Listing" l
        CROSS JOIN discovery_clock
        JOIN published_listing_counts plc
          ON plc."inventoryUnit" = l."inventoryUnit" AND plc.listing_count = 1
        JOIN "InventoryUnit" iu ON iu.id = l."inventoryUnit"
        JOIN "Specimen" s ON s.id = iu."specimen"
        JOIN "ProductVariant" pv ON pv.id = iu."commerceVariant"
        JOIN "Product" p ON p.id = pv."product"
        LEFT JOIN "Auction" a ON a."listing" = l.id
        LEFT JOIN "CatalogItem" ci ON ci.id = s."catalogItem"
        LEFT JOIN "CollectibleCategory" cc ON cc.id = ci.category
        LEFT JOIN "Franchise" f ON f.id = ci.franchise
        LEFT JOIN "CollectibleSet" cs ON cs.id = ci."collectibleSet"
        WHERE ${conditions.join("\n          AND ")}
      ), totals AS (
        SELECT COUNT(*)::bigint AS total_count FROM matching
      ), page AS (
        SELECT id, published_at
        FROM matching
        ORDER BY published_at DESC NULLS LAST, id DESC
        LIMIT ${limitParameter} OFFSET ${offsetParameter}
      )
      SELECT page.id, totals.total_count, discovery_clock.observed_at
      FROM totals
      CROSS JOIN discovery_clock
      LEFT JOIN page ON TRUE
      ORDER BY page.published_at DESC NULLS LAST, page.id DESC
    `,
    values
  };
}

// features/keystone/mutations/collectibles.ts
var AUCTION_LIFECYCLE_RELEASED = false;
var OFFER_LIFECYCLE_RELEASED = false;
var PUBLIC_LISTING_QUERY = `
  id title slug format status priceMinor currencyCode publicSummary publishedAt endsAt
  store { name }
  inventoryUnit {
    id status
    commerceVariant { id product { handle status } }
    specimen {
      id displayName attributeValues
      catalogItem {
        id title handle catalogNumber maker year attributeValues
        category { id name handle attributeDefinitions(where: { public: { equals: true } }, take: 100) { key valueType options public } }
        franchise { id name handle }
        collectibleSet { id name handle }
        release { id name handle edition releaseDate }
      }
      media(where: { visibility: { equals: "public" } }, take: 8) { id kind url altText source capturedAt }
      conditionObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 3) { id sourceType scale label score observedAt status }
      gradeObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 3) { id reportedGrade reportedLabel certificateReference observedAt verificationState disclaimer gradingCompany { id name code } }
      provenanceEvents(where: { publiclyVisible: { equals: true } }, orderBy: { occurredAt: desc }, take: 6) { id eventType occurredAt confidence reviewState }
      valuationObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 5) { id amountMinor currencyCode sourceType sourceName observedAt confidence disclaimer }
    }
  }
  auction { id status startAt endAt openingAmountMinor currentAmountMinor currencyCode reserveMet minimumIncrementMinor extensionWindowSeconds bidCount }
`;
async function marketplaceCollectiblesCapabilities() {
  return {
    platform: "openfront-collectibles",
    verticals: ["collectibles"],
    discovery: [{
      vertical: "collectibles",
      resultKind: "collectibles.specimen-listing",
      criteriaSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", maxLength: 80 },
          format: { enum: ["fixed_price", "auction"] },
          minPriceMinor: { type: "integer", minimum: 0 },
          maxPriceMinor: { type: "integer", minimum: 0 }
        }
      },
      actions: ["discovery.details"],
      extensionSchema: "openfront.collectibles.specimen-listing/v1"
    }]
  };
}
async function publicCollectiblesDiscovery(_root, { input }, context) {
  if (input?.query !== void 0 && typeof input.query !== "string") throw new Error("Search query must be text");
  const query = String(input?.query || "").trim().slice(0, 80).toLowerCase();
  const limit = input?.limit === void 0 ? 12 : Number(input.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 24) throw new Error("Discovery limit must be an integer between 1 and 24");
  const countryCode = String(input?.countryCode || "").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(countryCode)) throw new Error("A storefront country code is required");
  const criteria = input?.criteria && typeof input.criteria === "object" && !Array.isArray(input.criteria) ? input.criteria : {};
  const allowedCriteria = /* @__PURE__ */ new Set(["listingId", "productVariantId", "category", "format", "minPriceMinor", "maxPriceMinor"]);
  if (Object.keys(criteria).some((key) => !allowedCriteria.has(key))) throw new Error("Unsupported collectible discovery criterion");
  if (criteria.format !== void 0 && !["fixed_price", "auction"].includes(criteria.format)) throw new Error("Listing format is invalid");
  for (const value of [criteria.minPriceMinor, criteria.maxPriceMinor]) {
    if (value !== void 0 && (!Number.isSafeInteger(value) || Number(value) < 0)) throw new Error("Price criteria must be non-negative integer minor units");
  }
  if (Number.isSafeInteger(criteria.minPriceMinor) && Number.isSafeInteger(criteria.maxPriceMinor) && Number(criteria.minPriceMinor) > Number(criteria.maxPriceMinor)) {
    throw new Error("Minimum price cannot exceed maximum price");
  }
  const offset = input?.offset === void 0 ? 0 : Number(input.offset);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET) {
    throw new Error(`Discovery offset must be an integer between 0 and ${MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET}`);
  }
  const normalizedCriteria = {};
  if (criteria.listingId !== void 0) {
    if (typeof criteria.listingId !== "string" || !criteria.listingId || criteria.listingId.length > 128) throw new Error("Listing ID is invalid");
    normalizedCriteria.listingId = criteria.listingId;
  }
  if (criteria.productVariantId !== void 0) {
    if (typeof criteria.productVariantId !== "string" || !criteria.productVariantId || criteria.productVariantId.length > 128) throw new Error("Product variant ID is invalid");
    normalizedCriteria.productVariantId = criteria.productVariantId;
  }
  if (criteria.category !== void 0) {
    if (typeof criteria.category !== "string" || criteria.category.length > 80) throw new Error("Category criterion is invalid");
    if (criteria.category) normalizedCriteria.category = criteria.category;
  }
  if (criteria.format !== void 0) normalizedCriteria.format = criteria.format;
  if (criteria.minPriceMinor !== void 0) normalizedCriteria.minPriceMinor = criteria.minPriceMinor;
  if (criteria.maxPriceMinor !== void 0) normalizedCriteria.maxPriceMinor = criteria.maxPriceMinor;
  const sudo = context.sudo();
  const pageQuery = buildPublicCollectiblesDiscoveryPageQuery({ criteria: normalizedCriteria, query, limit, offset });
  const pageRows = await sudo.prisma.$queryRawUnsafe(pageQuery.sql, ...pageQuery.values);
  const rawTotal = pageRows[0]?.total_count ?? 0;
  const totalResults = Number(rawTotal);
  if (!Number.isSafeInteger(totalResults) || totalResults < 0) throw new Error("Public collectible discovery count is invalid");
  const rawObservedAt = pageRows[0]?.observed_at;
  const discoveryObservedAt = rawObservedAt instanceof Date ? rawObservedAt : new Date(rawObservedAt);
  if (!Number.isFinite(discoveryObservedAt.getTime())) throw new Error("Public collectible discovery clock is invalid");
  const listingIds = [...new Set(pageRows.map((row) => row.id).filter((id3) => typeof id3 === "string"))];
  const loadedListings = listingIds.length ? await sudo.query.Listing.findMany({ where: { id: { in: listingIds } }, query: PUBLIC_LISTING_QUERY }) : [];
  const loadedById = new Map(loadedListings.map((listing) => [listing.id, listing]));
  if (loadedById.size !== listingIds.length) throw new Error("Public listings changed during discovery; retry the query");
  const listings = listingIds.map((id3) => loadedById.get(id3));
  const projectedListings = listings.map((listing) => {
    const extension = projectPublicListingExtension(listing);
    if (!extension) throw new Error("Public listing projection changed during discovery; retry the query");
    return { listing, extension };
  });
  const [store] = await sudo.query.Store.findMany({ take: 1, query: "id" });
  const sourceId = store?.id || "openfront-collectibles";
  return {
    schemaVersion: "marketplace.discovery.v1",
    vertical: "collectibles",
    observedAt: discoveryObservedAt.toISOString(),
    source: { id: sourceId, platform: "openfront-collectibles" },
    resultKind: "collectibles.specimen-listing",
    results: projectedListings.map(({ listing, extension }) => ({
      ref: { sourceId, kind: "collectibles.specimen-listing", id: listing.id },
      title: listing.title,
      facts: {
        price: typeof listing.priceMinor === "number" ? { amountMinor: listing.priceMinor, currency: listing.currencyCode } : void 0,
        available: isPublicListingAvailable(listing, discoveryObservedAt),
        format: listing.format,
        auction: listing.auction ? {
          status: listing.auction.status,
          startAt: listing.auction.startAt,
          endAt: listing.auction.endAt,
          currentAmountMinor: listing.auction.currentAmountMinor,
          currencyCode: listing.auction.currencyCode,
          reserveMet: listing.auction.reserveMet,
          minimumIncrementMinor: listing.auction.minimumIncrementMinor,
          bidCount: listing.auction.bidCount
        } : void 0
      },
      extension,
      merchantUrl: `/${countryCode}/products/${encodeURIComponent(listing.inventoryUnit.commerceVariant.product.handle)}`
    })),
    totalResults,
    truncated: offset + listingIds.length < totalResults
  };
}
async function placeCollectibleBid(_root, { auctionId, amountMinor, idempotencyKey }, context) {
  if (!AUCTION_LIFECYCLE_RELEASED) throw new Error("Auction bidding is unavailable until award, payment-default, and settlement recovery workflows are complete");
  const bidderId = context.session?.itemId;
  if (!bidderId || isMachinePrincipal(context.session)) throw new Error("A signed-in customer is required to bid");
  const key = String(idempotencyKey || "").trim();
  if (key.length < 8 || key.length > 200) throw new Error("Idempotency key must be between 8 and 200 characters");
  const amount = Number(amountMinor);
  const sudo = context.sudo();
  const bidId = await sudo.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${auctionId} FOR UPDATE`;
    const replay = await tx.bid.findUnique({ where: { idempotencyKey: key } });
    if (replay) {
      if (replay.bidderId !== bidderId || replay.auctionId !== auctionId || replay.amountMinor !== amount) throw new Error("Idempotency key was already used for a different bid");
      return replay.id;
    }
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: { listing: { include: { inventoryUnit: true } } }
    });
    if (!auction?.listing?.inventoryUnit) throw new Error("Auction inventory is unavailable");
    const inventory = auction.listing.inventoryUnit;
    if (!["available", "reserved"].includes(inventory.status || "")) throw new Error("Auction inventory is unavailable");
    if (inventory.status === "reserved" && !auction.reservationId) throw new Error("Auction inventory is reserved by another workflow");
    const evaluated = evaluateAuctionBid({ ...auction, leadingBidderId: auction.leadingBidderId }, { bidderId, amountMinor: amount, now: /* @__PURE__ */ new Date() });
    let reservationId = auction.reservationId;
    if (!reservationId) {
      const reservation = await tx.reservation.create({ data: {
        inventoryUnitId: inventory.id,
        listingId: auction.listing.id,
        auctionId: auction.id,
        purpose: "auction",
        status: "active",
        ownerUserId: bidderId,
        expiresAt: evaluated.nextEndAt,
        idempotencyKey: `auction:${auction.id}`
      } });
      reservationId = reservation.id;
      await tx.inventoryUnit.update({ where: { id: inventory.id }, data: { status: "reserved", version: { increment: 1 } } });
    } else {
      await tx.reservation.update({ where: { id: reservationId }, data: { ownerUserId: bidderId, expiresAt: evaluated.nextEndAt } });
    }
    const bid = await tx.bid.create({ data: {
      auctionId: auction.id,
      bidderId,
      amountMinor: amount,
      currencyCode: auction.currencyCode,
      status: "accepted",
      acceptedAt: /* @__PURE__ */ new Date(),
      resultingEndAt: evaluated.nextEndAt,
      idempotencyKey: key
    } });
    if (auction.leadingBidderId) {
      await tx.bid.updateMany({ where: { auctionId: auction.id, bidderId: auction.leadingBidderId, status: "accepted" }, data: { status: "superseded" } });
    }
    await tx.auction.update({ where: { id: auction.id }, data: {
      currentAmountMinor: amount,
      leadingBidderId: bidderId,
      bidCount: { increment: 1 },
      endAt: evaluated.nextEndAt,
      extensionCount: evaluated.nextExtensionCount,
      reserveMet: auction.reserveAmountMinor == null ? true : amount >= auction.reserveAmountMinor,
      reservationId
    } });
    return bid.id;
  }, { isolationLevel: "Serializable", timeout: 15e3 });
  return sudo.query.Bid.findOne({ where: { id: bidId }, query: "id amountMinor currencyCode status acceptedAt resultingEndAt auction { id currentAmountMinor endAt reserveMet bidCount leadingBidder { id } }" });
}
async function submitCollectibleOffer(_root, { listingId, amountMinor, expiresAt, message, idempotencyKey }, context) {
  if (!OFFER_LIFECYCLE_RELEASED) throw new Error("Offers are unavailable until counter, acceptance, expiry, reservation, and conversion workflows are complete");
  const buyerId = context.session?.itemId;
  if (!buyerId || isMachinePrincipal(context.session)) throw new Error("A signed-in customer is required to make an offer");
  const key = String(idempotencyKey || "").trim();
  if (key.length < 8 || key.length > 200) throw new Error("Idempotency key must be between 8 and 200 characters");
  const sudo = context.sudo();
  const offerId = await sudo.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${listingId} FOR UPDATE`;
    const replay = await tx.offer.findUnique({ where: { idempotencyKey: key } });
    if (replay) {
      if (replay.buyerId !== buyerId || replay.listingId !== listingId || replay.currentAmountMinor !== Number(amountMinor)) throw new Error("Idempotency key was already used for a different offer");
      return replay.id;
    }
    const listing = await tx.listing.findUnique({ where: { id: listingId }, include: { inventoryUnit: true } });
    if (!listing || listing.status !== "published" || listing.format !== "fixed_price" || !listing.offersEnabled || listing.inventoryUnit?.status !== "available") throw new Error("Listing is not accepting offers");
    const amount = assertOfferAmount({ amountMinor, minimumOfferMinor: listing.minimumOfferMinor, listingPriceMinor: listing.priceMinor });
    const expiry = new Date(expiresAt);
    if (!Number.isFinite(expiry.getTime()) || expiry <= /* @__PURE__ */ new Date() || expiry.getTime() > Date.now() + 30 * 864e5) throw new Error("Offer expiry must be within the next 30 days");
    const offer = await tx.offer.create({ data: { listingId, buyerId, sellerId: listing.sellerId, status: "open", currentAmountMinor: amount, currencyCode: listing.currencyCode, expiresAt: expiry, currentRevision: 1, idempotencyKey: key } });
    await tx.offerRevision.create({ data: { offerId: offer.id, sequence: 1, actorType: "buyer", actorId: buyerId, action: "created", amountMinor: amount, currencyCode: listing.currencyCode, message: String(message || "").slice(0, 1e3), occurredAt: /* @__PURE__ */ new Date(), idempotencyKey: `${key}:revision:1` } });
    return offer.id;
  }, { isolationLevel: "Serializable", timeout: 15e3 });
  return sudo.query.Offer.findOne({ where: { id: offerId }, query: "id status currentAmountMinor currencyCode expiresAt currentRevision listing { id title slug } revisions { id sequence actorType action amountMinor message occurredAt }" });
}

// features/keystone/mutations/index.ts
var graphql = String.raw;
var extendGraphqlSchema = (schema) => (0, import_schema.mergeSchemas)({
  schemas: [schema],
  typeDefs: graphql`
      input CartCodeInput {
        code: String!
      }

      type Query {
        redirectToInit: Boolean
        activeCart(cartId: ID!): JSON
        activeCartShippingOptions(cartId: ID!): [ShippingOption!]
        activeCartPaymentProviders(regionId: ID!): [PaymentProvider!]
        activeCartRegion(countryCode: String!): Region
        getCustomerOrder(orderId: ID!, secretKey: String): JSON
        getCustomerOrders(limit: Int, offset: Int): JSON
        getCustomerAccount(accountId: ID!): JSON
        getCustomerAccounts(limit: Int, offset: Int): JSON
        getUnpaidLineItemsByRegion(accountId: ID!): UnpaidLineItemsByRegionResult!
        getInvoicePaymentSessions(invoiceId: ID!): [PaymentSession!]!
        getAnalytics(timeframe: String): JSON
        activeInvoice(invoiceId: ID!): JSON
        getCustomerPaidInvoices(limit: Int, offset: Int): JSON
        getFinanceClose(start: String!, end: String!): JSON!
        getMyPrivacyData: JSON!
        getProductsSortedByPrice(
          countryCode: String!
          limit: Int!
          offset: Int!
          priceOrder: String!
          collectionId: ID
          categoryId: ID
        ): ProductsSortedByPriceResult!
        marketplaceCollectiblesCapabilities: JSON!
        publicCollectiblesDiscovery(input: JSON): JSON!
      }

      type ProductsSortedByPriceResult {
        products: [Product!]!
        count: Int!
      }

      type ShippingRate {
        id: ID!
        provider: String!
        service: String!
        carrier: String!
        price: String!
        estimatedDays: String!
      }

      type ProviderShippingLabel {
        id: ID!
        status: String!
        trackingNumber: String
        trackingUrl: String
        labelUrl: String
        data: JSON
      }

      type PackageDimensions {
        length: Float!
        width: Float!
        height: Float!
        weight: Float!
        unit: String!
        weightUnit: String!
      }

      input DimensionsInput {
        length: Float!
        width: Float!
        height: Float!
        weight: Float!
        unit: String!
        weightUnit: String!
      }

      input LineItemInput {
        lineItemId: ID!
        quantity: Int!
      }

      type AddressValidationResult {
        isValid: Boolean!
        normalizedAddress: JSON
        errors: [String!]
      }

      type TrackingEvent {
        status: String!
        location: String
        timestamp: String!
        message: String
      }

      type ShipmentTrackingResult {
        status: String!
        estimatedDeliveryDate: String
        trackingEvents: [TrackingEvent!]!
      }

      type LabelCancellationResult {
        success: Boolean!
        refundStatus: String
        error: String
      }

      input UserUpdateProfileInput {
        email: String
        name: String
        phone: String
        billingAddress: String
        password: String
        onboardingStatus: String
      }

      type WebhookResult {
        success: Boolean!
        message: String
        statusCode: Int
        error: String
      }


      type CustomerTokenResult {
        success: Boolean!
        token: String
      }

      input PaymentInput {
        paymentMethod: String!
        paymentMethodId: String
        orderId: String
        data: JSON
      }

      type PaymentResult {
        success: Boolean!
        invoice: Invoice
        payment: Payment
        message: String
        error: String
      }

      type InvoiceCreationResult {
        success: Boolean!
        invoiceId: ID
        message: String
        error: String
      }

      type RegionLineItems {
        region: JSON!
        lineItems: [JSON!]!
        totalAmount: Int!
        formattedTotalAmount: String!
        itemCount: Int!
      }

      type UnpaidLineItemsByRegionResult {
        success: Boolean!
        regions: [RegionLineItems!]!
        totalRegions: Int!
        totalUnpaidItems: Int!
        message: String
      }

      type InvoicePaymentResult {
        id: ID!
        status: String!
        success: Boolean!
        message: String!
        error: String
      }

      type Mutation {
        receiveCollectibleItem(input: JSON!): JSON!
        manageCollectibleListing(input: JSON!): JSON!
        updateActiveUser(data: UserUpdateProfileInput!): User
        createActiveCart(regionId: ID!): JSON!
        createActiveCartProof(cartId: ID!): String!
        updateActiveCart(cartId: ID!, data: CartUpdateInput, code: String): Cart
        updateActiveCartLineItem(cartId: ID!, lineId: ID!, quantity: Int!): Cart
        updateActiveUserPassword(
          oldPassword: String!
          newPassword: String!
          confirmPassword: String!
        ): User
        updateActiveUserAddress(where: AddressWhereUniqueInput!, data: AddressUpdateInput!): User
        createActiveUserAddress(data: AddressCreateInput!): User
        deleteActiveUserAddress(where: AddressWhereUniqueInput!): Address
        addDiscountToActiveCart(cartId: ID!, code: String!): Cart
        removeDiscountFromActiveCart(cartId: ID!, code: String!): Cart
        createActiveCartPaymentSessions(cartId: ID!): Cart
        setActiveCartPaymentSession(cartId: ID!, providerId: ID!): Cart
        completeActiveCart(cartId: ID!, paymentSessionId: ID): JSON
        addActiveCartShippingMethod(cartId: ID!, shippingMethodId: ID!): Cart
        initiatePaymentSession(
          cartId: ID!
          paymentProviderId: String!
        ): PaymentSession
        handlePaymentProviderWebhook(providerId: ID!, event: JSON!, headers: JSON!): WebhookResult!
        importInventory: Boolean
        adjustInventory(variantId: ID!, delta: Int!, reason: String!, note: String): ProductVariant
        getRatesForOrder(orderId: ID!, providerId: ID!, dimensions: DimensionsInput): [ShippingRate!]!
        validateShippingAddress(providerId: ID!, address: JSON!): AddressValidationResult!
        trackShipment(providerId: ID!, trackingNumber: String!): ShipmentTrackingResult!
        cancelShippingLabel(providerId: ID!, labelId: ID!): LabelCancellationResult!
        createProviderShippingLabel(
          orderId: ID!
          providerId: ID!
          rateId: String!
          dimensions: DimensionsInput
          lineItems: [LineItemInput!]
          idempotencyKey: String!
        ): ProviderShippingLabel
        createOrderFulfillment(
          orderId: ID!
          lineItems: [LineItemInput!]!
          trackingNumber: String
          carrier: String
          noNotification: Boolean
          idempotencyKey: String!
        ): Fulfillment!
        cancelOrderFulfillment(fulfillmentId: ID!, reason: String!): Fulfillment!
        transitionOrderStatus(orderId: ID!, status: String!, reason: String!): Order!
        regenerateCustomerToken: CustomerTokenResult!
        createInvoiceFromLineItems(accountId: ID!, regionId: ID!, lineItemIds: [ID!]!, dueDate: String): InvoiceCreationResult!
        createInvoicePaymentSessions(invoiceId: ID!): Invoice!
        initiateInvoicePaymentSession(invoiceId: ID!, paymentProviderId: String!): PaymentSession
        setInvoicePaymentSession(invoiceId: ID!, providerId: ID!): Invoice
        completeInvoicePayment(paymentSessionId: ID!): InvoicePaymentResult!
        processReturnRefund(returnId: ID!, paymentId: ID!, idempotencyKey: String!): Refund
        retryWebhookDeliveries(limit: Int): Int!
        registerWebhookEndpoint(
          registrationKey: String!
          url: String!
          events: [String!]!
          secret: String!
          requiredScope: String
        ): WebhookEndpoint!
        updatePrivacyPreferences(preferences: JSON!): JSON!
        requestPrivacyAction(action: String!, details: String): Notification
        placeCollectibleBid(auctionId: ID!, amountMinor: Int!, idempotencyKey: String!): Bid!
        submitCollectibleOffer(listingId: ID!, amountMinor: Int!, expiresAt: String!, message: String, idempotencyKey: String!): Offer!
      }
    `,
  resolvers: {
    Query: {
      redirectToInit,
      activeCart: activeCart_default,
      activeCartShippingOptions: activeCartShippingOptions_default,
      activeCartPaymentProviders: activeCartPaymentProviders_default,
      activeCartRegion: activeCartRegion_default,
      getCustomerOrder: getCustomerOrder_default,
      getCustomerOrders: getCustomerOrders_default,
      getCustomerAccount: getCustomerAccount_default,
      getCustomerAccounts: getCustomerAccounts_default,
      getUnpaidLineItemsByRegion: getUnpaidLineItemsByRegion_default,
      getInvoicePaymentSessions,
      getAnalytics,
      activeInvoice: activeInvoice_default,
      getCustomerPaidInvoices: getCustomerPaidInvoices_default,
      getFinanceClose,
      getMyPrivacyData,
      getProductsSortedByPrice,
      marketplaceCollectiblesCapabilities,
      publicCollectiblesDiscovery
    },
    Mutation: {
      receiveCollectibleItem,
      manageCollectibleListing,
      updateActiveUserPassword,
      createActiveCart: createActiveCart_default,
      createActiveCartProof,
      updateActiveCart: updateActiveCart_default,
      updateActiveCartLineItem: updateActiveCartLineItem_default,
      updateActiveUser: updateActiveUser_default,
      createActiveUserAddress,
      updateActiveUserAddress,
      deleteActiveUserAddress,
      addDiscountToActiveCart: addDiscountToActiveCart_default,
      removeDiscountFromActiveCart: removeDiscountFromActiveCart_default,
      createActiveCartPaymentSessions: createActiveCartPaymentSessions_default,
      setActiveCartPaymentSession: setActiveCartPaymentSession_default,
      completeActiveCart: completeActiveCart_default,
      addActiveCartShippingMethod: addActiveCartShippingMethod_default,
      initiatePaymentSession: initiatePaymentSession_default,
      handlePaymentProviderWebhook: handlePaymentProviderWebhook_default,
      importInventory,
      adjustInventory: adjustInventory_default,
      getRatesForOrder: getRatesForOrder_default,
      validateShippingAddress: validateShippingAddress_default,
      trackShipment: trackShipment_default,
      cancelShippingLabel: cancelShippingLabel_default,
      createProviderShippingLabel: createProviderShippingLabel_default,
      createOrderFulfillment: createOrderFulfillment_default,
      cancelOrderFulfillment: cancelOrderFulfillment_default,
      transitionOrderStatus: transitionOrderStatus_default,
      regenerateCustomerToken: regenerateCustomerToken_default,
      createInvoiceFromLineItems: createInvoiceFromLineItems_default,
      createInvoicePaymentSessions: createInvoicePaymentSessions_default,
      initiateInvoicePaymentSession: initiateInvoicePaymentSession_default,
      setInvoicePaymentSession: setInvoicePaymentSession_default,
      completeInvoicePayment: completeInvoicePayment_default,
      processReturnRefund: processReturnRefund_default,
      retryWebhookDeliveries: retryWebhookDeliveries_default,
      registerWebhookEndpoint: registerWebhookEndpoint_default,
      updatePrivacyPreferences,
      requestPrivacyAction,
      placeCollectibleBid,
      submitCollectibleOffer
    }
  }
});

// features/keystone/models/Address.ts
var import_access23 = require("@keystone-6/core/access");
var import_core2 = require("@keystone-6/core");
var import_fields6 = require("@keystone-6/core/fields");

// features/keystone/models/required-relationship.ts
var import_fields4 = require("@keystone-6/core/fields");
function requiredRelationship({ validation: _validation, ...config2 }) {
  if (config2.many) throw new Error("Required relationship helper expects one related item");
  const previous = config2.hooks?.validateInput;
  return (0, import_fields4.relationship)({
    ...config2,
    hooks: {
      ...config2.hooks,
      async validateInput(args) {
        if (previous) await previous(args);
        const { operation, resolvedData, fieldKey, addValidationError } = args;
        const change = resolvedData[fieldKey];
        const connected = change && typeof change === "object" && "connect" in change && Boolean(change.connect);
        const disconnected = change === null || change && typeof change === "object" && "disconnect" in change && change.disconnect === true;
        if (operation === "create" && !connected || disconnected) addValidationError(`${fieldKey} is required`);
      }
    }
  });
}

// features/keystone/models/trackingFields.ts
var import_fields5 = require("@keystone-6/core/fields");
var trackingFields = {
  createdAt: (data) => (0, import_fields5.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } }
  })(data),
  updatedAt: (data) => (0, import_fields5.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } }
  })(data)
};

// features/keystone/models/Address.ts
var canManageAddresses = ({ session }) => {
  if (!isSignedIn({ session })) {
    return false;
  }
  if (permissions.canManageUsers({ session })) {
    return true;
  }
  return { user: { id: { equals: session?.itemId } } };
};
var Address = (0, import_core2.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: canManageAddresses,
      update: canManageAddresses,
      delete: canManageAddresses
    }
  },
  hooks: {
    resolveInput: ({ operation, inputData, resolvedData, context }) => {
      if ((operation === "create" || operation === "update") && !permissions.canManageUsers({ session: context.session })) {
        return resolveCustomerAddressData({
          inputData,
          resolvedData,
          userId: context.session.itemId
        });
      }
      return resolvedData;
    }
  },
  fields: {
    label: (0, import_fields6.virtual)({
      field: import_core2.graphql.field({
        type: import_core2.graphql.String,
        resolve(item) {
          const parts = [];
          if (item.company) {
            parts.push(item.company);
          }
          if (item.firstName || item.lastName) {
            parts.push(`${item.firstName || ""} ${item.lastName || ""}`.trim());
          }
          if (item.address1) {
            parts.push(item.address1);
          }
          if (item.address2) {
            parts.push(item.address2);
          }
          const cityProvince = [];
          if (item.city) cityProvince.push(item.city);
          if (item.province) cityProvince.push(item.province);
          if (cityProvince.length > 0) {
            parts.push(cityProvince.join(", ") + (item.postalCode ? ` ${item.postalCode}` : ""));
          } else if (item.postalCode) {
            parts.push(item.postalCode);
          }
          return parts.join(" \u2022 ");
        }
      })
    }),
    company: (0, import_fields6.text)(),
    firstName: (0, import_fields6.text)(),
    lastName: (0, import_fields6.text)(),
    address1: (0, import_fields6.text)(),
    address2: (0, import_fields6.text)(),
    city: (0, import_fields6.text)(),
    province: (0, import_fields6.text)(),
    postalCode: (0, import_fields6.text)(),
    phone: (0, import_fields6.text)(),
    isBilling: (0, import_fields6.checkbox)({ defaultValue: false }),
    metadata: (0, import_fields6.json)(),
    country: requiredRelationship({
      ref: "Country.addresses",
      many: false,
      validation: { isRequired: true }
    }),
    user: (0, import_fields6.relationship)({
      ref: "User.addresses",
      many: false,
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if ((operation === "create" || operation === "update") && context.session?.itemId && !permissions.canManageUsers({ session: context.session })) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    shippingProviders: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingProvider.fromAddress",
      many: true
    }),
    cart: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Cart.addresses",
      many: false
    }),
    claimOrders: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ClaimOrder.address",
      many: true
    }),
    ordersUsingAsBillingAddress: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.billingAddress",
      many: true
    }),
    ordersUsingAsShippingAddress: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.shippingAddress",
      many: true
    }),
    cartsUsingAsBillingAddress: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Cart.billingAddress",
      many: true
    }),
    cartsUsingAsShippingAddress: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Cart.shippingAddress",
      many: true
    }),
    swaps: (0, import_fields6.relationship)({
      access: { create: import_access23.denyAll, update: import_access23.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Swap.address",
      many: true
    }),
    ...trackingFields
  },
  ui: {
    labelField: "label"
  }
});

// features/keystone/models/ApiKey.ts
var import_fields7 = require("@keystone-6/core/fields");
var import_core3 = require("@keystone-6/core");

// features/keystone/security/control-plane.ts
var import_access25 = require("@keystone-6/core/access");
var controlPlaneAccess = {
  passwordUpdate: import_access25.denyAll,
  emailUpdate: permissions.canManageRoles,
  keySecretUpdate: import_access25.denyAll,
  keyOwnerUpdate: import_access25.denyAll,
  userDeletionScope(args) {
    return permissions.canManageRoles(args) ? true : permissions.canManageUsers(args) ? { role: null } : false;
  },
  keyOwnerCreate({ session, inputData }) {
    if (!session?.itemId || isMachinePrincipal(session)) return false;
    if (permissions.canManageRoles({ session })) return true;
    if (!inputData.user) return true;
    const relation = inputData.user;
    if (typeof relation !== "object" || relation === null || !("connect" in relation)) return false;
    const connect = relation.connect;
    return typeof connect === "object" && connect !== null && "id" in connect && connect.id === session.itemId;
  }
};

// features/keystone/oauth/owner-scope-ceiling.ts
function attenuateScopesToOwnerRole(scopes, role) {
  if (!Array.isArray(scopes) || !role || typeof role !== "object") return [];
  const owner = role;
  return [...new Set(scopes.filter(
    (scope) => typeof scope === "string" && Object.prototype.hasOwnProperty.call(SCOPE_TO_PERMISSIONS, scope) && SCOPE_TO_PERMISSIONS[scope].every((permission) => owner[permission] === true)
  ))];
}
function ownerRoleAllowsScope(scope, role) {
  return attenuateScopesToOwnerRole([scope], role).length === 1;
}

// features/keystone/models/ApiKey.ts
var API_KEY_SCOPES = {
  // Products
  "read_products": "View products and inventory",
  "write_products": "Manage products and inventory",
  // Orders  
  "read_orders": "View orders and customer information",
  "write_orders": "Manage orders and fulfillments",
  // Customers (users in our system)
  "read_customers": "View customer information",
  "write_customers": "Manage customer accounts",
  // Fulfillments
  "read_fulfillments": "View fulfillment information",
  "write_fulfillments": "Manage fulfillments and shipping",
  // Checkouts
  "read_checkouts": "View checkout sessions",
  "write_checkouts": "Manage checkout sessions",
  // Discounts
  "read_discounts": "View discount codes and promotions",
  "write_discounts": "Manage discount codes and promotions",
  // Gift Cards
  "read_gift_cards": "View gift card information",
  "write_gift_cards": "Manage gift cards",
  // Returns
  "read_returns": "View return requests",
  "write_returns": "Manage return requests",
  // Sales Channels
  "read_sales_channels": "View sales channel information",
  "write_sales_channels": "Manage sales channels",
  // Payments
  "read_payments": "View payment information",
  "write_payments": "Process payments and refunds",
  // Webhooks
  "read_webhooks": "View webhook configurations",
  "write_webhooks": "Manage webhook configurations",
  // Apps & System
  "read_apps": "View installed applications",
  "write_apps": "Manage application installations"
};
var canManageApiKeys = (args) => !isMachinePrincipal(args.session) && permissions.canManageKeys(args);
var ApiKey = (0, import_core3.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: canManageApiKeys,
      update: canManageApiKeys,
      delete: canManageApiKeys
    },
    filter: {
      query: rules.canManageKeys,
      update: rules.canManageKeys,
      delete: rules.canManageKeys
    }
  },
  hooks: {
    validateInput: ({ operation, resolvedData, context, addValidationError }) => {
      if (operation === "update" && resolvedData.scopes === void 0) return;
      const scopes = resolvedData.scopes;
      if (!Array.isArray(scopes) || scopes.length === 0 || scopes.length > 24 || scopes.some((scope) => typeof scope !== "string")) {
        addValidationError("API keys require between 1 and 24 valid scopes");
        return;
      }
      if (new Set(scopes).size !== scopes.length) addValidationError("API key scopes cannot be duplicated");
      for (const scope of scopes) {
        if (!Object.prototype.hasOwnProperty.call(API_KEY_SCOPES, scope)) {
          addValidationError("API key scope is not supported");
        } else if (!ownerRoleAllowsScope(scope, context.session?.data?.role)) {
          addValidationError(`API key scope ${scope} exceeds the owner's current permissions`);
        }
      }
    },
    resolveInput: {
      create: async ({ resolvedData, context }) => {
        return {
          ...resolvedData,
          user: resolvedData.user || (context.session?.itemId ? { connect: { id: context.session.itemId } } : void 0)
        };
      }
    }
  },
  fields: {
    name: (0, import_fields7.text)({
      validation: { isRequired: true },
      ui: {
        description: "A descriptive name for this API key (e.g. 'Production Bot', 'Analytics Dashboard')"
      }
    }),
    tokenSecret: (0, import_fields7.password)({
      access: { update: controlPlaneAccess.keySecretUpdate },
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Secure API key token (hashed and never displayed)"
      }
    }),
    tokenPreview: (0, import_fields7.text)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        description: "Preview of the API key (actual key is hidden for security)"
      }
    }),
    scopes: (0, import_fields7.json)({
      defaultValue: [],
      ui: {
        description: "Array of scopes for this API key. Available scopes: orders:read, orders:write, shops:read, shops:write, channels:read, channels:write, etc."
      }
    }),
    status: (0, import_fields7.select)({
      type: "enum",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Revoked", value: "revoked" }
      ],
      defaultValue: "active",
      ui: {
        description: "Current status of this API key"
      }
    }),
    expiresAt: (0, import_fields7.timestamp)({
      ui: {
        description: "When this API key expires (optional - leave blank for no expiration)"
      }
    }),
    lastUsedAt: (0, import_fields7.timestamp)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Last time this API key was used"
      }
    }),
    usageCount: (0, import_fields7.json)({
      defaultValue: { total: 0, daily: {} },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Usage statistics for this API key"
      }
    }),
    restrictedToIPs: (0, import_fields7.json)({
      defaultValue: [],
      ui: {
        description: "Optional: Restrict this key to specific IP addresses (array of IPs)"
      }
    }),
    user: (0, import_fields7.relationship)({
      ref: "User.apiKeys",
      access: {
        create: controlPlaneAccess.keyOwnerCreate,
        update: controlPlaneAccess.keyOwnerUpdate
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" }
      }
    }),
    ...trackingFields
  },
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "tokenPreview", "scopes", "status", "lastUsedAt", "expiresAt"]
    },
    description: "Secure API keys for programmatic access to Openfront"
  }
});

// features/keystone/models/BatchJob.ts
var import_core4 = require("@keystone-6/core");
var import_fields8 = require("@keystone-6/core/fields");
var BatchJob = (0, import_core4.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadProducts({ session }) || permissions.canManageProducts({ session }),
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    type: (0, import_fields8.select)({
      type: "enum",
      options: [
        { label: "Product Import", value: "PRODUCT_IMPORT" },
        { label: "Order Export", value: "ORDER_EXPORT" },
        { label: "Inventory Update", value: "INVENTORY_UPDATE" },
        { label: "Price Update", value: "PRICE_UPDATE" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields8.select)({
      type: "enum",
      options: [
        { label: "Created", value: "CREATED" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Failed", value: "FAILED" },
        { label: "Canceled", value: "CANCELED" }
      ],
      defaultValue: "CREATED",
      validation: { isRequired: true }
    }),
    context: (0, import_fields8.json)({
      defaultValue: {}
    }),
    result: (0, import_fields8.json)({
      defaultValue: {}
    }),
    error: (0, import_fields8.text)(),
    progress: (0, import_fields8.integer)({
      defaultValue: 0,
      validation: {
        min: 0,
        max: 100
      }
    }),
    createdBy: (0, import_fields8.relationship)({
      ref: "User.batchJobs",
      many: false
    }),
    completedAt: (0, import_fields8.timestamp)(),
    ...trackingFields
  }
});

// features/keystone/models/lifecycle-ui.ts
var immutableRecordUi = { hideDelete: true, itemView: { defaultFieldMode: "read" } };
var lockedRecordUi = { ...immutableRecordUi, hideCreate: true };

// features/keystone/models/Capture.ts
var import_core5 = require("@keystone-6/core");
var import_access29 = require("@keystone-6/core/access");
var import_fields9 = require("@keystone-6/core/fields");
var Capture = (0, import_core5.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadPayments({ session }) || permissions.canManagePayments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    amount: (0, import_fields9.integer)({
      validation: {
        isRequired: true
      }
    }),
    providerCaptureKey: (0, import_fields9.text)({
      isIndexed: "unique",
      defaultValue: null,
      db: { isNullable: true },
      access: { read: import_access29.denyAll, create: () => false, update: () => false }
    }),
    payment: (0, import_fields9.relationship)({
      ref: "Payment.captures"
    }),
    metadata: (0, import_fields9.json)(),
    createdBy: (0, import_fields9.text)(),
    ...trackingFields
  }
});

// features/keystone/models/Cart.ts
var import_core6 = require("@keystone-6/core");
var import_access32 = require("@keystone-6/core/access");
var import_fields10 = require("@keystone-6/core/fields");

// features/keystone/security/raw-cart-create-access.ts
var canCreateRawCart = (args) => !isMachinePrincipal(args.session) && permissions.canManageOrders(args);

// features/keystone/models/Cart.ts
var formatCurrency = (amount, currencyCode) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(amount);
};
async function calculateCartSubtotal(cart, context) {
  const sudoContext = context.sudo();
  if (!cart?.lineItems?.length) return 0;
  if (!cart.region?.id || !cart.region.currency?.code) throw new Error("Cart currency is unavailable");
  let subtotal = 0;
  for (const lineItem of cart.lineItems) {
    const prices = await sudoContext.query.MoneyAmount.findMany({
      where: {
        productVariant: { id: { equals: lineItem.productVariant.id } },
        region: { id: { equals: cart.region.id } },
        currency: { code: { equals: cart.region?.currency?.code } }
      },
      query: "calculatedPrice { calculatedAmount }"
    });
    const price = prices[0]?.calculatedPrice?.calculatedAmount || 0;
    subtotal += price * lineItem.quantity;
  }
  return subtotal;
}
async function calculateCartDiscount(cart, context) {
  const sudoContext = context.sudo();
  if (!cart?.discounts?.length) return 0;
  let totalDiscountAmount = 0;
  for (const discount of cart.discounts) {
    if (!discount.discountRule?.type) continue;
    const { type, value, allocation } = discount.discountRule;
    const conditions = discount.discountRule.discountConditions || [];
    const currencyMultiplier = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
    const eligibleLineItems = [];
    for (const lineItem of cart.lineItems || []) {
      if (lineItem.productVariant?.product?.discountable === false) {
        continue;
      }
      const product = lineItem.productVariant?.product;
      if (!product) continue;
      const isEligible = validateProductAgainstConditions(product, conditions);
      if (isEligible) {
        eligibleLineItems.push(lineItem);
      }
    }
    if (eligibleLineItems.length === 0 && type !== "free_shipping") {
      continue;
    }
    let eligibleSubtotal = 0;
    for (const lineItem of eligibleLineItems) {
      const prices = await sudoContext.query.MoneyAmount.findMany({
        where: {
          productVariant: { id: { equals: lineItem.productVariant.id } },
          region: { id: { equals: cart.region?.id } },
          currency: { code: { equals: cart.region?.currency?.code } }
        },
        query: "calculatedPrice { calculatedAmount }"
      });
      const price = prices[0]?.calculatedPrice?.calculatedAmount || 0;
      eligibleSubtotal += price * lineItem.quantity;
    }
    switch (type) {
      case "percentage":
        totalDiscountAmount += eligibleSubtotal * (value / 100);
        break;
      case "fixed":
        if (allocation === "item") {
          const eligibleQuantity = eligibleLineItems.reduce((sum2, li) => sum2 + li.quantity, 0);
          totalDiscountAmount += value * currencyMultiplier * eligibleQuantity;
        } else {
          totalDiscountAmount += value * currencyMultiplier;
        }
        break;
      case "free_shipping":
        totalDiscountAmount += cart.shippingMethods?.reduce(
          (total, method) => total + (method.price || 0),
          0
        ) || 0;
        break;
    }
  }
  const subtotal = await calculateCartSubtotal(cart, context);
  return Math.min(totalDiscountAmount, subtotal);
}
function validateProductAgainstConditions(product, conditions) {
  const productConditions = conditions.filter(
    (c) => c.type === "products" || c.type === "product_types" || c.type === "product_collections" || c.type === "product_tags"
  );
  if (productConditions.length === 0) {
    return true;
  }
  for (const condition of productConditions) {
    const { type, operator } = condition;
    let conditionEntityIds = [];
    let productEntityIds = [];
    switch (type) {
      case "products":
        conditionEntityIds = condition.products?.map((p) => p.id) || [];
        productEntityIds = [product.id];
        break;
      case "product_types":
        conditionEntityIds = condition.productTypes?.map((t) => t.id) || [];
        productEntityIds = product.productType ? [product.productType.id] : [];
        break;
      case "product_collections":
        conditionEntityIds = condition.productCollections?.map((c) => c.id) || [];
        productEntityIds = product.productCollections?.map((c) => c.id) || [];
        break;
      case "product_tags":
        conditionEntityIds = condition.productTags?.map((t) => t.id) || [];
        productEntityIds = product.productTags?.map((t) => t.id) || [];
        break;
      default:
        continue;
    }
    if (conditionEntityIds.length === 0) {
      continue;
    }
    const hasMatch = productEntityIds.some((id3) => conditionEntityIds.includes(id3));
    if (operator === "in" && !hasMatch) {
      return false;
    }
    if (operator === "not_in" && hasMatch) {
      return false;
    }
  }
  return true;
}
async function calculateCartShipping(cart) {
  if (!cart?.shippingMethods?.length) return 0;
  return cart.shippingMethods.reduce(
    (total, method) => total + (method.price || 0),
    0
  );
}
async function calculateCartTax(cart, context) {
  const subtotal = await calculateCartSubtotal(cart, context);
  const discount = await calculateCartDiscount(cart, context);
  const taxableAmount = subtotal - discount;
  return taxableAmount * (cart.region?.taxRate || 0);
}
async function calculateCartTotal(cart, context) {
  const [subtotal, discount, shipping, tax] = await Promise.all([
    calculateCartSubtotal(cart, context),
    calculateCartDiscount(cart, context),
    calculateCartShipping(cart),
    calculateCartTax(cart, context)
  ]);
  return subtotal - discount + shipping + tax;
}
async function findCheapestShippingOption(regionId, context) {
  const sudoContext = context.sudo();
  const shippingOptions = await sudoContext.query.ShippingOption.findMany({
    where: {
      region: { id: { equals: regionId } },
      isReturn: { equals: false }
    },
    take: 1,
    query: `
      id
      amount
      name
    `,
    orderBy: { amount: "asc" }
  });
  return shippingOptions[0];
}
var Cart = (0, import_core6.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }) || Boolean(session?.customerToken),
      create: canCreateRawCart,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    },
    filter: {
      query: ({ session }) => {
        if (!session) return false;
        if (permissions.canManageOrders({ session })) return true;
        return { user: { id: { equals: session.itemId } } };
      },
      update: ({ session }) => {
        if (!session) return false;
        if (permissions.canManageOrders({ session })) return true;
        return { user: { id: { equals: session.itemId } } };
      }
    }
  },
  hooks: {
    async beforeOperation({ operation, resolvedData, context, item }) {
      const sudoContext = context.sudo();
      if (operation === "create" && !permissions.canManageOrders({ session: context.session })) {
        const allowedCreateFields = /* @__PURE__ */ new Set([
          "region",
          "type",
          ...context.session?.customerToken ? ["idempotencyKey"] : []
        ]);
        for (const key of Object.keys(resolvedData)) {
          if (!allowedCreateFields.has(key)) Reflect.deleteProperty(resolvedData, key);
        }
        resolvedData.type = "default";
      }
      if (operation === "create" && context.session?.itemId) {
        resolvedData.user = { connect: { id: context.session.itemId } };
      }
      if (operation === "delete") return;
      const regionId = resolvedData.region?.connect?.id;
      if (regionId && (operation === "create" || item.regionId !== regionId)) {
        const cheapestOption = await findCheapestShippingOption(regionId, context);
        if (operation === "create") {
          if (cheapestOption) {
            resolvedData.shippingMethods = {
              create: [{
                shippingOption: { connect: { id: cheapestOption.id } },
                price: cheapestOption.amount,
                data: { name: cheapestOption.name }
              }]
            };
          }
        } else {
          const shippingMethods = await sudoContext.db.ShippingMethod.findMany({ where: { cart: { id: { equals: item.id } } }, take: 101 });
          if (shippingMethods.length > 100) throw new Error("Cart shipping methods require review");
          if (shippingMethods.length) {
            await Promise.all(
              shippingMethods.map(
                (method) => sudoContext.db.ShippingMethod.deleteOne({
                  where: { id: method.id }
                })
              )
            );
          }
          if (cheapestOption) {
            await sudoContext.db.ShippingMethod.createOne({
              data: {
                cart: { connect: { id: item.id } },
                shippingOption: { connect: { id: cheapestOption.id } },
                price: cheapestOption.amount,
                data: { name: cheapestOption.name }
              }
            });
          }
          resolvedData.paymentCollection = { disconnect: true };
        }
      }
    }
  },
  fields: {
    email: (0, import_fields10.text)(),
    type: (0, import_fields10.select)({
      type: "enum",
      options: [
        { label: "Default", value: "default" },
        { label: "Swap", value: "swap" },
        { label: "Draft Order", value: "draft_order" },
        { label: "Payment Link", value: "payment_link" },
        { label: "Claim", value: "claim" }
      ],
      defaultValue: "default",
      validation: { isRequired: true }
    }),
    metadata: (0, import_fields10.json)(),
    idempotencyKey: (0, import_fields10.text)({
      isIndexed: "unique",
      db: { isNullable: true },
      ui: { itemView: { fieldMode: "read" } }
    }),
    context: (0, import_fields10.json)(),
    paymentAuthorizedAt: (0, import_fields10.timestamp)(),
    abandonedEmailSent: (0, import_fields10.checkbox)({ defaultValue: false }),
    // Track if abandoned cart email was sent
    user: (0, import_fields10.relationship)({
      ref: "User.carts",
      many: false,
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if ((operation === "create" || operation === "update") && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    // Regular fields
    region: (0, import_fields10.relationship)({
      ref: "Region.carts"
    }),
    addresses: (0, import_fields10.relationship)({
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Address.cart",
      many: true
    }),
    discounts: (0, import_fields10.relationship)({
      ref: "Discount.carts",
      many: true
    }),
    giftCards: (0, import_fields10.relationship)({
      ref: "GiftCard.carts",
      many: true
    }),
    draftOrder: (0, import_fields10.relationship)({
      ref: "DraftOrder.cart"
    }),
    order: (0, import_fields10.relationship)({
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.cart"
    }),
    lineItems: (0, import_fields10.relationship)({
      ref: "LineItem.cart",
      many: true
    }),
    customShippingOptions: (0, import_fields10.relationship)({
      ref: "CustomShippingOption.cart",
      many: true
    }),
    swap: (0, import_fields10.relationship)({
      ref: "Swap.cart"
    }),
    shippingMethods: (0, import_fields10.relationship)({
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingMethod.cart",
      many: true
    }),
    payment: (0, import_fields10.relationship)({
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Payment.cart"
    }),
    paymentCollection: (0, import_fields10.relationship)({
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "PaymentCollection.cart"
    }),
    billingAddress: (0, import_fields10.relationship)({
      ref: "Address.cartsUsingAsBillingAddress",
      many: false
    }),
    shippingAddress: (0, import_fields10.relationship)({
      ref: "Address.cartsUsingAsShippingAddress",
      many: false
    }),
    ...(0, import_core6.group)({
      label: "Virtual Fields",
      description: "Calculated fields for cart display and totals",
      fields: {
        abandonedFor: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.Int,
            resolve(item) {
              if (!item.updatedAt) return 0;
              const lastActivity = new Date(item.updatedAt).getTime();
              return Math.floor((Date.now() - lastActivity) / (1e3 * 60));
            }
          })
        }),
        status: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.enum({
              name: "CartStatus",
              values: import_core6.graphql.enumValues(["ACTIVE", "COMPLETED"])
            }),
            resolve(item) {
              return item.orderId ? "COMPLETED" : "ACTIVE";
            }
          })
        }),
        isActive: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.Boolean,
            resolve(item) {
              return !item.orderId;
            }
          })
        }),
        subtotal: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  lineItems { 
                    id 
                    quantity
                    productVariant {
                      id
                    }
                  } 
                  region { 
                    id
                    currency { 
                      code 
                      noDivisionCurrency 
                    }
                  }
                `
              });
              if (!cart) return null;
              const subtotal = await calculateCartSubtotal(cart, context);
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              return formatCurrency(subtotal / divisor, currencyCode);
            }
          })
        }),
        total: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  lineItems {
                    id
                    quantity
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  shippingMethods {
                    price
                  }
                `
              });
              const total = await calculateCartTotal(cart, context);
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              return formatCurrency(total / divisor, currencyCode);
            }
          })
        }),
        rawTotal: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.Int,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  lineItems {
                    id
                    quantity
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  shippingMethods {
                    price
                  }
                `
              });
              if (!cart) return 0;
              return Math.round(await calculateCartTotal(cart, context));
            }
          })
        }),
        rawSubtotal: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  lineItems { 
                    id 
                    quantity
                    productVariant {
                      id
                      title
                      product {
                        title
                      }
                    }
                  } 
                  region { 
                    id
                    currency { 
                      code 
                      noDivisionCurrency 
                    }
                  }
                `
              });
              if (!cart?.lineItems?.length) return "No items in cart";
              if (!cart.region?.id) throw new Error("Cart region is unavailable");
              let subtotal = 0;
              const breakdown = [];
              for (const lineItem of cart.lineItems) {
                const prices = await sudoContext.query.MoneyAmount.findMany({
                  where: {
                    productVariant: { id: { equals: lineItem.productVariant.id } },
                    region: { id: { equals: cart.region.id } },
                    currency: { code: { equals: cart.region?.currency?.code } }
                  },
                  query: "id region { id } currency { code } calculatedPrice { calculatedAmount }"
                });
                const price = prices[0]?.calculatedPrice?.calculatedAmount || 0;
                const itemTotal = price * lineItem.quantity;
                subtotal += itemTotal;
                const title = `${lineItem.productVariant.product?.title} - ${lineItem.productVariant.title}`;
                breakdown.push(`${title}: ${price} \xD7 ${lineItem.quantity} = ${itemTotal}`);
              }
              return `Total: ${subtotal}
Breakdown:
${breakdown.join("\n")}`;
            }
          })
        }),
        rawTotalBreakdown: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  lineItems {
                    id
                    quantity
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  shippingMethods {
                    price
                  }
                `
              });
              if (!cart) return "Cart not found";
              const subtotal = await calculateCartSubtotal(cart, context);
              const discount = await calculateCartDiscount(cart, context);
              const shipping = await calculateCartShipping(cart);
              const tax = await calculateCartTax(cart, context);
              const total = subtotal - discount + shipping + tax;
              return `subtotal(${subtotal}) - discount(${discount}) + shipping(${shipping}) + tax(${tax}) = ${total}`;
            }
          })
        }),
        discount: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  lineItems { 
                    id 
                    quantity 
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  region {
                    id
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  shippingMethods {
                    price
                    shippingOption {
                      id
                      name
                    }
                  }
                `
              });
              if (!cart?.discounts?.length) {
                return null;
              }
              if (!cart.region?.id) throw new Error("Cart region is unavailable");
              let subtotal = 0;
              for (const lineItem of cart.lineItems || []) {
                const prices = await sudoContext.query.MoneyAmount.findMany({
                  where: {
                    productVariant: {
                      id: { equals: lineItem.productVariant.id }
                    },
                    region: { id: { equals: cart.region.id } },
                    currency: { code: { equals: cart.region?.currency?.code } }
                  },
                  query: "calculatedPrice { calculatedAmount }"
                });
                const price = prices[0]?.calculatedPrice?.calculatedAmount || 0;
                subtotal += price * lineItem.quantity;
              }
              let totalDiscountAmount = 0;
              for (const discount of cart.discounts) {
                if (!discount.discountRule?.type) continue;
                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * (cart.region?.currency?.noDivisionCurrency ? 1 : 100);
                    break;
                  case "free_shipping":
                    totalDiscountAmount += cart.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }
              if (totalDiscountAmount === 0) return null;
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              return formatCurrency(
                totalDiscountAmount / divisor,
                currencyCode
              );
            }
          })
        }),
        giftCardTotal: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  giftCards {
                    id
                    balance
                    value
                  }
                  region {
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `
              });
              if (!cart?.giftCards?.length) {
                return null;
              }
              const total = cart.giftCards.reduce((sum2, card) => {
                const usableAmount = Math.min(
                  card.balance,
                  card.value || card.balance
                );
                return sum2 + usableAmount;
              }, 0);
              if (total === 0) return null;
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              return formatCurrency(total / divisor, currencyCode);
            }
          })
        }),
        tax: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  region {
                    taxRate
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  lineItems {
                    id
                    quantity
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                `
              });
              const tax = await calculateCartTax(cart, context);
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              return formatCurrency(tax / divisor, currencyCode);
            }
          })
        }),
        shipping: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  shippingMethods {
                    price
                  }
                  region {
                    id
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `
              });
              if (cart.shippingMethods && cart.shippingMethods.length > 0) {
                const shipping = await calculateCartShipping(cart);
                const currencyCode = cart.region?.currency?.code || "USD";
                const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
                return shipping > 0 ? formatCurrency(shipping / divisor, currencyCode) : null;
              }
              if (cart?.region?.id) {
                const shippingOptions = await sudoContext.query.ShippingOption.findMany({
                  where: {
                    region: { id: { equals: cart.region.id } },
                    isReturn: { equals: false }
                  },
                  query: `
                    amount
                    priceType
                    calculatedAmount
                  `,
                  orderBy: { amount: "asc" }
                });
                if (shippingOptions?.length > 0) {
                  const currencyCode = cart.region?.currency?.code || "USD";
                  const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
                  return formatCurrency(
                    shippingOptions[0].amount / divisor,
                    currencyCode
                  );
                }
              }
              return null;
            }
          })
        }),
        cheapestShipping: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  shippingMethods {
                    price
                  }
                  region {
                    id
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                `
              });
              if (cart.shippingMethods && cart.shippingMethods.length > 0) {
                const shippingAmount = cart.shippingMethods.reduce(
                  (total, method) => total + (method.price || 0),
                  0
                );
                const currencyCode = cart.region?.currency?.code || "USD";
                const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
                return formatCurrency(shippingAmount / divisor, currencyCode);
              }
              if (cart?.region?.id) {
                const shippingOptions = await sudoContext.query.ShippingOption.findMany({
                  where: {
                    region: { id: { equals: cart.region.id } },
                    isReturn: { equals: false }
                  },
                  query: `
                    amount
                    priceType
                    calculatedAmount
                  `,
                  orderBy: { amount: "asc" }
                });
                if (shippingOptions?.length > 0) {
                  const currencyCode = cart.region?.currency?.code || "USD";
                  const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
                  return formatCurrency(
                    shippingOptions[0].amount / divisor,
                    currencyCode
                  );
                }
              }
              return null;
            }
          })
        }),
        discountsById: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.JSON,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  lineItems { 
                    id 
                    quantity 
                    productVariant {
                      id
                      product {
                        id
                        discountable
                        productType { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  discounts {
                    id
                    discountRule {
                      type
                      value
                      allocation
                      discountConditions {
                        id
                        type
                        operator
                        products { id }
                        productTypes { id }
                        productCollections { id }
                        productTags { id }
                      }
                    }
                  }
                  region {
                    id
                    currency {
                      code
                      noDivisionCurrency
                    }
                  }
                  shippingMethods {
                    price
                    shippingOption {
                      id
                      name
                    }
                  }
                `
              });
              if (!cart?.discounts?.length) {
                return {};
              }
              const currencyCode = cart.region?.currency?.code || "USD";
              const divisor = cart.region?.currency?.noDivisionCurrency ? 1 : 100;
              if (!cart.region?.id) throw new Error("Cart region is unavailable");
              let subtotal = 0;
              for (const lineItem of cart.lineItems || []) {
                const prices = await sudoContext.query.MoneyAmount.findMany({
                  where: {
                    productVariant: {
                      id: { equals: lineItem.productVariant.id }
                    },
                    region: { id: { equals: cart.region.id } },
                    currency: { code: { equals: currencyCode } }
                  },
                  query: "calculatedPrice { calculatedAmount }"
                });
                const price = prices[0]?.calculatedPrice?.calculatedAmount || 0;
                subtotal += price * lineItem.quantity;
              }
              const discountAmounts = {};
              for (const discount of cart.discounts) {
                if (!discount.discountRule?.type) continue;
                let amount = 0;
                switch (discount.discountRule.type) {
                  case "percentage":
                    amount = subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    amount = discount.discountRule.value * (cart.region?.currency?.noDivisionCurrency ? 1 : 100);
                    break;
                  case "free_shipping":
                    amount = cart.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
                if (amount > 0) {
                  discountAmounts[discount.id] = formatCurrency(
                    amount / divisor,
                    currencyCode
                  );
                }
              }
              return discountAmounts;
            }
          })
        }),
        checkoutStep: (0, import_fields10.virtual)({
          field: import_core6.graphql.field({
            type: import_core6.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const cart = await sudoContext.query.Cart.findOne({
                where: { id: item.id },
                query: `
                  id
                  email
                  billingAddress { id }
                  shippingAddress { id }
                  shippingMethods {
                    id
                  }
                  paymentCollection {
                    id
                    paymentSessions {
                      id
                      isSelected
                    }
                  }
                  lineItems {
                    id
                  }
                `
              });
              if (!cart || !cart.lineItems?.length) return "cart";
              if (!cart.billingAddress?.id || !cart.shippingAddress?.id)
                return "address";
              if (!cart.shippingMethods?.length) return "delivery";
              if (!cart.paymentCollection?.id || !cart.paymentCollection?.paymentSessions?.some(
                (s) => s.isSelected
              )) {
                return "payment";
              }
              return "review";
            }
          })
        })
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/ClaimImage.ts
var import_core7 = require("@keystone-6/core");
var import_fields11 = require("@keystone-6/core/fields");
var ClaimImage = (0, import_core7.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    // image: cloudinaryImage({
    //   cloudinary,
    //   label: 'Source',
    // }),
    image: (0, import_fields11.image)({ storage: "my_images" }),
    url: (0, import_fields11.text)({
      label: "Image URL",
      ui: {
        description: "Direct URL to the image file"
      }
    }),
    altText: (0, import_fields11.text)(),
    claimItem: (0, import_fields11.relationship)({ ref: "ClaimItem.claimImages" }),
    metadata: (0, import_fields11.json)(),
    ...trackingFields
  },
  ui: {
    listView: {
      initialColumns: ["image", "altText", "claimItem"]
    }
  }
});

// features/keystone/models/ClaimItem.ts
var import_core8 = require("@keystone-6/core");
var import_fields12 = require("@keystone-6/core/fields");
var ClaimItem = (0, import_core8.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    reason: (0, import_fields12.select)({
      type: "enum",
      options: [
        {
          label: "Missing Item",
          value: "missing_item"
        },
        {
          label: "Wrong Item",
          value: "wrong_item"
        },
        {
          label: "Production Failure",
          value: "production_failure"
        },
        {
          label: "Other",
          value: "other"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    note: (0, import_fields12.text)(),
    quantity: (0, import_fields12.integer)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields12.json)(),
    productVariant: (0, import_fields12.relationship)({
      ref: "ProductVariant.claimItems"
    }),
    lineItem: (0, import_fields12.relationship)({
      ref: "LineItem.claimItems"
    }),
    claimOrder: (0, import_fields12.relationship)({
      ref: "ClaimOrder.claimItems"
    }),
    claimImages: (0, import_fields12.relationship)({
      ref: "ClaimImage.claimItem",
      many: true
    }),
    claimTags: (0, import_fields12.relationship)({
      ref: "ClaimTag.claimItems",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ClaimOrder.ts
var import_core9 = require("@keystone-6/core");
var import_access36 = require("@keystone-6/core/access");
var import_fields13 = require("@keystone-6/core/fields");
var ClaimOrder = (0, import_core9.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    paymentStatus: (0, import_fields13.select)({
      type: "enum",
      options: [
        {
          label: "Na",
          value: "na"
        },
        {
          label: "Not Refunded",
          value: "not_refunded"
        },
        {
          label: "Refunded",
          value: "refunded"
        }
      ],
      defaultValue: "na",
      validation: {
        isRequired: true
      }
    }),
    fulfillmentStatus: (0, import_fields13.select)({
      type: "enum",
      options: [
        {
          label: "Not Fulfilled",
          value: "not_fulfilled"
        },
        {
          label: "Partially Fulfilled",
          value: "partially_fulfilled"
        },
        {
          label: "Fulfilled",
          value: "fulfilled"
        },
        {
          label: "Partially Shipped",
          value: "partially_shipped"
        },
        {
          label: "Shipped",
          value: "shipped"
        },
        {
          label: "Partially Returned",
          value: "partially_returned"
        },
        {
          label: "Returned",
          value: "returned"
        },
        {
          label: "Canceled",
          value: "canceled"
        },
        {
          label: "Requires Action",
          value: "requires_action"
        }
      ],
      defaultValue: "not_fulfilled",
      validation: {
        isRequired: true
      }
    }),
    type: (0, import_fields13.select)({
      type: "enum",
      options: [
        {
          label: "Refund",
          value: "refund"
        },
        {
          label: "Replace",
          value: "replace"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    refundAmount: (0, import_fields13.integer)(),
    canceledAt: (0, import_fields13.timestamp)(),
    metadata: (0, import_fields13.json)(),
    idempotencyKey: (0, import_fields13.text)(),
    noNotification: (0, import_fields13.checkbox)(),
    address: (0, import_fields13.relationship)({
      ref: "Address.claimOrders"
    }),
    order: (0, import_fields13.relationship)({
      ref: "Order.claimOrders"
    }),
    claimItems: (0, import_fields13.relationship)({
      ref: "ClaimItem.claimOrder",
      many: true
    }),
    fulfillments: (0, import_fields13.relationship)({
      access: { create: import_access36.denyAll, update: import_access36.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Fulfillment.claimOrder",
      many: true
    }),
    lineItems: (0, import_fields13.relationship)({
      ref: "LineItem.claimOrder",
      many: true
    }),
    return: (0, import_fields13.relationship)({
      ref: "Return.claimOrder"
    }),
    shippingMethods: (0, import_fields13.relationship)({
      access: { create: import_access36.denyAll, update: import_access36.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingMethod.claimOrder",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ClaimTag.ts
var import_core10 = require("@keystone-6/core");
var import_fields14 = require("@keystone-6/core/fields");
var ClaimTag = (0, import_core10.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    value: (0, import_fields14.text)({
      validation: {
        isRequired: true
      }
    }),
    description: (0, import_fields14.text)(),
    metadata: (0, import_fields14.json)(),
    claimItems: (0, import_fields14.relationship)({
      ref: "ClaimItem.claimTags",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/Country.ts
var import_core11 = require("@keystone-6/core");
var import_access39 = require("@keystone-6/core/access");
var import_fields15 = require("@keystone-6/core/fields");
var Country = (0, import_core11.list)({
  access: {
    operation: {
      query: () => true,
      // query: ({ session }) =>
      //   permissions.canReadUsers({ session }) ||
      //   permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    iso2: (0, import_fields15.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    iso3: (0, import_fields15.text)({
      validation: {
        isRequired: true
      }
    }),
    numCode: (0, import_fields15.integer)({
      validation: {
        isRequired: true
      }
    }),
    name: (0, import_fields15.text)({
      validation: {
        isRequired: true
      }
    }),
    displayName: (0, import_fields15.text)({
      validation: {
        isRequired: true
      }
    }),
    region: (0, import_fields15.relationship)({
      ref: "Region.countries"
    }),
    addresses: (0, import_fields15.relationship)({
      access: { create: import_access39.denyAll, update: import_access39.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Address.country",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/Currency.ts
var import_access41 = require("@keystone-6/core/access");
var import_core12 = require("@keystone-6/core");
var import_fields16 = require("@keystone-6/core/fields");
var Currency = (0, import_core12.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  hooks: {
    validateInput({ operation, resolvedData, item, addValidationError }) {
      const code = operation === "create" ? resolvedData.code : resolvedData.code ?? item.code;
      try {
        if (typeof code !== "string" || ![0, 2].includes(currencyExponent(code))) addValidationError("Currency precision is not supported by this price contract");
      } catch {
        addValidationError("Unsupported currency");
      }
    }
  },
  fields: {
    code: (0, import_fields16.text)({
      access: { update: import_access41.denyAll },
      ui: { itemView: { fieldMode: "read" } },
      isIndexed: "unique",
      validation: { isRequired: true }
    }),
    symbol: (0, import_fields16.text)({
      validation: { isRequired: true }
    }),
    symbolNative: (0, import_fields16.text)({
      validation: { isRequired: true }
    }),
    name: (0, import_fields16.text)({
      validation: { isRequired: true }
    }),
    moneyAmounts: (0, import_fields16.relationship)({
      ref: "MoneyAmount.currency",
      many: true
    }),
    orders: (0, import_fields16.relationship)({
      access: { create: import_access41.denyAll, update: import_access41.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.currency",
      many: true
    }),
    payments: (0, import_fields16.relationship)({
      access: { create: import_access41.denyAll, update: import_access41.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Payment.currency",
      many: true
    }),
    regions: (0, import_fields16.relationship)({
      access: { create: import_access41.denyAll, update: import_access41.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Region.currency",
      many: true
    }),
    stores: (0, import_fields16.relationship)({
      ref: "Store.currencies",
      many: true
    }),
    accounts: (0, import_fields16.relationship)({
      access: { create: import_access41.denyAll, update: import_access41.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Account.currency",
      many: true
    }),
    invoices: (0, import_fields16.relationship)({
      access: { create: import_access41.denyAll, update: import_access41.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Invoice.currency",
      many: true
    }),
    ...(0, import_core12.group)({
      label: "Virtual Fields",
      description: "Virtual fields for currency",
      fields: {
        noDivisionCurrency: (0, import_fields16.virtual)({
          field: import_core12.graphql.field({
            type: import_core12.graphql.Boolean,
            resolve(item) {
              const exponent = currencyExponent(item.code);
              if (exponent !== 0 && exponent !== 2) throw new Error("Unsupported currency precision");
              return exponent === 0;
            }
          })
        })
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleCatalog.ts
var import_core13 = require("@keystone-6/core");
var import_access43 = require("@keystone-6/core/access");
var import_fields17 = require("@keystone-6/core/fields");
var canRead = ({ session }) => permissions.canReadCollectibles({ session }) || permissions.canManageCatalog({ session });
var canManage = permissions.canManageCatalog;
var managedAccess = {
  operation: { query: canRead, create: canManage, update: canManage, delete: canManage }
};
var CollectibleCategory = (0, import_core13.list)({
  access: managedAccess,
  ui: { labelField: "name", listView: { initialColumns: ["name", "parent", "status", "sortOrder"] } },
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    description: (0, import_fields17.text)({ ui: { displayMode: "textarea" } }),
    parent: (0, import_fields17.relationship)({ ref: "CollectibleCategory.children" }),
    children: (0, import_fields17.relationship)({ ref: "CollectibleCategory.parent", many: true }),
    attributeDefinitions: (0, import_fields17.relationship)({ ref: "AttributeDefinition.category", many: true }),
    status: (0, import_fields17.select)({ type: "string", options: ["draft", "active", "archived"], defaultValue: "draft" }),
    sortOrder: (0, import_fields17.integer)({ defaultValue: 0 }),
    publicMetadata: (0, import_fields17.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var AttributeDefinition = (0, import_core13.list)({
  access: managedAccess,
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    category: (0, import_fields17.relationship)({ ref: "CollectibleCategory.attributeDefinitions" }),
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    key: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: true }),
    valueType: (0, import_fields17.select)({ type: "string", options: ["text", "integer", "decimal", "boolean", "date", "select", "multiselect"], defaultValue: "text" }),
    required: (0, import_fields17.checkbox)({ defaultValue: false }),
    filterable: (0, import_fields17.checkbox)({ defaultValue: true }),
    public: (0, import_fields17.checkbox)({ defaultValue: true }),
    options: (0, import_fields17.json)({ defaultValue: [] }),
    validationRules: (0, import_fields17.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var Franchise = (0, import_core13.list)({
  access: managedAccess,
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    description: (0, import_fields17.text)({ ui: { displayMode: "textarea" } }),
    externalReferences: (0, import_fields17.json)({ defaultValue: [] }),
    ...trackingFields
  }
});
var CollectibleSet = (0, import_core13.list)({
  access: managedAccess,
  ui: { labelField: "name" },
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    franchise: (0, import_fields17.relationship)({ ref: "Franchise" }),
    category: (0, import_fields17.relationship)({ ref: "CollectibleCategory" }),
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    manufacturer: (0, import_fields17.text)(),
    startYear: (0, import_fields17.integer)(),
    endYear: (0, import_fields17.integer)(),
    metadata: (0, import_fields17.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var CollectibleRelease = (0, import_core13.list)({
  access: managedAccess,
  ui: { labelField: "name" },
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    collectibleSet: (0, import_fields17.relationship)({ ref: "CollectibleSet" }),
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    releaseDate: (0, import_fields17.timestamp)(),
    edition: (0, import_fields17.text)(),
    printRunReported: (0, import_fields17.integer)({ validation: { min: 0 } }),
    printRunSource: (0, import_fields17.text)(),
    publicNotes: (0, import_fields17.text)({ ui: { displayMode: "textarea" } }),
    ...trackingFields
  }
});
var CatalogItem = (0, import_core13.list)({
  access: managedAccess,
  ui: { labelField: "title", listView: { initialColumns: ["title", "category", "release", "catalogNumber", "status"] } },
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    category: (0, import_fields17.relationship)({ ref: "CollectibleCategory" }),
    franchise: (0, import_fields17.relationship)({ ref: "Franchise" }),
    collectibleSet: (0, import_fields17.relationship)({ ref: "CollectibleSet" }),
    release: (0, import_fields17.relationship)({ ref: "CollectibleRelease" }),
    title: (0, import_fields17.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    catalogNumber: (0, import_fields17.text)(),
    maker: (0, import_fields17.text)(),
    year: (0, import_fields17.integer)(),
    description: (0, import_fields17.text)({ ui: { displayMode: "textarea" } }),
    attributeValues: (0, import_fields17.json)({ defaultValue: {} }),
    status: (0, import_fields17.select)({ type: "string", options: ["draft", "active", "archived"], defaultValue: "draft" }),
    specimens: (0, import_fields17.relationship)({ ref: "Specimen.catalogItem", many: true }),
    media: (0, import_fields17.relationship)({ ref: "CollectibleMedia.catalogItem", many: true }),
    ...trackingFields
  }
});
var Specimen = (0, import_core13.list)({
  graphql: { plural: "Specimens" },
  // Mutable catalog descriptions are not physical claim/tenant/lifecycle authority.
  access: { operation: { query: canRead, create: canManage, update: canManage, delete: import_access43.denyAll } },
  ui: { labelField: "displayName", listView: { initialColumns: ["displayName", "catalogItem", "lifecycleStatus", "updatedAt"] } },
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store", access: { create: canManage, update: import_access43.denyAll } }),
    catalogItem: (0, import_fields17.relationship)({ ref: "CatalogItem.specimens" }),
    displayName: (0, import_fields17.text)({ validation: { isRequired: true } }),
    specimenCode: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    lifecycleStatus: (0, import_fields17.select)({ type: "string", options: ["intake", "review", "available", "reserved", "sold", "returned", "withdrawn"], defaultValue: "intake", access: { create: import_access43.denyAll, update: import_access43.denyAll } }),
    attributeValues: (0, import_fields17.json)({ defaultValue: {} }),
    identifiers: (0, import_fields17.relationship)({ ref: "SpecimenIdentifier.specimen", many: true }),
    media: (0, import_fields17.relationship)({ ref: "CollectibleMedia.specimen", many: true }),
    conditionObservations: (0, import_fields17.relationship)({
      access: { create: import_access43.denyAll, update: import_access43.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ConditionObservation.specimen",
      many: true
    }),
    gradeObservations: (0, import_fields17.relationship)({
      access: { create: import_access43.denyAll, update: import_access43.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "GradeObservation.specimen",
      many: true
    }),
    provenanceEvents: (0, import_fields17.relationship)({
      access: { create: import_access43.denyAll, update: import_access43.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ProvenanceEvent.specimen",
      many: true
    }),
    custodyEvents: (0, import_fields17.relationship)({
      access: { create: import_access43.denyAll, update: import_access43.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "CustodyEvent.specimen",
      many: true
    }),
    valuationObservations: (0, import_fields17.relationship)({
      access: { create: import_access43.denyAll, update: import_access43.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ValuationObservation.specimen",
      many: true
    }),
    inventoryUnits: (0, import_fields17.relationship)({ ref: "InventoryUnit.specimen", many: true, access: { create: import_access43.denyAll, update: import_access43.denyAll } }),
    ...trackingFields
  }
});
var SpecimenIdentifier = (0, import_core13.list)({
  access: managedAccess,
  fields: {
    specimen: (0, import_fields17.relationship)({ ref: "Specimen.identifiers" }),
    type: (0, import_fields17.select)({ type: "string", options: ["operator", "serial", "edition", "manufacturer", "registry", "certificate", "other"], defaultValue: "operator" }),
    issuer: (0, import_fields17.text)(),
    value: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: true }),
    observedAt: (0, import_fields17.timestamp)({ defaultValue: { kind: "now" } }),
    evidence: (0, import_fields17.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var CollectibleMedia = (0, import_core13.list)({
  access: managedAccess,
  fields: {
    store: (0, import_fields17.relationship)({ ref: "Store" }),
    catalogItem: (0, import_fields17.relationship)({ ref: "CatalogItem.media" }),
    specimen: (0, import_fields17.relationship)({ ref: "Specimen.media" }),
    kind: (0, import_fields17.select)({ type: "string", options: ["image", "video", "document", "scan"], defaultValue: "image" }),
    url: (0, import_fields17.text)({ validation: { isRequired: true } }),
    altText: (0, import_fields17.text)(),
    visibility: (0, import_fields17.select)({ type: "string", options: ["public", "restricted", "private"], defaultValue: "restricted" }),
    source: (0, import_fields17.text)(),
    capturedAt: (0, import_fields17.timestamp)(),
    checksum: (0, import_fields17.text)(),
    metadata: (0, import_fields17.json)({ defaultValue: {} }),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleEvidence.ts
var import_core14 = require("@keystone-6/core");
var import_fields18 = require("@keystone-6/core/fields");
var import_access45 = require("@keystone-6/core/access");
var canRead2 = ({ session }) => permissions.canReadCollectibles({ session }) || permissions.canManageEvidence({ session });
var canManage2 = permissions.canManageEvidence;
var managedAccess2 = { operation: { query: canRead2, create: canManage2, update: canManage2, delete: canManage2 } };
var appendOnlyEvidenceAccess = { operation: { query: canRead2, create: canManage2, update: () => false, delete: () => false } };
var ConditionObservation = (0, import_core14.list)({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: (0, import_fields18.relationship)({ ref: "Specimen.conditionObservations" }),
    observer: (0, import_fields18.relationship)({ ref: "User" }),
    sourceType: (0, import_fields18.select)({ type: "string", options: ["operator", "seller", "buyer", "provider", "import"], defaultValue: "operator" }),
    scale: (0, import_fields18.text)(),
    label: (0, import_fields18.text)({ validation: { isRequired: true } }),
    score: (0, import_fields18.text)(),
    notes: (0, import_fields18.text)({ ui: { displayMode: "textarea" } }),
    observedAt: (0, import_fields18.timestamp)({ defaultValue: { kind: "now" } }),
    status: (0, import_fields18.select)({ type: "string", options: ["reported", "reviewed", "superseded", "disputed"], defaultValue: "reported" }),
    publiclyVisible: (0, import_fields18.checkbox)({ defaultValue: false }),
    mediaReferences: (0, import_fields18.json)({ defaultValue: [] }),
    evidence: (0, import_fields18.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var GradingCompany = (0, import_core14.list)({
  access: managedAccess2,
  fields: {
    name: (0, import_fields18.text)({ validation: { isRequired: true } }),
    code: (0, import_fields18.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    website: (0, import_fields18.text)(),
    certificateLookupTemplate: (0, import_fields18.text)(),
    active: (0, import_fields18.checkbox)({ defaultValue: true }),
    disclaimer: (0, import_fields18.text)({ defaultValue: "Provider-reported grading evidence; not an Openfront authenticity determination." }),
    ...trackingFields
  }
});
var GradeObservation = (0, import_core14.list)({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: (0, import_fields18.relationship)({ ref: "Specimen.gradeObservations" }),
    gradingCompany: (0, import_fields18.relationship)({ ref: "GradingCompany" }),
    reportedGrade: (0, import_fields18.text)({ validation: { isRequired: true } }),
    reportedLabel: (0, import_fields18.text)(),
    certificateReference: (0, import_fields18.text)({ isIndexed: true }),
    certificateLookupUrl: (0, import_fields18.text)(),
    observedAt: (0, import_fields18.timestamp)({ defaultValue: { kind: "now" } }),
    verificationState: (0, import_fields18.select)({ type: "string", options: ["not_checked", "provider_reported", "matched", "mismatch", "unavailable", "manual_review"], defaultValue: "not_checked" }),
    publiclyVisible: (0, import_fields18.checkbox)({ defaultValue: false }),
    providerResponseHash: (0, import_fields18.text)(),
    providerResponse: (0, import_fields18.json)({ defaultValue: null, access: { read: canManage2, create: canManage2, update: canManage2 } }),
    reviewedBy: (0, import_fields18.relationship)({ ref: "User" }),
    reviewedAt: (0, import_fields18.timestamp)(),
    disclaimer: (0, import_fields18.text)({ defaultValue: "This records an attributed grading/certificate observation and does not establish authenticity." }),
    ...trackingFields
  }
});
var ProvenanceEvent = (0, import_core14.list)({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: (0, import_fields18.relationship)({ ref: "Specimen.provenanceEvents" }),
    eventType: (0, import_fields18.select)({ type: "string", options: ["claimed_origin", "ownership", "sale", "exhibition", "publication", "restoration", "loss", "recovery", "other"], defaultValue: "other" }),
    occurredAt: (0, import_fields18.timestamp)(),
    recordedAt: (0, import_fields18.timestamp)({ defaultValue: { kind: "now" } }),
    summary: (0, import_fields18.text)({ validation: { isRequired: true } }),
    source: (0, import_fields18.text)(),
    confidence: (0, import_fields18.select)({ type: "string", options: ["unreviewed", "low", "medium", "high", "provider_reported"], defaultValue: "unreviewed" }),
    reviewState: (0, import_fields18.select)({ type: "string", options: ["reported", "reviewed", "disputed", "rejected"], defaultValue: "reported" }),
    publiclyVisible: (0, import_fields18.checkbox)({ defaultValue: false }),
    publicEvidence: (0, import_fields18.json)({ defaultValue: [] }),
    restrictedParties: (0, import_fields18.json)({ defaultValue: null, access: { read: canManage2, create: canManage2, update: canManage2 } }),
    reviewedBy: (0, import_fields18.relationship)({ ref: "User" }),
    ...trackingFields
  }
});
var CustodyEvent = (0, import_core14.list)({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: (0, import_fields18.relationship)({ ref: "Specimen.custodyEvents" }),
    type: (0, import_fields18.select)({ type: "string", options: ["intake", "received", "stored", "moved", "released", "shipped", "delivered", "returned", "inspection"], defaultValue: "intake" }),
    occurredAt: (0, import_fields18.timestamp)({ defaultValue: { kind: "now" } }),
    fromLocation: (0, import_fields18.relationship)({ ref: "InventoryLocation" }),
    toLocation: (0, import_fields18.relationship)({ ref: "InventoryLocation" }),
    actor: (0, import_fields18.relationship)({ ref: "User" }),
    counterpartyReference: (0, import_fields18.text)({ access: { read: canManage2, create: canManage2, update: canManage2 } }),
    evidence: (0, import_fields18.json)({ defaultValue: {} }),
    idempotencyKey: (0, import_fields18.text)({ isIndexed: "unique", access: { read: import_access45.denyAll, create: canManage2, update: import_access45.denyAll } }),
    ...trackingFields
  }
});
var ValuationObservation = (0, import_core14.list)({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: (0, import_fields18.relationship)({ ref: "Specimen.valuationObservations" }),
    amountMinor: (0, import_fields18.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields18.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    sourceType: (0, import_fields18.select)({ type: "string", options: ["operator", "comparable_sale", "price_guide", "auction_result", "provider", "seller", "other"], defaultValue: "operator" }),
    sourceName: (0, import_fields18.text)({ validation: { isRequired: true } }),
    sourceReference: (0, import_fields18.text)(),
    observedAt: (0, import_fields18.timestamp)({ defaultValue: { kind: "now" } }),
    confidence: (0, import_fields18.select)({ type: "string", options: ["unreviewed", "low", "medium", "high", "provider_reported"], defaultValue: "unreviewed" }),
    publiclyVisible: (0, import_fields18.checkbox)({ defaultValue: false }),
    notes: (0, import_fields18.text)({ ui: { displayMode: "textarea" } }),
    disclaimer: (0, import_fields18.text)({ defaultValue: "Attributed valuation evidence; not an appraisal or guarantee of sale value." }),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleInventory.ts
var import_core15 = require("@keystone-6/core");
var import_fields19 = require("@keystone-6/core/fields");
var import_access47 = require("@keystone-6/core/access");
var canRead3 = ({ session }) => permissions.canReadCollectibles({ session }) || permissions.canManageInventory({ session });
var canManage3 = permissions.canManageInventory;
var managedAccess3 = { operation: { query: canRead3, create: canManage3, update: canManage3, delete: canManage3 } };
var readOnlyUntilLifecycleCommands = { operation: { query: canRead3, create: () => false, update: () => false, delete: () => false } };
var InventoryLocation = (0, import_core15.list)({
  access: managedAccess3,
  fields: {
    store: (0, import_fields19.relationship)({ ref: "Store" }),
    name: (0, import_fields19.text)({ validation: { isRequired: true } }),
    code: (0, import_fields19.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    type: (0, import_fields19.select)({ type: "string", options: ["shop", "warehouse", "vault", "show", "transit", "virtual"], defaultValue: "shop" }),
    publicLabel: (0, import_fields19.text)(),
    restrictedLocation: (0, import_fields19.json)({ access: { read: canManage3, create: canManage3, update: canManage3 } }),
    status: (0, import_fields19.select)({ type: "string", options: ["active", "inactive"], defaultValue: "active" }),
    ...trackingFields
  }
});
var InventoryUnit = (0, import_core15.list)({
  access: readOnlyUntilLifecycleCommands,
  ui: { ...{ labelField: "sku", listView: { initialColumns: ["sku", "specimen", "ownershipBasis", "status", "location"] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    store: (0, import_fields19.relationship)({ ref: "Store" }),
    specimen: (0, import_fields19.relationship)({ ref: "Specimen.inventoryUnits" }),
    commerceVariant: (0, import_fields19.relationship)({ ref: "ProductVariant.collectibleInventoryUnit" }),
    sku: (0, import_fields19.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    ownershipBasis: (0, import_fields19.select)({ type: "string", options: ["owned", "consigned", "trade_in", "third_party"], defaultValue: "owned" }),
    status: (0, import_fields19.select)({ type: "string", options: ["intake", "available", "reserved", "sold", "return_hold", "withdrawn", "lost"], defaultValue: "intake" }),
    location: (0, import_fields19.relationship)({ ref: "InventoryLocation" }),
    quantity: (0, import_fields19.integer)({ defaultValue: 1, validation: { min: 0, max: 1 } }),
    version: (0, import_fields19.integer)({ defaultValue: 1, validation: { min: 1 } }),
    acquiredAmountMinor: (0, import_fields19.integer)({ validation: { min: 0 } }),
    currencyCode: (0, import_fields19.text)({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    movements: (0, import_fields19.relationship)({ ref: "InventoryMovement.inventoryUnit", many: true }),
    reservations: (0, import_fields19.relationship)({ ref: "Reservation.inventoryUnit", many: true }),
    ...trackingFields
  }
});
var InventoryMovement = (0, import_core15.list)({
  ui: lockedRecordUi,
  access: readOnlyUntilLifecycleCommands,
  fields: {
    inventoryUnit: (0, import_fields19.relationship)({ ref: "InventoryUnit.movements" }),
    type: (0, import_fields19.select)({ type: "string", options: ["receive", "move", "reserve", "release", "sell", "return", "adjust", "withdraw"], defaultValue: "adjust" }),
    fromStatus: (0, import_fields19.text)(),
    toStatus: (0, import_fields19.text)({ validation: { isRequired: true } }),
    fromLocation: (0, import_fields19.relationship)({ ref: "InventoryLocation" }),
    toLocation: (0, import_fields19.relationship)({ ref: "InventoryLocation" }),
    reason: (0, import_fields19.text)({ validation: { isRequired: true } }),
    actor: (0, import_fields19.relationship)({ ref: "User" }),
    occurredAt: (0, import_fields19.timestamp)({ defaultValue: { kind: "now" } }),
    evidence: (0, import_fields19.json)({ defaultValue: {} }),
    idempotencyKey: (0, import_fields19.text)({ validation: { isRequired: true }, isIndexed: "unique", access: { read: import_access47.denyAll, create: canManage3, update: import_access47.denyAll } }),
    ...trackingFields
  }
});
var Reservation = (0, import_core15.list)({
  ui: lockedRecordUi,
  access: {
    operation: { query: canRead3, create: () => false, update: () => false, delete: () => false }
  },
  fields: {
    inventoryUnit: (0, import_fields19.relationship)({ ref: "InventoryUnit.reservations" }),
    listing: (0, import_fields19.relationship)({ ref: "Listing" }),
    cart: (0, import_fields19.relationship)({ ref: "Cart" }),
    offer: (0, import_fields19.relationship)({ ref: "Offer" }),
    auction: (0, import_fields19.relationship)({ ref: "Auction" }),
    purpose: (0, import_fields19.select)({ type: "string", options: ["cart", "offer", "auction", "operator_hold", "return"], defaultValue: "cart" }),
    status: (0, import_fields19.select)({ type: "string", options: ["active", "released", "converted", "expired", "cancelled"], defaultValue: "active" }),
    expiresAt: (0, import_fields19.timestamp)(),
    ownerUser: (0, import_fields19.relationship)({ ref: "User" }),
    guestProofHash: (0, import_fields19.text)({ access: { read: import_access47.denyAll, create: () => false, update: () => false } }),
    idempotencyKey: (0, import_fields19.text)({ validation: { isRequired: true }, isIndexed: "unique", access: { read: import_access47.denyAll, create: () => false, update: () => false } }),
    releasedAt: (0, import_fields19.timestamp)(),
    releaseReason: (0, import_fields19.text)(),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleCommerce.ts
var import_core16 = require("@keystone-6/core");
var import_fields20 = require("@keystone-6/core/fields");
var import_access49 = require("@keystone-6/core/access");
var humanCustomer = ({ session }) => isHumanOwnerSession(session);
var canRead4 = ({ session }) => permissions.canReadCollectibles({ session }) || permissions.canManageListings({ session }) || permissions.canManageAuctions({ session });
var canReadPrivateOffers = permissions.canManageListings;
var canReadPrivateAuctions = permissions.canManageAuctions;
var canManageAuctions = permissions.canManageAuctions;
var Listing = (0, import_core16.list)({
  access: { operation: { query: canRead4, create: () => false, update: () => false, delete: () => false } },
  ui: { ...{ labelField: "title", listView: { initialColumns: ["title", "format", "status", "priceMinor", "currencyCode"] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    store: (0, import_fields20.relationship)({ ref: "Store" }),
    inventoryUnit: (0, import_fields20.relationship)({ ref: "InventoryUnit" }),
    seller: (0, import_fields20.relationship)({ ref: "SellerProfile" }),
    title: (0, import_fields20.text)({ validation: { isRequired: true } }),
    slug: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    format: (0, import_fields20.select)({ type: "string", options: ["fixed_price", "auction"], defaultValue: "fixed_price" }),
    status: (0, import_fields20.select)({ type: "string", options: ["draft", "scheduled", "published", "paused", "sold", "ended", "withdrawn"], defaultValue: "draft" }),
    priceMinor: (0, import_fields20.integer)({ validation: { min: 0 } }),
    compareAtMinor: (0, import_fields20.integer)({ validation: { min: 0 } }),
    currencyCode: (0, import_fields20.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } }, defaultValue: "USD" }),
    publishedAt: (0, import_fields20.timestamp)(),
    endsAt: (0, import_fields20.timestamp)(),
    publicationSnapshot: (0, import_fields20.json)({ defaultValue: {} }),
    publicSummary: (0, import_fields20.text)({ ui: { displayMode: "textarea" } }),
    offersEnabled: (0, import_fields20.checkbox)({ defaultValue: true }),
    minimumOfferMinor: (0, import_fields20.integer)({ validation: { min: 0 } }),
    auction: (0, import_fields20.relationship)({ ref: "Auction.listing" }),
    offers: (0, import_fields20.relationship)({ ref: "Offer.listing", many: true }),
    ...trackingFields
  }
});
var Offer = (0, import_core16.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateOffers, create: () => false, update: () => false, delete: () => false } },
  fields: {
    listing: (0, import_fields20.relationship)({ ref: "Listing.offers" }),
    buyer: (0, import_fields20.relationship)({ ref: "User" }),
    seller: (0, import_fields20.relationship)({ ref: "SellerProfile" }),
    status: (0, import_fields20.select)({ type: "string", options: ["open", "countered", "accepted", "declined", "withdrawn", "expired", "converted"], defaultValue: "open" }),
    currentAmountMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields20.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    expiresAt: (0, import_fields20.timestamp)(),
    currentRevision: (0, import_fields20.integer)({ defaultValue: 1, validation: { min: 1 } }),
    revisions: (0, import_fields20.relationship)({ ref: "OfferRevision.offer", many: true }),
    reservation: (0, import_fields20.relationship)({ ref: "Reservation" }),
    idempotencyKey: (0, import_fields20.text)({ isIndexed: "unique", access: { read: import_access49.denyAll, create: () => false, update: () => false } }),
    ...trackingFields
  }
});
var OfferRevision = (0, import_core16.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateOffers, create: () => false, update: () => false, delete: () => false } },
  fields: {
    offer: (0, import_fields20.relationship)({ ref: "Offer.revisions" }),
    sequence: (0, import_fields20.integer)({ validation: { isRequired: true, min: 1 } }),
    actorType: (0, import_fields20.select)({ type: "string", options: ["buyer", "seller", "operator"], defaultValue: "buyer" }),
    actor: (0, import_fields20.relationship)({ ref: "User" }),
    action: (0, import_fields20.select)({ type: "string", options: ["created", "countered", "accepted", "declined", "withdrawn", "expired"], defaultValue: "created" }),
    amountMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields20.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    message: (0, import_fields20.text)({ ui: { displayMode: "textarea" } }),
    occurredAt: (0, import_fields20.timestamp)({ defaultValue: { kind: "now" } }),
    idempotencyKey: (0, import_fields20.text)({ isIndexed: "unique", access: { read: import_access49.denyAll, create: () => false, update: () => false } }),
    ...trackingFields
  }
});
var Auction = (0, import_core16.list)({
  access: { operation: { query: canReadPrivateAuctions, create: () => false, update: () => false, delete: () => false } },
  ui: { ...{ listView: { initialColumns: ["listing", "status", "startAt", "endAt", "currentAmountMinor", "bidCount"] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    listing: (0, import_fields20.relationship)({ ref: "Listing.auction" }),
    status: (0, import_fields20.select)({ type: "string", options: ["draft", "scheduled", "active", "ended", "cancelled", "settled"], defaultValue: "draft" }),
    startAt: (0, import_fields20.timestamp)({ validation: { isRequired: true } }),
    endAt: (0, import_fields20.timestamp)({ validation: { isRequired: true } }),
    openingAmountMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 0 } }),
    currentAmountMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields20.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    reserveAmountMinor: (0, import_fields20.integer)({ validation: { min: 0 }, access: { read: canManageAuctions, create: canManageAuctions, update: import_access49.denyAll } }),
    reserveMet: (0, import_fields20.checkbox)({ defaultValue: false }),
    minimumIncrementMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 1 }, defaultValue: 100 }),
    extensionWindowSeconds: (0, import_fields20.integer)({ validation: { min: 0 }, defaultValue: 120 }),
    extensionSeconds: (0, import_fields20.integer)({ validation: { min: 0 }, defaultValue: 120 }),
    maximumExtensions: (0, import_fields20.integer)({ validation: { min: 0 }, defaultValue: 5 }),
    extensionCount: (0, import_fields20.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    leadingBidder: (0, import_fields20.relationship)({ ref: "User" }),
    bidCount: (0, import_fields20.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    bids: (0, import_fields20.relationship)({ ref: "Bid.auction", many: true }),
    reservation: (0, import_fields20.relationship)({ ref: "Reservation" }),
    settlementSnapshot: (0, import_fields20.json)({ defaultValue: null }),
    ...trackingFields
  }
});
var Bid = (0, import_core16.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateAuctions, create: () => false, update: () => false, delete: () => false } },
  fields: {
    auction: (0, import_fields20.relationship)({ ref: "Auction.bids" }),
    bidder: (0, import_fields20.relationship)({ ref: "User" }),
    amountMinor: (0, import_fields20.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields20.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    status: (0, import_fields20.select)({ type: "string", options: ["accepted", "rejected", "superseded", "winning"], defaultValue: "accepted" }),
    rejectionReason: (0, import_fields20.text)(),
    acceptedAt: (0, import_fields20.timestamp)({ defaultValue: { kind: "now" } }),
    resultingEndAt: (0, import_fields20.timestamp)(),
    idempotencyKey: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique", access: { read: import_access49.denyAll, create: () => false, update: () => false } }),
    requestMetadata: (0, import_fields20.json)({ defaultValue: {}, access: { read: canManageAuctions, create: () => false, update: () => false } }),
    ...trackingFields
  }
});
var WishlistItem = (0, import_core16.list)({
  access: {
    operation: { query: humanCustomer, create: humanCustomer, update: humanCustomer, delete: humanCustomer },
    filter: { query: customerOwnerFilter, update: customerOwnerFilter, delete: customerOwnerFilter }
  },
  fields: {
    user: (0, import_fields20.relationship)({
      ref: "User",
      access: { create: import_access49.denyAll, update: import_access49.denyAll },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          return operation === "create" ? { connect: { id: requireHumanOwnerId(context.session) } } : resolvedData.user;
        }
      }
    }),
    catalogItem: (0, import_fields20.relationship)({ ref: "CatalogItem" }),
    listing: (0, import_fields20.relationship)({ ref: "Listing" }),
    notes: (0, import_fields20.text)(),
    ...trackingFields
  }
});
var SavedSearch = (0, import_core16.list)({
  access: {
    operation: { query: humanCustomer, create: humanCustomer, update: humanCustomer, delete: humanCustomer },
    filter: { query: customerOwnerFilter, update: customerOwnerFilter, delete: customerOwnerFilter }
  },
  fields: {
    user: (0, import_fields20.relationship)({
      ref: "User",
      access: { create: import_access49.denyAll, update: import_access49.denyAll },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          return operation === "create" ? { connect: { id: requireHumanOwnerId(context.session) } } : resolvedData.user;
        }
      }
    }),
    name: (0, import_fields20.text)({ validation: { isRequired: true } }),
    query: (0, import_fields20.text)(),
    filters: (0, import_fields20.json)({ defaultValue: {} }),
    notificationFrequency: (0, import_fields20.select)({ type: "string", options: ["none", "instant", "daily", "weekly"], defaultValue: "none" }),
    lastNotifiedAt: (0, import_fields20.timestamp)(),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleConsignment.ts
var import_core17 = require("@keystone-6/core");
var import_fields21 = require("@keystone-6/core/fields");
var import_access51 = require("@keystone-6/core/access");
var canRead5 = ({ session }) => permissions.canReadCollectibles({ session }) || permissions.canManageConsignments({ session });
var canManage4 = permissions.canManageConsignments;
var managedAccess4 = { operation: { query: canRead5, create: canManage4, update: canManage4, delete: canManage4 } };
var lockedAccess = { operation: { query: canRead5, create: () => false, update: () => false, delete: () => false } };
var ConsignmentIntake = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    store: (0, import_fields21.relationship)({ ref: "Store" }),
    consignor: (0, import_fields21.relationship)({ ref: "SellerProfile" }),
    reference: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields21.select)({ type: "string", options: ["submitted", "received", "inspecting", "offered", "accepted", "declined", "returned"], defaultValue: "submitted" }),
    submittedDescription: (0, import_fields21.text)({ ui: { displayMode: "textarea" } }),
    intakeObservations: (0, import_fields21.json)({ defaultValue: {} }),
    receivedAt: (0, import_fields21.timestamp)(),
    items: (0, import_fields21.relationship)({ ref: "ConsignmentItem.intake", many: true }),
    agreement: (0, import_fields21.relationship)({ ref: "ConsignmentAgreement.intake" }),
    custodyEvidence: (0, import_fields21.json)({ defaultValue: [] }),
    ...trackingFields
  }
});
var ConsignmentAgreement = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    intake: (0, import_fields21.relationship)({ ref: "ConsignmentIntake.agreement" }),
    consignor: (0, import_fields21.relationship)({ ref: "SellerProfile" }),
    version: (0, import_fields21.integer)({ validation: { isRequired: true, min: 1 } }),
    status: (0, import_fields21.select)({ type: "string", options: ["draft", "sent", "accepted", "expired", "terminated"], defaultValue: "draft" }),
    commissionBasisPoints: (0, import_fields21.integer)({ validation: { isRequired: true, min: 0, max: 1e4 } }),
    fixedFeeMinor: (0, import_fields21.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    currencyCode: (0, import_fields21.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    pricingAuthority: (0, import_fields21.select)({ type: "string", options: ["operator", "consignor", "mutual"], defaultValue: "mutual" }),
    startsAt: (0, import_fields21.timestamp)(),
    endsAt: (0, import_fields21.timestamp)(),
    termsSnapshot: (0, import_fields21.json)({ defaultValue: {} }),
    acceptedAt: (0, import_fields21.timestamp)(),
    acceptanceEvidence: (0, import_fields21.json)({ access: { read: canManage4, create: canManage4, update: canManage4 } }),
    ...trackingFields
  }
});
var ConsignmentItem = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    intake: (0, import_fields21.relationship)({ ref: "ConsignmentIntake.items" }),
    specimen: (0, import_fields21.relationship)({ ref: "Specimen" }),
    inventoryUnit: (0, import_fields21.relationship)({ ref: "InventoryUnit" }),
    status: (0, import_fields21.select)({ type: "string", options: ["pending", "accepted", "listed", "sold", "return_requested", "returned", "settled"], defaultValue: "pending" }),
    reserveAmountMinor: (0, import_fields21.integer)({ validation: { min: 0 } }),
    agreedPriceMinor: (0, import_fields21.integer)({ validation: { min: 0 } }),
    currencyCode: (0, import_fields21.text)({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    notes: (0, import_fields21.text)({ ui: { displayMode: "textarea" } }),
    ...trackingFields
  }
});
var ConsignmentSettlement = (0, import_core17.list)({
  ui: lockedRecordUi,
  access: lockedAccess,
  fields: {
    store: (0, import_fields21.relationship)({ ref: "Store" }),
    consignor: (0, import_fields21.relationship)({ ref: "SellerProfile" }),
    reference: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields21.select)({ type: "string", options: ["pending", "on_hold", "approved", "paid", "failed", "reversed"], defaultValue: "pending" }),
    currencyCode: (0, import_fields21.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    grossAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    feeAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    refundHoldbackMinor: (0, import_fields21.integer)({ validation: { isRequired: true }, defaultValue: 0 }),
    payableAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    calculationSnapshot: (0, import_fields21.json)({ defaultValue: {} }),
    lines: (0, import_fields21.relationship)({ ref: "SettlementLine.settlement", many: true }),
    payoutEvidence: (0, import_fields21.json)({ access: { read: canManage4, create: () => false, update: () => false } }),
    idempotencyKey: (0, import_fields21.text)({ isIndexed: "unique", access: { read: import_access51.denyAll, create: () => false, update: () => false } }),
    ...trackingFields
  }
});
var SettlementLine = (0, import_core17.list)({
  ui: lockedRecordUi,
  access: lockedAccess,
  fields: {
    settlement: (0, import_fields21.relationship)({ ref: "ConsignmentSettlement.lines" }),
    consignmentItem: (0, import_fields21.relationship)({ ref: "ConsignmentItem" }),
    orderLineItem: (0, import_fields21.relationship)({ ref: "OrderLineItem" }),
    grossAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    commissionAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    feeAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    refundAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true }, defaultValue: 0 }),
    payableAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true } }),
    snapshot: (0, import_fields21.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var Buylist = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    store: (0, import_fields21.relationship)({ ref: "Store" }),
    name: (0, import_fields21.text)({ validation: { isRequired: true } }),
    status: (0, import_fields21.select)({ type: "string", options: ["draft", "active", "paused", "archived"], defaultValue: "draft" }),
    currencyCode: (0, import_fields21.text)({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    entries: (0, import_fields21.relationship)({ ref: "BuylistEntry.buylist", many: true }),
    ...trackingFields
  }
});
var BuylistEntry = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    buylist: (0, import_fields21.relationship)({ ref: "Buylist.entries" }),
    catalogItem: (0, import_fields21.relationship)({ ref: "CatalogItem" }),
    criteria: (0, import_fields21.json)({ defaultValue: {} }),
    offerAmountMinor: (0, import_fields21.integer)({ validation: { isRequired: true, min: 0 } }),
    maximumQuantity: (0, import_fields21.integer)({ validation: { min: 0 } }),
    active: (0, import_fields21.select)({ type: "string", options: ["active", "paused"], defaultValue: "active" }),
    ...trackingFields
  }
});
var TradeInSubmission = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    store: (0, import_fields21.relationship)({ ref: "Store" }),
    customer: (0, import_fields21.relationship)({ ref: "User" }),
    reference: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields21.select)({ type: "string", options: ["draft", "submitted", "received", "inspecting", "quoted", "accepted", "declined", "paid", "returned"], defaultValue: "submitted" }),
    disposition: (0, import_fields21.select)({ type: "string", options: ["cash", "store_credit", "trade"], defaultValue: "cash" }),
    items: (0, import_fields21.relationship)({ ref: "TradeInItem.submission", many: true }),
    shippingEvidence: (0, import_fields21.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var TradeInItem = (0, import_core17.list)({
  access: managedAccess4,
  fields: {
    submission: (0, import_fields21.relationship)({ ref: "TradeInSubmission.items" }),
    catalogItem: (0, import_fields21.relationship)({ ref: "CatalogItem" }),
    specimen: (0, import_fields21.relationship)({ ref: "Specimen" }),
    customerDescription: (0, import_fields21.text)({ ui: { displayMode: "textarea" } }),
    customerCondition: (0, import_fields21.text)(),
    inspectedConditionObservation: (0, import_fields21.relationship)({ ref: "ConditionObservation" }),
    quotedAmountMinor: (0, import_fields21.integer)({ validation: { min: 0 } }),
    acceptedAmountMinor: (0, import_fields21.integer)({ validation: { min: 0 } }),
    currencyCode: (0, import_fields21.text)({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    decisionEvidence: (0, import_fields21.json)({ defaultValue: {} }),
    ...trackingFields
  }
});

// features/keystone/models/CollectibleOperations.ts
var import_core18 = require("@keystone-6/core");
var import_fields22 = require("@keystone-6/core/fields");
var import_access53 = require("@keystone-6/core/access");
var humanCustomer2 = ({ session }) => isHumanOwnerSession(session);
var canManageCustomers = permissions.canManageCollectibleCustomers;
var canManageRisk = permissions.canManageRisk;
var canManageIntegrations = permissions.canManageIntegrations;
var StoreMembership = (0, import_core18.list)({
  access: { operation: { query: canManageCustomers, create: canManageCustomers, update: canManageCustomers, delete: canManageCustomers } },
  fields: {
    store: (0, import_fields22.relationship)({ ref: "Store" }),
    user: (0, import_fields22.relationship)({ ref: "User" }),
    role: (0, import_fields22.select)({ type: "string", options: ["owner", "catalog", "inventory", "auctioneer", "consignment", "fulfillment", "support", "finance", "viewer"], defaultValue: "viewer" }),
    status: (0, import_fields22.select)({ type: "string", options: ["invited", "active", "suspended", "revoked"], defaultValue: "invited" }),
    permissions: (0, import_fields22.json)({ defaultValue: [] }),
    ...trackingFields
  }
});
var CollectorProfile = (0, import_core18.list)({
  access: {
    operation: { query: humanCustomer2, create: humanCustomer2, update: humanCustomer2, delete: canManageCustomers },
    filter: {
      query: ({ session }) => permissions.canManageCollectibleCustomers({ session }) ? true : customerOwnerFilter({ session }),
      update: ({ session }) => permissions.canManageCollectibleCustomers({ session }) ? true : customerOwnerFilter({ session })
    }
  },
  fields: {
    user: (0, import_fields22.relationship)({
      ref: "User",
      access: { create: import_access53.denyAll, update: import_access53.denyAll },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          return operation === "create" ? { connect: { id: requireHumanOwnerId(context.session) } } : resolvedData.user;
        }
      }
    }),
    displayName: (0, import_fields22.text)({ validation: { isRequired: true } }),
    bio: (0, import_fields22.text)({ ui: { displayMode: "textarea" } }),
    interests: (0, import_fields22.json)({ defaultValue: [] }),
    preferences: (0, import_fields22.json)({ defaultValue: {} }),
    public: (0, import_fields22.checkbox)({ defaultValue: false }),
    ...trackingFields
  }
});
var SellerProfile = (0, import_core18.list)({
  access: {
    operation: { query: canManageCustomers, create: canManageCustomers, update: canManageCustomers, delete: canManageCustomers }
  },
  fields: {
    store: (0, import_fields22.relationship)({ ref: "Store" }),
    user: (0, import_fields22.relationship)({ ref: "User" }),
    displayName: (0, import_fields22.text)({ validation: { isRequired: true } }),
    status: (0, import_fields22.select)({ type: "string", options: ["applicant", "active", "paused", "suspended", "closed"], defaultValue: "applicant" }),
    publicBio: (0, import_fields22.text)({ ui: { displayMode: "textarea" } }),
    privateContact: (0, import_fields22.json)({ access: { read: canManageCustomers, create: canManageCustomers, update: canManageCustomers } }),
    identityEvidenceState: (0, import_fields22.select)({ type: "string", options: ["not_requested", "pending", "provider_reported", "manual_review", "rejected"], defaultValue: "not_requested" }),
    payoutConfigurationReference: (0, import_fields22.text)({ access: { read: canManageCustomers, create: canManageCustomers, update: canManageCustomers } }),
    ...trackingFields
  }
});
var FulfillmentRequirement = (0, import_core18.list)({
  ui: immutableRecordUi,
  access: { operation: { query: ({ session }) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }), create: permissions.canManageFulfillments, update: () => false, delete: () => false } },
  fields: {
    order: (0, import_fields22.relationship)({ ref: "Order" }),
    orderLineItem: (0, import_fields22.relationship)({ ref: "OrderLineItem" }),
    declaredValueMinor: (0, import_fields22.integer)({ validation: { min: 0 } }),
    currencyCode: (0, import_fields22.text)({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    signatureRequired: (0, import_fields22.checkbox)({ defaultValue: false }),
    insuranceRequested: (0, import_fields22.checkbox)({ defaultValue: false }),
    insuranceProviderReference: (0, import_fields22.text)(),
    packagingInstructions: (0, import_fields22.text)({ ui: { displayMode: "textarea" } }),
    policySnapshot: (0, import_fields22.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var ShipmentEvidence = (0, import_core18.list)({
  ui: immutableRecordUi,
  access: { operation: { query: permissions.canReadFulfillments, create: permissions.canManageFulfillments, update: () => false, delete: () => false } },
  fields: {
    fulfillment: (0, import_fields22.relationship)({ ref: "Fulfillment" }),
    requirement: (0, import_fields22.relationship)({ ref: "FulfillmentRequirement" }),
    type: (0, import_fields22.select)({ type: "string", options: ["label", "acceptance_scan", "tracking", "exception", "delivery", "signature", "insurance_response", "packaging"], defaultValue: "tracking" }),
    provider: (0, import_fields22.text)({ validation: { isRequired: true } }),
    providerReference: (0, import_fields22.text)(),
    observedAt: (0, import_fields22.timestamp)({ defaultValue: { kind: "now" } }),
    status: (0, import_fields22.text)(),
    publicSummary: (0, import_fields22.text)(),
    restrictedPayload: (0, import_fields22.json)({ access: { read: permissions.canManageFulfillments, create: permissions.canManageFulfillments, update: permissions.canManageFulfillments } }),
    disclaimer: (0, import_fields22.text)({ defaultValue: "Provider-attributed fulfillment evidence; not an independent guarantee of delivery or coverage." }),
    ...trackingFields
  }
});
var DisputeCase = (0, import_core18.list)({
  access: { operation: { query: canManageRisk, create: canManageRisk, update: canManageRisk, delete: canManageRisk } },
  fields: {
    store: (0, import_fields22.relationship)({ ref: "Store" }),
    order: (0, import_fields22.relationship)({ ref: "Order" }),
    return: (0, import_fields22.relationship)({ ref: "Return" }),
    openedBy: (0, import_fields22.relationship)({ ref: "User" }),
    assignedTo: (0, import_fields22.relationship)({ ref: "User" }),
    type: (0, import_fields22.select)({ type: "string", options: ["condition", "not_as_described", "authenticity_concern", "shipping", "payment", "return", "other"], defaultValue: "other" }),
    status: (0, import_fields22.select)({ type: "string", options: ["open", "evidence_requested", "review", "resolved", "closed"], defaultValue: "open" }),
    summary: (0, import_fields22.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    resolution: (0, import_fields22.text)({ ui: { displayMode: "textarea" } }),
    evidence: (0, import_fields22.relationship)({
      access: { create: import_access53.denyAll, update: import_access53.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "EvidenceAttachment.dispute",
      many: true
    }),
    ...trackingFields
  }
});
var RiskAssessment = (0, import_core18.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canManageRisk, create: () => false, update: () => false, delete: () => false } },
  fields: {
    store: (0, import_fields22.relationship)({ ref: "Store" }),
    subjectType: (0, import_fields22.select)({ type: "string", options: ["user", "seller", "listing", "bid", "offer", "order", "payment", "shipment"], defaultValue: "order" }),
    subjectId: (0, import_fields22.text)({ validation: { isRequired: true } }),
    provider: (0, import_fields22.text)({ validation: { isRequired: true } }),
    status: (0, import_fields22.select)({ type: "string", options: ["provider_reported", "manual_review", "cleared", "restricted", "unavailable"], defaultValue: "provider_reported" }),
    score: (0, import_fields22.integer)(),
    reasonCodes: (0, import_fields22.json)({ defaultValue: [] }),
    observedAt: (0, import_fields22.timestamp)({ defaultValue: { kind: "now" } }),
    signals: (0, import_fields22.relationship)({ ref: "RiskSignal.assessment", many: true }),
    restrictedPayload: (0, import_fields22.json)({ access: { read: canManageRisk, create: () => false, update: () => false } }),
    disclaimer: (0, import_fields22.text)({ defaultValue: "Risk evidence is provider/operator attributed and is not proof of fraud or identity." }),
    ...trackingFields
  }
});
var RiskSignal = (0, import_core18.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canManageRisk, create: () => false, update: () => false, delete: () => false } },
  fields: {
    assessment: (0, import_fields22.relationship)({ ref: "RiskAssessment.signals" }),
    code: (0, import_fields22.text)({ validation: { isRequired: true } }),
    severity: (0, import_fields22.select)({ type: "string", options: ["info", "low", "medium", "high"], defaultValue: "info" }),
    summary: (0, import_fields22.text)({ validation: { isRequired: true } }),
    evidence: (0, import_fields22.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var EvidenceAttachment = (0, import_core18.list)({
  ui: immutableRecordUi,
  access: { operation: { query: canManageRisk, create: canManageRisk, update: () => false, delete: () => false } },
  fields: {
    dispute: (0, import_fields22.relationship)({ ref: "DisputeCase.evidence" }),
    url: (0, import_fields22.text)({ validation: { isRequired: true } }),
    type: (0, import_fields22.text)(),
    checksum: (0, import_fields22.text)(),
    uploadedBy: (0, import_fields22.relationship)({ ref: "User" }),
    metadata: (0, import_fields22.json)({ defaultValue: {}, access: { read: canManageRisk, create: canManageRisk, update: canManageRisk } }),
    ...trackingFields
  }
});
var ProviderConnection = (0, import_core18.list)({
  access: { operation: { query: canManageIntegrations, create: canManageIntegrations, update: canManageIntegrations, delete: canManageIntegrations } },
  fields: {
    store: (0, import_fields22.relationship)({ ref: "Store" }),
    kind: (0, import_fields22.select)({ type: "string", options: ["payment", "tax", "shipping", "grading", "valuation", "identity", "risk", "notification"], defaultValue: "notification" }),
    provider: (0, import_fields22.text)({ validation: { isRequired: true } }),
    status: (0, import_fields22.select)({ type: "string", options: ["draft", "configured", "active", "degraded", "disabled"], defaultValue: "draft" }),
    adapterKey: (0, import_fields22.text)({ validation: { isRequired: true } }),
    configuration: (0, import_fields22.json)({ defaultValue: {} }),
    secretReference: (0, import_fields22.text)({ access: { read: import_access53.denyAll, create: canManageIntegrations, update: canManageIntegrations } }),
    lastObservedAt: (0, import_fields22.timestamp)(),
    lastObservation: (0, import_fields22.json)({ defaultValue: {} }),
    ...trackingFields
  }
});
var NotificationIntent = (0, import_core18.list)({
  ui: lockedRecordUi,
  access: { operation: { query: canManageIntegrations, create: () => false, update: () => false, delete: () => false } },
  fields: {
    user: (0, import_fields22.relationship)({ ref: "User" }),
    channel: (0, import_fields22.select)({ type: "string", options: ["email", "sms", "push", "webhook"], defaultValue: "email" }),
    template: (0, import_fields22.text)({ validation: { isRequired: true } }),
    status: (0, import_fields22.select)({ type: "string", options: ["queued", "sending", "delivered", "failed", "cancelled"], defaultValue: "queued" }),
    payload: (0, import_fields22.json)({ defaultValue: {} }),
    provider: (0, import_fields22.text)(),
    providerReference: (0, import_fields22.text)(),
    idempotencyKey: (0, import_fields22.text)({ isIndexed: "unique", access: { read: import_access53.denyAll, create: () => false, update: () => false } }),
    attemptedAt: (0, import_fields22.timestamp)(),
    ...trackingFields
  }
});

// features/keystone/models/CustomerGroup.ts
var import_core19 = require("@keystone-6/core");
var import_fields23 = require("@keystone-6/core/fields");
var CustomerGroup = (0, import_core19.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    name: (0, import_fields23.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields23.json)(),
    users: (0, import_fields23.relationship)({
      ref: "User.customerGroups",
      many: true
    }),
    discountConditions: (0, import_fields23.relationship)({
      ref: "DiscountCondition.customerGroups",
      many: true
    }),
    priceLists: (0, import_fields23.relationship)({
      ref: "PriceList.customerGroups",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/CustomShippingOption.ts
var import_core20 = require("@keystone-6/core");
var import_fields24 = require("@keystone-6/core/fields");
var CustomShippingOption = (0, import_core20.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    price: (0, import_fields24.integer)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields24.json)(),
    shippingOption: (0, import_fields24.relationship)({
      ref: "ShippingOption.customShippingOptions"
    }),
    cart: (0, import_fields24.relationship)({
      ref: "Cart.customShippingOptions"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Discount.ts
var import_core21 = require("@keystone-6/core");
var import_access57 = require("@keystone-6/core/access");
var import_fields25 = require("@keystone-6/core/fields");
var Discount = (0, import_core21.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    code: (0, import_fields25.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    isDynamic: (0, import_fields25.checkbox)(),
    isDisabled: (0, import_fields25.checkbox)(),
    stackable: (0, import_fields25.checkbox)({
      defaultValue: false
    }),
    startsAt: (0, import_fields25.timestamp)({
      defaultValue: { kind: "now" },
      validation: {
        isRequired: true
      }
    }),
    endsAt: (0, import_fields25.timestamp)({
      validation: {
        isRequired: false
      }
    }),
    metadata: (0, import_fields25.json)(),
    usageLimit: (0, import_fields25.integer)(),
    usageCount: (0, import_fields25.integer)({
      defaultValue: 0,
      validation: {
        isRequired: true
      }
    }),
    validDuration: (0, import_fields25.text)(),
    discountRule: (0, import_fields25.relationship)({
      ref: "DiscountRule.discounts"
    }),
    carts: (0, import_fields25.relationship)({
      ref: "Cart.discounts",
      many: true
    }),
    lineItemAdjustments: (0, import_fields25.relationship)({
      ref: "LineItemAdjustment.discount",
      many: true
    }),
    regions: (0, import_fields25.relationship)({
      ref: "Region.discounts",
      many: true
    }),
    orders: (0, import_fields25.relationship)({
      access: { create: import_access57.denyAll, update: import_access57.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.discounts",
      many: true
    }),
    ...trackingFields
  },
  hooks: {
    async afterOperation({ operation, item, context }) {
      if (operation === "create" || operation === "update") {
        const sudoContext = context.sudo();
        const discount = await sudoContext.query.Discount.findOne({
          where: { id: item.id },
          query: "carts { id }"
        });
        if (discount?.carts?.length) {
          for (const cart of discount.carts) {
            await sudoContext.query.Cart.updateOne({
              where: { id: cart.id },
              data: {
                paymentCollection: {
                  disconnect: true
                }
              }
            });
          }
        }
      }
    }
  }
});

// features/keystone/models/DiscountCondition.ts
var import_core22 = require("@keystone-6/core");
var import_fields26 = require("@keystone-6/core/fields");
var DiscountCondition = (0, import_core22.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    type: (0, import_fields26.select)({
      type: "enum",
      options: [
        {
          label: "Products",
          value: "products"
        },
        {
          label: "Product Types",
          value: "product_types"
        },
        {
          label: "Product Collections",
          value: "product_collections"
        },
        {
          label: "Product Tags",
          value: "product_tags"
        },
        {
          label: "Customer Groups",
          value: "customer_groups"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    operator: (0, import_fields26.select)({
      type: "enum",
      options: [
        {
          label: "In",
          value: "in"
        },
        {
          label: "Not In",
          value: "not_in"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields26.json)(),
    discountRule: (0, import_fields26.relationship)({
      ref: "DiscountRule.discountConditions"
    }),
    customerGroups: (0, import_fields26.relationship)({
      ref: "CustomerGroup.discountConditions",
      many: true
    }),
    products: (0, import_fields26.relationship)({
      ref: "Product.discountConditions",
      many: true
    }),
    productCollections: (0, import_fields26.relationship)({
      ref: "ProductCollection.discountConditions",
      many: true
    }),
    productCategories: (0, import_fields26.relationship)({
      ref: "ProductCategory.discountConditions",
      many: true
    }),
    productTags: (0, import_fields26.relationship)({
      ref: "ProductTag.discountConditions",
      many: true
    }),
    productTypes: (0, import_fields26.relationship)({
      ref: "ProductType.discountConditions",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/DiscountRule.ts
var import_core23 = require("@keystone-6/core");
var import_fields27 = require("@keystone-6/core/fields");
var DiscountRule = (0, import_core23.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    description: (0, import_fields27.text)(),
    type: (0, import_fields27.select)({
      type: "enum",
      options: [
        {
          label: "Fixed",
          value: "fixed"
        },
        {
          label: "Percentage",
          value: "percentage"
        },
        {
          label: "Free Shipping",
          value: "free_shipping"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    value: (0, import_fields27.integer)({
      validation: {
        isRequired: true
      }
    }),
    allocation: (0, import_fields27.select)({
      type: "enum",
      options: [
        {
          label: "Total",
          value: "total"
        },
        {
          label: "Item",
          value: "item"
        }
      ]
    }),
    metadata: (0, import_fields27.json)(),
    discounts: (0, import_fields27.relationship)({
      ref: "Discount.discountRule",
      many: true
    }),
    discountConditions: (0, import_fields27.relationship)({
      ref: "DiscountCondition.discountRule",
      many: true
    }),
    products: (0, import_fields27.relationship)({
      ref: "Product.discountRules",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/DraftOrder.ts
var import_core24 = require("@keystone-6/core");
var import_access61 = require("@keystone-6/core/access");
var import_fields28 = require("@keystone-6/core/fields");
var DraftOrder = (0, import_core24.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    status: (0, import_fields28.select)({
      type: "enum",
      options: [
        {
          label: "Open",
          value: "open"
        },
        {
          label: "Completed",
          value: "completed"
        }
      ],
      defaultValue: "open",
      validation: {
        isRequired: true
      }
    }),
    displayId: (0, import_fields28.integer)({
      validation: {
        isRequired: true
      }
    }),
    canceledAt: (0, import_fields28.timestamp)(),
    completedAt: (0, import_fields28.timestamp)(),
    metadata: (0, import_fields28.json)(),
    idempotencyKey: (0, import_fields28.text)(),
    noNotificationOrder: (0, import_fields28.checkbox)(),
    cart: (0, import_fields28.relationship)({
      ref: "Cart.draftOrder"
    }),
    order: (0, import_fields28.relationship)({
      access: { create: import_access61.denyAll, update: import_access61.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.draftOrder"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Fulfillment.ts
var import_core25 = require("@keystone-6/core");
var import_fields29 = require("@keystone-6/core/fields");
var Fulfillment = (0, import_core25.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    // Status fields
    shippedAt: (0, import_fields29.timestamp)(),
    canceledAt: (0, import_fields29.timestamp)(),
    // Data fields
    data: (0, import_fields29.json)(),
    metadata: (0, import_fields29.json)(),
    idempotencyKey: (0, import_fields29.text)(),
    noNotification: (0, import_fields29.checkbox)({
      defaultValue: false
    }),
    // Relationships
    order: requiredRelationship({
      ref: "Order.fulfillments",
      many: false,
      validation: { isRequired: true }
      // Atomic fulfillment commands validate quantities and audit together;
      // raw operations above are denied, including inverse relationship writes.
    }),
    claimOrder: (0, import_fields29.relationship)({
      ref: "ClaimOrder.fulfillments",
      many: false
    }),
    swap: (0, import_fields29.relationship)({
      ref: "Swap.fulfillments",
      many: false
    }),
    fulfillmentProvider: requiredRelationship({
      ref: "FulfillmentProvider.fulfillments",
      many: false,
      validation: { isRequired: true }
    }),
    fulfillmentItems: (0, import_fields29.relationship)({
      ref: "FulfillmentItem.fulfillment",
      many: true
    }),
    shippingLabels: (0, import_fields29.relationship)({
      ref: "ShippingLabel.fulfillment",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/FulfillmentItem.ts
var import_core26 = require("@keystone-6/core");
var import_fields30 = require("@keystone-6/core/fields");
var FulfillmentItem = (0, import_core26.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    quantity: (0, import_fields30.integer)({
      validation: {
        isRequired: true
      }
    }),
    fulfillment: requiredRelationship({
      ref: "Fulfillment.fulfillmentItems",
      many: false,
      validation: { isRequired: true }
    }),
    lineItem: requiredRelationship({
      ref: "OrderLineItem.fulfillmentItems",
      many: false,
      validation: { isRequired: true }
    }),
    ...trackingFields
  }
});

// features/keystone/models/FulfillmentProvider.ts
var import_access65 = require("@keystone-6/core/access");
var import_core27 = require("@keystone-6/core");
var import_fields31 = require("@keystone-6/core/fields");
var FulfillmentProvider = (0, import_core27.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }),
      create: permissions.canManageFulfillments,
      update: permissions.canManageFulfillments,
      delete: permissions.canManageFulfillments
    }
  },
  fields: {
    name: (0, import_fields31.text)({
      validation: { isRequired: true }
    }),
    code: (0, import_fields31.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true,
        match: {
          regex: /^fp_[a-zA-Z0-9-_]+$/,
          explanation: 'Code must start with "fp_" followed by letters, numbers, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields31.checkbox)({
      defaultValue: true
    }),
    credentials: (0, import_fields31.json)({
      ui: {
        itemView: { fieldMode: "hidden" }
      }
    }),
    metadata: (0, import_fields31.json)(),
    // Relationships
    fulfillments: (0, import_fields31.relationship)({
      access: { create: import_access65.denyAll, update: import_access65.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Fulfillment.fulfillmentProvider",
      many: true
    }),
    regions: (0, import_fields31.relationship)({
      ref: "Region.fulfillmentProviders",
      many: true
    }),
    shippingOptions: (0, import_fields31.relationship)({
      ref: "ShippingOption.fulfillmentProvider",
      many: true
    }),
    shippingProviders: (0, import_fields31.relationship)({
      ref: "ShippingProvider.fulfillmentProvider",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/GiftCard.ts
var import_core28 = require("@keystone-6/core");
var import_access67 = require("@keystone-6/core/access");
var import_fields32 = require("@keystone-6/core/fields");
var GiftCard = (0, import_core28.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadGiftCards({ session }) || permissions.canManageGiftCards({ session }),
      create: permissions.canManageGiftCards,
      update: permissions.canManageGiftCards,
      delete: permissions.canManageGiftCards
    }
  },
  hooks: {
    async afterOperation({ operation, item, context }) {
      if (operation === "create" || operation === "update") {
        const sudoContext = context.sudo();
        const giftCard = await sudoContext.query.GiftCard.findOne({
          where: { id: item.id },
          query: "carts { id }"
        });
        if (giftCard?.carts?.length) {
          for (const cart of giftCard.carts) {
            await sudoContext.query.Cart.updateOne({
              where: { id: cart.id },
              data: {
                paymentCollection: {
                  disconnect: true
                }
              }
            });
          }
        }
      }
    }
  },
  fields: {
    code: (0, import_fields32.text)({
      validation: {
        isRequired: true
      },
      isIndexed: "unique"
    }),
    value: (0, import_fields32.integer)({
      validation: {
        isRequired: true
      }
    }),
    balance: (0, import_fields32.integer)({
      validation: {
        isRequired: true
      }
    }),
    isDisabled: (0, import_fields32.checkbox)(),
    endsAt: (0, import_fields32.timestamp)(),
    metadata: (0, import_fields32.json)(),
    order: (0, import_fields32.relationship)({
      ref: "Order.giftCards"
    }),
    carts: (0, import_fields32.relationship)({
      ref: "Cart.giftCards",
      many: true
    }),
    giftCardTransactions: (0, import_fields32.relationship)({
      access: { create: import_access67.denyAll, update: import_access67.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "GiftCardTransaction.giftCard",
      many: true
    }),
    region: (0, import_fields32.relationship)({
      ref: "Region.giftCards"
    }),
    ...trackingFields
  }
});

// features/keystone/models/GiftCardTransaction.ts
var import_core29 = require("@keystone-6/core");
var import_fields33 = require("@keystone-6/core/fields");
var GiftCardTransaction = (0, import_core29.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadGiftCards({ session }) || permissions.canManageGiftCards({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    amount: (0, import_fields33.integer)({
      validation: {
        isRequired: true
      }
    }),
    isTaxable: (0, import_fields33.checkbox)(),
    taxRate: (0, import_fields33.float)(),
    giftCard: (0, import_fields33.relationship)({
      ref: "GiftCard.giftCardTransactions"
    }),
    order: (0, import_fields33.relationship)({
      ref: "Order.giftCardTransactions"
    }),
    ...trackingFields
  }
});

// features/keystone/models/IdempotencyKey.ts
var import_core30 = require("@keystone-6/core");
var import_fields34 = require("@keystone-6/core/fields");
var IdempotencyKey = (0, import_core30.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadIdempotencyKeys({ session }) || permissions.canManageIdempotencyKeys({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    idempotencyKey: (0, import_fields34.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    requestMethod: (0, import_fields34.text)(),
    requestParams: (0, import_fields34.json)(),
    requestPath: (0, import_fields34.text)(),
    responseCode: (0, import_fields34.integer)(),
    responseBody: (0, import_fields34.json)(),
    recoveryPoint: (0, import_fields34.text)({
      defaultValue: "started",
      validation: {
        isRequired: true
      }
    }),
    lockedAt: (0, import_fields34.timestamp)(),
    ...trackingFields
  }
});

// features/keystone/models/Invite.ts
var import_core31 = require("@keystone-6/core");
var import_fields35 = require("@keystone-6/core/fields");
var Invite = (0, import_core31.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    userEmail: (0, import_fields35.text)({
      validation: {
        isRequired: true
      }
    }),
    role: (0, import_fields35.select)({
      type: "enum",
      options: [
        {
          label: "Admin",
          value: "admin"
        },
        {
          label: "Member",
          value: "member"
        },
        {
          label: "Developer",
          value: "developer"
        }
      ],
      defaultValue: "member"
    }),
    accepted: (0, import_fields35.checkbox)(),
    metadata: (0, import_fields35.json)(),
    token: (0, import_fields35.text)({
      validation: {
        isRequired: true
      }
    }),
    expiresAt: (0, import_fields35.timestamp)({
      defaultValue: { kind: "now" },
      validation: {
        isRequired: true
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Account.ts
var import_access72 = require("@keystone-6/core/access");

// features/keystone/lib/account-money.ts
var record3 = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
function sumAccountCurrencyDebt(code, rows2, count) {
  if (!Array.isArray(rows2) || count !== rows2.length || count > 1e3) return null;
  const exponent = currencyExponent(code);
  if (exponent !== 0 && exponent !== 2) return null;
  let sum2 = 0;
  for (const row of rows2) {
    if (!record3(row) || typeof row.amount !== "number" || !Number.isSafeInteger(row.amount) || row.amount < 0 || !record3(row.order) || !record3(row.order.currency) || typeof row.order.currency.code !== "string" || row.order.currency.code.toUpperCase() !== code.toUpperCase()) return null;
    sum2 += row.amount;
    if (!Number.isSafeInteger(sum2) || sum2 > 2147483647) return null;
  }
  return sum2;
}
async function loadAccountDebt(id3, context) {
  const query = context.sudo().query;
  const account = await query.Account.findOne({ where: { id: id3 }, query: "creditLimit currency { code }" });
  if (!record3(account) || !record3(account.currency) || typeof account.currency.code !== "string") return null;
  const where = { account: { id: { equals: id3 } }, paymentStatus: { equals: "unpaid" } };
  const rows2 = await query.AccountLineItem.findMany({ where, take: 1001, query: "amount order { currency { code } }" });
  const count = await query.AccountLineItem.count({ where });
  const owed = sumAccountCurrencyDebt(account.currency.code, rows2, count);
  const limit = account.creditLimit;
  const available = owed !== null && typeof limit === "number" && Number.isSafeInteger(limit) && limit >= 0 ? Math.max(0, limit - owed) : null;
  return { currency: account.currency.code, owed, available };
}
function formatAccountMoney(value, code) {
  return value === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value / 10 ** currencyExponent(code));
}

// features/keystone/models/Account.ts
var import_core32 = require("@keystone-6/core");
var import_fields36 = require("@keystone-6/core/fields");
var Account = (0, import_core32.list)({
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    // Core account data
    user: requiredRelationship({
      ref: "User.accounts",
      many: false,
      validation: { isRequired: true }
    }),
    accountNumber: (0, import_fields36.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    title: (0, import_fields36.text)({
      validation: { isRequired: true },
      defaultValue: "Business Account"
    }),
    description: (0, import_fields36.text)({
      ui: { displayMode: "textarea" },
      defaultValue: "Running business account for automated orders placed through API integration"
    }),
    // Financial fields (amounts in cents)
    totalAmount: (0, import_fields36.integer)({
      access: { create: import_access72.denyAll, update: import_access72.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      defaultValue: 0
    }),
    paidAmount: (0, import_fields36.integer)({
      access: { create: import_access72.denyAll, update: import_access72.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      defaultValue: 0
    }),
    creditLimit: (0, import_fields36.integer)({
      validation: { isRequired: true },
      defaultValue: 1e5
      // $1000 default
    }),
    currency: requiredRelationship({
      access: { update: import_access72.denyAll },
      ui: { itemView: { fieldMode: "read" } },
      ref: "Currency.accounts",
      many: false,
      validation: { isRequired: true }
    }),
    // Status and dates
    status: (0, import_fields36.select)({
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Not Approved", value: "not_approved" },
        { label: "Paid", value: "paid" },
        { label: "Overdue", value: "overdue" }
      ],
      defaultValue: "active",
      validation: { isRequired: true }
    }),
    dueDate: (0, import_fields36.timestamp)(),
    paidAt: (0, import_fields36.timestamp)(),
    suspendedAt: (0, import_fields36.timestamp)(),
    notApprovedAt: (0, import_fields36.timestamp)(),
    // Account type
    accountType: (0, import_fields36.select)({
      options: [
        { label: "Business", value: "business" },
        { label: "Personal", value: "personal" }
      ],
      defaultValue: "business",
      validation: { isRequired: true }
    }),
    // Metadata for additional context
    metadata: (0, import_fields36.json)({
      defaultValue: {}
    }),
    // Relationships
    orders: (0, import_fields36.relationship)({
      access: { create: import_access72.denyAll, update: import_access72.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.account",
      many: true
    }),
    lineItems: (0, import_fields36.relationship)({
      access: { create: import_access72.denyAll, update: import_access72.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "AccountLineItem.account",
      many: true
    }),
    invoices: (0, import_fields36.relationship)({
      access: { create: import_access72.denyAll, update: import_access72.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Invoice.account",
      many: true
    }),
    // Virtual computed fields
    ...(0, import_core32.group)({
      label: "Computed Fields",
      description: "Auto-calculated fields for account display",
      fields: {
        balanceDue: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.Int,
            resolve(item) {
              return (item.totalAmount || 0) - (item.paidAmount || 0);
            }
          })
        }),
        formattedTotal: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.String,
            async resolve(item, args, context) {
              const account = await context.sudo().query.Account.findOne({
                where: { id: item.id },
                query: `
                  totalAmount
                  currency {
                    code
                    symbol
                    noDivisionCurrency
                  }
                `
              });
              if (!account?.currency) return null;
              const divisor = account.currency.noDivisionCurrency ? 1 : 100;
              const amount = (account.totalAmount || 0) / divisor;
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: account.currency.code
              }).format(amount);
            }
          })
        }),
        formattedCreditLimit: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.String,
            async resolve(item, args, context) {
              const account = await context.sudo().query.Account.findOne({
                where: { id: item.id },
                query: `
                  creditLimit
                  currency {
                    code
                    symbol
                    noDivisionCurrency
                  }
                `
              });
              if (!account?.currency) return null;
              const divisor = account.currency.noDivisionCurrency ? 1 : 100;
              const limit = (account.creditLimit || 0) / divisor;
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: account.currency.code
              }).format(limit);
            }
          })
        }),
        availableCredit: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.Int,
            resolve(item) {
              const used = (item.totalAmount || 0) - (item.paidAmount || 0);
              return Math.max(0, (item.creditLimit || 0) - used);
            }
          })
        }),
        // New currency-aware fields for multi-region support
        totalOwedInAccountCurrency: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.Int,
            async resolve(item, args, context) {
              return (await loadAccountDebt(item.id, context))?.owed ?? null;
            }
          })
        }),
        availableCreditInAccountCurrency: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.Int,
            async resolve(item, args, context) {
              return (await loadAccountDebt(item.id, context))?.available ?? null;
            }
          })
        }),
        formattedTotalOwedInAccountCurrency: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.String,
            async resolve(item, args, context) {
              const debt = await loadAccountDebt(item.id, context);
              return debt ? formatAccountMoney(debt.owed, debt.currency) : null;
            }
          })
        }),
        formattedAvailableCreditInAccountCurrency: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.String,
            async resolve(item, args, context) {
              const debt = await loadAccountDebt(item.id, context);
              return debt ? formatAccountMoney(debt.available, debt.currency) : null;
            }
          })
        }),
        // Proper current balance calculated from unpaid line items (same logic as unpaidLineItemsByRegion)
        formattedCurrentBalance: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.String,
            async resolve(item, args, context) {
              const debt = await loadAccountDebt(item.id, context);
              return debt ? formatAccountMoney(debt.owed, debt.currency) : null;
            }
          })
        }),
        unpaidLineItemsByRegion: (0, import_fields36.virtual)({
          field: import_core32.graphql.field({
            type: import_core32.graphql.JSON,
            async resolve(item, args, context) {
              const unpaidLineItems = await context.sudo().query.AccountLineItem.findMany({
                where: {
                  account: { id: { equals: item.id } },
                  paymentStatus: { equals: "unpaid" }
                },
                query: `
                  id
                  amount
                  description
                  orderDisplayId
                  itemCount
                  createdAt
                  formattedAmount
                  region {
                    id
                    name
                    currency {
                      id
                      code
                      symbol
                      noDivisionCurrency
                    }
                  }
                `,
                orderBy: { createdAt: "desc" }
              });
              if (unpaidLineItems.length === 0) {
                return {
                  success: true,
                  regions: [],
                  totalRegions: 0,
                  totalUnpaidItems: 0,
                  message: "No unpaid items found"
                };
              }
              const lineItemsByRegion = unpaidLineItems.reduce((acc, item2) => {
                const regionId = item2.region.id;
                const regionName = item2.region.name;
                const currency = item2.region.currency;
                if (!acc[regionId]) {
                  acc[regionId] = {
                    region: {
                      id: regionId,
                      name: regionName,
                      currency
                    },
                    lineItems: [],
                    totalAmount: 0,
                    itemCount: 0
                    // This will count unique orders
                  };
                }
                acc[regionId].lineItems.push({
                  id: item2.id,
                  amount: item2.amount,
                  description: item2.description,
                  orderDisplayId: item2.orderDisplayId,
                  itemCount: item2.itemCount,
                  createdAt: item2.createdAt,
                  formattedAmount: item2.formattedAmount
                });
                acc[regionId].totalAmount += item2.amount || 0;
                acc[regionId].itemCount += 1;
                return acc;
              }, {});
              const regionsWithLineItems = Object.values(lineItemsByRegion).map((regionData) => {
                const divisor = regionData.region.currency.noDivisionCurrency ? 1 : 100;
                const formattedTotal = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: regionData.region.currency.code
                }).format(regionData.totalAmount / divisor);
                return {
                  ...regionData,
                  formattedTotalAmount: formattedTotal
                };
              });
              regionsWithLineItems.sort((a, b) => b.totalAmount - a.totalAmount);
              return {
                success: true,
                regions: regionsWithLineItems,
                totalRegions: regionsWithLineItems.length,
                totalUnpaidItems: unpaidLineItems.length,
                message: `Found ${unpaidLineItems.length} unpaid orders across ${regionsWithLineItems.length} regions`
              };
            }
          })
        })
      }
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput({ operation, resolvedData }) {
      if (operation === "create" && !resolvedData.accountNumber) {
        const timestamp34 = Date.now();
        resolvedData.accountNumber = `ACC-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(timestamp34).slice(-6)}`;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/AccountLineItem.ts
var import_core33 = require("@keystone-6/core");
var import_fields37 = require("@keystone-6/core/fields");

// features/keystone/lib/account-line-item-order-details.ts
var MAX_ACCOUNT_LINE_ITEM_ORDER_DETAIL_LINES = 100;
function projectAccountLineItemOrderDetails(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const order = value;
  const rows2 = order.lineItems;
  const count = order.lineItemsCount;
  const lineItemsHasMore = Array.isArray(rows2) && Number.isSafeInteger(count) && count >= rows2.length ? count > rows2.length : null;
  return { ...order, lineItemsHasMore };
}

// features/keystone/models/AccountLineItem.ts
var AccountLineItem = (0, import_core33.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    // Core relationships
    account: requiredRelationship({
      ref: "Account.lineItems",
      many: false,
      validation: { isRequired: true }
    }),
    order: requiredRelationship({
      ref: "Order.accountLineItems",
      many: false,
      validation: { isRequired: true }
    }),
    orderKey: (0, import_fields37.text)({
      isIndexed: "unique",
      db: { isNullable: true },
      ui: { itemView: { fieldMode: "read" }, createView: { fieldMode: "hidden" } }
    }),
    region: (0, import_fields37.relationship)({
      ref: "Region.accountLineItems",
      many: false
    }),
    // Line item details
    description: (0, import_fields37.text)({
      validation: { isRequired: true },
      defaultValue: "Order line item"
    }),
    amount: (0, import_fields37.integer)({
      validation: { isRequired: true },
      label: "Amount (in cents)"
    }),
    orderDisplayId: (0, import_fields37.text)({
      validation: { isRequired: true },
      isIndexed: true
    }),
    itemCount: (0, import_fields37.integer)({
      validation: { isRequired: true },
      defaultValue: 0
    }),
    paymentStatus: (0, import_fields37.select)({
      options: [
        { label: "Unpaid", value: "unpaid" },
        { label: "Paid", value: "paid" },
        { label: "Canceled", value: "canceled" }
      ],
      defaultValue: "unpaid",
      validation: { isRequired: true }
    }),
    // Junction relationship to track which invoices paid this item
    invoiceLineItems: (0, import_fields37.relationship)({
      ref: "InvoiceLineItem.accountLineItem",
      many: true
    }),
    // Virtual computed fields
    ...(0, import_core33.group)({
      label: "Computed Fields",
      description: "Auto-calculated fields for line item display",
      fields: {
        formattedAmount: (0, import_fields37.virtual)({
          field: import_core33.graphql.field({
            type: import_core33.graphql.String,
            async resolve(item, args, context) {
              const lineItem = await context.sudo().query.AccountLineItem.findOne({
                where: { id: item.id },
                query: `
                  amount
                  account {
                    currency {
                      code
                      symbol
                      noDivisionCurrency
                    }
                  }
                `
              });
              if (!lineItem?.account?.currency) return "$0.00";
              const divisor = lineItem.account.currency.noDivisionCurrency ? 1 : 100;
              const amount = (lineItem.amount || 0) / divisor;
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: lineItem.account.currency.code
              }).format(amount);
            }
          })
        }),
        orderDetails: (0, import_fields37.virtual)({
          field: import_core33.graphql.field({
            type: import_core33.graphql.JSON,
            async resolve(item, args, context) {
              const lineItemId = item.id;
              const lineItem = await context.sudo().query.AccountLineItem.findOne({
                where: { id: lineItemId },
                query: `
                  order {
                    id
                    displayId
                    status
                    email
                    createdAt
                    total
                    subtotal
                    shipping
                    tax
                    lineItemsCount
                    lineItems(orderBy: [{ createdAt: desc }, { id: desc }], take: ${MAX_ACCOUNT_LINE_ITEM_ORDER_DETAIL_LINES}) {
                      id
                      title
                      quantity
                      sku
                      variantTitle
                      formattedUnitPrice
                      formattedTotal
                      thumbnail
                    }
                  }
                `
              });
              return projectAccountLineItemOrderDetails(lineItem?.order);
            }
          })
        }),
        paidAt: (0, import_fields37.virtual)({
          field: import_core33.graphql.field({
            type: import_core33.graphql.String,
            async resolve(item, args, context) {
              if (item.paymentStatus !== "paid") return null;
              const invoices = await context.sudo().query.Invoice.findMany({
                where: { status: { equals: "paid" }, paidAt: { not: { equals: null } }, lineItems: { some: { accountLineItem: { id: { equals: item.id } } } } },
                orderBy: [{ paidAt: "desc" }, { id: "desc" }],
                take: 1,
                query: "paidAt"
              });
              return invoices[0]?.paidAt ?? null;
            }
          })
        })
      }
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput: async ({ resolvedData, context, operation }) => {
      if (operation === "create") {
        if (resolvedData.order?.connect?.id && (!resolvedData.description || !resolvedData.amount)) {
          const order = await context.sudo().query.Order.findOne({
            where: { id: resolvedData.order.connect.id },
            query: `
              displayId
              rawTotal
              lineItems {
                id
              }
            `
          });
          if (order) {
            return {
              ...resolvedData,
              description: resolvedData.description || `Order #${order.displayId} - ${order.lineItems?.length || 0} items`,
              amount: resolvedData.amount || order.rawTotal || 0,
              orderDisplayId: resolvedData.orderDisplayId || order.displayId,
              itemCount: resolvedData.itemCount || order.lineItems?.length || 0
            };
          }
        }
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/Invoice.ts
var import_core34 = require("@keystone-6/core");
var import_fields38 = require("@keystone-6/core/fields");
var Invoice = (0, import_core34.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    // Core invoice data
    user: requiredRelationship({
      ref: "User.invoices",
      many: false,
      validation: { isRequired: true }
    }),
    invoiceNumber: (0, import_fields38.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    title: (0, import_fields38.text)({
      validation: { isRequired: true },
      defaultValue: "Payment Invoice"
    }),
    description: (0, import_fields38.text)({
      ui: { displayMode: "textarea" },
      defaultValue: "Invoice for selected orders payment"
    }),
    // Financial fields (amounts in cents)
    totalAmount: (0, import_fields38.integer)({
      validation: { isRequired: true },
      defaultValue: 0
    }),
    currency: requiredRelationship({
      ref: "Currency.invoices",
      many: false,
      validation: { isRequired: true }
    }),
    // Status and dates
    status: (0, import_fields38.select)({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Sent", value: "sent" },
        { label: "Paid", value: "paid" },
        { label: "Overdue", value: "overdue" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "draft",
      // Paid is only established by a verified completion command
      validation: { isRequired: true }
    }),
    dueDate: (0, import_fields38.timestamp)(),
    paidAt: (0, import_fields38.timestamp)(),
    // Metadata for payment details
    metadata: (0, import_fields38.json)({
      defaultValue: {}
    }),
    // Relationships
    account: requiredRelationship({
      ref: "Account.invoices",
      many: false,
      validation: { isRequired: true }
    }),
    lineItems: (0, import_fields38.relationship)({
      ref: "InvoiceLineItem.invoice",
      many: true
    }),
    paymentCollection: (0, import_fields38.relationship)({
      ref: "PaymentCollection.invoice",
      db: { foreignKey: true }
    }),
    // Virtual computed fields
    ...(0, import_core34.group)({
      label: "Computed Fields",
      description: "Auto-calculated fields for invoice display",
      fields: {
        formattedTotal: (0, import_fields38.virtual)({
          field: import_core34.graphql.field({
            type: import_core34.graphql.String,
            async resolve(item, args, context) {
              try {
                const invoice = await context.sudo().query.Invoice.findOne({ where: { id: item.id }, query: "currency { code noDivisionCurrency }" });
                const currency = invoice?.currency;
                if (!currency) {
                  return null;
                }
                const divisor = currency.noDivisionCurrency ? 1 : 100;
                const amount = (item.totalAmount || 0) / divisor;
                return new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: currency.code
                }).format(amount);
              } catch (error) {
                return null;
              }
            }
          })
        }),
        itemCount: (0, import_fields38.virtual)({
          field: import_core34.graphql.field({
            type: import_core34.graphql.Int,
            async resolve(item, args, context) {
              try {
                return context.sudo().query.InvoiceLineItem.count({ where: { invoice: { id: { equals: item.id } } } });
              } catch (error) {
                return 0;
              }
            }
          })
        }),
        paymentSessions: (0, import_fields38.virtual)({
          field: import_core34.graphql.field({
            type: import_core34.graphql.list(import_core34.graphql.nonNull(import_core34.graphql.JSON)),
            async resolve(item, args, context) {
              try {
                const invoice = await context.sudo().query.Invoice.findOne({
                  where: { id: item.id },
                  query: `
                    paymentCollection {
                      id
                      paymentSessions {
                        id
                        paymentProvider {
                          id
                          code
                        }
                        data
                        isSelected
                        isInitiated
                        amount
                      }
                    }
                  `
                });
                return invoice?.paymentCollection?.paymentSessions || [];
              } catch (error) {
                return [];
              }
            }
          })
        })
      }
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput({ operation, resolvedData }) {
      if (operation === "create" && !resolvedData.invoiceNumber) {
        const timestamp34 = Date.now();
        resolvedData.invoiceNumber = `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(timestamp34).slice(-6)}`;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/InvoiceLineItem.ts
var import_core35 = require("@keystone-6/core");
var import_fields39 = require("@keystone-6/core/fields");
var InvoiceLineItem = (0, import_core35.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    // Junction table relationships
    invoice: requiredRelationship({
      ref: "Invoice.lineItems",
      many: false,
      validation: { isRequired: true }
    }),
    accountLineItem: requiredRelationship({
      ref: "AccountLineItem.invoiceLineItems",
      many: false,
      validation: { isRequired: true }
    }),
    // Virtual computed fields
    ...(0, import_core35.group)({
      label: "Computed Fields",
      description: "Auto-calculated fields from related account line item",
      fields: {
        orderDisplayId: (0, import_fields39.virtual)({
          field: import_core35.graphql.field({
            type: import_core35.graphql.String,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    orderDisplayId
                  }
                `
              });
              return invoiceLineItem?.accountLineItem?.orderDisplayId || "";
            }
          })
        }),
        formattedAmount: (0, import_fields39.virtual)({
          field: import_core35.graphql.field({
            type: import_core35.graphql.String,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    formattedAmount
                  }
                `
              });
              return invoiceLineItem?.accountLineItem?.formattedAmount || "$0.00";
            }
          })
        }),
        orderDetails: (0, import_fields39.virtual)({
          field: import_core35.graphql.field({
            type: import_core35.graphql.JSON,
            async resolve(item, args, context) {
              const invoiceLineItem = await context.sudo().query.InvoiceLineItem.findOne({
                where: { id: item.id },
                query: `
                  accountLineItem {
                    orderDetails
                  }
                `
              });
              return invoiceLineItem?.accountLineItem?.orderDetails || null;
            }
          })
        })
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/BusinessAccountRequest.ts
var import_core36 = require("@keystone-6/core");
var import_fields40 = require("@keystone-6/core/fields");
var BusinessAccountRequest = (0, import_core36.list)({
  access: {
    operation: {
      query: ({ session }) => {
        if (permissions.canManageOrders({ session })) return true;
        return isSignedIn({ session });
      },
      create: isSignedIn,
      // Any authenticated user can create requests
      update: permissions.canManageOrders,
      // Only admins can update/approve
      delete: permissions.canManageOrders
      // Only admins can delete
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManageOrders({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      }
    }
  },
  fields: {
    // Core relationship
    user: (0, import_fields40.relationship)({
      ref: "User.businessAccountRequest",
      many: false
    }),
    // Request details
    businessName: (0, import_fields40.text)({
      validation: { isRequired: true }
    }),
    businessType: (0, import_fields40.select)({
      options: [
        { label: "Wholesale Partner", value: "wholesale" },
        { label: "Distribution Channel", value: "distribution" },
        { label: "Authorized Reseller", value: "reseller" },
        { label: "B2B Platform", value: "b2b_platform" },
        { label: "Other", value: "other" }
      ],
      validation: { isRequired: true }
    }),
    monthlyOrderVolume: (0, import_fields40.select)({
      options: [
        { label: "1-50 orders/month", value: "low" },
        { label: "51-200 orders/month", value: "medium" },
        { label: "201-1000 orders/month", value: "high" },
        { label: "1000+ orders/month", value: "enterprise" }
      ],
      validation: { isRequired: true }
    }),
    requestedCreditLimit: (0, import_fields40.integer)({
      validation: { isRequired: true },
      label: "Requested Credit Limit (in cents)"
    }),
    businessDescription: (0, import_fields40.text)({
      ui: { displayMode: "textarea" },
      validation: { isRequired: true }
    }),
    // Status tracking
    status: (0, import_fields40.select)({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Not Approved", value: "not_approved" },
        { label: "Requires Info", value: "requires_info" }
      ],
      defaultValue: "pending",
      validation: { isRequired: true }
    }),
    // Admin fields
    reviewedBy: (0, import_fields40.relationship)({
      ref: "User",
      many: false,
      label: "Reviewed By Admin"
    }),
    reviewNotes: (0, import_fields40.text)({
      ui: { displayMode: "textarea" },
      label: "Admin Review Notes"
    }),
    approvedCreditLimit: (0, import_fields40.integer)({
      label: "Approved Credit Limit (in cents)"
    }),
    // Timestamps
    submittedAt: (0, import_fields40.timestamp)({
      defaultValue: { kind: "now" },
      validation: { isRequired: true }
    }),
    reviewedAt: (0, import_fields40.timestamp)(),
    // Generated account (once approved)
    generatedAccount: (0, import_fields40.relationship)({
      ref: "Account",
      many: false,
      label: "Generated Account"
    }),
    // Virtual computed fields
    ...(0, import_core36.group)({
      label: "Computed Fields",
      description: "Auto-calculated fields for request display",
      fields: {
        formattedRequestedCredit: (0, import_fields40.virtual)({
          field: import_core36.graphql.field({
            type: import_core36.graphql.String,
            resolve(item) {
              const amount = Number(item.requestedCreditLimit || 0) / 100;
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD"
              }).format(amount);
            }
          })
        }),
        formattedApprovedCredit: (0, import_fields40.virtual)({
          field: import_core36.graphql.field({
            type: import_core36.graphql.String,
            resolve(item) {
              if (!item.approvedCreditLimit) return null;
              const amount = Number(item.approvedCreditLimit || 0) / 100;
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD"
              }).format(amount);
            }
          })
        }),
        businessTypeLabel: (0, import_fields40.virtual)({
          field: import_core36.graphql.field({
            type: import_core36.graphql.String,
            resolve(item) {
              const typeMap = {
                wholesale: "Wholesale Partner",
                distribution: "Distribution Channel",
                reseller: "Authorized Reseller",
                b2b_platform: "B2B Platform",
                other: "Other"
              };
              return typeMap[item.businessType] || item.businessType;
            }
          })
        }),
        volumeLabel: (0, import_fields40.virtual)({
          field: import_core36.graphql.field({
            type: import_core36.graphql.String,
            resolve(item) {
              const volumeMap = {
                low: "1-50 orders/month",
                medium: "51-200 orders/month",
                high: "201-1000 orders/month",
                enterprise: "1000+ orders/month"
              };
              return volumeMap[item.monthlyOrderVolume] || item.monthlyOrderVolume;
            }
          })
        }),
        statusLabel: (0, import_fields40.virtual)({
          field: import_core36.graphql.field({
            type: import_core36.graphql.String,
            resolve(item) {
              const statusMap = {
                pending: "Pending Review",
                approved: "Approved",
                not_approved: "Not Approved",
                requires_info: "Requires Additional Information"
              };
              return statusMap[item.status] || item.status;
            }
          })
        })
      }
    }),
    ...trackingFields
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, item, addValidationError }) => {
      if (operation === "create" && !resolvedData.user) {
        addValidationError("A user is required");
      }
      if (operation === "update" && resolvedData.status === "approved" && !resolvedData.approvedCreditLimit && !item?.approvedCreditLimit) {
        addValidationError("An approved credit limit is required");
      }
    },
    afterOperation: async ({ operation, item, originalItem, context }) => {
      if (operation === "update" && item?.status === "approved" && originalItem?.status !== "approved" && !item.generatedAccountId) {
        const accountId = await createAccountFromApprovedRequest(item, context);
        if (accountId) {
          await context.sudo().query.BusinessAccountRequest.updateOne({
            where: { id: String(item.id) },
            data: { generatedAccount: { connect: { id: accountId } } }
          });
        }
      }
    }
  }
});
async function createAccountFromApprovedRequest(request, context) {
  try {
    const fullRequest = await context.sudo().query.BusinessAccountRequest.findOne({
      where: { id: request.id },
      query: `
        id
        businessName
        businessType
        approvedCreditLimit
        user {
          id
          email
          name
        }
      `
    });
    if (!fullRequest) {
      return null;
    }
    const defaultCurrency = await context.sudo().query.Currency.findOne({
      where: { code: "usd" },
      query: "id code"
    });
    if (!defaultCurrency) {
      return null;
    }
    const account = await context.sudo().query.Account.createOne({
      data: {
        user: { connect: { id: fullRequest.user.id } },
        title: "Business Account",
        description: `Running business account for automated orders placed through API integration - ${fullRequest.businessName}`,
        currency: { connect: { id: defaultCurrency.id } },
        status: "active",
        creditLimit: request.approvedCreditLimit || fullRequest.approvedCreditLimit || 1e5,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        // 30 days from now
        accountType: "business",
        metadata: {
          createdFromRequest: fullRequest.id,
          businessType: fullRequest.businessType,
          businessName: fullRequest.businessName,
          approvedCreditLimit: request.approvedCreditLimit || fullRequest.approvedCreditLimit
        }
      }
    });
    return account.id;
  } catch (error) {
    console.error("Error creating account from approved request:", error);
    return null;
  }
}

// features/keystone/models/LineItem.ts
var import_core37 = require("@keystone-6/core");
var import_fields41 = require("@keystone-6/core/fields");
var formatCurrency2 = (amount, currencyCode) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(amount);
};
var LineItem = (0, import_core37.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  hooks: {
    async afterOperation({ operation, item, context }) {
      if (operation === "create" || operation === "update") {
        const sudoContext = context.sudo();
        const lineItem = await sudoContext.query.LineItem.findOne({
          where: { id: item.id },
          query: "cart { id }"
        });
        if (lineItem?.cart?.id) {
          await sudoContext.query.Cart.updateOne({
            where: { id: lineItem.cart.id },
            data: {
              paymentCollection: {
                disconnect: true
              }
            }
          });
        }
      }
    }
  },
  fields: {
    // Core fields
    quantity: (0, import_fields41.integer)({
      validation: { isRequired: true }
    }),
    metadata: (0, import_fields41.json)(),
    isReturn: (0, import_fields41.checkbox)(),
    isGiftcard: (0, import_fields41.checkbox)(),
    shouldMerge: (0, import_fields41.checkbox)({
      defaultValue: true
    }),
    allowDiscounts: (0, import_fields41.checkbox)({
      defaultValue: true
    }),
    hasShipping: (0, import_fields41.checkbox)(),
    // Relationships
    claimOrder: (0, import_fields41.relationship)({
      ref: "ClaimOrder.lineItems"
    }),
    cart: (0, import_fields41.relationship)({
      ref: "Cart.lineItems"
    }),
    swap: (0, import_fields41.relationship)({
      ref: "Swap.lineItems"
    }),
    productVariant: (0, import_fields41.relationship)({
      ref: "ProductVariant.lineItems"
    }),
    claimItems: (0, import_fields41.relationship)({
      ref: "ClaimItem.lineItem",
      many: true
    }),
    lineItemAdjustments: (0, import_fields41.relationship)({
      ref: "LineItemAdjustment.lineItem",
      many: true
    }),
    lineItemTaxLines: (0, import_fields41.relationship)({
      ref: "LineItemTaxLine.lineItem",
      many: true
    }),
    returnItems: (0, import_fields41.relationship)({
      ref: "ReturnItem.lineItem",
      many: true
    }),
    ...(0, import_core37.group)({
      label: "Virtual Fields",
      description: "Virtual fields for line item",
      fields: {
        title: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const lineItem = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: "productVariant { product { title } }"
              });
              if (!lineItem?.productVariant?.product) {
                return "Product not found";
              }
              return lineItem.productVariant.product.title;
            }
          })
        }),
        thumbnail: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const lineItem = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `
                  productVariant {
                    primaryImage {
                      image { url }
                      imagePath
                    }
                    product { thumbnail }
                  }
                `
              });
              if (!lineItem?.productVariant) {
                return null;
              }
              const primaryImage = lineItem.productVariant.primaryImage;
              if (primaryImage) {
                return primaryImage.image?.url || primaryImage.imagePath || null;
              }
              return lineItem.productVariant.product?.thumbnail || null;
            }
          })
        }),
        description: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.JSON,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const lineItem = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: "productVariant { product { description { document } } }"
              });
              if (!lineItem?.productVariant?.product) {
                return null;
              }
              return lineItem.productVariant.product.description.document;
            }
          })
        }),
        originalPrice: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const { cart } = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `cart { region { id taxRate currency { code noDivisionCurrency } } }`
              });
              if (!cart) {
                return "No cart associated";
              }
              const prices = await sudoContext.query.MoneyAmount.findMany({
                where: {
                  productVariant: {
                    lineItems: { some: { id: { equals: item.id } } }
                  },
                  region: { id: { equals: cart.region.id } }
                },
                query: `
                  calculatedPrice {
                    originalAmount
                    currencyCode
                  }
                `
              });
              const price = prices[0]?.calculatedPrice;
              const currencyCode = cart?.region?.currency?.code || price?.currencyCode;
              if (!price || !currencyCode) {
                return "No price available";
              }
              const amount = price.originalAmount;
              const divisor = cart?.region?.currency?.noDivisionCurrency ? 1 : 100;
              const finalAmount = Math.round(amount) / divisor;
              return formatCurrency2(finalAmount, currencyCode);
            }
          })
        }),
        unitPrice: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const { cart } = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `
                  cart {
                    region {
                      id
                      currency {
                        code
                        noDivisionCurrency
                      }
                    }
                  }
                `
              });
              if (!cart) {
                return "No cart associated";
              }
              const prices = await sudoContext.query.MoneyAmount.findMany({
                where: {
                  productVariant: {
                    lineItems: { some: { id: { equals: item.id } } }
                  },
                  region: { id: { equals: cart.region.id } }
                },
                query: `
                  calculatedPrice {
                    calculatedAmount
                    currencyCode
                  }
                `
              });
              const price = prices[0]?.calculatedPrice;
              const currencyCode = cart?.region?.currency?.code || price?.currencyCode;
              if (!price || !currencyCode) {
                return "No price available";
              }
              const amount = price.calculatedAmount;
              const divisor = cart?.region?.currency?.noDivisionCurrency ? 1 : 100;
              const finalAmount = Math.round(amount) / divisor;
              return formatCurrency2(finalAmount, currencyCode);
            }
          })
        }),
        total: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const { cart, quantity } = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `
                  quantity
                  cart {
                    region {
                      id
                      currency {
                        code
                        noDivisionCurrency
                      }
                    }
                  }
                `
              });
              if (!cart) {
                return "No cart associated";
              }
              const prices = await sudoContext.query.MoneyAmount.findMany({
                where: {
                  productVariant: {
                    lineItems: { some: { id: { equals: item.id } } }
                  },
                  region: { id: { equals: cart.region.id } }
                },
                query: `
                  calculatedPrice {
                    calculatedAmount
                    currencyCode
                  }
                `
              });
              const price = prices[0]?.calculatedPrice;
              const currencyCode = cart?.region?.currency?.code || price?.currencyCode;
              if (!price || !currencyCode) {
                return "No price available";
              }
              const amount = price.calculatedAmount;
              const divisor = cart?.region?.currency?.noDivisionCurrency ? 1 : 100;
              const finalAmount = Math.round(amount * quantity) / divisor;
              return formatCurrency2(finalAmount, currencyCode);
            }
          })
        }),
        availableInRegion: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const { cart } = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `
                  cart { 
                    region { 
                      id 
                    }
                  }
                `
              });
              if (!cart) {
                return "no_cart";
              }
              const prices = await sudoContext.query.MoneyAmount.findMany({
                where: {
                  productVariant: {
                    lineItems: { some: { id: { equals: item.id } } }
                  },
                  region: { id: { equals: cart.region.id } }
                },
                query: "id"
              });
              return prices.length > 0 ? "available" : "unavailable";
            }
          })
        }),
        percentageOff: (0, import_fields41.virtual)({
          field: import_core37.graphql.field({
            type: import_core37.graphql.Int,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const { cart, quantity } = await sudoContext.query.LineItem.findOne({
                where: { id: item.id },
                query: `cart { region { id } } quantity`
              });
              if (!cart) {
                return 0;
              }
              const prices = await sudoContext.query.MoneyAmount.findMany({
                where: {
                  productVariant: {
                    lineItems: { some: { id: { equals: item.id } } }
                  },
                  region: { id: { equals: cart.region.id } }
                },
                query: `
                  id
                  amount
                  calculatedPrice {
                    calculatedAmount
                    originalAmount
                    currencyCode
                  }
                `
              });
              const price = prices[0]?.calculatedPrice;
              if (!price) return 0;
              const originalAmount = price.originalAmount * quantity;
              const calculatedAmount = price.calculatedAmount * quantity;
              if (!originalAmount || originalAmount <= calculatedAmount)
                return 0;
              const diff = originalAmount - calculatedAmount;
              return Math.round(diff / originalAmount * 100);
            }
          })
        })
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/LineItemAdjustment.ts
var import_core38 = require("@keystone-6/core");
var import_fields42 = require("@keystone-6/core/fields");
var LineItemAdjustment = (0, import_core38.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    description: (0, import_fields42.text)({
      validation: {
        isRequired: true
      }
    }),
    amount: (0, import_fields42.integer)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields42.json)(),
    discount: (0, import_fields42.relationship)({
      ref: "Discount.lineItemAdjustments"
    }),
    lineItem: (0, import_fields42.relationship)({
      ref: "LineItem.lineItemAdjustments"
    }),
    ...trackingFields
  }
});

// features/keystone/models/LineItemTaxLine.ts
var import_core39 = require("@keystone-6/core");
var import_fields43 = require("@keystone-6/core/fields");
var LineItemTaxLine = (0, import_core39.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    rate: (0, import_fields43.float)({
      validation: {
        isRequired: true
      }
    }),
    name: (0, import_fields43.text)({
      validation: {
        isRequired: true
      }
    }),
    code: (0, import_fields43.text)(),
    metadata: (0, import_fields43.json)(),
    lineItem: (0, import_fields43.relationship)({
      ref: "LineItem.lineItemTaxLines"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Location.ts
var import_core40 = require("@keystone-6/core");
var import_fields44 = require("@keystone-6/core/fields");
var Location = (0, import_core40.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadProducts({ session }) || permissions.canManageProducts({ session }),
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    name: (0, import_fields44.text)({
      validation: { isRequired: true }
    }),
    description: (0, import_fields44.text)(),
    address: (0, import_fields44.text)(),
    variants: (0, import_fields44.relationship)({
      ref: "ProductVariant.location",
      many: true
    }),
    ...trackingFields
  },
  hooks: {
    validateInput: async ({ resolvedData, addValidationError }) => {
      const { name } = resolvedData;
      if (name && name.length < 2) {
        addValidationError("Location name must be at least 2 characters long");
      }
    }
  }
});

// features/keystone/models/Measurement.ts
var import_core41 = require("@keystone-6/core");
var import_fields45 = require("@keystone-6/core/fields");
var UNITS = {
  weight: ["g", "kg", "oz", "lb"],
  dimensions: ["cm", "m", "in", "ft"]
};
var Measurement = (0, import_core41.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    value: (0, import_fields45.float)({
      validation: {
        isRequired: true,
        min: 0
      }
    }),
    unit: (0, import_fields45.select)({
      type: "string",
      validation: {
        isRequired: true
      },
      options: [...UNITS.weight, ...UNITS.dimensions].map((unit) => ({
        label: unit.toUpperCase(),
        value: unit
      })),
      defaultValue: "g",
      ui: {
        displayMode: "select"
      }
    }),
    type: (0, import_fields45.select)({
      type: "string",
      validation: {
        isRequired: true
      },
      options: [
        { label: "Weight", value: "weight" },
        { label: "Length", value: "length" },
        { label: "Width", value: "width" },
        { label: "Height", value: "height" }
      ],
      defaultValue: "weight",
      ui: {
        displayMode: "select"
      }
    }),
    productVariant: (0, import_fields45.relationship)({
      ref: "ProductVariant.measurements"
    }),
    ...trackingFields
  }
});

// features/keystone/models/MoneyAmount.ts
var import_core42 = require("@keystone-6/core");
var import_fields46 = require("@keystone-6/core/fields");
var MoneyAmount = (0, import_core42.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    },
    filter: {
      query: ({ session }) => permissions.canManageProducts({ session }) ? true : {
        productVariant: { product: { status: { equals: "published" } } }
      }
    }
  },
  fields: {
    amount: (0, import_fields46.integer)({
      validation: {
        isRequired: true,
        min: 0,
        max: 2147483647
      }
    }),
    compareAmount: (0, import_fields46.integer)(),
    minQuantity: (0, import_fields46.integer)(),
    maxQuantity: (0, import_fields46.integer)(),
    productVariant: (0, import_fields46.relationship)({
      ref: "ProductVariant.prices"
    }),
    region: (0, import_fields46.relationship)({
      ref: "Region.moneyAmounts"
    }),
    currency: (0, import_fields46.relationship)({
      ref: "Currency.moneyAmounts"
    }),
    priceList: (0, import_fields46.relationship)({
      ref: "PriceList.moneyAmounts"
    }),
    priceSet: (0, import_fields46.relationship)({
      ref: "PriceSet.prices"
    }),
    priceRules: (0, import_fields46.relationship)({
      ref: "PriceRule.moneyAmounts",
      many: true
    }),
    ...(0, import_core42.group)({
      label: "Virtual Fields",
      description: "Virtual fields for money amount",
      fields: {
        displayPrice: (0, import_fields46.virtual)({
          field: import_core42.graphql.field({
            type: import_core42.graphql.String,
            resolve: async (item, args, context) => {
              const price = await context.query.MoneyAmount.findOne({ where: { id: item.id }, query: "currency { code noDivisionCurrency } amount" });
              if (!price?.currency) return null;
              return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency.code }).format(price.amount / (price.currency.noDivisionCurrency ? 1 : 100));
            }
          })
        }),
        calculatedPrice: (0, import_fields46.virtual)({
          field: import_core42.graphql.field({
            type: import_core42.graphql.object()({
              name: "CalculatedPrice",
              fields: {
                calculatedAmount: import_core42.graphql.field({ type: import_core42.graphql.Int }),
                originalAmount: import_core42.graphql.field({ type: import_core42.graphql.Int }),
                currencyCode: import_core42.graphql.field({ type: import_core42.graphql.String }),
                moneyAmountId: import_core42.graphql.field({ type: import_core42.graphql.ID }),
                variantId: import_core42.graphql.field({ type: import_core42.graphql.ID }),
                priceListId: import_core42.graphql.field({ type: import_core42.graphql.ID }),
                priceListType: import_core42.graphql.field({ type: import_core42.graphql.String })
              }
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
                `
              });
              if (!moneyAmount) return null;
              const now = /* @__PURE__ */ new Date();
              const currencyCode = moneyAmount.currency.code;
              let calculatedAmount = moneyAmount.amount;
              let originalAmount = moneyAmount.amount;
              let appliedPriceList = null;
              if (moneyAmount.priceList) {
                const startDate = moneyAmount.priceList.startsAt ? new Date(moneyAmount.priceList.startsAt) : null;
                const endDate = moneyAmount.priceList.endsAt ? new Date(moneyAmount.priceList.endsAt) : null;
                if (moneyAmount.priceList.status === "active" && (!startDate || startDate <= now) && (!endDate || endDate >= now)) {
                  appliedPriceList = moneyAmount.priceList;
                }
              }
              if (moneyAmount.priceSet) {
                const validPrices = moneyAmount.priceSet.prices.filter(
                  (price) => {
                    if (price.currency.code !== currencyCode) return false;
                    if (price.priceList) {
                      const startDate = price.priceList.startsAt ? new Date(price.priceList.startsAt) : null;
                      const endDate = price.priceList.endsAt ? new Date(price.priceList.endsAt) : null;
                      return price.priceList.status === "active" && (!startDate || startDate <= now) && (!endDate || endDate >= now);
                    }
                    return true;
                  }
                );
                if (validPrices.length > 0) {
                  validPrices.sort((a, b) => a.amount - b.amount);
                  calculatedAmount = validPrices[0].amount;
                  appliedPriceList = validPrices[0].priceList || null;
                }
                if (moneyAmount.priceSet.priceRules && moneyAmount.priceSet.priceRules.length > 0) {
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
              if (!Number.isSafeInteger(calculatedAmount) || calculatedAmount < 0 || calculatedAmount > 2147483647 || !Number.isSafeInteger(originalAmount) || originalAmount < 0) throw new Error("Invalid minor-unit price");
              return {
                calculatedAmount,
                originalAmount,
                currencyCode,
                moneyAmountId: moneyAmount.id,
                variantId: moneyAmount.productVariant?.id || null,
                priceListId: appliedPriceList?.id || null,
                priceListType: appliedPriceList?.type || null
              };
            }
          }),
          ui: {
            query: "{ calculatedAmount originalAmount currencyCode moneyAmountId variantId priceListId priceListType }"
          }
        })
      }
    }),
    ...trackingFields
  },
  ui: {
    labelField: "displayPrice"
  }
});

// features/keystone/models/Note.ts
var import_core43 = require("@keystone-6/core");
var import_fields47 = require("@keystone-6/core/fields");
var Note = (0, import_core43.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    value: (0, import_fields47.text)({
      validation: {
        isRequired: true
      }
    }),
    resourceType: (0, import_fields47.text)({
      validation: {
        isRequired: true
      }
    }),
    resourceId: (0, import_fields47.text)({
      validation: {
        isRequired: true
      }
    }),
    authorId: (0, import_fields47.text)(),
    metadata: (0, import_fields47.json)(),
    ...trackingFields
  }
});

// features/keystone/models/Notification.ts
var import_core44 = require("@keystone-6/core");
var import_fields48 = require("@keystone-6/core/fields");
var Notification = (0, import_core44.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    eventName: (0, import_fields48.text)(),
    resourceType: (0, import_fields48.text)({
      validation: {
        isRequired: true
      }
    }),
    resourceId: (0, import_fields48.text)({
      validation: {
        isRequired: true
      }
    }),
    to: (0, import_fields48.text)({
      validation: {
        isRequired: true
      }
    }),
    data: (0, import_fields48.json)(),
    parentId: (0, import_fields48.text)(),
    notificationProvider: (0, import_fields48.relationship)({
      ref: "NotificationProvider.notifications"
    }),
    user: (0, import_fields48.relationship)({
      ref: "User.notifications"
    }),
    otherNotifications: (0, import_fields48.relationship)({
      ref: "Notification",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/NotificationProvider.ts
var import_core45 = require("@keystone-6/core");
var import_fields49 = require("@keystone-6/core/fields");
var NotificationProvider = (0, import_core45.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    isInstalled: (0, import_fields49.checkbox)({
      defaultValue: true
    }),
    notifications: (0, import_fields49.relationship)({
      ref: "Notification.notificationProvider",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/OAuthApp.ts
var import_core46 = require("@keystone-6/core");
var import_fields50 = require("@keystone-6/core/fields");
var OAuthApp = (0, import_core46.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadApps({ session }) || permissions.canManageApps({ session }),
      create: ({ session }) => permissions.canManageApps({ session }),
      update: ({ session }) => permissions.canManageApps({ session }),
      delete: ({ session }) => permissions.canManageApps({ session })
    }
  },
  fields: {
    name: (0, import_fields50.text)({
      validation: {
        isRequired: true
      }
    }),
    clientId: (0, import_fields50.text)({
      isIndexed: "unique",
      hooks: {
        resolveInput: ({ operation, resolvedData }) => {
          if (operation === "create" && !resolvedData.clientId) {
            return generateOpaqueToken("of_");
          }
          return resolvedData.clientId;
        }
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Auto-generated unique identifier for your application."
      }
    }),
    clientSecret: (0, import_fields50.text)({
      access: {
        read: () => false
      },
      hooks: {
        resolveInput: ({ operation, resolvedData }) => {
          if (operation === "create" && !resolvedData.clientSecret) {
            throw new Error("OAuth apps must be created through the show-once credential command");
          }
          if (resolvedData.clientSecret) {
            return oauthClientSecretDigest(resolvedData.clientSecret);
          }
          return void 0;
        }
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        // displayMode: "textarea",
        description: "Auto-generated secret key. Keep this secure - it's used to authenticate your application."
      }
    }),
    redirectUris: (0, import_fields50.json)({
      defaultValue: [],
      ui: {
        description: "Array of allowed redirect URIs for OAuth callbacks"
      }
    }),
    scopes: (0, import_fields50.json)({
      defaultValue: DEFAULT_SCOPES,
      ui: {
        description: "Array of allowed OAuth scopes that map to permissions"
      }
    }),
    webhookUrl: (0, import_fields50.text)({
      ui: {
        description: "URL to receive webhook notifications"
      }
    }),
    status: (0, import_fields50.select)({
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Pending", value: "pending" }
      ],
      defaultValue: "active"
    }),
    installUrl: (0, import_fields50.text)({
      ui: {
        description: "URL where users can install this app"
      }
    }),
    uninstallUrl: (0, import_fields50.text)({
      ui: {
        description: "URL to handle app uninstallation"
      }
    }),
    description: (0, import_fields50.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    metadata: (0, import_fields50.json)({
      defaultValue: {},
      ui: {
        description: "Additional app-specific configuration and settings"
      }
    }),
    developerEmail: (0, import_fields50.text)(),
    privacyPolicyUrl: (0, import_fields50.text)(),
    termsOfServiceUrl: (0, import_fields50.text)(),
    supportUrl: (0, import_fields50.text)(),
    ...trackingFields
  },
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "clientId", "status", "createdAt"]
    }
  }
});

// features/keystone/models/OAuthToken.ts
var import_core47 = require("@keystone-6/core");
var import_fields51 = require("@keystone-6/core/fields");

// features/keystone/security/oauth-credentials.ts
function storedOAuthToken(rawToken) {
  return oauthTokenDigest(rawToken);
}
async function findOAuthToken(context, rawToken, query) {
  if (!rawToken) return null;
  let token = await context.sudo().query.OAuthToken.findOne({
    where: { token: storedOAuthToken(rawToken) },
    query
  });
  if (!token && process.env.NODE_ENV !== "production") {
    token = await context.sudo().query.OAuthToken.findOne({
      where: { token: rawToken },
      query
    });
  }
  return token;
}

// features/keystone/models/OAuthToken.ts
var digestTokenInput = {
  resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] ? storedOAuthToken(resolvedData[fieldKey]) : resolvedData[fieldKey]
};
var OAuthToken = (0, import_core47.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadApps({ session }) || permissions.canManageApps({ session }),
      create: ({ session }) => permissions.canManageApps({ session }),
      update: ({ session }) => permissions.canManageApps({ session }),
      delete: ({ session }) => permissions.canManageApps({ session })
    }
  },
  fields: {
    tokenType: (0, import_fields51.select)({
      options: [
        { label: "Authorization Code", value: "authorization_code" },
        { label: "Access Token", value: "access_token" },
        { label: "Refresh Token", value: "refresh_token" }
      ],
      validation: {
        isRequired: true
      }
    }),
    token: (0, import_fields51.text)({
      access: { read: () => false },
      validation: {
        isRequired: true
      },
      isIndexed: "unique",
      hooks: digestTokenInput
    }),
    clientId: (0, import_fields51.text)({
      validation: {
        isRequired: true
      },
      isIndexed: true
    }),
    user: (0, import_fields51.relationship)({
      ref: "User",
      ui: {
        description: "The user who authorized this token"
      }
    }),
    scopes: (0, import_fields51.json)({
      defaultValue: [],
      ui: {
        description: "Array of granted scopes"
      }
    }),
    redirectUri: (0, import_fields51.text)({
      ui: {
        description: "The redirect URI used during authorization"
      }
    }),
    expiresAt: (0, import_fields51.timestamp)({
      ui: {
        description: "When this token expires"
      }
    }),
    isRevoked: (0, import_fields51.select)({
      options: [
        { label: "Active", value: "false" },
        { label: "Revoked", value: "true" }
      ],
      defaultValue: "false"
    }),
    authorizationCode: (0, import_fields51.text)({
      access: { read: () => false },
      hooks: digestTokenInput,
      ui: {
        description: "The authorization code that was exchanged for this token (for access tokens)"
      }
    }),
    refreshToken: (0, import_fields51.text)({
      access: { read: () => false },
      hooks: digestTokenInput,
      ui: {
        description: "Associated refresh token (for access tokens)"
      }
    }),
    accessToken: (0, import_fields51.text)({
      access: { read: () => false },
      hooks: digestTokenInput,
      ui: {
        description: "Associated access token (for refresh tokens)"
      }
    }),
    state: (0, import_fields51.text)({
      ui: {
        description: "OAuth state parameter for CSRF protection"
      }
    }),
    codeChallenge: (0, import_fields51.text)({
      ui: {
        description: "PKCE code challenge"
      }
    }),
    codeChallengeMethod: (0, import_fields51.select)({
      options: [
        { label: "Plain", value: "plain" },
        { label: "SHA256", value: "S256" }
      ],
      ui: {
        description: "PKCE code challenge method"
      }
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput({ operation, resolvedData, context }) {
      if ((operation === "create" || operation === "update") && !resolvedData.user && context.session?.itemId) {
        return {
          ...resolvedData,
          user: { connect: { id: context.session.itemId } }
        };
      }
      return resolvedData;
    }
  },
  ui: {
    labelField: "token",
    listView: {
      initialColumns: ["tokenType", "clientId", "scopes", "expiresAt", "isRevoked"]
    }
  }
});

// features/keystone/lib/order-view-projection.ts
var object = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function snapshot(item) {
  return object(item.metadata) && object(item.metadata.commercialSnapshot) ? item.metadata.commercialSnapshot : {};
}
function acceptedOrderCurrency(item, currency) {
  const stored = snapshot(item).currency;
  const code = typeof stored === "string" ? stored : currency?.code;
  if (!code) throw new Error("Accepted order currency is unavailable");
  const exponent = currencyExponent(code);
  if (exponent !== 0 && exponent !== 2) throw new Error("Unsupported accepted currency precision");
  return { code: code.toUpperCase(), divisor: 10 ** exponent };
}
function acceptedOrderTaxRate(item) {
  const policy = snapshot(item).tax;
  const rate = object(policy) ? policy.rate : item.taxRate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error("Accepted order tax policy is unavailable");
  return rate;
}
function acceptedOrderDiscounts(item, legacy) {
  const stored = snapshot(item).discounts;
  if (stored === void 0) {
    if (legacy?.length) throw new Error("Accepted order discount policy is unavailable");
    return [];
  }
  if (!Array.isArray(stored) || stored.length > 100) throw new Error("Invalid accepted discount policy");
  return stored.map((value) => {
    if (!object(value) || !object(value.discountRule)) throw new Error("Invalid accepted discount policy");
    const rule = value.discountRule;
    if (typeof rule.type !== "string" || !["fixed", "percentage", "free_shipping"].includes(rule.type) || typeof rule.value !== "number" || !Number.isSafeInteger(rule.value) || rule.value < 0 || rule.type === "percentage" && rule.value > 100) throw new Error("Invalid accepted discount policy");
    return { discountRule: { type: rule.type, value: rule.value, ...typeof rule.allocation === "string" ? { allocation: rule.allocation } : {} } };
  });
}

// features/keystone/models/Order.ts
var import_core48 = require("@keystone-6/core");
var import_access89 = require("@keystone-6/core/access");
var import_fields52 = require("@keystone-6/core/fields");
var formatCurrency3 = (amount, currencyCode) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(amount);
};
var Order = (0, import_core48.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canManageOrders({ session }) || Boolean(session?.customerToken),
      create: () => false,
      update: () => false,
      delete: () => false
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManageOrders({ session })) return true;
        if (session?.customerToken && session?.itemId) {
          return { user: { id: { equals: session.itemId } } };
        }
        return false;
      }
    }
  },
  fields: {
    status: (0, import_fields52.select)({
      type: "enum",
      options: [
        {
          label: "Pending",
          value: "pending"
        },
        {
          label: "Completed",
          value: "completed"
        },
        {
          label: "Archived",
          value: "archived"
        },
        {
          label: "Canceled",
          value: "canceled"
        },
        {
          label: "Requires Action",
          value: "requires_action"
        }
      ],
      defaultValue: "pending",
      validation: {
        isRequired: true
      },
      access: {
        update: () => false
      }
    }),
    displayId: (0, import_fields52.integer)({
      validation: {
        isRequired: true
      }
    }),
    email: (0, import_fields52.text)({
      validation: {
        isRequired: true
      }
    }),
    taxRate: (0, import_fields52.float)(),
    canceledAt: (0, import_fields52.timestamp)(),
    metadata: (0, import_fields52.json)(),
    idempotencyKey: (0, import_fields52.text)(),
    noNotification: (0, import_fields52.checkbox)(),
    externalId: (0, import_fields52.text)(),
    shippingAddress: (0, import_fields52.relationship)({
      ref: "Address.ordersUsingAsShippingAddress",
      many: false
    }),
    billingAddress: (0, import_fields52.relationship)({
      ref: "Address.ordersUsingAsBillingAddress",
      many: false
    }),
    currency: (0, import_fields52.relationship)({
      ref: "Currency.orders"
    }),
    draftOrder: (0, import_fields52.relationship)({
      ref: "DraftOrder.order"
    }),
    cart: (0, import_fields52.relationship)({
      ref: "Cart.order"
    }),
    user: (0, import_fields52.relationship)({
      ref: "User.orders"
    }),
    region: (0, import_fields52.relationship)({
      ref: "Region.orders"
    }),
    claimOrders: (0, import_fields52.relationship)({
      ref: "ClaimOrder.order",
      many: true
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    fulfillments: (0, import_fields52.relationship)({
      ref: "Fulfillment.order",
      many: true,
      access: { create: import_access89.denyAll, update: import_access89.denyAll }
    }),
    giftCards: (0, import_fields52.relationship)({
      ref: "GiftCard.order",
      many: true
    }),
    giftCardTransactions: (0, import_fields52.relationship)({
      ref: "GiftCardTransaction.order",
      many: true
    }),
    lineItems: (0, import_fields52.relationship)({
      ref: "OrderLineItem.order",
      many: true
    }),
    discounts: (0, import_fields52.relationship)({
      ref: "Discount.orders",
      many: true
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    payments: (0, import_fields52.relationship)({
      ref: "Payment.order",
      many: true,
      access: { create: import_access89.denyAll, update: import_access89.denyAll }
    }),
    // Lifecycle commands append their own atomic audit/outbox. A field
    // beforeOperation return value never transformed input in pinned Keystone.
    returns: (0, import_fields52.relationship)({
      ref: "Return.order",
      many: true,
      access: { create: import_access89.denyAll, update: import_access89.denyAll }
    }),
    shippingMethods: (0, import_fields52.relationship)({
      ref: "ShippingMethod.order",
      many: true
    }),
    swaps: (0, import_fields52.relationship)({
      ref: "Swap.order",
      many: true
    }),
    // Account relationship for Openship integration
    account: (0, import_fields52.relationship)({
      ref: "Account.orders",
      many: false
    }),
    accountLineItems: (0, import_fields52.relationship)({
      ref: "AccountLineItem.order",
      many: true
    }),
    secretKey: (0, import_fields52.text)({
      hooks: {
        resolveInput: ({ operation }) => {
          if (operation === "create") {
            const randomBytes = require("crypto").randomBytes(32);
            return randomBytes.toString("hex");
          }
          return void 0;
        }
      }
    }),
    ...(0, import_core48.group)({
      label: "Virtual Fields",
      description: "Calculated fields for order display and totals",
      fields: {
        subtotal: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              if (!order?.lineItems?.length) return "0";
              let subtotal = 0;
              for (const lineItem of order.lineItems) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }
              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;
              return formatCurrency3(subtotal / divisor, currencyCode);
            }
          })
        }),
        shipping: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              if (!order?.shippingMethods?.length) return "0";
              const total = order.shippingMethods.reduce(
                (sum2, method) => sum2 + (method.price || 0),
                0
              );
              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;
              return formatCurrency3(total / divisor, currencyCode);
            }
          })
        }),
        discount: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              const discounts = acceptedOrderDiscounts(item, order?.discounts);
              if (!discounts.length) return null;
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }
              let totalDiscountAmount = 0;
              for (const discount of discounts) {
                if (!discount.discountRule?.type) continue;
                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * acceptedOrderCurrency(item, order.currency).divisor;
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
              return formatCurrency3(totalDiscountAmount / divisor, currencyCode);
            }
          })
        }),
        tax: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;
                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * acceptedOrderCurrency(item, order.currency).divisor;
                    break;
                }
              }
              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * acceptedOrderTaxRate(item);
              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;
              return formatCurrency3(tax / divisor, currencyCode);
            }
          })
        }),
        total: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;
                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * acceptedOrderCurrency(item, order.currency).divisor;
                    break;
                  case "free_shipping":
                    totalDiscountAmount += order.shippingMethods?.reduce(
                      (total2, method) => total2 + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }
              const shipping = order.shippingMethods?.reduce(
                (sum2, method) => sum2 + (method.price || 0),
                0
              ) || 0;
              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * acceptedOrderTaxRate(item);
              const total = subtotal - totalDiscountAmount + shipping + tax;
              const currencyCode = acceptedOrderCurrency(item, order.currency).code;
              const divisor = acceptedOrderCurrency(item, order.currency).divisor;
              return formatCurrency3(total / divisor, currencyCode);
            }
          })
        }),
        rawTotal: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.Int,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const order = await sudoContext.query.Order.findOne({
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
                `
              });
              if ((order.lineItems?.length ?? 0) > 500 || (order.shippingMethods?.length ?? 0) > 100 || (order.discounts?.length ?? 0) > 100) throw new Error("Order projection exceeds the supported limit");
              let subtotal = 0;
              for (const lineItem of order.lineItems || []) {
                const amount = lineItem.moneyAmount?.amount || 0;
                subtotal += amount * lineItem.quantity;
              }
              let totalDiscountAmount = 0;
              for (const discount of acceptedOrderDiscounts(item, order.discounts)) {
                if (!discount.discountRule?.type) continue;
                switch (discount.discountRule.type) {
                  case "percentage":
                    totalDiscountAmount += subtotal * (discount.discountRule.value / 100);
                    break;
                  case "fixed":
                    totalDiscountAmount += discount.discountRule.value * acceptedOrderCurrency(item, order.currency).divisor;
                    break;
                  case "free_shipping":
                    totalDiscountAmount += order.shippingMethods?.reduce(
                      (total, method) => total + (method.price || 0),
                      0
                    ) || 0;
                    break;
                }
              }
              const shipping = order.shippingMethods?.reduce(
                (sum2, method) => sum2 + (method.price || 0),
                0
              ) || 0;
              const taxableAmount = subtotal - totalDiscountAmount;
              const tax = taxableAmount * acceptedOrderTaxRate(item);
              return Math.round(subtotal - totalDiscountAmount + shipping + tax);
            }
          })
        }),
        fulfillmentDetails: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.JSON,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
                `
              });
              const fulfillmentDetails = order.fulfillments?.map((fulfillment) => ({
                id: fulfillment.id,
                createdAt: fulfillment.createdAt,
                canceledAt: fulfillment.canceledAt,
                shippingLabels: fulfillment.shippingLabels?.map((label) => ({
                  id: label.id,
                  trackingNumber: label.trackingNumber,
                  url: label.trackingUrl,
                  carrier: label.carrier,
                  labelUrl: label.labelUrl
                })) || [],
                items: fulfillment.fulfillmentItems?.map((fi) => ({
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
            }
          })
        }),
        unfulfilled: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.JSON,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
                `
              });
              const fulfilledQuantities = {};
              order.fulfillments?.filter((f) => !f.canceledAt)?.forEach((fulfillment) => {
                fulfillment.fulfillmentItems?.forEach((fi) => {
                  const lineItemId = fi.lineItem.id;
                  fulfilledQuantities[lineItemId] = (fulfilledQuantities[lineItemId] || 0) + fi.quantity;
                });
              });
              const result = order.lineItems?.map((lineItem) => {
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
              }).filter((item2) => item2.quantity > 0) || [];
              if (permissions.canManageOrders({ session: context.session })) return jsonTransport(result);
              return jsonTransport(projectCustomerOrderForRead({ unfulfilled: result })?.unfulfilled || []);
            }
          })
        }),
        fulfillmentStatus: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.JSON,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
                `
              });
              const totalQuantity = (order.lineItems || []).reduce((sum2, item2) => sum2 + item2.quantity, 0);
              const activeFulfillments = (order.fulfillments || []).filter((f) => !f.canceledAt);
              const fulfilledQuantity = activeFulfillments.reduce(
                (sum2, f) => sum2 + (f.fulfillmentItems || []).reduce((itemSum, fi) => itemSum + fi.quantity, 0),
                0
              );
              const shippedQuantity = activeFulfillments.filter((f) => Boolean(f.shippingLabels?.length)).reduce(
                (sum2, f) => sum2 + (f.fulfillmentItems || []).reduce((itemSum, fi) => itemSum + fi.quantity, 0),
                0
              );
              return {
                totalQuantity,
                fulfilledQuantity,
                shippedQuantity,
                remainingQuantity: totalQuantity - fulfilledQuantity,
                status: fulfilledQuantity === 0 ? "not_fulfilled" : fulfilledQuantity === totalQuantity ? "fulfilled" : "partially_fulfilled",
                shippingStatus: shippedQuantity === 0 ? "not_shipped" : shippedQuantity === totalQuantity ? "shipped" : "partially_shipped"
              };
            }
          })
        }),
        paymentDetails: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.JSON,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
              return jsonTransport(order.payments.map((payment) => ({
                id: payment.id,
                amount: payment.amount,
                formattedAmount: order.currency ? `${order.currency.symbol}${(payment.amount / 100).toFixed(2)}` : `${(payment.amount / 100).toFixed(2)}`,
                status: payment.status,
                createdAt: payment.createdAt,
                provider: payment.data?.provider,
                cardLast4: payment.data?.cardLast4,
                paymentSession: payment.paymentCollection?.paymentSessions?.find((s) => s.isSelected)
              })));
            }
          })
        }),
        totalPaid: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.Int,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
              let totalPaid = order.payments?.reduce((total, payment) => {
                if (payment.status === "captured") {
                  return total + payment.amount;
                }
                return total;
              }, 0) || 0;
              if (totalPaid === 0 && order.accountLineItems && order.accountLineItems.length > 0) {
                const hasPaidLineItems = order.accountLineItems.some(
                  (lineItem) => lineItem.paymentStatus === "paid"
                );
                if (hasPaidLineItems) {
                  totalPaid = order.accountLineItems.reduce((total, lineItem) => {
                    if (lineItem.paymentStatus === "paid") {
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
        formattedTotalPaid: (0, import_fields52.virtual)({
          field: import_core48.graphql.field({
            type: import_core48.graphql.String,
            async resolve(item, args, context) {
              const order = await context.sudo().query.Order.findOne({
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
              let totalPaid = order.payments?.reduce((total, payment) => {
                if (payment.status === "captured") {
                  return total + payment.amount;
                }
                return total;
              }, 0) || 0;
              if (totalPaid === 0 && order.accountLineItems && order.accountLineItems.length > 0) {
                const hasPaidLineItems = order.accountLineItems.some(
                  (lineItem) => lineItem.paymentStatus === "paid"
                );
                if (hasPaidLineItems) {
                  totalPaid = order.accountLineItems.reduce((total, lineItem) => {
                    if (lineItem.paymentStatus === "paid") {
                      return total + (lineItem.amount || 0);
                    }
                    return total;
                  }, 0);
                }
              }
              const { code, divisor } = acceptedOrderCurrency(item, order.currency);
              return formatCurrency3(totalPaid / divisor, code);
            }
          })
        })
      }
    }),
    events: (0, import_fields52.relationship)({
      ref: "OrderEvent.order",
      many: true
    }),
    note: (0, import_fields52.text)({
      label: "Note"
    }),
    shippingLabels: (0, import_fields52.relationship)({
      ref: "ShippingLabel.order",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/OrderEvent.ts
var import_core49 = require("@keystone-6/core");
var import_fields53 = require("@keystone-6/core/fields");
var OrderEvent = (0, import_core49.list)({
  fields: {
    order: (0, import_fields53.relationship)({
      ref: "Order.events",
      many: false
    }),
    user: (0, import_fields53.relationship)({
      ref: "User.orderEvents",
      many: false,
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if ((operation === "create" || operation === "update") && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    type: (0, import_fields53.select)({
      type: "enum",
      options: [
        { label: "Order Placed", value: "ORDER_PLACED" },
        { label: "Status Change", value: "STATUS_CHANGE" },
        { label: "Payment Status Change", value: "PAYMENT_STATUS_CHANGE" },
        { label: "Payment Captured", value: "PAYMENT_CAPTURED" },
        { label: "Fulfillment Status Change", value: "FULFILLMENT_STATUS_CHANGE" },
        { label: "Note Added", value: "NOTE_ADDED" },
        { label: "Email Sent", value: "EMAIL_SENT" },
        { label: "Tracking Number Added", value: "TRACKING_NUMBER_ADDED" },
        { label: "Return Requested", value: "RETURN_REQUESTED" },
        { label: "Refund Processed", value: "REFUND_PROCESSED" }
      ],
      validation: { isRequired: true },
      defaultValue: "STATUS_CHANGE"
    }),
    data: (0, import_fields53.json)({
      defaultValue: {}
    }),
    time: (0, import_fields53.timestamp)({
      defaultValue: { kind: "now" }
    }),
    createdBy: (0, import_fields53.relationship)({
      ref: "User",
      many: false,
      ui: {
        displayMode: "select",
        labelField: "email"
      },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if ((operation === "create" || operation === "update") && !resolvedData.createdBy && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.createdBy;
        }
      }
    }),
    ...trackingFields
  },
  ui: { ...{
    listView: {
      initialColumns: ["order", "type", "time", "createdBy"],
      initialSort: { field: "time", direction: "DESC" }
    }
  }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  }
});

// features/keystone/models/OrderLineItem.ts
var import_core50 = require("@keystone-6/core");
var import_fields54 = require("@keystone-6/core/fields");

// features/keystone/lib/order-thumbnail-url.ts
var MAX_THUMBNAIL_LENGTH = 2048;
var MAX_SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;
function signedUrlExpiry(url) {
  const dateText = url.searchParams.get("X-Amz-Date");
  const expiresText = url.searchParams.get("X-Amz-Expires");
  if (dateText === null && expiresText === null) return void 0;
  if (dateText === null || expiresText === null || !/^\d{1,6}$/.test(expiresText)) return null;
  const match = dateText.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  const ttlSeconds = Number(expiresText);
  if (!match || !Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > MAX_SIGNED_URL_TTL_SECONDS) {
    return null;
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) {
    return null;
  }
  return date.getTime() + ttlSeconds * 1e3;
}
function getOrderSnapshotThumbnail(productData, now = Date.now()) {
  if (!productData || typeof productData !== "object" || Array.isArray(productData) || !("thumbnail" in productData)) return null;
  return getReusableOrderThumbnail(productData.thumbnail, now);
}
function getReusableOrderThumbnail(value, now = Date.now()) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_THUMBNAIL_LENGTH) {
    return null;
  }
  if (value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  if (!hasScheme) return value;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const expiresAt = signedUrlExpiry(url);
  if (expiresAt === null || expiresAt !== void 0 && expiresAt <= now) return null;
  return value;
}

// features/keystone/models/OrderLineItem.ts
var import_core51 = require("@keystone-6/core");
var OrderLineItem = (0, import_core50.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    quantity: (0, import_fields54.integer)({
      validation: { isRequired: true }
    }),
    title: (0, import_fields54.text)({
      validation: { isRequired: true }
    }),
    sku: (0, import_fields54.text)(),
    thumbnail: (0, import_fields54.virtual)({
      field: import_core51.graphql.field({
        type: import_core51.graphql.String,
        resolve(item) {
          return getOrderSnapshotThumbnail(item.productData);
        }
      })
    }),
    metadata: (0, import_fields54.json)(),
    productData: (0, import_fields54.json)({
      ui: { description: "Snapshot of product data at time of order" }
    }),
    variantData: (0, import_fields54.json)({
      ui: { description: "Snapshot of variant data at time of order" }
    }),
    // Formatted values for display
    variantTitle: (0, import_fields54.text)(),
    formattedUnitPrice: (0, import_fields54.text)(),
    formattedTotal: (0, import_fields54.text)(),
    order: (0, import_fields54.relationship)({
      ref: "Order.lineItems"
    }),
    productVariant: (0, import_fields54.relationship)({
      ref: "ProductVariant",
      ui: { description: "Optional reference to product variant (may be deleted)" }
    }),
    moneyAmount: (0, import_fields54.relationship)({
      ref: "OrderMoneyAmount.orderLineItem"
    }),
    originalLineItem: (0, import_fields54.relationship)({
      ref: "LineItem",
      ui: { description: "Reference to the original cart line item" }
    }),
    fulfillmentItems: (0, import_fields54.relationship)({
      ref: "FulfillmentItem.lineItem",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/OrderMoneyAmount.ts
var import_core52 = require("@keystone-6/core");
var import_fields55 = require("@keystone-6/core/fields");
var OrderMoneyAmount = (0, import_core52.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    amount: (0, import_fields55.integer)({
      validation: { isRequired: true }
    }),
    originalAmount: (0, import_fields55.integer)({
      validation: { isRequired: true }
    }),
    priceData: (0, import_fields55.json)({
      ui: { description: "Snapshot of complete price data including rules, lists, etc." }
    }),
    metadata: (0, import_fields55.json)(),
    orderLineItem: (0, import_fields55.relationship)({
      ref: "OrderLineItem.moneyAmount"
    }),
    currency: (0, import_fields55.relationship)({
      ref: "Currency"
    }),
    region: (0, import_fields55.relationship)({
      ref: "Region"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Payment.ts
var import_core53 = require("@keystone-6/core");
var import_fields56 = require("@keystone-6/core/fields");
var import_core54 = require("@keystone-6/core");
var Payment = (0, import_core53.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadPayments({ session }) || permissions.canManagePayments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    status: (0, import_fields56.select)({
      type: "enum",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Authorized", value: "authorized" },
        { label: "Captured", value: "captured" },
        { label: "Failed", value: "failed" },
        { label: "Canceled", value: "canceled" }
      ],
      defaultValue: "pending",
      validation: { isRequired: true }
    }),
    amount: (0, import_fields56.integer)({
      validation: {
        isRequired: true
      }
    }),
    currencyCode: (0, import_fields56.text)({
      validation: {
        isRequired: true
      }
    }),
    amountRefunded: (0, import_fields56.integer)({
      defaultValue: 0,
      validation: {
        isRequired: true
      }
    }),
    data: (0, import_fields56.json)(),
    capturedAt: (0, import_fields56.timestamp)(),
    canceledAt: (0, import_fields56.timestamp)(),
    metadata: (0, import_fields56.json)(),
    idempotencyKey: (0, import_fields56.text)(),
    cart: (0, import_fields56.relationship)({
      ref: "Cart.payment"
    }),
    paymentCollection: (0, import_fields56.relationship)({
      ref: "PaymentCollection.payments"
    }),
    swap: (0, import_fields56.relationship)({
      ref: "Swap.payment"
    }),
    currency: (0, import_fields56.relationship)({
      ref: "Currency.payments"
    }),
    order: (0, import_fields56.relationship)({
      ref: "Order.payments"
    }),
    captures: (0, import_fields56.relationship)({
      ref: "Capture.payment",
      many: true
    }),
    refunds: (0, import_fields56.relationship)({
      ref: "Refund.payment",
      many: true
    }),
    user: (0, import_fields56.relationship)({
      ref: "User.payments"
    }),
    paymentLink: (0, import_fields56.virtual)({
      field: import_core54.graphql.field({
        type: import_core54.graphql.String,
        resolve(item) {
          if (!item.data) return null;
          const data = item.data;
          if (data.provider_id?.startsWith("pp_stripe_")) {
            const paymentIntentId = data.payment_intent_id;
            if (paymentIntentId) {
              return `https://dashboard.stripe.com/payments/${paymentIntentId}`;
            }
          }
          if (data.provider_id?.startsWith("pp_paypal_")) {
            const paypalOrderId = data.id;
            if (paypalOrderId) {
              return `https://www.paypal.com/activity/payment/${paypalOrderId}`;
            }
          }
          return null;
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentCollection.ts
var import_core55 = require("@keystone-6/core");
var import_fields57 = require("@keystone-6/core/fields");
var PaymentCollection = (0, import_core55.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadPayments({ session }) || permissions.canManagePayments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    description: (0, import_fields57.select)({
      type: "enum",
      options: [
        { label: "Default", value: "default" },
        { label: "Refund", value: "refund" }
      ],
      defaultValue: "default"
    }),
    amount: (0, import_fields57.integer)({
      validation: { isRequired: true }
    }),
    authorizedAmount: (0, import_fields57.integer)({
      defaultValue: 0
    }),
    refundedAmount: (0, import_fields57.integer)({
      defaultValue: 0
    }),
    metadata: (0, import_fields57.json)(),
    paymentSessions: (0, import_fields57.relationship)({
      ref: "PaymentSession.paymentCollection",
      many: true
    }),
    payments: (0, import_fields57.relationship)({
      ref: "Payment.paymentCollection",
      many: true
    }),
    cart: (0, import_fields57.relationship)({
      ref: "Cart.paymentCollection"
    }),
    invoice: (0, import_fields57.relationship)({
      ref: "Invoice.paymentCollection"
    }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentProvider.ts
var import_core56 = require("@keystone-6/core");
var import_access96 = require("@keystone-6/core/access");
var import_fields58 = require("@keystone-6/core/fields");
var PaymentProvider = (0, import_core56.list)({
  hooks: {
    validateInput: ({ resolvedData, item, addValidationError }) => {
      const allowed = new Set(Object.keys(paymentProviderAdapters));
      for (const field of ["createPaymentFunction", "capturePaymentFunction", "refundPaymentFunction", "getPaymentStatusFunction", "generatePaymentLinkFunction", "handleWebhookFunction"]) {
        const adapterKey = resolvedData[field] ?? item?.[field];
        if (typeof adapterKey !== "string" || !allowed.has(adapterKey)) {
          addValidationError(`${field} must name a registered payment adapter`);
        }
      }
    }
  },
  access: {
    operation: {
      query: ({ session }) => permissions.canReadPayments({ session }) || permissions.canManagePayments({ session }),
      create: permissions.canManagePayments,
      update: permissions.canManagePayments,
      delete: permissions.canManagePayments
    }
  },
  fields: {
    name: (0, import_fields58.text)({
      validation: { isRequired: true }
    }),
    code: (0, import_fields58.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields58.checkbox)({
      defaultValue: true
    }),
    credentials: (0, import_fields58.json)({
      defaultValue: {},
      access: {
        read: import_access96.denyAll,
        create: permissions.canManagePayments,
        update: permissions.canManagePayments
      }
    }),
    metadata: (0, import_fields58.json)({
      defaultValue: {}
    }),
    // Adapter function fields
    createPaymentFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to create payments"
      }
    }),
    capturePaymentFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to capture payments"
      }
    }),
    refundPaymentFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to refund payments"
      }
    }),
    getPaymentStatusFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to check payment status"
      }
    }),
    generatePaymentLinkFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to generate payment dashboard links"
      }
    }),
    handleWebhookFunction: (0, import_fields58.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to handle provider webhooks"
      }
    }),
    regions: (0, import_fields58.relationship)({
      ref: "Region.paymentProviders",
      many: true
    }),
    sessions: (0, import_fields58.relationship)({
      access: { create: import_access96.denyAll, update: import_access96.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "PaymentSession.paymentProvider",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentSession.ts
var import_core57 = require("@keystone-6/core");
var import_fields59 = require("@keystone-6/core/fields");
var import_core58 = require("@keystone-6/core");
var PaymentSession = (0, import_core57.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadPayments({ session }) || permissions.canManagePayments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    isSelected: (0, import_fields59.checkbox)({
      defaultValue: false
    }),
    isInitiated: (0, import_fields59.checkbox)({
      defaultValue: false
    }),
    amount: (0, import_fields59.integer)({
      validation: { isRequired: true }
    }),
    formattedAmount: (0, import_fields59.virtual)({
      field: import_core58.graphql.field({
        type: import_core58.graphql.String,
        async resolve(item, args, context) {
          const { paymentCollection } = await context.query.PaymentSession.findOne({
            where: { id: item.id },
            query: `
              paymentCollection {
                cart {
                  order {
                    currency {
                      code
                      symbol
                    }
                  }
                }
              }
            `
          });
          if (!paymentCollection?.cart?.order?.currency) {
            return `${item.amount / 100}`;
          }
          const { symbol } = paymentCollection.cart.order.currency;
          const amount = item.amount / 100;
          return `${symbol}${amount.toFixed(2)}`;
        }
      })
    }),
    data: (0, import_fields59.json)({
      defaultValue: {}
    }),
    idempotencyKey: (0, import_fields59.text)({
      isIndexed: true
    }),
    paymentCollection: (0, import_fields59.relationship)({
      ref: "PaymentCollection.paymentSessions"
    }),
    paymentProvider: (0, import_fields59.relationship)({
      ref: "PaymentProvider.sessions",
      many: false
    }),
    paymentAuthorizedAt: (0, import_fields59.timestamp)(),
    ...trackingFields
  }
});

// features/keystone/models/PriceList.ts
var import_core59 = require("@keystone-6/core");
var import_fields60 = require("@keystone-6/core/fields");
var PriceList = (0, import_core59.list)({
  access: {
    operation: {
      // Allow public read access
      query: () => true,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    name: (0, import_fields60.text)({
      validation: {
        isRequired: true
      }
    }),
    description: (0, import_fields60.text)({
      validation: {
        isRequired: true
      }
    }),
    type: (0, import_fields60.select)({
      type: "enum",
      options: [
        {
          label: "Sale",
          value: "sale"
        },
        {
          label: "Override",
          value: "override"
        }
      ],
      defaultValue: "sale",
      validation: {
        isRequired: true
      }
    }),
    status: (0, import_fields60.select)({
      type: "enum",
      options: [
        {
          label: "Active",
          value: "active"
        },
        {
          label: "Draft",
          value: "draft"
        }
      ],
      defaultValue: "draft",
      validation: {
        isRequired: true
      }
    }),
    startsAt: (0, import_fields60.timestamp)(),
    endsAt: (0, import_fields60.timestamp)(),
    moneyAmounts: (0, import_fields60.relationship)({
      ref: "MoneyAmount.priceList",
      many: true
    }),
    customerGroups: (0, import_fields60.relationship)({
      ref: "CustomerGroup.priceLists",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/PriceRule.ts
var import_core60 = require("@keystone-6/core");
var import_fields61 = require("@keystone-6/core/fields");
var PriceRule = (0, import_core60.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    type: (0, import_fields61.select)({
      type: "enum",
      options: [
        { label: "Fixed", value: "fixed" },
        { label: "Percentage", value: "percentage" }
      ],
      validation: { isRequired: true }
    }),
    value: (0, import_fields61.float)({ validation: { isRequired: true } }),
    priority: (0, import_fields61.integer)({ defaultValue: 0 }),
    ruleAttribute: (0, import_fields61.text)({ validation: { isRequired: true } }),
    ruleValue: (0, import_fields61.text)({ validation: { isRequired: true } }),
    moneyAmounts: (0, import_fields61.relationship)({ ref: "MoneyAmount.priceRules", many: true }),
    priceSet: (0, import_fields61.relationship)({ ref: "PriceSet.priceRules" }),
    ...trackingFields
  }
});

// features/keystone/models/PriceSet.ts
var import_core61 = require("@keystone-6/core");
var import_fields62 = require("@keystone-6/core/fields");
var PriceSet = (0, import_core61.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    prices: (0, import_fields62.relationship)({ ref: "MoneyAmount.priceSet", many: true }),
    priceRules: (0, import_fields62.relationship)({ ref: "PriceRule.priceSet", many: true }),
    ruleTypes: (0, import_fields62.relationship)({ ref: "RuleType.priceSets", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Product.ts
var import_core62 = require("@keystone-6/core");
var import_fields63 = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
var Product = (0, import_core62.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManageProducts({ session })) {
          return true;
        }
        return {
          status: {
            equals: "published"
          }
        };
      }
    }
  },
  fields: {
    title: (0, import_fields63.text)({
      validation: {
        isRequired: true
      }
    }),
    description: (0, import_fields_document.document)({
      formatting: true,
      links: true,
      dividers: true,
      layouts: [
        [1, 1],
        [1, 1, 1],
        [2, 1]
      ]
    }),
    handle: (0, import_fields63.text)({
      isIndexed: "unique"
    }),
    subtitle: (0, import_fields63.text)(),
    isGiftcard: (0, import_fields63.checkbox)(),
    thumbnail: (0, import_fields63.virtual)({
      field: import_core62.graphql.field({
        type: import_core62.graphql.String,
        resolve: async (item, args, context) => {
          const product = await context.query.Product.findOne({
            where: { id: item.id },
            query: "productImages(take: 1) { image { url } imagePath }"
          });
          return product.productImages[0]?.image?.url || product.productImages[0]?.imagePath || null;
        }
      })
    }),
    dimensionsRange: (0, import_fields63.virtual)({
      field: import_core62.graphql.field({
        type: import_core62.graphql.JSON,
        resolve: async (item, args, context) => {
          const product = await context.query.Product.findOne({
            where: { id: item.id },
            query: `
              productVariants(take: 100) {
                measurements {
                  value
                  unit
                  type
                }
              }
            `
          });
          if (!product?.productVariants?.length) return null;
          const dimensions = {
            weight: { min: null, max: null },
            length: { min: null, max: null },
            height: { min: null, max: null },
            width: { min: null, max: null }
          };
          product.productVariants.forEach((variant) => {
            variant.measurements?.forEach((measurement) => {
              const dim = measurement.type;
              if (dimensions[dim] && measurement.value !== null && measurement.value !== void 0) {
                if (dimensions[dim].min === null || measurement.value < dimensions[dim].min) {
                  dimensions[dim].min = measurement.value;
                }
                if (dimensions[dim].max === null || measurement.value > dimensions[dim].max) {
                  dimensions[dim].max = measurement.value;
                }
              }
            });
          });
          return dimensions;
        }
      })
    }),
    defaultDimensions: (0, import_fields63.virtual)({
      field: import_core62.graphql.field({
        type: import_core62.graphql.JSON,
        resolve: async (item, args, context) => {
          const product = await context.query.Product.findOne({
            where: { id: item.id },
            query: `
              productVariants(take: 1) {
                measurements {
                  value
                  unit
                  type
                }
              }
            `
          });
          if (!product?.productVariants?.[0]?.measurements) return null;
          const dimensions = {};
          product.productVariants[0].measurements.forEach((measurement) => {
            dimensions[measurement.type] = {
              value: measurement.value,
              unit: measurement.unit
            };
          });
          return dimensions;
        }
      })
    }),
    metadata: (0, import_fields63.json)(),
    discountable: (0, import_fields63.checkbox)({
      defaultValue: true
    }),
    status: (0, import_fields63.select)({
      type: "enum",
      options: [
        {
          label: "Draft",
          value: "draft"
        },
        {
          label: "Proposed",
          value: "proposed"
        },
        {
          label: "Published",
          value: "published"
        },
        {
          label: "Rejected",
          value: "rejected"
        }
      ],
      defaultValue: "draft",
      validation: {
        isRequired: true
      }
    }),
    externalId: (0, import_fields63.text)(),
    productCollections: (0, import_fields63.relationship)({
      ref: "ProductCollection.products",
      many: true
    }),
    productCategories: (0, import_fields63.relationship)({
      ref: "ProductCategory.products",
      many: true
    }),
    shippingProfile: (0, import_fields63.relationship)({
      ref: "ShippingProfile.products"
    }),
    productType: (0, import_fields63.relationship)({
      ref: "ProductType.products"
    }),
    discountConditions: (0, import_fields63.relationship)({
      ref: "DiscountCondition.products",
      many: true
    }),
    discountRules: (0, import_fields63.relationship)({
      ref: "DiscountRule.products",
      many: true
    }),
    productImages: (0, import_fields63.relationship)({
      ref: "ProductImage.products",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["image", "altText", "imagePath"],
        inlineCreate: { fields: ["image", "altText", "imagePath"] },
        inlineEdit: { fields: ["image", "altText", "imagePath"] },
        inlineConnect: true,
        removeMode: "disconnect",
        linkToItem: false
      }
    }),
    productOptions: (0, import_fields63.relationship)({
      ref: "ProductOption.product",
      many: true
    }),
    productTags: (0, import_fields63.relationship)({
      ref: "ProductTag.products",
      many: true
    }),
    taxRates: (0, import_fields63.relationship)({
      ref: "TaxRate.products",
      many: true
    }),
    productVariants: (0, import_fields63.relationship)({
      ref: "ProductVariant.product",
      many: true
    }),
    ...trackingFields
  },
  // hooks: {
  //   resolveInput: async ({
  //     resolvedData,
  //     existingItem,
  //     context,
  //     operation,
  //   }) => {
  //     if (!resolvedData.handle && resolvedData.title) {
  //       let baseHandle = resolvedData.title
  //         .toLowerCase()
  //         .replace(/[^a-z0-9]+/g, '-')
  //         .replace(/^-+|-+$/g, '');
  //       let handle = baseHandle;
  //       let counter = 1;
  //       while (await context.query.Product.findOne({ where: { handle } })) {
  //         handle = `${baseHandle}-${counter}`;
  //         counter++;
  //       }
  //       resolvedData.handle = handle;
  //     }
  //     return resolvedData;
  //   },
  // },
  ui: {
    labelField: "title"
  }
});

// features/keystone/models/ProductCategory.ts
var import_core63 = require("@keystone-6/core");
var import_fields64 = require("@keystone-6/core/fields");
var ProductCategory = (0, import_core63.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManageProducts({ session })) {
          return true;
        }
        return {
          isActive: {
            equals: true
          }
        };
      }
    }
  },
  fields: {
    title: (0, import_fields64.text)({
      validation: {
        isRequired: true
      }
    }),
    handle: (0, import_fields64.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields64.json)(),
    isInternal: (0, import_fields64.checkbox)({
      defaultValue: false
    }),
    isActive: (0, import_fields64.checkbox)({
      defaultValue: true
    }),
    discountConditions: (0, import_fields64.relationship)({
      ref: "DiscountCondition.productCategories",
      many: true
    }),
    products: (0, import_fields64.relationship)({
      ref: "Product.productCategories",
      many: true
    }),
    parentCategory: (0, import_fields64.relationship)({
      ref: "ProductCategory.categoryChildren",
      many: false
    }),
    categoryChildren: (0, import_fields64.relationship)({
      ref: "ProductCategory.parentCategory",
      many: true
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput: async ({ resolvedData, item, context, operation }) => {
      if (!resolvedData.handle && resolvedData.title) {
        let baseHandle = resolvedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        let handle = baseHandle;
        let counter = 1;
        while (await context.query.ProductCategory.findOne({ where: { handle } })) {
          handle = `${baseHandle}-${counter}`;
          counter++;
        }
        resolvedData.handle = handle;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/ProductCollection.ts
var import_core64 = require("@keystone-6/core");
var import_fields65 = require("@keystone-6/core/fields");
var ProductCollection = (0, import_core64.list)({
  access: {
    operation: {
      // Allow public read access
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    title: (0, import_fields65.text)({
      validation: {
        isRequired: true
      }
    }),
    handle: (0, import_fields65.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields65.json)(),
    discountConditions: (0, import_fields65.relationship)({
      ref: "DiscountCondition.productCollections",
      many: true
    }),
    products: (0, import_fields65.relationship)({
      ref: "Product.productCollections",
      many: true
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput: async ({ resolvedData, item, context, operation }) => {
      if (!resolvedData.handle && resolvedData.title) {
        let baseHandle = resolvedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        let handle = baseHandle;
        let counter = 1;
        while (await context.query.ProductCollection.findOne({ where: { handle } })) {
          handle = `${baseHandle}-${counter}`;
          counter++;
        }
        resolvedData.handle = handle;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/ProductImage.ts
var import_core65 = require("@keystone-6/core");
var import_fields66 = require("@keystone-6/core/fields");
var ProductImage = (0, import_core65.list)({
  access: {
    operation: {
      // query: ({ session }) =>
      //   permissions.canReadProducts({ session }) ||
      //   permissions.canManageProducts({ session }),
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    },
    filter: {
      query: ({ session }) => permissions.canManageProducts({ session }) ? true : {
        OR: [
          { products: { some: { status: { equals: "published" } } } },
          { productVariants: { some: { product: { status: { equals: "published" } } } } }
        ]
      }
    }
  },
  fields: {
    image: (0, import_fields66.image)({ storage: "my_images" }),
    imagePath: (0, import_fields66.text)(),
    altText: (0, import_fields66.text)(),
    order: (0, import_fields66.integer)({
      defaultValue: 0
    }),
    products: (0, import_fields66.relationship)({ ref: "Product.productImages", many: true }),
    productVariants: (0, import_fields66.relationship)({ ref: "ProductVariant.primaryImage", many: true }),
    metadata: (0, import_fields66.json)({ access: { read: permissions.canManageProducts } }),
    ...trackingFields
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "products"]
    }
  }
});

// features/keystone/models/ProductOption.ts
var import_core66 = require("@keystone-6/core");
var import_fields67 = require("@keystone-6/core/fields");
var ProductOption = (0, import_core66.list)({
  access: {
    operation: {
      // query: ({ session }) =>
      //   permissions.canReadProducts({ session }) ||
      //   permissions.canManageProducts({ session }),
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    title: (0, import_fields67.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields67.json)(),
    product: (0, import_fields67.relationship)({
      ref: "Product.productOptions"
    }),
    productOptionValues: (0, import_fields67.relationship)({
      ref: "ProductOptionValue.productOption",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ProductOptionValue.ts
var import_core67 = require("@keystone-6/core");
var import_fields68 = require("@keystone-6/core/fields");
var ProductOptionValue = (0, import_core67.list)({
  access: {
    operation: {
      // query: ({ session }) =>
      //   permissions.canReadProducts({ session }) ||
      //   permissions.canManageProducts({ session }),
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    value: (0, import_fields68.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields68.json)(),
    productVariants: (0, import_fields68.relationship)({
      ref: "ProductVariant.productOptionValues",
      many: true
    }),
    productOption: (0, import_fields68.relationship)({
      ref: "ProductOption.productOptionValues"
    }),
    ...trackingFields
  },
  ui: {
    labelField: "value"
  }
});

// features/keystone/models/ProductTag.ts
var import_core68 = require("@keystone-6/core");
var import_fields69 = require("@keystone-6/core/fields");
var ProductTag = (0, import_core68.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadProducts({ session }) || permissions.canManageProducts({ session }),
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    value: (0, import_fields69.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields69.json)(),
    discountConditions: (0, import_fields69.relationship)({
      ref: "DiscountCondition.productTags",
      many: true
    }),
    products: (0, import_fields69.relationship)({ ref: "Product.productTags", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/ProductType.ts
var import_core69 = require("@keystone-6/core");
var import_fields70 = require("@keystone-6/core/fields");
var ProductType = (0, import_core69.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadProducts({ session }) || permissions.canManageProducts({ session }),
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    value: (0, import_fields70.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields70.json)(),
    discountConditions: (0, import_fields70.relationship)({
      ref: "DiscountCondition.productTypes",
      many: true
    }),
    products: (0, import_fields70.relationship)({
      ref: "Product.productType",
      many: true
    }),
    taxRates: (0, import_fields70.relationship)({
      ref: "TaxRate.productTypes",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ProductVariant.ts
var import_core70 = require("@keystone-6/core");
var import_access110 = require("@keystone-6/core/access");
var import_fields71 = require("@keystone-6/core/fields");
var ProductVariant = (0, import_core70.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    },
    filter: {
      query: ({ session }) => permissions.canManageProducts({ session }) ? true : { product: { status: { equals: "published" } } }
    }
  },
  fields: {
    isUniqueCollectible: (0, import_fields71.virtual)({
      field: import_core70.graphql.field({
        type: import_core70.graphql.Boolean,
        async resolve(item, _args, context) {
          const product = item.productId ? await context.prisma.product.findUnique({ where: { id: item.productId }, select: { status: true } }) : null;
          if (product?.status !== "published" && !permissions.canManageProducts({ session: context.session })) return false;
          return Boolean(await context.prisma.inventoryUnit.findFirst({ where: { commerceVariantId: item.id }, select: { id: true } }));
        }
      })
    }),
    fullTitle: (0, import_fields71.virtual)({
      field: import_core70.graphql.field({
        type: import_core70.graphql.String,
        resolve: async (item, args, context) => {
          const { product } = await context.query.ProductVariant.findOne({
            where: { id: item.id.toString() },
            query: "product { title }"
          });
          return `${product?.title ? `${product.title} - ` : ""}${item.title}`;
        }
      })
    }),
    title: (0, import_fields71.text)({
      validation: {
        isRequired: true
      }
    }),
    sku: (0, import_fields71.text)(),
    barcode: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    ean: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    upc: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    inventoryQuantity: (0, import_fields71.integer)({
      validation: {
        isRequired: true
      }
    }),
    allowBackorder: (0, import_fields71.checkbox)(),
    manageInventory: (0, import_fields71.checkbox)({
      defaultValue: true
    }),
    hsCode: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    originCountry: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    midCode: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    material: (0, import_fields71.text)({ access: { read: permissions.canManageProducts } }),
    metadata: (0, import_fields71.json)({ access: { read: permissions.canManageProducts } }),
    variantRank: (0, import_fields71.integer)({
      defaultValue: 0
    }),
    product: (0, import_fields71.relationship)({
      ref: "Product.productVariants"
    }),
    claimItems: (0, import_fields71.relationship)({
      ref: "ClaimItem.productVariant",
      many: true
    }),
    lineItems: (0, import_fields71.relationship)({
      ref: "LineItem.productVariant",
      many: true
    }),
    prices: (0, import_fields71.relationship)({
      ref: "MoneyAmount.productVariant",
      many: true
    }),
    productOptionValues: (0, import_fields71.relationship)({
      ref: "ProductOptionValue.productVariants",
      many: true
    }),
    location: (0, import_fields71.relationship)({
      ref: "Location.variants"
    }),
    stockMovements: (0, import_fields71.relationship)({
      access: { create: import_access110.denyAll, update: import_access110.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "StockMovement.variant",
      many: true
    }),
    collectibleInventoryUnit: (0, import_fields71.relationship)({
      ref: "InventoryUnit.commerceVariant",
      many: false,
      // Inverse connect/disconnect can otherwise change a read-only Unit's FK.
      access: { create: import_access110.denyAll, update: import_access110.denyAll },
      ui: { itemView: { fieldMode: "read" } }
    }),
    measurements: (0, import_fields71.relationship)({
      ref: "Measurement.productVariant",
      many: true
    }),
    primaryImage: (0, import_fields71.relationship)({
      ref: "ProductImage.productVariants",
      many: false
    }),
    ...trackingFields
  },
  ui: {
    labelField: "fullTitle"
  }
});

// features/keystone/models/Refund.ts
var import_core71 = require("@keystone-6/core");
var import_fields72 = require("@keystone-6/core/fields");
var Refund = (0, import_core71.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadReturns({ session }) || permissions.canManageReturns({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    amount: (0, import_fields72.integer)({
      validation: {
        isRequired: true
      }
    }),
    note: (0, import_fields72.text)(),
    reason: (0, import_fields72.select)({
      type: "enum",
      options: [
        {
          label: "Discount",
          value: "discount"
        },
        {
          label: "Return",
          value: "return"
        },
        {
          label: "Swap",
          value: "swap"
        },
        {
          label: "Claim",
          value: "claim"
        },
        {
          label: "Other",
          value: "other"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields72.json)(),
    idempotencyKey: (0, import_fields72.text)(),
    payment: (0, import_fields72.relationship)({
      ref: "Payment.refunds"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Region.ts
var import_core72 = require("@keystone-6/core");
var import_access113 = require("@keystone-6/core/access");
var import_fields73 = require("@keystone-6/core/fields");
var Region = (0, import_core72.list)({
  access: {
    operation: {
      // Allow public read access
      query: () => true,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    code: (0, import_fields73.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    name: (0, import_fields73.text)({
      validation: {
        isRequired: true
      }
    }),
    taxRate: (0, import_fields73.float)({
      validation: {
        isRequired: true,
        min: 0,
        max: 1
      }
    }),
    taxCode: (0, import_fields73.text)(),
    metadata: (0, import_fields73.json)(),
    giftCardsTaxable: (0, import_fields73.checkbox)({
      defaultValue: true
    }),
    automaticTaxes: (0, import_fields73.checkbox)({
      defaultValue: true
    }),
    currency: (0, import_fields73.relationship)({
      access: { update: import_access113.denyAll },
      ui: { itemView: { fieldMode: "read" } },
      ref: "Currency.regions"
    }),
    carts: (0, import_fields73.relationship)({
      ref: "Cart.region",
      many: true
    }),
    countries: (0, import_fields73.relationship)({
      ref: "Country.region",
      many: true
    }),
    discounts: (0, import_fields73.relationship)({
      ref: "Discount.regions",
      many: true
    }),
    giftCards: (0, import_fields73.relationship)({
      ref: "GiftCard.region",
      many: true
    }),
    moneyAmounts: (0, import_fields73.relationship)({
      ref: "MoneyAmount.region",
      many: true
    }),
    orders: (0, import_fields73.relationship)({
      access: { create: import_access113.denyAll, update: import_access113.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Order.region",
      many: true
    }),
    taxProvider: (0, import_fields73.relationship)({
      ref: "TaxProvider.regions"
    }),
    fulfillmentProviders: (0, import_fields73.relationship)({
      ref: "FulfillmentProvider.regions",
      many: true
    }),
    paymentProviders: (0, import_fields73.relationship)({
      ref: "PaymentProvider.regions",
      many: true
    }),
    shippingOptions: (0, import_fields73.relationship)({
      ref: "ShippingOption.region",
      many: true
    }),
    taxRates: (0, import_fields73.relationship)({
      ref: "TaxRate.region",
      many: true
    }),
    shippingProviders: (0, import_fields73.relationship)({
      ref: "ShippingProvider.regions",
      many: true
    }),
    accountLineItems: (0, import_fields73.relationship)({
      access: { create: import_access113.denyAll, update: import_access113.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "AccountLineItem.region",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/Return.ts
var import_core73 = require("@keystone-6/core");
var import_access115 = require("@keystone-6/core/access");
var import_fields74 = require("@keystone-6/core/fields");
var Return = (0, import_core73.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadReturns({ session }) || permissions.canManageReturns({ session }),
      create: permissions.canManageReturns,
      update: permissions.canManageReturns,
      delete: permissions.canManageReturns
    }
  },
  fields: {
    status: (0, import_fields74.select)({
      type: "enum",
      options: [
        {
          label: "Requested",
          value: "requested"
        },
        {
          label: "Received",
          value: "received"
        },
        {
          label: "Requires Action",
          value: "requires_action"
        },
        {
          label: "Canceled",
          value: "canceled"
        }
      ],
      defaultValue: "requested",
      db: {
        isNullable: false
      },
      validation: {
        isRequired: true
      }
    }),
    shippingData: (0, import_fields74.json)(),
    refundAmount: (0, import_fields74.integer)({
      validation: {
        isRequired: true
      }
    }),
    receivedAt: (0, import_fields74.timestamp)(),
    metadata: (0, import_fields74.json)(),
    idempotencyKey: (0, import_fields74.text)(),
    noNotification: (0, import_fields74.checkbox)(),
    claimOrder: (0, import_fields74.relationship)({
      ref: "ClaimOrder.return"
    }),
    swap: (0, import_fields74.relationship)({
      ref: "Swap.return"
    }),
    order: (0, import_fields74.relationship)({
      ref: "Order.returns"
    }),
    returnItems: (0, import_fields74.relationship)({
      ref: "ReturnItem.return",
      many: true
    }),
    shippingMethod: (0, import_fields74.relationship)({
      access: { create: import_access115.denyAll, update: import_access115.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingMethod.return"
    }),
    ...trackingFields
  }
});

// features/keystone/models/ReturnItem.ts
var import_core74 = require("@keystone-6/core");
var import_fields75 = require("@keystone-6/core/fields");
var ReturnItem = (0, import_core74.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadReturns({ session }) || permissions.canManageReturns({ session }),
      create: permissions.canManageReturns,
      update: permissions.canManageReturns,
      delete: permissions.canManageReturns
    }
  },
  fields: {
    quantity: (0, import_fields75.integer)({
      validation: {
        isRequired: true
      }
    }),
    isRequested: (0, import_fields75.checkbox)({
      defaultValue: true
    }),
    requestedQuantity: (0, import_fields75.integer)(),
    receivedQuantity: (0, import_fields75.integer)(),
    metadata: (0, import_fields75.json)(),
    note: (0, import_fields75.text)(),
    return: (0, import_fields75.relationship)({
      ref: "Return.returnItems"
    }),
    lineItem: (0, import_fields75.relationship)({
      ref: "LineItem.returnItems"
    }),
    returnReason: (0, import_fields75.relationship)({
      ref: "ReturnReason.returnItems"
    }),
    ...trackingFields
  }
});

// features/keystone/models/ReturnReason.ts
var import_core75 = require("@keystone-6/core");
var import_fields76 = require("@keystone-6/core/fields");
var ReturnReason = (0, import_core75.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadReturns({ session }) || permissions.canManageReturns({ session }),
      create: permissions.canManageReturns,
      update: permissions.canManageReturns,
      delete: permissions.canManageReturns
    }
  },
  fields: {
    value: (0, import_fields76.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    label: (0, import_fields76.text)({
      validation: {
        isRequired: true
      }
    }),
    description: (0, import_fields76.text)(),
    metadata: (0, import_fields76.json)(),
    parentReturnReason: (0, import_fields76.relationship)({
      ref: "ReturnReason"
    }),
    returnItems: (0, import_fields76.relationship)({
      ref: "ReturnItem.returnReason",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/Role.ts
var import_fields77 = require("@keystone-6/core/fields");
var import_core76 = require("@keystone-6/core");
var Role = (0, import_core76.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadRoles({ session }) || permissions.canManageRoles({ session }),
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    isHidden: (args) => !permissions.canManageRoles(args)
  },
  fields: {
    name: (0, import_fields77.text)({ validation: { isRequired: true } }),
    ...permissionFields,
    assignedTo: (0, import_fields77.relationship)({
      ref: "User.role",
      // TODO: Add this to the User
      many: true
      // ui: {
      //   itemView: { fieldMode: 'read' },
      // },
    }),
    ...trackingFields
  }
});

// features/keystone/models/RuleType.ts
var import_core77 = require("@keystone-6/core");
var import_fields79 = require("@keystone-6/core/fields");
var RuleType = (0, import_core77.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts
    }
  },
  fields: {
    name: (0, import_fields79.text)({ validation: { isRequired: true } }),
    ruleAttribute: (0, import_fields79.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    priceSets: (0, import_fields79.relationship)({ ref: "PriceSet.ruleTypes", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/SalesChannel.ts
var import_core78 = require("@keystone-6/core");
var import_fields80 = require("@keystone-6/core/fields");
var SalesChannel = (0, import_core78.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadSalesChannels({ session }) || permissions.canManageSalesChannels({ session }),
      create: permissions.canManageSalesChannels,
      update: permissions.canManageSalesChannels,
      delete: permissions.canManageSalesChannels
    }
  },
  fields: {
    name: (0, import_fields80.text)(),
    description: (0, import_fields80.text)(),
    isDisabled: (0, import_fields80.checkbox)(),
    ...trackingFields
  }
});

// features/keystone/models/ShippingLabel.ts
var import_core79 = require("@keystone-6/core");
var import_fields81 = require("@keystone-6/core/fields");
var ShippingLabel = (0, import_core79.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    status: (0, import_fields81.select)({
      type: "enum",
      options: [
        { label: "Created", value: "created" },
        { label: "Purchased", value: "purchased" },
        { label: "Failed", value: "failed" }
      ],
      validation: { isRequired: true },
      defaultValue: "created"
    }),
    // Label information
    labelUrl: (0, import_fields81.text)(),
    carrier: (0, import_fields81.text)(),
    service: (0, import_fields81.text)(),
    rate: (0, import_fields81.json)(),
    // Tracking information
    trackingNumber: (0, import_fields81.text)(),
    trackingUrl: (0, import_fields81.text)(),
    // Relationships
    order: (0, import_fields81.relationship)({
      ref: "Order.shippingLabels",
      many: false
    }),
    provider: (0, import_fields81.relationship)({
      ref: "ShippingProvider.labels",
      many: false
    }),
    fulfillment: (0, import_fields81.relationship)({
      ref: "Fulfillment.shippingLabels",
      many: false
    }),
    // Additional data
    data: (0, import_fields81.json)(),
    metadata: (0, import_fields81.json)(),
    ...trackingFields
  },
  hooks: {
    resolveInput: ({ resolvedData }) => {
      if (resolvedData.carrier && resolvedData.trackingNumber && !resolvedData.trackingUrl) {
        const carrier = resolvedData.carrier.toLowerCase();
        resolvedData.trackingUrl = carrier === "ups" ? `https://www.ups.com/track?tracknum=${resolvedData.trackingNumber}` : carrier === "usps" ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${resolvedData.trackingNumber}` : carrier === "fedex" ? `https://www.fedex.com/fedextrack/?trknbr=${resolvedData.trackingNumber}` : carrier === "dhl" ? `https://www.dhl.com/en/express/tracking.html?AWB=${resolvedData.trackingNumber}` : void 0;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/ShippingMethod.ts
var import_core80 = require("@keystone-6/core");
var import_fields82 = require("@keystone-6/core/fields");
var ShippingMethod = (0, import_core80.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      // Cart and order reads use explicitly authorized custom projections.
      query: permissions.canManageOrders,
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  hooks: {
    async afterOperation({ operation, item, context }) {
      if (operation === "create" || operation === "update") {
        const sudoContext = context.sudo();
        const shippingMethod = await sudoContext.query.ShippingMethod.findOne({
          where: { id: item.id },
          query: "cart { id }"
        });
        if (shippingMethod?.cart?.id) {
          await sudoContext.query.Cart.updateOne({
            where: { id: shippingMethod.cart.id },
            data: {
              paymentCollection: {
                disconnect: true
              }
            }
          });
        }
      }
    }
  },
  fields: {
    price: (0, import_fields82.integer)({
      validation: {
        isRequired: true
      }
    }),
    data: (0, import_fields82.json)(),
    return: (0, import_fields82.relationship)({
      ref: "Return.shippingMethod"
    }),
    order: (0, import_fields82.relationship)({
      ref: "Order.shippingMethods"
    }),
    claimOrder: (0, import_fields82.relationship)({
      ref: "ClaimOrder.shippingMethods"
    }),
    cart: (0, import_fields82.relationship)({
      ref: "Cart.shippingMethods"
    }),
    swap: (0, import_fields82.relationship)({
      ref: "Swap.shippingMethods"
    }),
    shippingOption: (0, import_fields82.relationship)({
      ref: "ShippingOption.shippingMethods"
    }),
    shippingMethodTaxLines: (0, import_fields82.relationship)({
      ref: "ShippingMethodTaxLine.shippingMethod",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShippingMethodTaxLine.ts
var import_core81 = require("@keystone-6/core");
var import_fields83 = require("@keystone-6/core/fields");
var ShippingMethodTaxLine = (0, import_core81.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    rate: (0, import_fields83.float)({
      validation: {
        isRequired: true
      }
    }),
    name: (0, import_fields83.text)({
      validation: {
        isRequired: true
      }
    }),
    code: (0, import_fields83.text)(),
    metadata: (0, import_fields83.json)(),
    shippingMethod: (0, import_fields83.relationship)({
      ref: "ShippingMethod.shippingMethodTaxLines"
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShippingOption.ts
var import_core82 = require("@keystone-6/core");
var import_access125 = require("@keystone-6/core/access");
var import_fields84 = require("@keystone-6/core/fields");
var import_core83 = require("@keystone-6/core");
function formatCurrency4(amount, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(amount);
}
var ShippingOption = (0, import_core82.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    name: (0, import_fields84.text)({
      validation: {
        isRequired: true
      }
    }),
    uniqueKey: (0, import_fields84.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    priceType: (0, import_fields84.select)({
      type: "enum",
      options: [
        {
          label: "Flat Rate",
          value: "flat_rate"
        },
        {
          label: "Calculated",
          value: "calculated"
        },
        {
          label: "Free",
          value: "free"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    amount: (0, import_fields84.integer)({
      validation: {
        isRequired: false
      }
    }),
    isReturn: (0, import_fields84.checkbox)(),
    data: (0, import_fields84.json)(),
    metadata: (0, import_fields84.json)(),
    adminOnly: (0, import_fields84.checkbox)(),
    region: (0, import_fields84.relationship)({
      ref: "Region.shippingOptions"
    }),
    fulfillmentProvider: (0, import_fields84.relationship)({
      ref: "FulfillmentProvider.shippingOptions"
    }),
    shippingProfile: (0, import_fields84.relationship)({
      ref: "ShippingProfile.shippingOptions"
    }),
    customShippingOptions: (0, import_fields84.relationship)({
      ref: "CustomShippingOption.shippingOption",
      many: true
    }),
    shippingMethods: (0, import_fields84.relationship)({
      access: { create: import_access125.denyAll, update: import_access125.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingMethod.shippingOption",
      many: true
    }),
    shippingOptionRequirements: (0, import_fields84.relationship)({
      ref: "ShippingOptionRequirement.shippingOption",
      many: true
    }),
    taxRates: (0, import_fields84.relationship)({
      ref: "TaxRate.shippingOptions",
      many: true
    }),
    calculatedAmount: (0, import_fields84.virtual)({
      field: import_core83.graphql.field({
        type: import_core83.graphql.String,
        async resolve(item, args, context) {
          const sudoContext = context.sudo();
          const shippingOption = await sudoContext.query.ShippingOption.findOne({
            where: { id: item.id },
            query: `
              region {
                currency {
                  code
                  noDivisionCurrency
                }
              }
              amount
              taxRates {
                rate
              }
            `
          });
          if (!shippingOption?.amount) return null;
          const currencyCode = shippingOption.region?.currency?.code || "USD";
          const divisor = shippingOption.region?.currency?.noDivisionCurrency ? 1 : 100;
          const taxRate = shippingOption.taxRates?.[0]?.rate || 0;
          const amount = shippingOption.amount * (1 + taxRate);
          return formatCurrency4(amount / divisor, currencyCode);
        }
      })
    }),
    isTaxInclusive: (0, import_fields84.virtual)({
      field: import_core83.graphql.field({
        type: import_core83.graphql.Boolean,
        resolve() {
          return true;
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShippingOptionRequirement.ts
var import_core84 = require("@keystone-6/core");
var import_fields85 = require("@keystone-6/core/fields");
var ShippingOptionRequirement = (0, import_core84.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    type: (0, import_fields85.select)({
      type: "enum",
      options: [
        {
          label: "Min Subtotal",
          value: "min_subtotal"
        },
        {
          label: "Max Subtotal",
          value: "max_subtotal"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    amount: (0, import_fields85.integer)({
      validation: {
        isRequired: true
      }
    }),
    shippingOption: (0, import_fields85.relationship)({
      ref: "ShippingOption.shippingOptionRequirements"
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShippingProfile.ts
var import_core85 = require("@keystone-6/core");
var import_fields86 = require("@keystone-6/core/fields");
var ShippingProfile = (0, import_core85.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    name: (0, import_fields86.text)({
      validation: {
        isRequired: true
      }
    }),
    type: (0, import_fields86.select)({
      type: "enum",
      options: [
        {
          label: "Default",
          value: "default"
        },
        {
          label: "Gift Card",
          value: "gift_card"
        },
        {
          label: "Custom",
          value: "custom"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields86.json)(),
    products: (0, import_fields86.relationship)({
      ref: "Product.shippingProfile",
      many: true
    }),
    shippingOptions: (0, import_fields86.relationship)({
      ref: "ShippingOption.shippingProfile",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShippingProvider.ts
var import_core86 = require("@keystone-6/core");
var import_access129 = require("@keystone-6/core/access");
var import_fields87 = require("@keystone-6/core/fields");
var ShippingProvider = (0, import_core86.list)({
  ui: { listView: { initialColumns: ["name", "isActive", "updatedAt"] } },
  hooks: {
    validateInput: ({ resolvedData, item, addValidationError }) => {
      const allowed = new Set(Object.keys(shippingProviderAdapters));
      for (const field of ["createLabelFunction", "getRatesFunction", "validateAddressFunction", "trackShipmentFunction", "cancelLabelFunction"]) {
        const adapterKey = resolvedData[field] ?? item?.[field];
        if (typeof adapterKey !== "string" || !allowed.has(adapterKey)) {
          addValidationError(`${field} must name a registered shipping adapter`);
        }
      }
    }
  },
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    name: (0, import_fields87.text)({
      validation: { isRequired: true }
    }),
    isActive: (0, import_fields87.checkbox)({
      defaultValue: false
    }),
    accessToken: (0, import_fields87.text)({
      isFilterable: false,
      isOrderable: false,
      validation: { isRequired: true },
      access: {
        read: import_access129.denyAll,
        create: permissions.canManageOrders,
        update: permissions.canManageOrders
      },
      ui: {
        itemView: { fieldMode: "hidden" }
      }
    }),
    // Adapter names are resolved only through the in-repository registry; arbitrary URLs are never called.
    createLabelFunction: (0, import_fields87.text)({
      validation: { isRequired: true },
      ui: { description: "Registered shipping adapter name (shippo, shipengine, or manual)" }
    }),
    getRatesFunction: (0, import_fields87.text)({
      validation: { isRequired: true },
      ui: { description: "Registered shipping adapter name (shippo, shipengine, or manual)" }
    }),
    validateAddressFunction: (0, import_fields87.text)({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)"
      }
    }),
    trackShipmentFunction: (0, import_fields87.text)({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)"
      }
    }),
    cancelLabelFunction: (0, import_fields87.text)({
      validation: { isRequired: true },
      ui: {
        description: "Registered shipping adapter name (shippo, shipengine, or manual)"
      }
    }),
    metadata: (0, import_fields87.json)(),
    // Relationships
    regions: (0, import_fields87.relationship)({
      ref: "Region.shippingProviders",
      many: true
    }),
    labels: (0, import_fields87.relationship)({
      access: { create: import_access129.denyAll, update: import_access129.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingLabel.provider",
      many: true
    }),
    fulfillmentProvider: (0, import_fields87.relationship)({
      ref: "FulfillmentProvider.shippingProviders",
      many: false
    }),
    fromAddress: (0, import_fields87.relationship)({
      ref: "Address.shippingProviders",
      many: false
      // ui: {
      //   displayMode: 'cards',
      //   cardFields: ['company', 'address1', 'city', 'province', 'country'],
      //   inlineCreate: { fields: ['company', 'firstName', 'lastName', 'address1', 'address2', 'city', 'province', 'postalCode', 'country', 'phone'] },
      //   inlineEdit: { fields: ['company', 'firstName', 'lastName', 'address1', 'address2', 'city', 'province', 'postalCode', 'country', 'phone'] },
      //   inlineConnect: true,
      // },
    }),
    ...trackingFields
  }
});

// features/keystone/models/StockMovement.ts
var import_core87 = require("@keystone-6/core");
var import_fields88 = require("@keystone-6/core/fields");
var StockMovement = (0, import_core87.list)({
  ui: lockedRecordUi,
  access: {
    operation: {
      query: ({ session }) => permissions.canReadProducts({ session }) || permissions.canManageProducts({ session }),
      create: () => false,
      update: () => false,
      delete: () => false
    }
  },
  fields: {
    type: (0, import_fields88.select)({
      type: "enum",
      options: [
        { label: "Receive", value: "RECEIVE" },
        { label: "Remove", value: "REMOVE" }
      ],
      validation: { isRequired: true }
    }),
    quantity: (0, import_fields88.integer)({
      validation: { isRequired: true }
    }),
    reason: (0, import_fields88.text)(),
    note: (0, import_fields88.text)(),
    variant: (0, import_fields88.relationship)({
      ref: "ProductVariant.stockMovements",
      many: false
    }),
    ...trackingFields
  }
});

// features/keystone/models/Store.ts
var import_core88 = require("@keystone-6/core");
var import_fields89 = require("@keystone-6/core/fields");
var import_core89 = require("@keystone-6/core");

// features/platform/store-settings/lib/store-logo.ts
var DEFAULT_STORE_LOGO_ICON = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" height="100%" width="100%" viewBox="0 0 42 48"><path fill="#155eef" fill-rule="evenodd" d="m22.102 20.86 9.9-9.9L29.88 8.84l-7.339 7.339V3h-3v13.178l-7.339-7.34-2.121 2.122 9.9 9.9 1.06 1.06zm2.12 2.121 9.9-9.9 2.121 2.122-7.339 7.339H42v3H28.904l7.34 7.339L34.121 35l-9.9-9.899-1.06-1.06zM7.96 35.001l9.9-9.899 1.06-1.06-1.06-1.061-9.9-9.9-2.121 2.122 7.339 7.339H.002v3h13.176l-7.34 7.339zm12.02-7.777-9.9 9.9 2.122 2.12 7.339-7.338V45h3V31.906l7.339 7.338L32 37.124l-9.9-9.9-1.06-1.061z" clip-rule="evenodd"/></svg>';
var DEFAULT_STORE_LOGO_COLOR = "0";
function normalizeStoreLogoColor(value) {
  const numeric = Number.parseFloat(String(value ?? DEFAULT_STORE_LOGO_COLOR));
  if (!Number.isFinite(numeric)) return DEFAULT_STORE_LOGO_COLOR;
  return String((numeric % 360 + 360) % 360);
}

// features/lib/sanitize-store-logo.ts
var ALLOWED_ELEMENTS = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "path",
  "defs",
  "lineargradient",
  "radialgradient",
  "stop",
  "clippath",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "title",
  "desc"
]);
var ALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set([
  "xmlns",
  "fill",
  "fill-rule",
  "clip-rule",
  "height",
  "width",
  "viewbox",
  "d",
  "clip-path",
  "id",
  "x1",
  "x2",
  "y1",
  "y2",
  "gradientunits",
  "gradienttransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "opacity",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "transform",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "points",
  "role",
  "aria-hidden",
  "aria-label",
  "preserveaspectratio"
]);
var ATTRIBUTE_PATTERN = /\s+([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
var TAG_PATTERN = /<\/?\s*([A-Za-z][\w:-]*)([^<>]*)>/g;
function sanitizeStoreLogoSvg(svg) {
  const source = svg.trim();
  if (!source.startsWith("<svg") || !source.endsWith("</svg>") || source.length > 1e5) {
    return "";
  }
  if (/<!|<\?|\b(?:javascript|data|vbscript):|\bon[a-z]+\s*=|\b(?:href|src|style)\s*=/i.test(source)) {
    return "";
  }
  let tagCount = 0;
  let match;
  TAG_PATTERN.lastIndex = 0;
  while (match = TAG_PATTERN.exec(source)) {
    tagCount += 1;
    const element = match[1].toLowerCase();
    if (!ALLOWED_ELEMENTS.has(element)) return "";
    if (match[0].startsWith("</")) continue;
    const attributes = match[2];
    let consumed = "";
    ATTRIBUTE_PATTERN.lastIndex = 0;
    let attributeMatch;
    while (attributeMatch = ATTRIBUTE_PATTERN.exec(attributes)) {
      consumed += attributeMatch[0];
      const attribute = attributeMatch[1].toLowerCase();
      const value = attributeMatch[2].slice(1, -1);
      if (!ALLOWED_ATTRIBUTES.has(attribute)) return "";
      if (attribute === "id" && !/^[A-Za-z_][\w:.-]*$/.test(value)) return "";
      if (/url\(/i.test(value) && !/^url\(#[A-Za-z_][\w:.-]*\)$/.test(value)) return "";
    }
    const remainder = attributes.replace(consumed, "").replace(/\//g, "").trim();
    if (remainder) return "";
  }
  TAG_PATTERN.lastIndex = 0;
  if (tagCount === 0 || source.replace(TAG_PATTERN, "").trim()) return "";
  return source;
}

// features/keystone/models/Store.ts
var Store = (0, import_core88.list)({
  access: {
    operation: {
      // Allow public read access
      query: () => true,
      create: permissions.canManageSalesChannels,
      update: permissions.canManageSalesChannels,
      delete: permissions.canManageSalesChannels
    }
  },
  fields: {
    name: (0, import_fields89.text)({
      defaultValue: "Openfront Store",
      validation: {
        isRequired: true
      }
    }),
    defaultCurrencyCode: (0, import_fields89.text)({
      defaultValue: "usd",
      validation: {
        isRequired: true
      }
    }),
    homepageTitle: (0, import_fields89.text)({
      defaultValue: "Openfront Next.js Starter"
    }),
    homepageDescription: (0, import_fields89.text)({
      defaultValue: "A performant frontend e-commerce starter template with Next.js 15 and Openfront."
    }),
    logoIcon: (0, import_fields89.text)({
      defaultValue: DEFAULT_STORE_LOGO_ICON,
      hooks: {
        resolveInput: ({ resolvedData, fieldKey }) => {
          const value = resolvedData[fieldKey];
          if (value === void 0 || value === null || value === "") return value;
          return typeof value === "string" ? sanitizeStoreLogoSvg(value) : "";
        },
        validate: ({ inputData, resolvedData, fieldKey, addValidationError }) => {
          const submitted = inputData?.logoIcon;
          if (typeof submitted === "string" && submitted.trim() && !resolvedData?.[fieldKey]) {
            addValidationError("Logo must be a valid, safe SVG document");
          }
        }
      }
    }),
    logoColor: (0, import_fields89.text)({
      defaultValue: DEFAULT_STORE_LOGO_COLOR,
      hooks: {
        resolveInput: ({ resolvedData, fieldKey }) => {
          const value = resolvedData[fieldKey];
          return value === void 0 ? value : normalizeStoreLogoColor(value);
        }
      }
    }),
    metadata: (0, import_fields89.json)(),
    swapLinkTemplate: (0, import_fields89.text)(),
    paymentLinkTemplate: (0, import_fields89.text)(),
    inviteLinkTemplate: (0, import_fields89.text)(),
    // currency: relationship({
    //   ref: "Currency.stores",
    // }),
    currencies: (0, import_fields89.relationship)({
      ref: "Currency.stores",
      many: true
    }),
    paymentProviders: (0, import_fields89.virtual)({
      field: import_core89.graphql.field({
        type: import_core89.graphql.list(
          import_core89.graphql.object()({
            name: "PaymentProviderConfig",
            fields: {
              provider: import_core89.graphql.field({ type: import_core89.graphql.String }),
              publishableKey: import_core89.graphql.field({ type: import_core89.graphql.String })
            }
          })
        ),
        resolve: async (_item, _args, context) => {
          const installedProviders = await context.sudo().query.PaymentProvider.findMany({
            where: { isInstalled: { equals: true } },
            take: 51,
            query: "code"
          });
          if (installedProviders.length > 50) throw new Error("Payment provider configuration exceeds the supported bound");
          return installedProviders.map((provider) => getPublicPaymentProviderConfig(provider.code || "")).filter((provider) => Boolean(provider));
        }
      }),
      ui: { query: "{ provider publishableKey }", createView: { fieldMode: "hidden" }, itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Swap.ts
var import_core90 = require("@keystone-6/core");
var import_access133 = require("@keystone-6/core/access");
var import_fields90 = require("@keystone-6/core/fields");
var Swap = (0, import_core90.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadOrders({ session }) || permissions.canManageOrders({ session }),
      create: permissions.canManageOrders,
      update: permissions.canManageOrders,
      delete: permissions.canManageOrders
    }
  },
  fields: {
    fulfillmentStatus: (0, import_fields90.select)({
      type: "enum",
      options: [
        {
          label: "Not Fulfilled",
          value: "not_fulfilled"
        },
        {
          label: "Fulfilled",
          value: "fulfilled"
        },
        {
          label: "Shipped",
          value: "shipped"
        },
        {
          label: "Partially Shipped",
          value: "partially_shipped"
        },
        {
          label: "Canceled",
          value: "canceled"
        },
        {
          label: "Requires Action",
          value: "requires_action"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    paymentStatus: (0, import_fields90.select)({
      type: "enum",
      options: [
        {
          label: "Not Paid",
          value: "not_paid"
        },
        {
          label: "Awaiting",
          value: "awaiting"
        },
        {
          label: "Captured",
          value: "captured"
        },
        {
          label: "Confirmed",
          value: "confirmed"
        },
        {
          label: "Canceled",
          value: "canceled"
        },
        {
          label: "Difference Refunded",
          value: "difference_refunded"
        },
        {
          label: "Partially Refunded",
          value: "partially_refunded"
        },
        {
          label: "Refunded",
          value: "refunded"
        },
        {
          label: "Requires Action",
          value: "requires_action"
        }
      ],
      validation: {
        isRequired: true
      }
    }),
    differenceDue: (0, import_fields90.integer)(),
    confirmedAt: (0, import_fields90.timestamp)(),
    metadata: (0, import_fields90.json)(),
    idempotencyKey: (0, import_fields90.text)(),
    noNotification: (0, import_fields90.checkbox)(),
    canceledAt: (0, import_fields90.timestamp)(),
    allowBackorder: (0, import_fields90.checkbox)(),
    cart: (0, import_fields90.relationship)({
      ref: "Cart.swap"
    }),
    order: (0, import_fields90.relationship)({
      ref: "Order.swaps"
    }),
    address: (0, import_fields90.relationship)({
      ref: "Address.swaps"
    }),
    lineItems: (0, import_fields90.relationship)({
      ref: "LineItem.swap",
      many: true
    }),
    fulfillments: (0, import_fields90.relationship)({
      access: { create: import_access133.denyAll, update: import_access133.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Fulfillment.swap",
      many: true
    }),
    payment: (0, import_fields90.relationship)({
      access: { create: import_access133.denyAll, update: import_access133.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "Payment.swap"
    }),
    return: (0, import_fields90.relationship)({
      ref: "Return.swap"
    }),
    shippingMethods: (0, import_fields90.relationship)({
      access: { create: import_access133.denyAll, update: import_access133.denyAll },
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } },
      ref: "ShippingMethod.swap",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/TaxProvider.ts
var import_core91 = require("@keystone-6/core");
var import_fields91 = require("@keystone-6/core/fields");
var TaxProvider = (0, import_core91.list)({
  access: {
    operation: {
      query: permissions.canManageIntegrations,
      create: permissions.canManageIntegrations,
      update: permissions.canManageIntegrations,
      delete: permissions.canManageIntegrations
    }
  },
  fields: {
    ...trackingFields,
    isInstalled: (0, import_fields91.checkbox)({
      defaultValue: true
    }),
    regions: (0, import_fields91.relationship)({
      ref: "Region.taxProvider",
      many: true
    })
  }
});

// features/keystone/models/TaxRate.ts
var import_core92 = require("@keystone-6/core");
var import_fields92 = require("@keystone-6/core/fields");
var TaxRate = (0, import_core92.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    rate: (0, import_fields92.float)(),
    code: (0, import_fields92.text)(),
    name: (0, import_fields92.text)({
      validation: {
        isRequired: true
      }
    }),
    metadata: (0, import_fields92.json)(),
    products: (0, import_fields92.relationship)({
      ref: "Product.taxRates",
      many: true
    }),
    productTypes: (0, import_fields92.relationship)({
      ref: "ProductType.taxRates",
      many: true
    }),
    region: (0, import_fields92.relationship)({
      ref: "Region.taxRates"
    }),
    shippingOptions: (0, import_fields92.relationship)({
      ref: "ShippingOption.taxRates",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/Team.ts
var import_core93 = require("@keystone-6/core");
var import_fields93 = require("@keystone-6/core/fields");
var canManageTeams = ({ session }) => {
  if (!isSignedIn({ session })) {
    return false;
  }
  if (permissions.canManageUsers({ session })) {
    return true;
  }
  return { members: { some: { id: { equals: session?.itemId } } } };
};
var Team = (0, import_core93.list)({
  access: {
    operation: {
      create: permissions.canManageUsers,
      query: isSignedIn,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    },
    filter: {
      query: canManageTeams,
      update: canManageTeams
    }
  },
  ui: {
    // hide the backend UI from regular users
    hideCreate: (args) => !permissions.canManageUsers(args),
    hideDelete: (args) => !permissions.canManageUsers(args)
  },
  fields: {
    name: (0, import_fields93.text)({
      validation: { isRequired: true }
    }),
    description: (0, import_fields93.text)(),
    members: (0, import_fields93.relationship)({
      ref: "User.team",
      many: true
    }),
    leader: (0, import_fields93.relationship)({
      ref: "User.teamLead",
      many: false
    }),
    ...trackingFields
  },
  hooks: {
    validateInput: async ({ resolvedData, addValidationError, context }) => {
      const { name, leader, members } = resolvedData;
      if (typeof name === "string" && name.length < 2) {
        addValidationError("Team name must be at least 2 characters long");
      }
      if (leader && members) {
        const memberConnections = Array.isArray(members.connect) ? members.connect : members.connect ? [members.connect] : [];
        const leaderInMembers = memberConnections.some(
          (member) => member.id === leader.connect?.id
        );
        if (!leaderInMembers) {
          addValidationError("Team leader must be a member of the team");
        }
      }
    },
    beforeOperation: async ({ operation, resolvedData, item, context }) => {
      if (operation === "delete") {
        const teamWithMembers = await context.query.Team.findOne({
          where: { id: item.id },
          query: "members { id }"
        });
        if (teamWithMembers?.members?.length > 0) {
          throw new Error("Cannot delete team with active members");
        }
      }
    }
  }
});

// features/keystone/models/User.ts
var import_core94 = require("@keystone-6/core");
var import_access139 = require("@keystone-6/core/access");
var import_fields94 = require("@keystone-6/core/fields");

// features/keystone/security/user-create.ts
var canCreateUserRole = permissions.canManageRoles;
var PUBLIC_USER_CREATE_FIELDS = /* @__PURE__ */ new Set([
  "name",
  "email",
  "password",
  "phone",
  // createAuth merges initFirstItem.itemData into the DB API input before list
  // hooks run. Public callers cannot supply role because User.role field access
  // is enforced before resolveInput; allowing it here preserves the first admin.
  "role",
  // Guest checkout sends this explicitly. It is always forced to false below.
  "hasAccount"
]);
function resolvePublicUserCreateData({
  inputData,
  resolvedData
}) {
  const restrictedData = { ...resolvedData };
  for (const key of Object.keys(inputData ?? {})) {
    if (!PUBLIC_USER_CREATE_FIELDS.has(key)) {
      delete restrictedData[key];
    }
  }
  restrictedData.hasAccount = false;
  return restrictedData;
}

// features/keystone/models/User.ts
var canManageUsers = ({ session }) => {
  if (!isSignedIn({ session })) {
    return false;
  }
  if (permissions.canManageUsers({ session })) {
    return true;
  }
  return { id: { equals: session?.itemId } };
};
var User = (0, import_core94.list)({
  access: {
    operation: {
      create: () => true,
      query: isSignedIn,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    },
    filter: {
      query: canManageUsers,
      update: canManageUsers,
      delete: controlPlaneAccess.userDeletionScope
    }
  },
  hooks: {
    resolveInput: ({ operation, inputData, resolvedData, context }) => {
      if (operation === "create" && !permissions.canManageUsers({ session: context.session })) {
        return resolvePublicUserCreateData({ inputData, resolvedData });
      }
      return resolvedData;
    }
  },
  ui: {
    // hide the backend UI from regular users
    hideCreate: (args) => !permissions.canManageUsers(args),
    hideDelete: (args) => !permissions.canManageRoles(args)
  },
  fields: {
    name: (0, import_fields94.text)({
      validation: { isRequired: true }
    }),
    email: (0, import_fields94.text)({ isIndexed: "unique", isFilterable: true, validation: { isRequired: true }, access: { update: controlPlaneAccess.emailUpdate }, ui: { itemView: { fieldMode: (args) => permissions.canManageRoles(args) ? "edit" : "read" } } }),
    password: (0, import_fields94.password)({
      access: { update: controlPlaneAccess.passwordUpdate },
      ui: { itemView: { fieldMode: "read" } },
      validation: {
        length: { min: 10, max: 1e3 },
        isRequired: true,
        rejectCommon: true
      }
    }),
    role: (0, import_fields94.relationship)({
      ref: "Role.assignedTo",
      access: {
        create: canCreateUserRole,
        update: permissions.canManageRoles
      },
      ui: {
        itemView: {
          fieldMode: (args) => permissions.canManageRoles(args) ? "edit" : "read"
        }
      }
    }),
    apiKeys: (0, import_fields94.relationship)({ ref: "ApiKey.user", many: true, access: { create: import_access139.denyAll, update: import_access139.denyAll } }),
    phone: (0, import_fields94.text)(),
    hasAccount: (0, import_fields94.checkbox)(),
    addresses: (0, import_fields94.relationship)({
      ref: "Address.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    orders: (0, import_fields94.relationship)({
      ref: "Order.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    orderEvents: (0, import_fields94.relationship)({
      ref: "OrderEvent.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    carts: (0, import_fields94.relationship)({
      ref: "Cart.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    customerGroups: (0, import_fields94.relationship)({
      ref: "CustomerGroup.users",
      many: true
    }),
    notifications: (0, import_fields94.relationship)({
      ref: "Notification.user",
      many: true
    }),
    payments: (0, import_fields94.relationship)({
      ref: "Payment.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    batchJobs: (0, import_fields94.relationship)({
      ref: "BatchJob.createdBy",
      many: true
    }),
    team: (0, import_fields94.relationship)({
      ref: "Team.members",
      many: false
    }),
    teamLead: (0, import_fields94.relationship)({
      ref: "Team.leader",
      many: true
    }),
    userField: (0, import_fields94.relationship)({
      ref: "UserField.user",
      many: false
    }),
    onboardingStatus: (0, import_fields94.select)({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Dismissed", value: "dismissed" }
      ],
      defaultValue: "not_started"
    }),
    // Account system fields
    accounts: (0, import_fields94.relationship)({
      ref: "Account.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    webhookEndpoints: (0, import_fields94.relationship)({
      ref: "WebhookEndpoint.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll },
      ui: { displayMode: "count" }
    }),
    invoices: (0, import_fields94.relationship)({
      ref: "Invoice.user",
      many: true,
      // Ownership/lifecycle changes go through the related domain's command.
      access: { create: import_access139.denyAll, update: import_access139.denyAll }
    }),
    businessAccountRequest: (0, import_fields94.relationship)({
      ref: "BusinessAccountRequest.user",
      many: false
    }),
    customerToken: (0, import_fields94.text)({
      isFilterable: false,
      isOrderable: false,
      access: {
        read: () => false,
        create: () => false,
        update: () => false
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" }
      },
      db: {
        isNullable: true
      }
    }),
    tokenGeneratedAt: (0, import_fields94.timestamp)(),
    ...(0, import_core94.group)({
      label: "Virtual Fields",
      description: "Calculated fields for user display and cart status",
      fields: {
        firstName: (0, import_fields94.virtual)({
          field: import_core94.graphql.field({
            type: import_core94.graphql.String,
            resolve(item) {
              if (!item.name) return "";
              const parts = item.name.trim().split(/\s+/);
              return parts[0] || "";
            }
          })
        }),
        lastName: (0, import_fields94.virtual)({
          field: import_core94.graphql.field({
            type: import_core94.graphql.String,
            resolve(item) {
              if (!item.name) return "";
              const parts = item.name.trim().split(/\s+/);
              if (parts.length === 1) return "";
              if (parts.length > 2 && parts[parts.length - 2].length === 1) {
                return parts.slice(-2).join(" ");
              }
              return parts[parts.length - 1];
            }
          })
        }),
        activeCartId: (0, import_fields94.virtual)({
          field: import_core94.graphql.field({
            type: import_core94.graphql.String,
            async resolve(item, args, context) {
              const sudoContext = context.sudo();
              const activeCarts = await sudoContext.query.Cart.findMany({
                where: {
                  user: { id: { equals: item.id } },
                  order: null,
                  type: { equals: "default" }
                },
                orderBy: { updatedAt: "desc" },
                take: 1,
                query: `
                  id
                  lineItems {
                    id
                  }
                `
              });
              const cart = activeCarts[0];
              if (cart && cart.lineItems?.length > 0) {
                return cart.id;
              }
              return null;
            }
          })
        }),
        billingAddress: (0, import_fields94.virtual)({
          field: (lists) => import_core94.graphql.field({
            type: lists.Address.types.output,
            async resolve(item, args, context) {
              const address = await context.db.Address.findMany({
                where: {
                  user: { id: { equals: item.id } },
                  isBilling: { equals: true }
                },
                take: 1
              });
              if (!address.length) return null;
              return address[0];
            }
          }),
          ui: {
            query: `{
                firstName
                lastName
                company
                address1
                address2
                city
                province
                postalCode
                country {
                  id
                  iso2
                }
                phone
            }`
          }
        })
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/UserField.ts
var import_core95 = require("@keystone-6/core");
var import_fields95 = require("@keystone-6/core/fields");
var UserField = (0, import_core95.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canReadUsers({ session }) || permissions.canManageUsers({ session }),
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers
    }
  },
  fields: {
    user: (0, import_fields95.relationship)({
      ref: "User.userField",
      many: false
    }),
    lastLoginIp: (0, import_fields95.text)(),
    lastLoginUserAgent: (0, import_fields95.text)(),
    loginHistory: (0, import_fields95.json)({
      defaultValue: []
    }),
    preferences: (0, import_fields95.json)({
      defaultValue: {
        theme: "light",
        notifications: true,
        emailNotifications: true
      }
    }),
    notes: (0, import_fields95.text)(),
    lastPasswordChange: (0, import_fields95.timestamp)(),
    failedLoginAttempts: (0, import_fields95.json)({
      defaultValue: {
        count: 0,
        lastAttempt: null,
        lockedUntil: null
      }
    }),
    ...trackingFields
  },
  hooks: {
    resolveInput: async ({ resolvedData, context }) => {
      if (resolvedData.lastLoginIp || resolvedData.lastLoginUserAgent) {
        const history = resolvedData.loginHistory || [];
        history.push({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          ip: resolvedData.lastLoginIp,
          userAgent: resolvedData.lastLoginUserAgent
        });
        if (history.length > 10) {
          history.shift();
        }
        resolvedData.loginHistory = history;
      }
      return resolvedData;
    }
  }
});

// features/keystone/models/WebhookEvent.ts
var import_core96 = require("@keystone-6/core");
var import_fields96 = require("@keystone-6/core/fields");
var WebhookEvent = (0, import_core96.list)({
  access: {
    operation: {
      query: permissions.canReadWebhooks,
      create: permissions.canManageWebhooks,
      // Only system should create events
      update: permissions.canManageWebhooks,
      // Only system should update events
      delete: permissions.canManageWebhooks
    }
  },
  ui: {
    hideCreate: () => true,
    // Events should only be created by the system
    hideDelete: (args) => !permissions.canManageWebhooks(args),
    listView: {
      initialColumns: ["eventType", "resourceType", "delivered", "deliveryAttempts", "createdAt"]
    }
  },
  fields: {
    eventType: (0, import_fields96.text)({
      validation: { isRequired: true },
      ui: { description: 'The type of event (e.g., "order.created")' }
    }),
    resourceId: (0, import_fields96.text)({
      validation: { isRequired: true },
      ui: { description: "ID of the resource that triggered the event" }
    }),
    resourceType: (0, import_fields96.text)({
      validation: { isRequired: true },
      ui: { description: 'Type of resource (e.g., "Order", "Product")' }
    }),
    payload: (0, import_fields96.json)({
      ui: {
        description: "The event payload sent to the webhook",
        itemView: { fieldMode: "read" }
      }
    }),
    deliveryAttempts: (0, import_fields96.integer)({
      defaultValue: 0,
      ui: {
        itemView: { fieldMode: "read" },
        description: "Number of delivery attempts"
      }
    }),
    delivered: (0, import_fields96.checkbox)({
      defaultValue: false,
      ui: {
        itemView: { fieldMode: "read" },
        description: "Whether the webhook was successfully delivered"
      }
    }),
    lastAttempt: (0, import_fields96.timestamp)({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Timestamp of the last delivery attempt"
      }
    }),
    nextAttempt: (0, import_fields96.timestamp)({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Timestamp for the next retry attempt"
      }
    }),
    deadLetteredAt: (0, import_fields96.timestamp)({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Set when the delivery exhausted its retry budget"
      }
    }),
    responseStatus: (0, import_fields96.integer)({
      ui: {
        itemView: { fieldMode: "read" },
        description: "HTTP status code from the last delivery attempt"
      }
    }),
    responseBody: (0, import_fields96.text)({
      ui: {
        itemView: { fieldMode: "read" },
        displayMode: "textarea",
        description: "Response body from the last delivery attempt"
      }
    }),
    endpoint: (0, import_fields96.relationship)({
      ref: "WebhookEndpoint.webhookEvents",
      ui: { description: "The webhook endpoint this event was sent to" }
    }),
    ...trackingFields
  },
  db: {
    extendPrismaSchema: (schema) => schema.replace(
      /(model [^}]+)}/g,
      '$1@@index([delivered, deadLetteredAt, nextAttempt], map: "WebhookEvent_retry_queue_idx")\n}'
    )
  }
});

// features/keystone/models/index.ts
var models = {
  Account,
  AccountLineItem,
  Address,
  ApiKey,
  BatchJob,
  Capture,
  Cart,
  ClaimImage,
  ClaimItem,
  ClaimOrder,
  ClaimTag,
  Country,
  Currency,
  AttributeDefinition,
  CatalogItem,
  CollectibleCategory,
  CollectibleMedia,
  CollectibleRelease,
  CollectibleSet,
  Franchise,
  Specimen,
  SpecimenIdentifier,
  ConditionObservation,
  CustodyEvent,
  GradeObservation,
  GradingCompany,
  ProvenanceEvent,
  ValuationObservation,
  InventoryLocation,
  InventoryMovement,
  InventoryUnit,
  Reservation,
  Auction,
  Bid,
  Listing,
  Offer,
  OfferRevision,
  SavedSearch,
  WishlistItem,
  Buylist,
  BuylistEntry,
  ConsignmentAgreement,
  ConsignmentIntake,
  ConsignmentItem,
  ConsignmentSettlement,
  SettlementLine,
  TradeInItem,
  TradeInSubmission,
  CollectorProfile,
  DisputeCase,
  EvidenceAttachment,
  FulfillmentRequirement,
  NotificationIntent,
  ProviderConnection,
  RiskAssessment,
  RiskSignal,
  SellerProfile,
  ShipmentEvidence,
  StoreMembership,
  CustomShippingOption,
  CustomerGroup,
  Discount,
  DiscountCondition,
  DiscountRule,
  DraftOrder,
  Fulfillment,
  FulfillmentItem,
  FulfillmentProvider,
  GiftCard,
  GiftCardTransaction,
  IdempotencyKey,
  Invite,
  Invoice,
  InvoiceLineItem,
  BusinessAccountRequest,
  LineItem,
  LineItemAdjustment,
  LineItemTaxLine,
  Location,
  Measurement,
  MoneyAmount,
  Note,
  Notification,
  NotificationProvider,
  OAuthApp,
  OAuthToken,
  Order,
  OrderEvent,
  OrderLineItem,
  OrderMoneyAmount,
  Payment,
  PaymentCollection,
  PaymentProvider,
  PaymentSession,
  PriceList,
  PriceRule,
  PriceSet,
  Product,
  ProductCategory,
  ProductCollection,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductTag,
  ProductType,
  ProductVariant,
  Refund,
  Region,
  Return,
  ReturnItem,
  ReturnReason,
  Role,
  RuleType,
  SalesChannel,
  ShippingLabel,
  ShippingMethod,
  ShippingMethodTaxLine,
  ShippingOption,
  ShippingOptionRequirement,
  ShippingProfile,
  ShippingProvider,
  StockMovement,
  Store,
  Swap,
  TaxProvider,
  TaxRate,
  Team,
  User,
  UserField,
  WebhookEndpoint,
  WebhookEvent
};

// features/keystone/lib/mail.ts
var import_nodemailer = require("nodemailer");
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
var transport = (0, import_nodemailer.createTransport)({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : void 0,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
function passwordResetEmail({ url }) {
  const backgroundColor = "#f9f9f9";
  const textColor = "#444444";
  const mainBackgroundColor = "#ffffff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#ffffff";
  return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Please click below to reset your password
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Reset Password</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  `;
}
async function sendPasswordResetEmail(resetToken, to, baseUrl) {
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: `${frontendUrl}${basePath && basePath}/reset?token=${resetToken}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
}

// features/keystone/index.ts
var import_iron = __toESM(require("@hapi/iron"));
var cookie = __toESM(require("cookie"));
var import_bcryptjs = __toESM(require("bcryptjs"));
function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function productionEnv(name, developmentFallback) {
  if (process.env[name]) return process.env[name];
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }
  return developmentFallback;
}
var databaseURL = requiredEnv("DATABASE_URL");
var sessionSecret = requiredEnv("SESSION_SECRET");
if (sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long");
}
var listKey = "User";
var trustedProxyIps = new Set(
  (process.env.TRUSTED_PROXY_IPS || "").split(",").map((value) => value.trim()).filter(Boolean)
);
function requestClientIp(req) {
  const remote = String(
    req.socket?.remoteAddress || req.connection?.remoteAddress || ""
  ).replace(/^::ffff:/, "");
  if (trustedProxyIps.has(remote)) {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (typeof first === "string" && first.trim()) {
      return first.split(",")[0].trim().replace(/^::ffff:/, "");
    }
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  }
  return remote;
}
var basePath = "/dashboard";
var sessionConfig = {
  maxAge: 60 * 60 * 24 * 30,
  secret: sessionSecret
};
var bucketName = productionEnv("S3_BUCKET_NAME", "keystone-test");
var region = productionEnv("S3_REGION", "ap-southeast-2");
var accessKeyId = productionEnv("S3_ACCESS_KEY_ID", "keystone");
var secretAccessKey = productionEnv("S3_SECRET_ACCESS_KEY", "keystone");
var endpoint = productionEnv("S3_ENDPOINT", "https://sfo3.digitaloceanspaces.com");
function statelessSessions({
  secret,
  maxAge = 60 * 60 * 24 * 360,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = import_iron.default.defaults,
  domain,
  sameSite = "lax",
  cookieName = "keystonejs-session"
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }
  return {
    async get({ context }) {
      if (!context?.req) return;
      const authHeader = context.req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const accessToken = authHeader.replace("Bearer ", "");
        if (accessToken.startsWith("of_")) {
          try {
            const actualClientIP = requestClientIp(context.req);
            const ownerPermissionFields = permissionsList.join("\n");
            const apiKeys = await context.sudo().query.ApiKey.findMany({
              where: { status: { equals: "active" } },
              query: `
                id
                name
                scopes
                status
                expiresAt
                usageCount
                restrictedToIPs
                tokenSecret { isSet }
                user { id role { ${ownerPermissionFields} } }
              `
            });
            let matchingApiKey = null;
            for (const apiKey of apiKeys) {
              try {
                if (!apiKey.tokenSecret?.isSet) continue;
                const fullApiKey = await context.sudo().db.ApiKey.findOne({
                  where: { id: apiKey.id }
                });
                if (!fullApiKey || typeof fullApiKey.tokenSecret !== "string") {
                  continue;
                }
                const isValid = await import_bcryptjs.default.compare(accessToken, fullApiKey.tokenSecret);
                if (isValid) {
                  matchingApiKey = apiKey;
                  break;
                }
              } catch (error) {
                continue;
              }
            }
            if (!matchingApiKey) {
              return;
            }
            if (matchingApiKey.restrictedToIPs && Array.isArray(matchingApiKey.restrictedToIPs) && matchingApiKey.restrictedToIPs.length > 0) {
              const allowedIPs = matchingApiKey.restrictedToIPs;
              const isAllowedIP = allowedIPs.includes(actualClientIP);
              if (!isAllowedIP) {
                return;
              }
            }
            if (matchingApiKey.status !== "active") {
              return;
            }
            if (matchingApiKey.expiresAt && /* @__PURE__ */ new Date() > new Date(matchingApiKey.expiresAt)) {
              await context.sudo().query.ApiKey.updateOne({
                where: { id: matchingApiKey.id },
                data: { status: "revoked" }
              });
              return;
            }
            const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
            const usage = matchingApiKey.usageCount || { total: 0, daily: {} };
            usage.total = (usage.total || 0) + 1;
            usage.daily[today] = (usage.daily[today] || 0) + 1;
            context.sudo().query.ApiKey.updateOne({
              where: { id: matchingApiKey.id },
              data: {
                lastUsedAt: /* @__PURE__ */ new Date(),
                usageCount: usage
              }
            }).catch(console.error);
            if (matchingApiKey.user?.id) {
              const session = {
                itemId: matchingApiKey.user.id,
                listKey,
                apiKeyScopes: attenuateScopesToOwnerRole(matchingApiKey.scopes, matchingApiKey.user.role)
                // Attach only scopes still granted by the owner's current role
              };
              return session;
            }
          } catch (err) {
            return;
          }
        }
        try {
          const oauthToken = await findOAuthToken(
            context,
            accessToken,
            `id clientId scopes expiresAt tokenType isRevoked user { id role { ${permissionsList.join(" ")} } }`
          );
          if (oauthToken) {
            if (oauthToken.tokenType !== "access_token") {
              return;
            }
            if (oauthToken.isRevoked === "true") {
              return;
            }
            if (/* @__PURE__ */ new Date() > new Date(oauthToken.expiresAt)) {
              return;
            }
            const oauthApp = await context.sudo().query.OAuthApp.findOne({
              where: { clientId: oauthToken.clientId },
              query: `id status`
            });
            if (!oauthApp || oauthApp.status !== "active") {
              return;
            }
            if (oauthToken.user?.id) {
              return {
                itemId: oauthToken.user.id,
                listKey,
                oauthScopes: attenuateScopesToOwnerRole(oauthToken.scopes, oauthToken.user.role)
                // Attach only scopes still granted by the owner's current role
              };
            }
          }
        } catch (err) {
        }
        if (accessToken.startsWith("ctok_")) {
          try {
            const digest = customerTokenDigest(accessToken);
            let users = await context.sudo().query.User.findMany({
              where: { customerToken: { equals: digest } },
              take: 1,
              query: `
                id
                tokenGeneratedAt
                accounts(where: { status: { equals: "active" }, accountType: { equals: "business" } }) {
                  id
                  status
                }
              `
            });
            if (!users[0] && process.env.NODE_ENV !== "production") {
              users = await context.sudo().query.User.findMany({
                where: { customerToken: { equals: accessToken } },
                take: 1,
                query: `id tokenGeneratedAt accounts(where: { status: { equals: "active" }, accountType: { equals: "business" } }) { id status }`
              });
            }
            const user = users[0];
            const activeAccount = user?.accounts?.[0];
            if (!user || !activeAccount || !user.tokenGeneratedAt) return;
            const maxAgeDays = Number(process.env.CUSTOMER_TOKEN_MAX_AGE_DAYS || 90);
            const expiresAt = new Date(user.tokenGeneratedAt).getTime() + maxAgeDays * 24 * 60 * 60 * 1e3;
            if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return;
            return {
              itemId: user.id,
              listKey,
              customerToken: true,
              activeAccountId: activeAccount.id
            };
          } catch (err) {
            return;
          }
        }
        try {
          return await import_iron.default.unseal(accessToken, secret, ironOptions);
        } catch (err) {
        }
      }
      const cookies = cookie.parse(context.req.headers.cookie || "");
      const token = cookies[cookieName];
      if (!token) return;
      try {
        return await import_iron.default.unseal(token, secret, ironOptions);
      } catch (err) {
      }
    },
    async end({ context }) {
      if (!context?.res) return;
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, "", {
          maxAge: 0,
          expires: /* @__PURE__ */ new Date(),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
    },
    async start({ context, data }) {
      if (!context?.res) return;
      const sealedData = await import_iron.default.seal(data, secret, {
        ...ironOptions,
        ttl: maxAge * 1e3
      });
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, sealedData, {
          maxAge,
          expires: new Date(Date.now() + maxAge * 1e3),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
      return sealedData;
    }
  };
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      /*
        This creates a related role with full permissions, so that when the first user signs in
        they have complete access to the system (without this, you couldn't do anything)
      */
      role: {
        create: {
          name: "Admin",
          canAccessDashboard: true,
          canReadOrders: true,
          canManageOrders: true,
          canReadProducts: true,
          canManageProducts: true,
          canReadFulfillments: true,
          canManageFulfillments: true,
          canReadUsers: true,
          canManageUsers: true,
          canReadRoles: true,
          canManageRoles: true,
          canReadCheckouts: true,
          canManageCheckouts: true,
          canReadDiscounts: true,
          canManageDiscounts: true,
          canReadGiftCards: true,
          canManageGiftCards: true,
          canReadReturns: true,
          canManageReturns: true,
          canReadSalesChannels: true,
          canManageSalesChannels: true,
          canReadPayments: true,
          canManagePayments: true,
          canReadIdempotencyKeys: true,
          canManageIdempotencyKeys: true,
          canReadApps: true,
          canManageApps: true,
          canManageKeys: true,
          canManageOnboarding: true,
          canReadCollectibles: true,
          canManageCatalog: true,
          canManageInventory: true,
          canManageListings: true,
          canManageAuctions: true,
          canManageConsignments: true,
          canManageCollectibleCustomers: true,
          canManageEvidence: true,
          canManageRisk: true,
          canManageIntegrations: true,
          canReadWebhooks: true,
          canManageWebhooks: true
        }
      }
    }
    // TODO: Add in inital roles here
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetEmail(args.token, args.identity);
    }
  },
  sessionData: `id name email role { ${permissionsList.join(" ")} }`
});
var keystone_default = withAuth(
  withWebhooks(
    (0, import_core97.config)({
      db: {
        provider: "postgresql",
        url: databaseURL
      },
      lists: models,
      storage: {
        my_images: {
          kind: "s3",
          type: "image",
          bucketName,
          region,
          accessKeyId,
          secretAccessKey,
          endpoint,
          signed: { expiry: 5e3 },
          forcePathStyle: true
        }
      },
      graphql: {
        // apolloConfig: {
        //   ...armor.protect()
        // },
        // extendGraphqlSchema: (schema) => {
        //   const extendedSchema = extendGraphqlSchema(schema);
        //   return applyMiddleware(extendedSchema,
        //     applyRateLimiting
        //   );
        // }
        extendGraphqlSchema
      },
      ui: {
        // Show the UI only for users who have canAccessDashboard permission
        // (min access scope needed to access Admin UI)
        isAccessAllowed: ({ session }) => permissions.canAccessDashboard({ session }),
        basePath
      },
      session: statelessSessions(sessionConfig)
    })
  )
);

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map
