import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div className="flex min-h-[50vh] flex-col items-start justify-center gap-6 py-16" data-testid="empty-cart-message">
      <h1 className="font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px]">
        Your cart is empty
      </h1>
      <LocalizedClientLink href="/store" className="cx-btn">
        Browse all items
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
