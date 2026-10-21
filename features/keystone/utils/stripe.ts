import Stripe from 'stripe';

// Unconfigured installations must build and render without constructing a
// payment client. Actual operations request it only after their policy checks.
export default function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured');
  return new Stripe(key, { apiVersion: '2025-05-28.basil', timeout: 15_000, maxNetworkRetries: 0 });
}
