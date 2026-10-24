"use client";
import React from "react";

interface CartTotalsProps {
  data: {
    subtotal?: number | string | null;
    discount?: number | string | null;
    giftCardTotal?: number | string | null;
    shipping?: number | string | null;
    tax?: number | string | null;
    total?: number | string | null;
  } | null;
  // Checkout before an address is saved: the attached default method is not a real quote yet.
  shippingPending?: boolean;
}

function Row({ label, value, credit }: { label: string; value: React.ReactNode; credit?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-cx-ink-2">{label}</dt>
      <dd className={credit ? "cx-num text-cx-ok" : "cx-num text-cx-ink"}>
        {credit ? "− " : ""}
        {value}
      </dd>
    </div>
  );
}

const CartTotals = ({ data, shippingPending = false }: CartTotalsProps) => {
  if (!data) {
    return null;
  }

  return (
    <div>
      <dl className="space-y-2 text-[14px]">
        <Row label="Subtotal" value={data.subtotal} />
        {data.discount && data.discount !== "0" && <Row label="Discount" value={data.discount} credit />}
        {data.giftCardTotal && data.giftCardTotal !== "0" && <Row label="Gift card" value={data.giftCardTotal} credit />}
        <Row label="Shipping" value={shippingPending ? "Calculated at next step" : data.shipping} />
        <Row label="Taxes" value={shippingPending ? "Calculated at next step" : data.tax} />
      </dl>
      {!shippingPending && (
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-cx-line pt-4">
          <span className="text-[15px] font-medium text-cx-ink">Total</span>
          <span className="cx-num text-[22px] text-cx-ink">{data.total}</span>
        </div>
      )}
    </div>
  );
};

export default CartTotals;
