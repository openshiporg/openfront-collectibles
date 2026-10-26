import Link from "next/link"
import { CardRow, CardSheet, money } from "@/features/storefront/components/cards"
import { Shelf } from "../shelf"

/** What the shop is buying right now: the hotlist first, at Near Mint cash and credit. */
export function BuylistTeaser({ buylists, countryCode }: { buylists: any[] | null; countryCode: string }) {
  const buylist = buylists?.[0]
  const entries: any[] = buylist?.entries ?? []
  if (!buylist || !entries.length) return null
  const rows = [...entries].sort((a, b) => Number(b.hotlist) - Number(a.hotlist) || b.offerAmountMinor - a.offerAmountMinor).slice(0, 6)
  const pct = (bp: number) => `${Math.round(bp / 100)}%`
  return (
    <Shelf
      title="We're buying"
      note={`Near Mint pays ${pct(buylist.cashPercentBasisPoints)} of market in cash or ${pct(buylist.creditPercentBasisPoints)} in store credit; played copies pay less. Final offers follow inspection.`}
      href={`/${countryCode}/trade-in`}
      linkLabel={`Full buylist, ${entries.length} cards`}
    >
      <CardSheet label="Buylist hotlist" marketHead="Cash" priceHead="Credit" runHead="" heads>
        {rows.map((entry, i) => (
          <CardRow
            key={entry.id}
            index={i}
            status={entry.hotlist ? "wanted" : "none"}
            href={`/${countryCode}/trade-in#${entry.id}`}
            card={{ id: entry.id, name: entry.title, number: entry.number, rarity: entry.rarity, imageUrl: entry.imageUrl, setName: entry.set?.name }}
            detail={[entry.set?.name, entry.hotlist ? "Hotlist" : null].filter(Boolean).join(" · ")}
            market={money(entry.offerAmountMinor, buylist.currencyCode)}
            price={money(entry.creditOfferMinor ?? entry.offerAmountMinor, buylist.currencyCode)}
          />
        ))}
      </CardSheet>
      <Link href={`/${countryCode}/trade-in`} className="tc-btn w-fit">Sell cards to us</Link>
    </Shelf>
  )
}
