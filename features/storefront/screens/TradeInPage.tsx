import { Metadata } from "next"

import { getPublicBuylist } from "@/features/storefront/lib/data/collectibles"
import { getUser } from "@/features/storefront/lib/data/user"
import { money } from "@/features/storefront/components/cards"
import { BuylistBuilder } from "@/features/storefront/modules/trade-in/buylist-builder"

export const metadata: Metadata = {
  title: "Sell to us",
}

export async function TradeInPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const [buylists, customer] = await Promise.all([getPublicBuylist(), getUser().catch(() => null)])
  const buylist = buylists?.[0] ?? null
  const entries = (buylists ?? []).flatMap((b: any) => b.entries ?? [])
  const pct = (bp: number) => `${Math.round(bp / 100)}%`

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12" data-testid="trade-in-container">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]">Sell to us</h1>
      {buylist ? (
        <div className="mt-4 grid max-w-[72ch] gap-2 text-[16px] leading-[1.5] text-cx-ink-2">
          <p>
            {buylist.notes || `For Near Mint cards we pay ${pct(buylist.cashPercentBasisPoints)} of TCGplayer market in cash, or ${pct(buylist.creditPercentBasisPoints)} in store credit. Played copies pay a share of that.`}
          </p>
          <p className="text-[14px] text-cx-ink-3">Cards marked with a dashed box are on the hotlist: the ones we need most.</p>
        </div>
      ) : null}

      <div className="mt-10" data-testid="buylist">
        {buylists === null ? (
          <p className="text-[15px] text-cx-ink-2">The buylist is unavailable right now.</p>
        ) : entries.length === 0 ? (
          <p className="text-[15px] text-cx-ink-2">We aren&apos;t buying anything right now.</p>
        ) : (
          <BuylistBuilder entries={entries} currencyCode={buylist?.currencyCode || "USD"} countryCode={countryCode} signedIn={Boolean(customer)} />
        )}
      </div>
      {buylist && entries.length > 0 ? (
        <p className="mt-8 text-[13px] text-cx-ink-3">
          Offers follow TCGplayer market readings and change when prices are refreshed.
          {buylist.minimumOfferMinor ? ` The minimum offer is ${money(buylist.minimumOfferMinor, buylist.currencyCode)} a card.` : ""}
        </p>
      ) : null}
    </div>
  )
}
