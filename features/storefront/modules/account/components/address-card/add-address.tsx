"use client"

import { Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useActionState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

import useToggleState from "@/features/storefront/lib/hooks/use-toggle-state"
import CountrySelect from "@/features/storefront/modules/checkout/components/country-select"
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button"
import { createCustomerAddress } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { cxInput } from "../account-ui"

const AddAddress = ({
  region,
}: {
  region: any
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(createCustomerAddress, { // Updated function name
    // isDefaultShipping: addresses.length === 0, // Removed, handled by is_billing form field
    success: false,
    error: null,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <Dialog open={state} onOpenChange={(isOpen) => isOpen ? open() : close()}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cx-btn"
          onClick={open}
          data-testid="add-address-button"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add address
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-cx-line bg-cx-bg sm:max-w-xl" data-testid="add-address-modal">
        <DialogHeader>
          <DialogTitle className="font-cx-serif text-[24px] font-normal leading-[28px] text-cx-ink">Add address</DialogTitle>
          <DialogDescription className="sr-only">New shipping or billing address</DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <div className="flex flex-col gap-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="First name"
                aria-label="First name"
                className={cxInput}
                name="first_name"
                required
                autoComplete="given-name"
                data-testid="first-name-input"
              />
              <Input
                placeholder="Last name"
                aria-label="Last name"
                className={cxInput}
                name="last_name"
                required
                autoComplete="family-name"
                data-testid="last-name-input"
              />
            </div>
            <Input
              placeholder="Company"
              aria-label="Company"
              className={cxInput}
              name="company"
              autoComplete="organization"
              data-testid="company-input"
            />
            <Input
              placeholder="Address"
              aria-label="Address"
              className={cxInput}
              name="address_1"
              required
              autoComplete="address-line1"
              data-testid="address-1-input"
            />
            <Input
              placeholder="Apartment, suite, etc."
              aria-label="Apartment, suite, etc."
              className={cxInput}
              name="address_2"
              autoComplete="address-line2"
              data-testid="address-2-input"
            />
            <Input
              placeholder="City"
              aria-label="City"
              className={cxInput}
              name="city"
              required
              autoComplete="locality"
              data-testid="city-input"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="State / Province"
                aria-label="State / Province"
                className={cxInput}
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <Input
                placeholder="ZIP / Postal code"
                aria-label="ZIP / Postal code"
                className={cxInput}
                name="postal_code"
                required
                autoComplete="postal-code"
                data-testid="postal-code-input"
              />
            </div>
            <CountrySelect
              region={region}
              name="country_code"
              required
              autoComplete="country"
              data-testid="country-select"
            />
            <div className="flex items-center gap-x-2 mt-2">
              <Checkbox
                id="is_billing"
                name="is_billing"
                value="true"
                data-testid="billing-checkbox"
              />
              <Label
                htmlFor="is_billing"
                className="text-[14px] font-normal text-cx-ink"
                data-testid="billing-label"
              >
                Set as default billing address
              </Label>
            </div>
            <Input
              placeholder="Phone"
              aria-label="Phone"
              className={cxInput}
              name="phone"
              autoComplete="tel"
              type="tel"
              data-testid="phone-input"
            />
          </div>
          {formState.error && (
            <div
              className="py-2 text-[13px] text-cx-danger"
              role="alert"
              data-testid="address-error"
            >
              {formState.error}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <button
              type="reset"
              onClick={close}
              className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-[15px] font-medium text-cx-ink-2 hover:bg-cx-well"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <SubmitButton data-testid="save-button" className="h-12 rounded-full px-6 text-[15px]">Save</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAddress
