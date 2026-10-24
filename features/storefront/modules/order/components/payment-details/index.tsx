import { paymentInfoMap } from "@/features/storefront/lib/constants";
import OrderSection, { Field } from "../section";

import { StoreOrder } from "@/features/storefront/types/storefront";

const PaymentDetails = ({ order }: { order: StoreOrder }) => {
  const payment = order.payments?.[0];
  const paymentSession = payment?.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected
  );
  const provider = paymentSession?.paymentProvider;

  if (!payment || !provider?.code) return null;

  return (
    <OrderSection title="Payment">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Method">
          <p>{paymentInfoMap[provider.code]?.title || provider.code}</p>
        </Field>
        <Field label="Details">
          <div className="flex items-center gap-2">
            {paymentInfoMap[provider.code]?.icon && (
              <span className="flex h-7 items-center rounded-md bg-cx-well px-2 text-cx-ink-2">
                {paymentInfoMap[provider.code]?.icon}
              </span>
            )}
            <span className="cx-num text-[13px]">
              {provider.code === "stripe" && payment.data?.cardLast4
                ? `•••• ${payment.data?.cardLast4}`
                : `${order.total} · ${new Date(payment.createdAt).toLocaleDateString()}`}
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
