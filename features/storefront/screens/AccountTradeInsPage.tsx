import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getTradeIns } from "@/features/storefront/lib/data/collectibles"
import { formatMinorAmount } from "@/features/storefront/lib/collectible-evidence-presentation"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { AccountHeading, Band, EmptyState, TitleState } from "@/features/storefront/modules/account/components/account-ui"
import type { DotTone } from "@/features/storefront/modules/common/components/collectibles/status-dot"

export const metadata: Metadata = {
  title: "Sold to us",
}

const TONES: Record<string, DotTone> = {
  draft: "muted",
  submitted: "warn",
  received: "warn",
  inspecting: "warn",
  quoted: "accent",
  accepted: "ok",
  paid: "ok",
  declined: "danger",
  returned: "muted",
}

const label = (value?: string | null) => {
  const text = String(value || "").replaceAll("_", " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const money = (amount: unknown, currency: unknown) =>
  typeof amount === "number" && typeof currency === "string" && currency ? formatMinorAmount(amount, currency) : null

export async function AccountTradeInsPage() {
  const tradeIns = await getTradeIns()
  if (tradeIns === null) notFound()

  return (
    <div className="w-full" data-testid="trade-ins-page-wrapper">
      <AccountHeading
        title="Sold to us"
        meta={tradeIns.length}
        actions={
          <LocalizedClientLink href="/trade-in" className="cx-btn !min-h-10 !text-[14px]">
            New trade-in
          </LocalizedClientLink>
        }
      />
      {tradeIns.length === 0 ? (
        <EmptyState title="No trade-ins yet" />
      ) : (
        <div className="space-y-6">
          {tradeIns.map((tradeIn: any) => (
            <section key={tradeIn.id} className="space-y-2" data-testid="trade-in-row">
              <TitleState
                className="cx-num text-[15px] text-cx-ink"
                title={tradeIn.reference}
                tone={TONES[tradeIn.status] || "muted"}
                state={label(tradeIn.status)}
              />
              <p className="text-[13px] text-cx-ink-2">
                {label(tradeIn.disposition)} ·{" "}
                {new Date(tradeIn.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
              </p>
              <Band>
                {tradeIn.items.map((item: any) => {
                  const quoted = money(item.quotedAmountMinor, item.currencyCode)
                  const accepted = money(item.acceptedAmountMinor, item.currencyCode)
                  const estimate = money(tradeIn.disposition === "cash" ? item.estimateCashMinor : item.estimateCreditMinor, item.currencyCode)
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] text-cx-ink">{item.description || item.title}</p>
                        <p className="truncate text-[13px] text-cx-ink-2">{[item.quantity > 1 ? `${item.quantity} copies` : null, item.condition].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="shrink-0 text-right text-[13px]">
                        {accepted ? (
                          <p className="cx-num text-cx-ink">{accepted}</p>
                        ) : quoted ? (
                          <p className="cx-num text-cx-ink">Quote {quoted}</p>
                        ) : estimate ? (
                          <p className="cx-num text-cx-ink-2">Buylist estimate {estimate}</p>
                        ) : (
                          <p className="text-cx-ink-3">Not quoted</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </Band>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
