import { currencyExponent } from '../../lib/minor-units';

// Explicit transport fields selected by Order's virtual views. These are DTOs,
// not native Prisma items, and do not expose provider credential payloads.
export interface OrderLineView {
  id: string; title: string; quantity: number;
  thumbnail?: string | null; sku?: string | null; variantTitle?: string | null;
  formattedUnitPrice?: string | null; formattedTotal?: string | null;
  productData?: unknown; variantData?: unknown;
  moneyAmount?: { amount: number; originalAmount?: number | null } | null;
}
interface ShippingLabelView {
  id: string; trackingNumber?: string | null; trackingUrl?: string | null;
  carrier?: string | null; labelUrl?: string | null;
}
export interface FulfillmentView {
  id: string; createdAt?: string; canceledAt?: string | null;
  shippingLabels?: ShippingLabelView[];
  fulfillmentItems?: { id: string; quantity: number; lineItem: OrderLineView }[];
}
interface PaymentSessionView {
  id: string; amount: number; isSelected: boolean; paymentProvider?: { name: string } | null;
}
type AcceptedOrderItem = { metadata: unknown; taxRate: number | null };
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
function snapshot(item: AcceptedOrderItem) { return object(item.metadata) && object(item.metadata.commercialSnapshot) ? item.metadata.commercialSnapshot : {}; }
export function acceptedOrderCurrency(item: AcceptedOrderItem, currency: OrderViewProjection['currency']) {
  const stored = snapshot(item).currency;
  const code = typeof stored === 'string' ? stored : currency?.code;
  if (!code) throw new Error('Accepted order currency is unavailable');
  const exponent = currencyExponent(code);
  if (exponent !== 0 && exponent !== 2) throw new Error('Unsupported accepted currency precision');
  return { code: code.toUpperCase(), divisor: 10 ** exponent };
}
export function acceptedOrderTaxRate(item: AcceptedOrderItem) {
  const policy = snapshot(item).tax;
  const rate = object(policy) ? policy.rate : item.taxRate;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Accepted order tax policy is unavailable');
  return rate;
}
export function acceptedOrderDiscounts(item: AcceptedOrderItem, legacy: OrderViewProjection['discounts']): NonNullable<OrderViewProjection['discounts']> {
  const stored = snapshot(item).discounts;
  if (stored === undefined) { if (legacy?.length) throw new Error('Accepted order discount policy is unavailable'); return []; }
  if (!Array.isArray(stored) || stored.length > 100) throw new Error('Invalid accepted discount policy');
  return stored.map(value => {
    if (!object(value) || !object(value.discountRule)) throw new Error('Invalid accepted discount policy');
    const rule = value.discountRule;
    if (typeof rule.type !== 'string' || !['fixed', 'percentage', 'free_shipping'].includes(rule.type) || typeof rule.value !== 'number' || !Number.isSafeInteger(rule.value) || rule.value < 0 || (rule.type === 'percentage' && rule.value > 100)) throw new Error('Invalid accepted discount policy');
    return { discountRule: { type: rule.type, value: rule.value, ...(typeof rule.allocation === 'string' ? { allocation: rule.allocation } : {}) } };
  });
}

export interface OrderViewProjection {
  region?: { taxRate?: number | null; currency?: { code: string; noDivisionCurrency?: boolean } | null } | null;
  currency?: { code: string; symbol: string; noDivisionCurrency?: boolean } | null;
  lineItems?: OrderLineView[];
  shippingMethods?: { price?: number | null }[];
  discounts?: { discountRule?: { type: string; value: number; allocation?: string } | null }[];
  fulfillments?: FulfillmentView[];
  payments?: { id: string; amount: number; status: string; createdAt?: string; data?: { provider?: string; cardLast4?: string } | null; paymentCollection?: { paymentSessions?: PaymentSessionView[] } | null }[];
  accountLineItems?: { id: string; paymentStatus: string; amount?: number | null }[];
}
