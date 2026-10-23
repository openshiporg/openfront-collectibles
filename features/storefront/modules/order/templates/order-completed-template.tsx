import Help from "@/features/storefront/modules/order/components/help"
import Items from "@/features/storefront/modules/order/components/items"
import OrderDetails from "@/features/storefront/modules/order/components/order-details"
import OrderSummary from "@/features/storefront/modules/order/components/order-summary"
import ShippingDetails from "@/features/storefront/modules/order/components/shipping-details"
import PaymentDetails from "@/features/storefront/modules/order/components/payment-details"
import FulfillmentCard from "@/features/storefront/modules/order/components/fulfillment-card"
import OrderSection from "@/features/storefront/modules/order/components/section"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"
import { StoreOrder } from "@/features/storefront/types/storefront"

type OrderCompletedTemplateProps = {
  order: StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="flex flex-col gap-8" data-testid="order-complete-container">
        <div className="space-y-2">
          <p className="cx-num text-[13px] text-cx-ink-3">Order {order.displayId}</p>
          <h1 className="flex items-baseline gap-3 font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px]">
            <StatusDot tone="ok" className="size-2.5" />
            Order placed
          </h1>
        </div>
        <OrderDetails order={order} />
        <OrderSection title="Items">
          <Items items={order.lineItems} region={order.region} />
        </OrderSection>
        <OrderSummary order={order} />
        <FulfillmentCard order={order} />
        <ShippingDetails order={order} />
        <PaymentDetails order={order} />
        <Help />
      </div>
    </div>
  )
}
