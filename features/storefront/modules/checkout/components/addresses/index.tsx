"use client";

import { setAddresses } from "@/features/storefront/lib/data/cart";
import compareAddresses from "@/features/storefront/lib/util/compare-addresses";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import BillingAddress from "../billing-address";
import ErrorMessage from "../error-message";
import ShippingAddress from "../shipping-address";
import StepHeader, { StepSection, SummaryBlock, secondaryPill } from "../step-header";
import { RiLoader2Fill } from "@remixicon/react";

const Addresses = ({
  cart,
  customer,
}: {
  cart: any | null;
  customer: any | null;
}) => {

  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  // A fresh cart has no address summary to collapse. Keep the address form open
  // until both server-owned cart relationships exist, regardless of a missing
  // or stale step query parameter.
  const isOpen =
    searchParams?.get("step") === "address" ||
    !cart?.shippingAddress ||
    !cart?.billingAddress;

  const [sameAsBilling, setSameAsBilling] = useState(
    cart?.shippingAddress && cart?.billingAddress
      ? compareAddresses(cart?.shippingAddress, cart?.billingAddress)
      : true
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggleSameAsBilling = () => setSameAsBilling((prev) => !prev);

  const handleEdit = () => {
    router.push(pathname + "?step=address");
  };

  const params = useParams();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Check for required fields before calling setAddresses
    if (!formData.get("shippingAddress.countryCode")) {
      setError("Please select a country.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("shippingAddress.firstName")) {
      setError("Please enter your first name.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("shippingAddress.lastName")) {
      setError("Please enter your last name.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("shippingAddress.address1")) {
      setError("Please enter your address.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("shippingAddress.city")) {
      setError("Please enter your city.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("shippingAddress.postalCode")) {
      setError("Please enter your postal code.");
      setIsLoading(false);
      return;
    }

    if (!formData.get("email")) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await setAddresses(null, formData);

      // If successful, redirect client-side
      if (result && typeof result === 'object' && 'success' in result && result.success === true) {
        const countryCode = params?.countryCode as string;
        router.push(`/${countryCode}/checkout?step=delivery`);
        return;
      }

      // Otherwise set the error message
      if (typeof result === 'string') {
        setError(result);
      } else if (result && typeof result === 'object' && 'message' in result) {
        setError(result.message as string);
      } else {
        setError("An unexpected error occurred.");
      }
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const addressLines = (address: any) => (
    <>
      <p className="text-cx-ink">
        {address?.firstName} {address?.lastName}
      </p>
      <p>
        {address?.address1} {address?.address2}
      </p>
      <p>
        {address?.city}
        {address?.province && `, ${address.province}`}
      </p>
      <p className="cx-num text-[13px]">
        {address?.postalCode} {address?.countryCode?.toUpperCase()}
      </p>
    </>
  );

  return (
    <StepSection>
      <StepHeader
        step={1}
        title="Shipping address"
        done={!isOpen}
        action={
          !isOpen && cart?.shippingAddress ? (
            <button
              type="button"
              onClick={handleEdit}
              data-testid="edit-address-button"
              className={secondaryPill}
            >
              Edit
            </button>
          ) : null
        }
      />
      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
            countryCode={params?.countryCode as string}
          />

          {!sameAsBilling && (
            <div className="mt-8 border-t border-cx-line pt-6">
              <h3 className="pb-5 font-cx-serif text-[22px] leading-[26px] text-cx-ink">Billing address</h3>
              <BillingAddress cart={cart} />
            </div>
          )}
          <button
            className="cx-btn mt-6 w-full sm:w-auto"
            data-testid="submit-address-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <RiLoader2Fill className="size-4 animate-spin" />}
            Continue to delivery
          </button>
          <ErrorMessage error={error} data-testid="address-error-message" />
        </form>
      ) : (
        <div className="mt-5">
          {cart && cart.shippingAddress ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <SummaryBlock label="Ship to" data-testid="shipping-address-summary">
                {addressLines(cart.shippingAddress)}
              </SummaryBlock>
              <SummaryBlock label="Contact" data-testid="shipping-contact-summary">
                {cart.shippingAddress.phone && <p className="cx-num text-[13px]">{cart.shippingAddress.phone}</p>}
                <p className="break-all">{cart.email}</p>
              </SummaryBlock>
              <SummaryBlock label="Billing" data-testid="billing-address-summary">
                {sameAsBilling ? <p>Same as shipping</p> : addressLines(cart.billingAddress)}
              </SummaryBlock>
            </div>
          ) : (
            <RiLoader2Fill className="size-5 animate-spin text-cx-ink-3" />
          )}
        </div>
      )}
    </StepSection>
  );
};

export default Addresses;
