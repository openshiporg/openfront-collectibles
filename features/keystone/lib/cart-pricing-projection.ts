/** Store credit records its currency in metadata; it spends only in that currency. */
export function giftCardCurrencyMismatch(metadata: unknown, currencyCode?: string | null): boolean {
  const stored = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).currencyCode : null;
  if (typeof stored !== "string" || !stored || !currencyCode) return false;
  return stored.toUpperCase() !== currencyCode.toUpperCase();
}

export interface DiscountProduct {
  id: string;
  discountable?: boolean;
  isGiftcard?: boolean;
  title?: string;
  productType?: { id: string } | null;
  productCollections?: { id: string }[];
  productTags?: { id: string }[];
}
export interface ProductDiscountCondition {
  type: string; operator: string;
  products?: { id: string }[];
  productTypes?: { id: string }[];
  productCollections?: { id: string }[];
  productTags?: { id: string }[];
}
export interface CartPricingProjection {
  region?: { id: string; taxRate?: number | null; currency?: { code: string; noDivisionCurrency?: boolean } | null } | null;
  lineItems?: { quantity: number; productVariant: { id: string; title?: string; product?: DiscountProduct | null } }[];
  discounts?: { id: string; code?: string; discountRule?: { type: string; value: number; allocation?: string; discountConditions?: ProductDiscountCondition[] } | null }[];
  shippingMethods?: { price?: number | null; shippingOption?: { name: string } | null }[];
  giftCards?: { id?: string; code?: string; balance: number; value?: number; isDisabled?: boolean | null; endsAt?: string | null; metadata?: unknown; region?: { id: string } | null }[];
  billingAddress?: { id: string } | null;
  shippingAddress?: { id: string } | null;
  paymentCollection?: { id: string; paymentSessions?: { isSelected: boolean; isInitiated?: boolean; data?: { status?: string; clientSecret?: string } | null }[] } | null;
}
