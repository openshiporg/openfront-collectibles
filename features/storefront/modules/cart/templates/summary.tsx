"use client"

import CartTotals from "@/features/storefront/modules/common/components/cart-totals"
import DiscountCode from "@/features/storefront/modules/checkout/components/discount-code"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import LinkStatus from "@/features/storefront/modules/common/components/link-status"

type PromotionInfo = {
  code: string;
};

type RegionInfoForSummary = {
  id: string;
  currencyCode: string;
};

type CartSummary = {
  id: string;
  checkoutStep?: string | null;
  subtotal?: number | null;
  discountTotal?: number | null;
  shippingTotal?: number | null;
  taxTotal?: number | null;
  total?: number | null;
  promotions?: PromotionInfo[] | null;
  discounts?: any[];
  giftCards?: any[];
  region?: RegionInfoForSummary | null;
  currencyCode?: string;
  lineItems?: any[];
} | null;

type SummaryProps = {
  cart: CartSummary;
};

const Summary = ({ cart }: SummaryProps) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-cx-surface p-5 ring-1 ring-cx-line sm:p-6">
      <h2 className="font-cx-serif text-[24px] leading-[28px] text-cx-ink">Summary</h2>
      {cart && <DiscountCode cart={cart} />}
      <CartTotals data={cart} />
      <LocalizedClientLink
        href={`/checkout?step=${cart?.checkoutStep ?? 'address'}`}
        data-testid="checkout-button"
        className="cx-btn w-full"
      >
        <LinkStatus />
        Go to checkout
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
