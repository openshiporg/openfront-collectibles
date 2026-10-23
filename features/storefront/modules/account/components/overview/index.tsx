import { ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { CustomerProfile, OrderSummary, OrdersList } from "@/features/storefront/types/account"
import { Band, EmptyState, TitleState, statusLabel, statusTone } from "../account-ui"

type OverviewProps = {
  user: CustomerProfile
  orders: OrdersList
}

type OrderWithStatus = OrderSummary & { status?: string | null }

const Overview = ({ user, orders }: OverviewProps) => {
  const completion = getProfileCompletion(user)
  const addressCount = user?.addresses?.length || 0

  return (
    <div data-testid="overview-page-wrapper" className="space-y-10">
      <span className="sr-only" data-testid="welcome-message" data-value={user?.firstName}>
        {user?.firstName}
      </span>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cx-line ring-1 ring-cx-line sm:grid-cols-3">
        <div className="bg-cx-surface px-5 py-4">
          <dt className="cx-label">Signed in as</dt>
          <dd className="mt-2 truncate text-[15px] text-cx-ink" data-testid="customer-email" data-value={user?.email}>
            {user?.email}
          </dd>
        </div>
        <LocalizedClientLink href="/account/profile" className="group bg-cx-surface px-5 py-4 hover:bg-cx-bg">
          <dt className="cx-label">Profile</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="cx-num text-[24px] leading-none text-cx-ink" data-testid="customer-profile-completion" data-value={completion}>
              {completion}%
            </span>
            <span className="text-[13px] text-cx-ink-2">complete</span>
          </dd>
        </LocalizedClientLink>
        <LocalizedClientLink href="/account/addresses" className="group bg-cx-surface px-5 py-4 hover:bg-cx-bg">
          <dt className="cx-label">Addresses</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="cx-num text-[24px] leading-none text-cx-ink" data-testid="addresses-count" data-value={addressCount}>
              {addressCount}
            </span>
            <span className="text-[13px] text-cx-ink-2">saved</span>
          </dd>
        </LocalizedClientLink>
      </dl>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4 border-b border-cx-line pb-3">
          <h2 className="font-cx-serif text-[26px] leading-[30px] text-cx-ink">Recent orders</h2>
          <LocalizedClientLink
            href="/account/orders"
            className="group inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-cx-ink-2 hover:text-cx-ink"
          >
            All orders
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </LocalizedClientLink>
        </div>
        <div data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            <Band>
              {orders.slice(0, 5).map((order: OrderWithStatus) => (
                <LocalizedClientLink
                  key={order.id}
                  href={`/account/orders/details/${order.id}`}
                  data-testid="order-wrapper"
                  data-value={order.id}
                  className="flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-cx-surface/60 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <TitleState
                      className="text-[15px] font-medium text-cx-ink"
                      title={
                        <span className="cx-num" data-testid="order-id" data-value={order.displayId}>
                          #{order.displayId}
                        </span>
                      }
                      tone={statusTone(order.status)}
                      state={statusLabel(order.status || "pending")}
                    />
                    <p className="mt-0.5 text-[13px] text-cx-ink-2" data-testid="order-created-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : ""}
                    </p>
                  </div>
                  <span className="cx-num shrink-0 text-[14px] text-cx-ink" data-testid="order-amount">
                    {order.total}
                  </span>
                  <span className="sr-only" data-testid="open-order-button">
                    Open order #{order.displayId}
                  </span>
                </LocalizedClientLink>
              ))}
            </Band>
          ) : (
            <EmptyState title="No orders yet">
              <span className="sr-only" data-testid="no-orders-message">No recent orders</span>
              <LocalizedClientLink href="/store" className="cx-btn">
                Browse items
              </LocalizedClientLink>
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  )
}

const getProfileCompletion = (user: CustomerProfile) => {
  let count = 0

  if (!user) {
    return 0
  }

  if (user.email) {
    count++
  }

  if (user.firstName && user.lastName) {
    count++
  }

  if (user.phone) {
    count++
  }

  if (user.billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
