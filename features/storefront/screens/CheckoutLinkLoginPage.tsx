import { notFound, redirect } from "next/navigation";
import { gql } from "graphql-request";
import { openfrontClient } from "@/features/storefront/lib/config";
import CheckoutLinkCart, { CheckoutLinkMissing } from "@/features/storefront/modules/checkout/components/checkout-link-cart";
import Link from "next/link";

export const metadata = {
  title: "Complete Your Order",
  description: "Sign in to complete your order via checkout link"
};

interface PageProps {
  searchParams: Promise<{
    cartId?: string;
  }>;
  params: Promise<{
    countryCode: string;
  }>;
}

async function GuestCheckoutLinkContent({ cartId, countryCode }: { cartId: string, countryCode: string }) {

  // Check if cart exists
  const CART_QUERY = gql`
    query GetCart($cartId: ID!) {
      activeCart(cartId: $cartId)
    }
  `;

  let cart;
  try {
    const { activeCart } = await openfrontClient.request(CART_QUERY, { cartId });
    cart = activeCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return <CheckoutLinkMissing />;
  }

  if (!cart) {
    return <CheckoutLinkMissing />;
  }

  const returnUrl = encodeURIComponent(`/${countryCode}/account/checkout-link?cartId=${cartId}`);

  return (
    <CheckoutLinkCart
      cart={cart}
      title="Complete your order"
      testId="guest-checkout-link-page-wrapper"
      actions={
        <>
          <Link
            href={`/${countryCode}/account?view=register&returnUrl=${returnUrl}`}
            className="inline-flex min-h-12 items-center justify-center rounded-[2px] border border-cx-line px-5 text-[15px] font-medium text-cx-ink hover:bg-cx-well"
          >
            Create account
          </Link>
          <Link
            href={`/${countryCode}/account?view=login&returnUrl=${returnUrl}`}
            className="cx-btn"
            data-testid="sign-in-to-complete-button"
          >
            Sign in to complete order
          </Link>
        </>
      }
    />
  );
}

export default async function GuestCheckoutLinkPage({ searchParams, params }: PageProps) {
  const { cartId } = await searchParams;
  const { countryCode } = await params;

  if (!cartId) {
    return notFound();
  }

  return <GuestCheckoutLinkContent cartId={cartId} countryCode={countryCode} />;
}
