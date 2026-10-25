"use client"

import React, { useEffect, useState, useActionState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox
import { Label } from "@/components/ui/label" // Added Label
import { RiLoader2Fill } from "@remixicon/react"

import useToggleState from "@/features/storefront/lib/hooks/use-toggle-state"
import CountrySelect from "@/features/storefront/modules/checkout/components/country-select"
import Input from "@/features/storefront/modules/common/components/input"
import Modal from "@/features/storefront/modules/common/components/modal"
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button"
import {
  deleteCustomerShippingAddress,
  updateCustomerAddress,
} from "@/features/storefront/lib/data/user"
import { cn } from "@/lib/utils"
import { StorefrontAddress, StorefrontRegion } from "@/features/storefront/types"

type EditAddressProps = {
  region: StorefrontRegion
  address: StorefrontAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
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

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerShippingAddress(address.id)
    setRemoving(false)
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5",
          { "bg-cx-surface/60": isActive }
        )}
        data-testid="address-container"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <h3 className="font-cx-serif text-[18px] leading-[24px] text-cx-ink" data-testid="address-name">
              {address.firstName} {address.lastName}
            </h3>
            {address.isBilling && (
              <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
                <span className="cx-dot bg-cx-accent" aria-hidden="true" />
                Default billing
              </span>
            )}
          </div>
          {address.company && (
            <p className="text-[14px] text-cx-ink-2" data-testid="address-company">
              {address.company}
            </p>
          )}
          <div className="mt-1 flex flex-col text-[14px] leading-6 text-cx-ink-2">
            <span data-testid="address-address">
              {address.address1}
              {address.address2 && <span>, {address.address2}</span>}
            </span>
            <span data-testid="address-city-province">
              {address.city}{address.province && `, ${address.province}`}
            </span>
            <span data-testid="address-postal-country">
              {address.postalCode} {address.country?.iso2?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={open}
            data-testid="address-edit-button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] bg-cx-surface px-4 text-[14px] font-medium text-cx-ink shadow-[0_1px_2px_rgb(26_23_18/0.14)] hover:bg-cx-bg"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={removeAddress}
            disabled={removing}
            data-testid="address-delete-button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] px-3 text-[14px] font-medium text-cx-danger hover:bg-cx-surface disabled:opacity-50"
          >
            {removing ? <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
            {removing ? "Removing" : "Remove"}
          </button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          Edit address
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.firstName || undefined}
                  data-testid="first-name-input"
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.lastName || undefined}
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />
              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address1 || undefined}
                data-testid="address-1-input"
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address2 || undefined}
                data-testid="address-2-input"
              />
              <Input
                label="City"
                name="city"
                required
                autoComplete="locality"
                defaultValue={address.city || undefined}
                data-testid="city-input"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="State / Province"
                  name="province"
                  autoComplete="address-level1"
                  defaultValue={address.province || undefined}
                  data-testid="state-input"
                />
                <Input
                  label="ZIP / Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address.postalCode || undefined}
                  data-testid="postal-code-input"
                />
              </div>
              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address.country?.iso2 || undefined}
                data-testid="country-select"
              />
              <div className="flex items-center gap-x-2 mt-2">
                <Checkbox
                  id="is_billing"
                  name="is_billing"
                  value="true"
                  defaultChecked={!!address.isBilling}
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
                label="Phone"
                name="phone"
                autoComplete="phone"
                defaultValue={address.phone || undefined}
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div className="py-2 text-[13px] text-cx-danger" role="alert">
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="reset"
                onClick={close}
                className="inline-flex min-h-12 items-center justify-center rounded-[2px] px-5 text-[15px] font-medium text-cx-ink-2 hover:bg-cx-well"
                data-testid="cancel-button"
              >
                Cancel
              </button>
              <SubmitButton data-testid="save-button" className="h-12 rounded-[2px] px-6 text-[15px]">Save</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
