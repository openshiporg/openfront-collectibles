import type { ReactNode } from "react"

import Thumbnail from "@/features/storefront/modules/products/components/thumbnail"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

export function CheckoutLinkMissing() {
  return (
    <div className="flex min-h-[320px] flex-col justify-center gap-2">
      <h2 className="flex items-baseline gap-2 font-cx-serif text-[28px] leading-[32px] text-cx-ink">
        <StatusDot tone="danger" />
        Cart not found
      </h2>
      <p className="text-[15px] text-cx-ink-2">This checkout link has expired or the cart no longer exists.</p>
    </div>
  )
}

/** The cart behind a checkout link: reference, totals, items and the actions. */
export default function CheckoutLinkCart({
  cart,
  title,
  actions,
  testId,
}: {
  cart: any
  title: string
  actions: ReactNode
  testId: string
}) {
  const numberOfLines =
    cart.lineItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) ?? 0
  const numberOfProducts = cart.lineItems?.length ?? 0

  return (
    <div className="w-full space-y-6" data-testid={testId}>
      <h1 className="font-cx-display font-extrabold text-[32px] leading-[36px] tracking-[-0.015em] text-cx-ink sm:text-[40px] sm:leading-[44px]">
        {title}
      </h1>

      <div className="space-y-5 rounded-[2px] bg-cx-surface p-4 ring-1 ring-cx-line sm:p-6" data-testid="cart-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="cx-num text-[13px] uppercase text-cx-ink-2">Cart {cart.id.slice(-8).toUpperCase()}</p>
          <p className="cx-num text-[22px] text-cx-ink" data-testid="cart-total">{cart.total}</p>
        </div>
        <dl className="cx-num grid grid-cols-3 gap-3 rounded-[2px] bg-cx-well px-4 py-3 text-[13px]">
          <div>
            <dt className="cx-label">Subtotal</dt>
            <dd className="text-cx-ink" data-testid="cart-subtotal">{cart.subtotal}</dd>
          </div>
          <div>
            <dt className="cx-label">Shipping</dt>
            <dd className="text-cx-ink" data-testid="cart-shipping">{cart.shipping}</dd>
          </div>
          <div>
            <dt className="cx-label">Items</dt>
            <dd className="text-cx-ink">{numberOfLines}</dd>
          </div>
        </dl>

        {cart.lineItems && cart.lineItems.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cart.lineItems.slice(0, 3).map((item: any) => (
              <li key={item.id} className="flex flex-col gap-2" data-testid="cart-item">
                <Thumbnail thumbnail={item.thumbnail} images={[]} size="full" />
                <p className="text-[13px] leading-[18px]">
                  <span className="font-cx-serif text-[15px] text-cx-ink" data-testid="item-title">
                    {item.title}
                  </span>{" "}
                  <span className="cx-num text-cx-ink-3">
                    × <span data-testid="item-quantity">{item.quantity}</span>
                  </span>
                </p>
              </li>
            ))}
            {numberOfProducts > 3 && (
              <li className="flex aspect-square items-center justify-center rounded-[2px] bg-cx-well">
                <span className="cx-num text-[14px] text-cx-ink-2">+{numberOfLines - 3}</span>
              </li>
            )}
          </ul>
        )}

        <div className="flex flex-col gap-3 border-t border-cx-line pt-5 sm:flex-row sm:justify-end">{actions}</div>
      </div>
    </div>
  )
}
