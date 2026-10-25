import { Metadata } from "next"

import { getPublicBuylist } from "@/features/storefront/lib/data/collectibles"
import { getUser } from "@/features/storefront/lib/data/user"
import { formatMinorAmount } from "@/features/storefront/lib/collectible-evidence-presentation"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import SectionHead from "@/features/storefront/modules/common/components/collectibles/section-head"
import TradeInForm from "@/features/storefront/modules/trade-in/trade-in-form"

export const metadata: Metadata = {
  title: "Trade in",
}

const offerOf = (amount: unknown, currency: unknown) => {
  try {
    return typeof amount === "number" && typeof currency === "string" && currency ? formatMinorAmount(amount, currency) : "—"
  } catch {
    return "—"
  }
}

export async function TradeInPage() {
  const [buylists, customer] = await Promise.all([getPublicBuylist(), getUser().catch(() => null)])
  const entries = (buylists || []).flatMap((buylist: any) =>
    (buylist.entries || []).map((entry: any) => ({ ...entry, offer: offerOf(entry.offerAmountMinor, buylist.currencyCode) }))
  )

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="trade-in-container">
      <h1 className="font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px]">
        Trade in
      </h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="space-y-4" aria-label="Buylist">
          <SectionHead title="We're buying" meta={entries.length} />
          {buylists === null ? (
            <p className="cx-band px-4 py-3.5 text-[14px] text-cx-ink-2">Buylist unavailable</p>
          ) : entries.length === 0 ? (
            <p className="cx-band px-4 py-3.5 text-[14px] text-cx-ink-2">No items on the buylist</p>
          ) : (
            <ul className="cx-band divide-y divide-cx-line overflow-hidden" data-testid="buylist">
              {entries.map((entry: any) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-cx-serif text-[17px] leading-[22px] text-cx-ink">{entry.title}</p>
                    <p className="truncate text-[13px] text-cx-ink-2">
                      {[entry.category, entry.catalogNumber, entry.maker, entry.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="cx-num text-[14px] text-cx-ink">{entry.offer}</p>
                    {entry.maximumQuantity != null && <p className="cx-num text-[13px] text-cx-ink-3">Up to {entry.maximumQuantity}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4" aria-label="Submit a trade-in">
          <SectionHead title="Your items" />
          {customer ? (
            <TradeInForm entries={entries.map((entry: any) => ({ id: entry.id, title: entry.title, catalogNumber: entry.catalogNumber, offer: entry.offer }))} />
          ) : (
            <div className="cx-band flex flex-col items-start gap-4 px-5 py-6">
              <p className="font-cx-serif text-[20px] text-cx-ink">Sign in to submit a trade-in</p>
              <LocalizedClientLink href="/account" className="cx-btn">
                Sign in
              </LocalizedClientLink>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
