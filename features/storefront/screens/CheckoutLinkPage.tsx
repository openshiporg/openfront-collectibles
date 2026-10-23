import { notFound, redirect } from "next/navigation";
import { gql } from "graphql-request";
import { openfrontClient } from "@/features/storefront/lib/config";
import { getUser } from "@/features/storefront/lib/data/user";
import { getAuthHeaders, setCartProof } from "@/features/storefront/lib/data/cookies";
import { updateTag } from "next/cache";
import CheckoutLinkCart, { CheckoutLinkMissing } from "@/features/storefront/modules/checkout/components/checkout-link-cart";

export const metadata = {
  title: "Checkout Link",
  description: "Complete your order via checkout link"
};

interface PageProps {
  searchParams: Promise<{
    cartId?: string;
  }>;
  params: Promise<{
    countryCode: string;
  }>;
}

async function CheckoutLinkContent({ cartId, countryCode }: { cartId: string, countryCode: string }) {
  const user = await getUser();

  if (!user) {
    // This should not happen as the route is protected, but just in case
    redirect(`/${countryCode}/account/login`);
  }

  // Check if cart exists and belongs to user
  const CART_QUERY = gql`
    query GetCart($cartId: ID!) {
      activeCart(cartId: $cartId)
    }
  `;

  let cart;
  try {
    const { activeCart } = await openfrontClient.request(CART_QUERY, { cartId }, await getAuthHeaders());
    cart = activeCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return <CheckoutLinkMissing />;
  }

  if (!cart) {
    return <CheckoutLinkMissing />;
  }

  // Server action to connect cart to user and redirect to checkout
  async function continueToCheckout() {
    'use server';

    // Connect the cart to the logged-in user
    const CONNECT_CART_MUTATION = gql`
      mutation UpdateActiveCart($cartId: ID!, $data: CartUpdateInput!) {
        updateActiveCart(cartId: $cartId, data: $data) {
          id
          user {
            id
            email
          }
        }
      }
    `;

    try {
      await openfrontClient.request(CONNECT_CART_MUTATION, {
        cartId,
        data: {
          email: user.email
        }
      }, await getAuthHeaders());

      const { createActiveCartProof } = await openfrontClient.request(
        gql`mutation CreateActiveCartProof($cartId: ID!) { createActiveCartProof(cartId: $cartId) }`,
        { cartId },
        await getAuthHeaders(),
      );
      await setCartProof(createActiveCartProof);
      updateTag('cart');
    } catch {
      console.error('Error connecting cart to user');
      redirect(`/${countryCode}/cart`);
    }
    redirect(`/${countryCode}/checkout?step=payment`);
  }

  return (
    <CheckoutLinkCart
      cart={cart}
      title="Complete your order"
      testId="checkout-link-page-wrapper"
      actions={
        <form action={continueToCheckout}>
          <button type="submit" data-testid="complete-checkout-button" className="cx-btn w-full sm:w-auto">
            Continue to checkout
          </button>
        </form>
      }
    />
  );
}

export default async function CheckoutLinkPage({ searchParams, params }: PageProps) {
  const { cartId } = await searchParams;
  const { countryCode } = await params;

  if (!cartId) {
    return notFound();
  }

  return <CheckoutLinkContent cartId={cartId} countryCode={countryCode} />;
}
