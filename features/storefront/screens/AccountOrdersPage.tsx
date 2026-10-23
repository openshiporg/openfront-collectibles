import { Metadata } from "next"
import type { StorefrontOrderOverviewItem } from '@/features/storefront/types'

import OrderOverview from "@/features/storefront/modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listCustomerOrders } from "@/features/storefront/lib/data/orders"
import { AccountHeading } from "@/features/storefront/modules/account/components/account-ui"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export async function AccountOrdersPage() {
  const orders: StorefrontOrderOverviewItem[] | null = await listCustomerOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <AccountHeading title="Orders" meta={orders.length} />
      <OrderOverview orders={orders} />
    </div>
  )
}
