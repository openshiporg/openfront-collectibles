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
  region?: { id: string; taxRate?: number | null; taxRates?: { code?: string | null; rate?: number | null }[] | null; currency?: { code: string; noDivisionCurrency?: boolean } | null } | null;
  lineItems?: { quantity: number; productVariant: { id: string; title?: string; product?: DiscountProduct | null } }[];
  discounts?: { id: string; code?: string; discountRule?: { type: string; value: number; allocation?: string; discountConditions?: ProductDiscountCondition[] } | null }[];
  shippingMethods?: { price?: number | null; shippingOption?: { name: string } | null }[];
  giftCards?: { id?: string; code?: string; balance: number; value?: number; isDisabled?: boolean | null; endsAt?: string | null; metadata?: unknown; region?: { id: string } | null }[];
  billingAddress?: { id: string } | null;
  shippingAddress?: { id?: string; province?: string | null; country?: { iso2?: string | null } | null } | null;
  paymentCollection?: { id: string; paymentSessions?: { isSelected: boolean; isInitiated?: boolean; data?: { status?: string; clientSecret?: string } | null }[] } | null;
}

// Shoppers type the state either way ("TX" or "Texas"); tax rates are keyed by the code.
const STATE_CODES: Record<string, string> = { "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR", "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE", "DISTRICT OF COLUMBIA": "DC", "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID", "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS", "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD", "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS", "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK", "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT", "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY", "PUERTO RICO": "PR", "ALBERTA": "AB", "BRITISH COLUMBIA": "BC", "MANITOBA": "MB", "NEW BRUNSWICK": "NB", "NEWFOUNDLAND AND LABRADOR": "NL", "NOVA SCOTIA": "NS", "ONTARIO": "ON", "PRINCE EDWARD ISLAND": "PE", "QUEBEC": "QC", "SASKATCHEWAN": "SK", "NORTHWEST TERRITORIES": "NT", "NUNAVUT": "NU", "YUKON": "YT" };

/**
 * The sales-tax rate for where the order ships. A region tax rate whose code is the shipping state or
 * province (for example "TX") is used for that destination; otherwise the region's own rate applies.
 * Rates are fractions (0.0825 = 8.25%), the same unit as Region.taxRate.
 */
export function destinationTaxRate(cart: Pick<CartPricingProjection, "region" | "shippingAddress">): number {
  const typed = String(cart.shippingAddress?.province || "").trim().replace(/\s+/g, " ").toUpperCase();
  const province = STATE_CODES[typed] || typed;
  if (province) {
    const match = (cart.region?.taxRates || []).find(
      (rate) => String(rate?.code || "").trim().toUpperCase() === province && typeof rate?.rate === "number"
    );
    if (match && Number.isFinite(match.rate) && match.rate! >= 0 && match.rate! <= 1) return match.rate!;
  }
  return cart.region?.taxRate || 0;
}
