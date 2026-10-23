"use client"

import { ArrowLeft } from "lucide-react"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import Help from "@/features/storefront/modules/order/components/help"
import Items from "@/features/storefront/modules/order/components/items"
import OrderDetails from "@/features/storefront/modules/order/components/order-details"
import OrderSummary from "@/features/storefront/modules/order/components/order-summary"
import ShippingDetails from "@/features/storefront/modules/order/components/shipping-details"
import FulfillmentCard from "@/features/storefront/modules/order/components/fulfillment-card"
import OrderSection from "@/features/storefront/modules/order/components/section"
import React from "react"
import { StoreOrder } from "@/features/storefront/types/storefront"

type OrderDetailsTemplateProps = {
  order: StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <LocalizedClientLink
          href="/account/orders"
          className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-cx-ink-2 hover:bg-cx-well hover:text-cx-ink"
          data-testid="back-to-overview-button"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Orders
        </LocalizedClientLink>
        <h1 className="flex items-baseline gap-3 font-cx-serif text-[32px] leading-[36px] tracking-[-0.015em] text-cx-ink sm:text-[40px] sm:leading-[44px]">
          Order <span className="cx-num text-[24px] sm:text-[28px]">{order.displayId}</span>
        </h1>
      </div>
      <div className="flex flex-col gap-8" data-testid="order-details-container">
        <OrderDetails order={order} showStatus />
        <OrderSection title="Items">
          <Items items={order.lineItems} region={order.region} />
        </OrderSection>
        <OrderSummary order={order} />
        <FulfillmentCard order={order} />
        <ShippingDetails order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
