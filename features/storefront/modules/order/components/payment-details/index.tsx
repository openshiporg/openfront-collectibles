import { ViewerTime } from '@/features/dashboard/components/ViewerTime'
import { paymentInfoMap } from "@/features/storefront/lib/constants";
import OrderSection, { Field } from "../section";

import { StoreOrder } from "@/features/storefront/types/storefront";

const PaymentDetails = ({ order }: { order: StoreOrder }) => {
  const giftCardPayments = (order.payments || []).filter((p: any) => p.data?.tender === "gift_card");
  const payment = (order.payments || []).find((p: any) => p.data?.tender !== "gift_card");
  const paymentSession = payment?.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected
  );
  const provider = paymentSession?.paymentProvider;
  const currency = (order as any).currency?.code || (order as any).currencyCode || "USD";
  const giftCardRows = giftCardPayments.flatMap((p: any) =>
    (p.data?.giftCards || []).map((card: any, i: number) => (
      <p key={`${p.id}-${i}`} className="cx-num text-[13px]">
        {card.last4 ? `Gift card ending ${card.last4}` : "Gift card"} ·{" "}
        {new Intl.NumberFormat("en-US", { style: "currency", currency: String(currency).toUpperCase() }).format(card.amount / 100)}
      </p>
    ))
  );

  if (!payment || !provider?.code) {
    if (!giftCardRows.length) return null;
    return (
      <OrderSection title="Payment">
        <Field label="Method">
          <div className="space-y-1">{giftCardRows}</div>
        </Field>
      </OrderSection>
    );
  }

  return (
    <OrderSection title="Payment">
      {giftCardRows.length > 0 && (
        <div className="mb-5">
          <Field label="Gift cards">
            <div className="space-y-1">{giftCardRows}</div>
          </Field>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Method">
          <p>{paymentInfoMap[provider.code]?.title || provider.code}</p>
        </Field>
        <Field label="Details">
          <div className="flex items-center gap-2">
            {paymentInfoMap[provider.code]?.icon && (
              <span className="flex items-center text-cx-ink-3">
                {paymentInfoMap[provider.code]?.icon}
              </span>
            )}
            <span className="cx-num text-[13px]">
              {provider.code === "stripe" && payment.data?.cardLast4
                ? `•••• ${payment.data?.cardLast4}`
                : <>{typeof payment.amount === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: String(currency).toUpperCase() }).format(payment.amount / 100) : order.total} · <ViewerTime value={payment.createdAt} style="date" /></>}
            </span>
          </div>
        </Field>
        {payment.data?.manual === true && (
          <Field label="Status">
            <p>{payment.status === "captured" ? "Received" : payment.status === "canceled" ? "Canceled" : "Awaiting bank transfer"}</p>
          </Field>
        )}
      </div>
    </OrderSection>
  );
};

export default PaymentDetails;
