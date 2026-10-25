import ItemsPreviewTemplate from "@/features/storefront/modules/cart/templates/preview"
import DiscountCode from "@/features/storefront/modules/checkout/components/discount-code"
import CartTotals from "@/features/storefront/modules/common/components/cart-totals"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const count = cart?.lineItems?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0

  return (
    <aside className="lg:sticky lg:top-8">
      <div className="flex flex-col gap-5 rounded-[2px] bg-cx-surface p-4 ring-1 ring-cx-line sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-cx-serif text-[24px] leading-[28px] text-cx-ink">In your cart</h2>
          <span className="cx-num text-[13px] text-cx-ink-3">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
        <ItemsPreviewTemplate region={cart?.region} items={cart?.lineItems} />
        <DiscountCode cart={cart} />
        <div className="border-t border-cx-line pt-4">
          <CartTotals data={cart} shippingPending={!cart?.shippingAddress} />
        </div>
      </div>
    </aside>
  )
}

export default CheckoutSummary
