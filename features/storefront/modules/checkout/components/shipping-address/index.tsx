import React, { useState, useEffect, useMemo } from "react";
import Checkbox from "@/features/storefront/modules/common/components/checkbox";
import AddressSelect from "../address-select";
import CountrySelect from "../country-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const cxInputClass =
  "h-12 rounded-[2px] border-cx-line bg-cx-surface px-4 text-[15px] text-cx-ink shadow-none placeholder:text-cx-ink-3 hover:border-cx-ink-3 focus-visible:border-cx-accent focus-visible:ring-2 focus-visible:ring-cx-accent/25"

/** Labelled checkout field: visible label above a 48px input. */
export function CxField({
  label,
  id,
  className,
  required,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  const generated = React.useId()
  const fieldId = id || `${props.name}-${generated}`
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className || ""}`}>
      <Label htmlFor={fieldId} className="text-[13px] font-medium leading-[18px] text-cx-ink-2">
        {label}
        {required && <span className="text-cx-ink-3"> *</span>}
      </Label>
      <Input id={fieldId} required={required} className={cxInputClass} {...props} />
    </div>
  )
}

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  countryCode,
}: {
  customer: any | null;
  cart: any | null;
  checked: boolean;
  onChange: () => void;
  countryCode: string | null;
}) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    "shippingAddress.firstName": cart?.shippingAddress?.firstName || "",
    "shippingAddress.lastName": cart?.shippingAddress?.lastName || "",
    "shippingAddress.address1": cart?.shippingAddress?.address1 || "",
    "shippingAddress.company": cart?.shippingAddress?.company || "",
    "shippingAddress.postalCode": cart?.shippingAddress?.postalCode || "",
    "shippingAddress.city": cart?.shippingAddress?.city || "",
    "shippingAddress.countryCode":
      cart?.shippingAddress?.country?.iso2 || countryCode || "",
    "shippingAddress.province": cart?.shippingAddress?.province || "",
    email: cart?.email || customer?.email || "",
    "shippingAddress.phone":
      cart?.shippingAddress?.phone || customer?.phone || "",
  });

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c: any) => c.iso2),
    [cart?.region]
  );

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses?.filter(
        (a: any) => a.country?.iso2 && countriesInRegion?.includes(a.country.iso2)
      ),
    [customer?.addresses, countriesInRegion]
  );

  useEffect(() => {
    setFormData({
      "shippingAddress.firstName": cart?.shippingAddress?.firstName || "",
      "shippingAddress.lastName": cart?.shippingAddress?.lastName || "",
      "shippingAddress.address1": cart?.shippingAddress?.address1 || "",
      "shippingAddress.company": cart?.shippingAddress?.company || "",
      "shippingAddress.postalCode": cart?.shippingAddress?.postalCode || "",
      "shippingAddress.city": cart?.shippingAddress?.city || "",
      "shippingAddress.countryCode":
        cart?.shippingAddress?.country?.iso2 ||
        countryCode ||
        cart?.region?.countries?.[0]?.iso2 ||
        "",
      "shippingAddress.province": cart?.shippingAddress?.province || "",
      email: cart?.email || customer?.email || "",
      "shippingAddress.phone":
        cart?.shippingAddress?.phone || customer?.phone || "",
    });
  }, [cart, countryCode, customer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressSelect = (address: any) => {
    if (!address) return;

    setSelectedAddressId(address.id);
    setFormData((prev) => ({
      ...prev,
      "shippingAddress.firstName": address.firstName || "",
      "shippingAddress.lastName": address.lastName || "",
      "shippingAddress.address1": address.address1 || "",
      "shippingAddress.company": address.company || "",
      "shippingAddress.postalCode": address.postalCode || "",
      "shippingAddress.city": address.city || "",
      "shippingAddress.countryCode": address.country?.iso2 || countryCode || "",
      "shippingAddress.province": address.province || "",
      "shippingAddress.phone": address.phone || prev["shippingAddress.phone"],
    }));
  };

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          <p className="cx-label">Saved addresses</p>
          <AddressSelect
            addresses={addressesInRegion}
            cart={cart}
            onSelect={handleAddressSelect}
          />
        </div>
      )}
      <input
        type="hidden"
        name="selectedAddressId"
        value={selectedAddressId || ""}
      />
      <input
        type="hidden"
        name="hasModifiedFields"
        value={""}
      />
      <div className="grid gap-4">
        {/* First name and Last name - always together */}
        <div className="grid grid-cols-2 gap-4">
          <CxField
            label="First name"
            name="shippingAddress.firstName"
            autoComplete="given-name"
            value={formData["shippingAddress.firstName"]}
            onChange={handleChange}
            required
          />
          <CxField
            label="Last name"
            name="shippingAddress.lastName"
            autoComplete="family-name"
            value={formData["shippingAddress.lastName"]}
            onChange={handleChange}
            required
          />
        </div>

        {/* Address - full width on mobile, but can be 2 columns on larger screens */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CxField
            label="Address"
            name="shippingAddress.address1"
            autoComplete="address-line1"
            value={formData["shippingAddress.address1"]}
            onChange={handleChange}
            required
            className="sm:col-span-1"
          />
          <CxField
            label="Company"
            name="shippingAddress.company"
            value={formData["shippingAddress.company"]}
            onChange={handleChange}
            autoComplete="organization"
            className="sm:col-span-1"
          />
        </div>

        {/* City and State - together on mobile and desktop */}
        <div className="grid grid-cols-2 gap-4">
          <CxField
            label="City"
            name="shippingAddress.city"
            autoComplete="address-level2"
            value={formData["shippingAddress.city"]}
            onChange={handleChange}
            required
          />
          <CxField
            label="State / Province"
            name="shippingAddress.province"
            autoComplete="address-level1"
            value={formData["shippingAddress.province"]}
            onChange={handleChange}
          />
        </div>

        {/* ZIP and Country - together on mobile, but can be 2 columns on larger screens */}
        <div className="grid grid-cols-2 gap-4">
          <CxField
            label="ZIP / Postal code"
            name="shippingAddress.postalCode"
            autoComplete="postal-code"
            value={formData["shippingAddress.postalCode"]}
            onChange={handleChange}
            required
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country" className="text-[13px] font-medium leading-[18px] text-cx-ink-2">
              Country <span className="text-cx-ink-3">*</span>
            </Label>
            <CountrySelect
              id="country"
              name="shippingAddress.countryCode"
              region={cart?.region}
              value={formData["shippingAddress.countryCode"]}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>
      <div className="my-5">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CxField
            label="Email"
            id="email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        <CxField
            label="Phone"
            id="phone"
            name="shippingAddress.phone"
            autoComplete="tel"
            value={formData["shippingAddress.phone"]}
            onChange={handleChange}
          />
      </div>
    </>
  );
};

export default ShippingAddress;
