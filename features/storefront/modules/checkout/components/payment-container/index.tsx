import { RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@/features/storefront/modules/common/components/radio"

import { isManual } from "@/features/storefront/lib/constants"
import SkeletonCardDetails from "@/features/storefront/modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <div
      className={cn(
        "mb-1.5 flex cursor-pointer flex-col gap-y-2 rounded-[12px] px-4 py-3 text-[15px] text-cx-ink",
        {
          "bg-cx-surface shadow-[0_1px_2px_rgb(26_23_18/0.14),0_0_0_0.5px_rgb(26_23_18/0.1)]":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <RadioGroupItem
        key={paymentProviderId}
        value={paymentProviderId}
        disabled={disabled}
        id={paymentProviderId}
      />
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <p className="text-[15px]">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </p>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden sm:block" />
          )}
        </div>
        <span className="justify-self-end text-cx-ink-2">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="sm:hidden text-[10px]" />
      )}
      {children}
    </div>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#1a1712",
          "::placeholder": {
            color: "#8c8477",
          },
        },
      },
      classes: {
        base: "block h-12 w-full appearance-none rounded-xl border border-cx-line bg-cx-surface px-4 pt-3.5 pb-1 transition-colors hover:border-cx-ink-3",
      },
      // Hide postal code since we already collect it in the billing address form
      hidePostalCode: true,
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <p className="mb-1.5 text-[13px] font-medium text-cx-ink-2">
              Card details
            </p>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          /* TODO: [Refactor Alignment] SkeletonCardDetails component usage commented out as it's not present in the old storefront. Re-evaluate integration later. */
          null
        ))}
    </PaymentContainer>
  )
}
