"use client"

import { setShippingMethod } from "@/features/storefront/lib/data/cart"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message"
import Radio from "@/features/storefront/modules/common/components/radio"
import StepHeader, { StepSection, SummaryBlock, optionBand, optionRow, secondaryPill } from "../step-header"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { RiLoader2Fill } from "@remixicon/react";

interface ShippingOption {
  id: string;
  name: string;
  calculatedAmount: string;
}

interface ShippingProps {
  cart: {
    id: string;
    shippingMethods: {
      shippingOption: {
        id: string;
        name: string;
      };
    }[];
    shippingAddress: any;
    billingAddress: any;
    email: string;
    shipping: string;
  };
  availableShippingMethods: ShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(
    cart?.shippingMethods?.[0]?.shippingOption?.id || null
  )

  const searchParams = useSearchParams() ?? new URLSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "delivery"

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = async () => {
    if (!selectedOption) return

    setIsLoading(true)
    try {
      await setShippingMethod(selectedOption)
      router.push(pathname + "?step=payment", { scroll: false })
    } catch (err: any) {
      setError(err.message || err.toString())
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setSelectedOption(value)
  }

  useEffect(() => {
    setIsLoading(false)
    setError(null)
    setSelectedOption(cart?.shippingMethods?.[0]?.shippingOption?.id || null)
  }, [isOpen, cart?.shippingMethods])

  // The cart model attaches the cheapest option on create, so a method only counts
  // once there is an address to ship to.
  const hasMethod = !!cart?.shippingAddress && (cart?.shippingMethods?.length ?? 0) > 0

  return (
    <StepSection>
      <StepHeader
        step={2}
        title="Delivery"
        done={!isOpen && hasMethod}
        muted={!isOpen && !hasMethod}
        action={
          !isOpen && cart?.shippingAddress && cart?.billingAddress && cart?.email ? (
            <button
              type="button"
              onClick={handleEdit}
              data-testid="edit-delivery-button"
              className={secondaryPill}
            >
              Edit
            </button>
          ) : null
        }
      />
      {isOpen ? (
        <div className="mt-6 space-y-5">
          <div data-testid="delivery-options-container">
            <RadioGroup
              value={selectedOption || ""}
              onValueChange={handleChange}
              className={optionBand}
              aria-label="Shipping method"
            >
              {availableShippingMethods?.map((option) => {
                const isDisabled = false
                const selected = option.id === selectedOption

                return (
                  <div key={option.id} data-testid="delivery-option-radio" className="relative">
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      disabled={isDisabled}
                      className="sr-only"
                    />
                    <Label htmlFor={option.id} className={optionRow(selected, isDisabled)}>
                      <span className="flex min-w-0 items-center gap-3">
                        <Radio checked={selected} />
                        <span className="min-w-0 font-normal">{option.name}</span>
                      </span>
                      <span className="cx-num shrink-0 text-[14px] font-normal">{option.calculatedAmount}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
            {availableShippingMethods?.length === 0 && (
              <p className="text-[14px] text-cx-ink-2">No delivery options for this address</p>
            )}
          </div>

          <div>
            <button
              type="button"
              className="cx-btn w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!selectedOption || isLoading}
              data-testid="submit-delivery-option-button"
            >
              {isLoading && <RiLoader2Fill className="size-4 animate-spin" />}
              Continue to payment
            </button>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
          </div>
        </div>
      ) : (
        cart && hasMethod && (
          <div className="mt-5">
            <SummaryBlock label="Method">
              <p>
                {cart.shippingMethods[0].shippingOption.name}{" "}
                <span className="cx-num text-[13px] text-cx-ink">{cart.shipping}</span>
              </p>
            </SummaryBlock>
          </div>
        )
      )}
    </StepSection>
  )
}

export default Shipping
