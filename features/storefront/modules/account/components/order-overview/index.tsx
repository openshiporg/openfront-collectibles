"use client"

import type { StorefrontOrderOverviewItem } from '@/features/storefront/types'

import OrderCard from "../order-card"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { Band, EmptyState } from "../account-ui"

const OrderOverview = ({ orders }: { orders: StorefrontOrderOverviewItem[] }) => {
  if (orders?.length) {
    return (
      <Band>
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </Band>
    )
  }

  return (
    <div data-testid="no-orders-container">
      <EmptyState title="No orders yet">
        <LocalizedClientLink href="/store" className="cx-btn" data-testid="continue-shopping-button">
          Browse items
        </LocalizedClientLink>
      </EmptyState>
    </div>
  )
}

export default OrderOverview
