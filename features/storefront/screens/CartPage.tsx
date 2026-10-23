import CartTemplate from "@/features/storefront/modules/cart/templates"
import { retrieveCart } from "@/features/storefront/lib/data/cart"
import { getUser } from "@/features/storefront/lib/data/user"
import SkeletonCartPage from "@/features/storefront/modules/skeletons/templates/skeleton-cart-page"
import InteractiveLink from "@/features/storefront/modules/common/components/interactive-link"

export const metadata = {
  title: "Cart",
  description: "View your cart",
}

export async function CartPage() {
  const cart = await retrieveCart()
  const user = await getUser()

  return <CartTemplate cart={cart} user={user} />
}

export function CartLoading() {
  return <SkeletonCartPage />
}

export function CartNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] flex-col justify-center gap-5 px-4 py-24 sm:px-6">
      <span className="cx-num text-[13px] text-cx-ink-3">404</span>
      <h1 className="font-cx-serif text-[40px] leading-[44px] tracking-[-0.015em] text-cx-ink">Cart not found</h1>
      <p className="text-[15px] text-cx-ink-2">Clear your cookies and try again.</p>
      <div>
        <InteractiveLink href="/store">Browse all items</InteractiveLink>
      </div>
    </div>
  )
}
