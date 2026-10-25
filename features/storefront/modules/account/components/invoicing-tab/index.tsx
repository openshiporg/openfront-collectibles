"use client"

import type { StorefrontAccountCustomer as User } from "@/features/storefront/types"
import { Copy, RefreshCw, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import BusinessAccountRequestForm from "./business-account-request-form"
import { toast } from "@/components/ui/use-toast"
import PaymentDialog from "./invoice-payment-dialog"
import OrderCard from "../order-card"
import { useState, useActionState, useEffect } from "react"
import { regenerateCustomerToken } from "@/features/storefront/lib/data/business-accounts"
import { PillButton, Track } from "@/features/storefront/modules/common/components/collectibles/track"
import StatusDot, { type DotTone } from "@/features/storefront/modules/common/components/collectibles/status-dot"
import { AccountHeading, Band, EmptyState } from "../account-ui"

const ACCOUNT_STATES: Record<string, { label: string; tone: DotTone }> = {
  active: { label: "Active", tone: "ok" },
  suspended: { label: "Suspended", tone: "danger" },
  not_approved: { label: "Not approved", tone: "danger" },
  overdue: { label: "Overdue", tone: "danger" },
  paid: { label: "Paid", tone: "ok" },
}

type BusinessAccountTabProps = {
  customer: User
  businessAccount: any
  businessAccountRequest: any  
  orders: any[]
  unpaidLineItems: any
}

const InvoicingTab = ({ customer, businessAccount, businessAccountRequest, orders, unpaidLineItems }: BusinessAccountTabProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [orderFilter, setOrderFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [tokenCopied, setTokenCopied] = useState(false)
  
  // Server actions with useActionState
  const [tokenState, tokenAction] = useActionState(regenerateCustomerToken, { success: false, error: '' })

  // Determine account status from server data
  const getAccountStatus = () => {
    if (businessAccount) {
      return businessAccount.status === 'suspended' ? 'suspended' : 'active'
    }
    if (businessAccountRequest) {
      return businessAccountRequest.status === 'pending' ? 'pending' : 'none'
    }
    return 'none'
  }

  const accountStatus = getAccountStatus()

  // Helper functions for order categorization
  // For business accounts, orders are paid/unpaid based on whether they have been included in paid invoices
  // We need to check if the order has AccountLineItems with paymentStatus 'paid' or 'unpaid'
  const getOrderCounts = () => {
    const allOrders = orders.length
    
    // For business accounts, an order is "paid" if it's NOT in the current unpaid balance
    // Check if order is in unpaidLineItems regions
    const unpaidOrderIds = new Set()
    if (unpaidLineItems?.regions) {
      unpaidLineItems.regions.forEach((region: any) => {
        region.lineItems?.forEach((lineItem: any) => {
          if (lineItem.order?.id) {
            unpaidOrderIds.add(lineItem.order.id)
          }
        })
      })
    }
    
    const unpaidOrders = orders.filter(order => unpaidOrderIds.has(order.id)).length
    const paidOrders = allOrders - unpaidOrders
    
    return {
      all: allOrders,
      paid: paidOrders,
      unpaid: unpaidOrders
    }
  }

  const filterOrdersByStatus = (status: string) => {
    // Build set of unpaid order IDs from unpaidLineItems
    const unpaidOrderIds = new Set()
    if (unpaidLineItems?.regions) {
      unpaidLineItems.regions.forEach((region: any) => {
        region.lineItems?.forEach((lineItem: any) => {
          if (lineItem.order?.id) {
            unpaidOrderIds.add(lineItem.order.id)
          }
        })
      })
    }

    switch (status) {
      case 'paid':
        return orders.filter(order => !unpaidOrderIds.has(order.id))
      case 'unpaid':
        return orders.filter(order => unpaidOrderIds.has(order.id))
      default:
        return orders
    }
  }

  const orderCounts = getOrderCounts()

  const currentToken = tokenState.success && 'token' in tokenState ? tokenState.token : null

  const copyToken = async () => {
    if (currentToken) {
      await navigator.clipboard.writeText(currentToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 1500)
    }
  }

  const handleTokenRegenerate = () => {
    const formData = new FormData()
    tokenAction(formData)
  }

  useEffect(() => {
    if (tokenState.success && 'token' in tokenState) {
      toast({
        title: "Token regenerated",
        description: "Copy it now. It will not be shown again.",
      })
    } else if (tokenState.error) {
      toast({
        title: "Token not regenerated",
        description: tokenState.error,
        variant: "destructive",
      })
    }
  }, [tokenState])

  // State 1: Empty State (No Account Request)
  if (accountStatus === 'none') {
    return (
      <div className="w-full">
        <AccountHeading title="Business account" />
        <ul className="cx-band mb-6 divide-y divide-cx-line overflow-hidden text-[14px] text-cx-ink">
          <li className="px-5 py-4">
            <p className="cx-label">Terms</p>
            <p className="mt-1">Monthly invoicing against a credit limit</p>
          </li>
          <li className="px-5 py-4">
            <p className="cx-label">Ordering</p>
            <p className="mt-1">API customer token for carts and orders</p>
          </li>
          <li className="px-5 py-4">
            <p className="cx-label">Review</p>
            <p className="mt-1">Each request is approved by the store</p>
          </li>
        </ul>
        <BusinessAccountRequestForm customer={customer} />
      </div>
    )
  }

  // State 2: Pending State
  if (accountStatus === 'pending') {
    return (
      <div className="w-full">
        <AccountHeading title="Business account" />
        <div className="cx-band px-5 py-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-cx-serif text-[22px] leading-[28px] text-cx-ink">Request received</p>
            <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
              <StatusDot tone="warn" />
              In review
            </span>
          </div>
          {businessAccountRequest?.createdAt && (
            <p className="cx-num mt-2 text-[13px] text-cx-ink-2">
              Submitted {new Date(businessAccountRequest.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </p>
          )}
        </div>
      </div>
    )
  }

  // State 3: Active State
  if (accountStatus === 'active' && businessAccount) {
    const hasUnpaidItems = unpaidLineItems?.success && unpaidLineItems?.regions?.some((region: any) => region.totalAmount > 0)
    const state = ACCOUNT_STATES[businessAccount?.status] || { label: "Unknown", tone: "muted" as DotTone }
    const visibleOrders = filterOrdersByStatus(orderFilter).slice(0, 5)

    return (
      <div className="w-full space-y-10">
        <div>
          <div className="mb-6 flex flex-col gap-3 border-b border-cx-line pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-cx-display font-extrabold text-[30px] leading-[34px] tracking-[-0.01em] text-cx-ink sm:text-[36px] sm:leading-[40px]">
                Business account
              </h1>
              <span className="inline-flex items-baseline gap-1.5 text-[14px] text-cx-ink-2">
                <StatusDot tone={state.tone} />
                {state.label}
              </span>
            </div>
            <button
              type="button"
              className="cx-btn"
              onClick={() => setShowPaymentDialog(true)}
              disabled={!hasUnpaidItems}
            >
              {hasUnpaidItems ? 'Pay balance' : 'No balance due'}
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[2px] bg-cx-line ring-1 ring-cx-line sm:grid-cols-3">
            <div className="bg-cx-surface px-5 py-4">
              <dt className="cx-label">Balance</dt>
              <dd className="cx-num mt-2 text-[24px] leading-none text-cx-ink">{businessAccount.formattedTotalOwedInAccountCurrency}</dd>
            </div>
            <div className="bg-cx-surface px-5 py-4">
              <dt className="cx-label">Credit limit</dt>
              <dd className="cx-num mt-2 text-[24px] leading-none text-cx-ink">{businessAccount.formattedCreditLimit}</dd>
            </div>
            <div className="bg-cx-surface px-5 py-4">
              <dt className="cx-label">Available</dt>
              <dd className="cx-num mt-2 text-[24px] leading-none text-cx-ok">{businessAccount.formattedAvailableCreditInAccountCurrency}</dd>
            </div>
          </dl>
        </div>

        <section>
          <h2 className="mb-3 border-b border-cx-line pb-3 font-cx-serif text-[26px] leading-[30px] text-cx-ink">API access</h2>
          <label htmlFor="customer-token" className="cx-label">Customer token</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="customer-token"
              value={currentToken || '••••••••••••••••••••••••'}
              readOnly
              className="cx-num h-12 min-w-0 flex-1 rounded-[2px] border border-cx-line bg-cx-well px-4 text-[14px] text-cx-ink outline-none"
            />
            <div className="cx-track self-start">
              <button
                type="button"
                onClick={copyToken}
                className="cx-pill"
                data-active={!!currentToken}
                aria-label={tokenCopied ? "Copied" : "Copy token"}
                disabled={tokenCopied || !currentToken}
              >
                {tokenCopied ? <CheckIcon className="size-4 text-cx-ok" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {tokenCopied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleTokenRegenerate}
                className="cx-pill"
                aria-label="Regenerate token"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate
              </button>
            </div>
          </div>
          {currentToken && (
            <p className="mt-2 inline-flex items-baseline gap-2 text-[13px] text-cx-warn" role="status">
              <StatusDot tone="warn" />
              Shown once
            </p>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-3 border-b border-cx-line pb-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-cx-serif text-[26px] leading-[30px] text-cx-ink">Recent orders</h2>
            {orders.length > 0 && (
              <Track label="Filter orders">
                {([
                  ['all', 'All', orderCounts.all],
                  ['paid', 'Paid', orderCounts.paid],
                  ['unpaid', 'Unpaid', orderCounts.unpaid],
                ] as const).map(([value, label, count]) => (
                  <PillButton key={value} active={orderFilter === value} onClick={() => setOrderFilter(value)}>
                    {label} <span className="cx-num text-[13px] text-cx-ink-3">{count}</span>
                  </PillButton>
                ))}
              </Track>
            )}
          </div>

          {orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : visibleOrders.length === 0 ? (
            <EmptyState title={orderFilter === 'paid' ? "No paid orders" : "No unpaid orders"} />
          ) : (
            <Band>
              {visibleOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </Band>
          )}
        </section>

        {showPaymentDialog && (
          <PaymentDialog
            isOpen={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            businessAccount={businessAccount}
            unpaidLineItems={unpaidLineItems}
          />
        )}
      </div>
    )
  }

  // State 4: Suspended State
  if (accountStatus === 'suspended') {
    return (
      <div className="w-full">
        <AccountHeading title="Business account" />
        <div className={cn("cx-band px-5 py-6")}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-cx-serif text-[22px] leading-[28px] text-cx-ink">Account suspended</p>
            <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
              <StatusDot tone="danger" />
              Suspended
            </span>
          </div>
          {businessAccount?.formattedTotalOwedInAccountCurrency && (
            <p className="cx-num mt-2 text-[14px] text-cx-ink-2">Balance {businessAccount.formattedTotalOwedInAccountCurrency}</p>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default InvoicingTab
