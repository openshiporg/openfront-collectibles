import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBinder } from "@/features/storefront/lib/data/cards"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { AccountHeading, EmptyState } from "@/features/storefront/modules/account/components/account-ui"
import { BinderSummary, CardRow, CardSheet, conditionLabel, finishLabel, money } from "@/features/storefront/components/cards"
import { RemoveFromBinder } from "@/features/storefront/modules/cards/binder-button"

export const metadata: Metadata = {
  title: "Binder",
}

export async function AccountBinderPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  // Market readings are TCGplayer US dollar prices.
  const currencyCode = "USD"
  const binder = await getBinder()
  if (binder === null) notFound()
  const cards: any[] = binder.cards ?? []

  const valueMinor = cards.reduce((sum, c) => sum + (c.marketMinor ?? 0) * c.quantity, 0)
  const costed = cards.filter((c) => c.costBasisMinor != null)
  const costMinor = costed.length ? costed.reduce((sum, c) => sum + c.costBasisMinor * c.quantity, 0) : null
  const pricedCost = costed.length ? costed.reduce((sum, c) => sum + (c.marketMinor ?? 0) * c.quantity, 0) : null
  const copies = cards.reduce((sum, c) => sum + c.quantity, 0)
  const distinct = new Set(cards.map((c) => c.card.id)).size
  const sets = (binder.sets ?? []).map((s: any) => ({ name: s.name, owned: s.owned, total: s.totalCards ?? s.printedTotal ?? s.owned }))

  return (
    <div className="tc w-full" data-testid="binder-page-wrapper">
      <AccountHeading title="Binder" meta={copies} />
      {cards.length === 0 ? (
        <EmptyState title="Your binder is empty">
          <p className="max-w-[48ch] text-[15px] text-cx-ink-2">On any card page, press I have this to add your copy, its condition and what you paid. Market value and set completion follow.</p>
          <LocalizedClientLink href="/sets" className="cx-btn">Browse sets</LocalizedClientLink>
        </EmptyState>
      ) : (
        <div className="grid gap-10">
          <BinderSummary valueMinor={valueMinor} costMinor={costMinor} pricedCost={pricedCost} copies={copies} distinct={distinct} currencyCode={currencyCode} sets={sets} />
          <CardSheet label="Cards in your binder" actions marketHead="Market" priceHead="Paid" runHead="Copy">
            {cards.map((row, i) => (
              <CardRow
                key={row.id}
                index={i}
                status="owned"
                href={`/${countryCode}/cards/${row.card.id}`}
                card={{ id: row.card.id, name: row.card.name, number: row.card.number, rarity: row.card.rarity, imageUrl: row.card.imageUrl, setName: row.set?.name }}
                detail={[row.set?.name, row.finish ? finishLabel(row.finish) : null, row.grade].filter(Boolean).join(" · ")}
                run={<span className="text-[12px] text-[var(--tc-ink-2)]">{row.quantity} × {conditionLabel(row.condition)}</span>}
                market={row.marketMinor != null ? money(row.marketMinor * row.quantity, currencyCode) : "No reading"}
                price={row.costBasisMinor != null ? money(row.costBasisMinor * row.quantity, currencyCode) : <span className="font-normal text-[var(--tc-ink-3)]">—</span>}
                action={<RemoveFromBinder id={row.id} label={row.card.name} />}
              />
            ))}
          </CardSheet>
          <p className="text-[13px] text-cx-ink-3">Market value uses the latest TCGplayer Near Mint reading for each card, in US dollars.</p>
        </div>
      )}
    </div>
  )
}
