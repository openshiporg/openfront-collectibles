export interface DiscountProduct {
  id: string;
  discountable?: boolean;
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
  giftCards?: { balance: number; value?: number }[];
  billingAddress?: { id: string } | null;
  shippingAddress?: { id: string } | null;
  paymentCollection?: { id: string; paymentSessions?: { isSelected: boolean; isInitiated?: boolean; data?: { status?: string; clientSecret?: string } | null }[] } | null;
}
