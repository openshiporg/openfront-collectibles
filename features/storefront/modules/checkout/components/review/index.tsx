"use client"

import PaymentButton from "../payment-button"
import StepHeader, { StepSection } from "../step-header"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams() ?? new URLSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.giftCard && cart?.giftCard?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart?.shippingAddress &&
    cart?.shippingMethods?.length > 0 &&
    (cart?.paymentCollection || paidByGiftcard)

  return (
    <StepSection>
      <StepHeader step={4} title="Review" muted={!isOpen || !previousStepsCompleted} />
      {isOpen && previousStepsCompleted && (
        <div className="mt-6 space-y-5">
          <div className="flex items-baseline justify-between gap-4 rounded-xl bg-cx-well px-4 py-3">
            <span className="text-[14px] text-cx-ink-2">Order total</span>
            <span className="cx-num text-[18px] text-cx-ink">{cart?.total}</span>
          </div>
          <p className="text-[13px] leading-[20px] text-cx-ink-2">
            Placing the order accepts the store&apos;s terms of sale, returns policy and privacy policy.
          </p>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </StepSection>
  )
}

export default Review
