"use client"

import type { StorefrontAccountCustomer as User } from "@/features/storefront/types"
import { AccountHeading, Band, EmptyState, TitleState } from "../account-ui"
import { format } from "date-fns"

type InvoicesTabProps = {
  customer: User
  invoices: any[]
}

const InvoicesTab = ({ customer, invoices }: InvoicesTabProps) => {
  return (
    <div className="w-full">
      <AccountHeading title="Invoices" meta={invoices.length} />

      {invoices.length === 0 ? (
        <EmptyState title="No paid invoices" />
      ) : (
        <Band>
          {invoices.map((invoice: any) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </Band>
      )}
    </div>
  )
}

type InvoiceCardProps = {
  invoice: any
}

function formatInvoiceLineItemCompleteness(invoice: any, displayedCount: number): string {
  const total = Number.isSafeInteger(invoice.lineItemsCount) && invoice.lineItemsCount >= 0
    ? invoice.lineItemsCount
    : null;
  if (invoice.lineItemsHasMore === true) {
    return total === null
      ? `Showing ${displayedCount} invoice line items`
      : `Showing ${displayedCount} of ${total} invoice line item${total === 1 ? '' : 's'}`;
  }
  if (invoice.lineItemsHasMore === false) {
    const completeCount = total ?? displayedCount;
    return `${completeCount} invoice line item${completeCount === 1 ? '' : 's'} included`;
  }
  return `${displayedCount} invoice line item${displayedCount === 1 ? '' : 's'}`;
}

const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <TitleState
            className="text-[16px] font-medium text-cx-ink"
            title={<span className="cx-num">{invoice.invoiceNumber}</span>}
            tone="ok"
            state="Paid"
          />
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-cx-ink-2">
            {invoice.paidAt && <span>Paid {format(new Date(invoice.paidAt), "MMM d, yyyy")}</span>}
            <span>Created {format(new Date(invoice.createdAt), "MMM d, yyyy")}</span>
            {invoice.account?.accountNumber && (
              <span className="cx-num">Account {invoice.account.accountNumber}</span>
            )}
          </div>
        </div>
        <p className="cx-num shrink-0 text-[18px] leading-none text-cx-ink">{invoice.formattedTotal}</p>
      </div>
      {Array.isArray(invoice.lineItems) && (
        <div className="mt-3">
          {(invoice.lineItems.length > 0 || invoice.lineItemsCount > 0 || invoice.lineItemsHasMore !== false) && (
            <p className="cx-num pb-2 text-[13px] text-cx-ink-3">
              {formatInvoiceLineItemCompleteness(invoice, invoice.lineItems.length)}
            </p>
          )}
          {invoice.lineItems.length > 0 && (
            <ul className="divide-y divide-cx-line overflow-hidden rounded-[2px] bg-cx-surface ring-1 ring-cx-line">
              {invoice.lineItems.map((lineItem: any) => {
                const order = lineItem.accountLineItem?.order;
                return (
                  <li key={lineItem.id}>
                    <a
                      href={`/account/orders/details/${order?.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center gap-3 px-3 py-2 text-[13px] hover:bg-cx-bg"
                    >
                      <span className="cx-num font-medium text-cx-ink">#{order?.displayId || lineItem.orderDisplayId}</span>
                      <span className="flex-1 text-cx-ink-2">
                        {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </span>
                      <span className="cx-num text-cx-ink">{order?.total || lineItem.formattedAmount}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default InvoicesTab