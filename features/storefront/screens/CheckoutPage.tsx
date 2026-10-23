import { redirect } from "next/navigation";
import Wrapper from "@/features/storefront/modules/checkout/components/payment-wrapper";
import CheckoutForm from "@/features/storefront/modules/checkout/templates/checkout-form";
import CheckoutSummary from "@/features/storefront/modules/checkout/templates/checkout-summary";
import { retrieveCart } from "@/features/storefront/lib/data/cart";
import { getUser } from "@/features/storefront/lib/data/user";
import React from "react"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { ArrowLeft } from "lucide-react"
import CollectiblesShell from "@/features/storefront/modules/layout/components/collectibles-shell"
import Logo from "@/features/storefront/modules/layout/components/logo"
import InteractiveLink from "@/features/storefront/modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata = {
  title: "Checkout",
};

export async function CheckoutPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params;
  const cart = await retrieveCart();

  // Checkout needs something to buy: no cart or an empty one goes back to the cart page.
  if (!cart || !cart.lineItems?.length) {
    redirect(`/${countryCode}/cart`);
  }

  const customer = await getUser();

  return (
    <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-6 px-4 pb-20 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-12 lg:gap-y-8">
      <h1 className="font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px] lg:col-span-2">
        Checkout
      </h1>
      <div className="min-w-0">
        <Wrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </Wrapper>
      </div>
      <div className="min-w-0 lg:row-start-2 lg:col-start-2">
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  );
}

export function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CollectiblesShell>
      <header className="border-b border-cx-line bg-cx-bg">
        <nav className="mx-auto grid h-16 w-full max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <LocalizedClientLink
            href="/cart"
            className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-cx-ink-2 hover:bg-cx-well hover:text-cx-ink"
            data-testid="back-to-cart-link"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Back to cart</span>
            <span className="sm:hidden">Cart</span>
          </LocalizedClientLink>
          <div className="flex min-w-0 justify-center">
            <Logo />
          </div>
          <div aria-hidden="true" />
        </nav>
      </header>
      <div className="relative flex-1" data-testid="checkout-container">{children}</div>
    </CollectiblesShell>
  )
}

export const NotFoundMetadata: Metadata = {
  title: "Page not found",
}

export function CheckoutNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] flex-col justify-center gap-5 px-4 py-24 sm:px-6">
      <span className="cx-num text-[13px] text-cx-ink-3">404</span>
      <h1 className="font-cx-serif text-[40px] leading-[44px] tracking-[-0.015em] text-cx-ink">Page not found</h1>
      <div>
        <InteractiveLink href="/cart">Back to cart</InteractiveLink>
      </div>
    </div>
  )
}
