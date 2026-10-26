import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { getCardProducts, getSetChecklist, getWantList } from "@/features/storefront/lib/data/cards"
import { CardSheet, FilterBar, SetSummary, releaseDay } from "@/features/storefront/components/cards"
import { ChecklistRow } from "@/features/storefront/modules/cards/checklist-row"
import { rawCells } from "@/features/storefront/modules/cards/checklist-stock"
import { JumpToNumber } from "@/features/storefront/modules/cards/jump-to-number"
import { ProductSheetRow } from "@/features/storefront/modules/cards/product-sheet-row"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ show?: string; rarity?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const region = await getRegion(countryCode)
  const data = await getSetChecklist(handle, region?.currency?.code || "usd")
  return { title: data ? `${data.set.name} checklist` : "Set" }
}

export async function SetChecklistPage(props: Props) {
  const { countryCode, handle } = await props.params
  const { show, rarity } = await props.searchParams
  const region = await getRegion(countryCode)
  const currencyCode = region?.currency?.code?.toUpperCase() || "USD"
  const [data, wants, sealed] = await Promise.all([
    getSetChecklist(handle, currencyCode),
    getWantList(currencyCode),
    getCardProducts({ countryCode, set: handle, kind: "sealed", limit: 24, sort: "price_desc" }),
  ])
  if (!data) notFound()

  const singles = data.cards.filter((c) => c.kind === "single")
  const wanted = new Set((wants ?? []).map((w: any) => w.card?.id))
  const held = singles.filter((c) => rawCells(c).cells.some((cell) => cell.available))
  const rarities = [...new Set(singles.map((c) => c.rarity).filter(Boolean))] as string[]
  let rows = singles
  if (show === "stock") rows = rows.filter((c) => rawCells(c).hasRaw)
  if (show === "missing") rows = rows.filter((c) => !rawCells(c).cells.some((cell) => cell.available))
  if (rarity) rows = rows.filter((c) => c.rarity === rarity)
  const preorder = data.set.releaseStatus === "preorder"

  return (
    <div className="tc mx-auto w-full max-w-[1320px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <SetSummary
        size="head"
        set={data.set}
        have={held.length}
        cells={singles.map((c) => rawCells(c).cells.some((cell) => cell.available))}
      />

      {preorder && singles.length === 0 ? (
        <p className="mt-12 max-w-[60ch] text-[16px] leading-[1.5] text-cx-ink-2">
          The card list for {data.set.name} is published at release on {releaseDay(data.set.releaseDate, "long")}. Pre-order sealed product above.
        </p>
      ) : (
        <section className="mt-12 grid gap-5" aria-label={`${data.set.name} checklist`}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <FilterBar
              label="Filter the checklist"
              filters={[
                { id: "show", label: "Show", allLabel: `All ${singles.length} cards`, options: [{ value: "stock", label: "Cards we stock" }, { value: "missing", label: "Cards we're out of" }] },
                { id: "rarity", label: "Rarity", allLabel: "Any rarity", options: rarities.map((r) => ({ value: r, label: r })) },
              ]}
            />
            <JumpToNumber />
          </div>
          <CardSheet label={`${data.set.name} checklist`} actions>
            {rows.map((card, i) => (
              <div key={card.id} id={`no-${(card.number ?? "").split("/")[0]}`} className="contents">
                <ChecklistRow card={card} index={i} setName={data.set.name} currencyCode={currencyCode} wanted={wanted.has(card.id)} />
              </div>
            ))}
          </CardSheet>
          {rows.length === 0 ? <p className="text-[15px] text-cx-ink-2">No cards match these filters.</p> : null}
          <p className="text-[13px] text-cx-ink-3">
            Market prices are TCGplayer market readings for Near Mint, dated on each card page. Our prices follow them by condition.
          </p>
        </section>
      )}
      {sealed.products.length > 0 ? (
        <section className="mt-16 grid gap-5" aria-label={`${data.set.name} sealed product`}>
          <h2 className="border-b-2 border-cx-ink pb-2 text-[18px] font-bold text-cx-ink">Sealed {data.set.name}</h2>
          <CardSheet label={`Sealed ${data.set.name}`} actions runHead="Stock">{sealed.products.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}</CardSheet>
        </section>
      ) : null}
    </div>
  )
}
