import OrderSection, { Field } from "../section";

// Define inline types based on GraphQL schema and component usage
type CountryInfoForShipping = {
  iso2?: string | null;
};

type AddressInfoForShipping = {
  firstName?: string | null;
  lastName?: string | null;
  address1?: string | null;
  address2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  country?: CountryInfoForShipping | null;
  phone?: string | null;
};

type ShippingOptionInfo = {
  name?: string | null;
};

type ShippingMethodInfo = {
  shippingOption?: ShippingOptionInfo | null;
};

import { StoreRegion } from "@/features/storefront/types/storefront";

type OrderWithShipping = {
  id: string;
  email?: string | null;
  currencyCode?: string | null; // Correct field name
  shippingAddress?: AddressInfoForShipping | null; // Correct field name
  shippingMethods?: ShippingMethodInfo[] | null; // Correct field name
  shippingTotal?: number | null; // Correct field name
  region?: Pick<StoreRegion, 'id' | 'name' | 'currency'> | null;
  shipping: string;
};

type ShippingDetailsProps = {
  order: OrderWithShipping;
};

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const address = order.shippingAddress;

  return (
    <OrderSection title="Delivery">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Ship to" data-testid="shipping-address-summary">
          <p className="text-cx-ink">
            {address?.firstName} {address?.lastName}
          </p>
          <p>
            {address?.address1} {address?.address2}
          </p>
          <p>
            {address?.city}
            {address?.province ? `, ${address.province}` : ""}
          </p>
          <p className="cx-num text-[13px]">
            {address?.postalCode} {address?.country?.iso2?.toUpperCase()}
          </p>
        </Field>
        <Field label="Contact" data-testid="shipping-contact-summary">
          {address?.phone && <p className="cx-num text-[13px]">{address.phone}</p>}
          <p className="break-all">{order.email}</p>
        </Field>
        <Field label="Method" data-testid="shipping-method-summary">
          <p>
            {order.shippingMethods?.[0]?.shippingOption?.name}{" "}
            <span className="cx-num text-[13px] text-cx-ink">{order.shipping}</span>
          </p>
        </Field>
      </div>
    </OrderSection>
  );
};

export default ShippingDetails;
