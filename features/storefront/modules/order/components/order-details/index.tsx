import StatusDot, { type DotTone } from "@/features/storefront/modules/common/components/collectibles/status-dot"

// Define inline types based on GraphQL schema and component usage
type OrderDetailsType = {
  email?: string | null;
  createdAt?: string | null; // Correct field name
  displayId?: string | null; // Correct field name
  fulfillmentStatus?: string | null; // Correct field name (enum as string)
  paymentStatus?: string | null; // Correct field name (enum as string)
};

type OrderDetailsProps = {
  order: any;
  showStatus?: boolean;
};

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string | null | undefined) => {
    if (!str) return "Not available"
    if (typeof str !== 'string') return String(str)
    const formatted = str.split("_").join(" ")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const paymentState = (() => {
    const totalPaid = parseFloat(order.formattedTotalPaid?.replace(/[^0-9.-]+/g, "") || "0")
    const total = parseFloat(order.total?.replace(/[^0-9.-]+/g, "") || "0")

    if (totalPaid === 0) return { label: "Unpaid", tone: "warn" as const }
    if (totalPaid >= total) return { label: "Paid", tone: "ok" as const }
    return { label: "Partially paid", tone: "warn" as const }
  })()

  const fulfillment = order.fulfillmentStatus?.status as string | undefined
  const fulfillmentTone: DotTone =
    fulfillment === "fulfilled" || fulfillment === "shipped" || fulfillment === "delivered"
      ? "ok"
      : fulfillment === "canceled" || fulfillment === "cancelled"
        ? "danger"
        : "accent"

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[2px] bg-cx-surface p-4 ring-1 ring-cx-line sm:grid-cols-4 sm:p-5">
      <div className="min-w-0 space-y-1">
        <dt className="cx-label">Order</dt>
        <dd className="cx-num text-[15px] text-cx-ink" data-testid="order-id">{order.displayId}</dd>
      </div>
      <div className="min-w-0 space-y-1">
        <dt className="cx-label">Placed</dt>
        <dd className="cx-num text-[14px] text-cx-ink" data-testid="order-date">
          {new Date(order.createdAt ?? "").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </dd>
      </div>
      <div className="col-span-2 min-w-0 space-y-1">
        <dt className="cx-label">Confirmation sent to</dt>
        <dd className="truncate text-[14px] text-cx-ink" data-testid="order-email">{order.email}</dd>
      </div>
      {showStatus && (
        <>
          <div className="min-w-0 space-y-1">
            <dt className="cx-label">Fulfillment</dt>
            <dd className="flex items-baseline gap-1.5 text-[14px] text-cx-ink" data-testid="order-status">
              <StatusDot tone={fulfillmentTone} />
              {formatStatus(fulfillment)}
            </dd>
          </div>
          <div className="min-w-0 space-y-1">
            <dt className="cx-label">Payment</dt>
            <dd className="flex items-baseline gap-1.5 text-[14px] text-cx-ink" data-testid="order-payment-status">
              <StatusDot tone={paymentState.tone} />
              {paymentState.label}
            </dd>
          </div>
        </>
      )}
    </dl>
  )
}

export default OrderDetails
