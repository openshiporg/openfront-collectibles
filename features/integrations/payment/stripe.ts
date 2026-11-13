import Stripe from "stripe";

type CreatePaymentInput = {
  cart?: any;
  amount: number;
  currency: string;
};

type PaymentOperationInput = {
  paymentId: string;
  amount?: number;
  idempotencyKey?: string;
  currency?: string;
};

type PaymentWebhookInput = {
  event: any;
  headers: Record<string, string> & { __rawBody?: string };
};

const getStripeClient = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("Stripe secret key not configured");
  }
  return new Stripe(stripeKey, {
    apiVersion: "2025-05-28.basil",
  });
};

export async function createPaymentFunction({ cart, amount, currency }: CreatePaymentInput) {
  const stripe = getStripeClient();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: cart?.id ? { cartId: cart.id } : undefined,
  }, cart?.id ? { idempotencyKey: `cart:${cart.id}:${amount}:${currency.toLowerCase()}` } : undefined);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function capturePaymentFunction({ paymentId, amount, idempotencyKey }: PaymentOperationInput) {
  const stripe = getStripeClient();

  const paymentIntent = await stripe.paymentIntents.capture(
    paymentId,
    { ...(amount ? { amount_to_capture: amount } : {}) },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    data: paymentIntent,
  };
}

/**
 * A 4xx answer means Stripe did not make the refund (declined, already refunded, bad amount): final for this key.
 * An idempotency_error (the key was first used with other parameters), a 409 conflict, a 5xx or a dropped
 * connection leave the outcome unknown, so they are not marked declined.
 */
export function isDefinitiveStripeDecline(error: any): boolean {
  const status = Number(error?.statusCode);
  if (!(status >= 400 && status < 500) || status === 409) return false;
  return error?.rawType !== "idempotency_error" && error?.type !== "StripeIdempotencyError";
}

export async function refundPaymentFunction({ paymentId, amount, idempotencyKey }: PaymentOperationInput) {
  const stripe = getStripeClient();

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create({
      payment_intent: paymentId,
      ...(amount ? { amount } : {}),
    }, idempotencyKey ? { idempotencyKey } : undefined);
  } catch (error) {
    if (isDefinitiveStripeDecline(error)) Object.assign(error as object, { providerDeclined: true });
    throw error;
  }

  return {
    status: refund.status,
    amount: refund.amount,
    currency: refund.currency,
    data: refund,
  };
}

export async function getPaymentStatusFunction({ paymentId, includeRefunds }: PaymentOperationInput & { includeRefunds?: boolean }) {
  const stripe = getStripeClient();

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
  // Refund reconciliation asks what the processor already gave back; checkout does not need the extra call.
  const refunds = includeRefunds
    ? (await stripe.refunds.list({ payment_intent: paymentId, limit: 100 })).data
        .filter((refund) => refund.status !== "failed" && refund.status !== "canceled")
        .map((refund) => ({ id: refund.id, amount: refund.amount, status: String(refund.status) }))
    : undefined;

  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received || paymentIntent.amount,
    currency: paymentIntent.currency,
    data: paymentIntent,
    ...(refunds ? { refunds } : {}),
  };
}

export async function generatePaymentLinkFunction({ paymentId }: PaymentOperationInput) {
  return `https://dashboard.stripe.com/payments/${paymentId}`;
}

export async function handleWebhookFunction({ event, headers }: PaymentWebhookInput) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  const stripe = getStripeClient();

  try {
    if (!headers.__rawBody) throw new Error('Raw webhook body is required');
    const stripeEvent = stripe.webhooks.constructEvent(
      headers.__rawBody,
      headers['stripe-signature'],
      webhookSecret
    );

    return {
      isValid: true,
      event: stripeEvent,
      type: stripeEvent.type,
      resource: stripeEvent.data.object,
    };
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
  }
} 