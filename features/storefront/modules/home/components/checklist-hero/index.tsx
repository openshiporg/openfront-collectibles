import Link from "next/link"
import { CardSheet, SetLogo, releaseDay } from "@/features/storefront/components/cards"
import type { CardSet, ChecklistCard } from "@/features/storefront/lib/data/cards"
import { ChecklistRow } from "@/features/storefront/modules/cards/checklist-row"
import { marketFor, rawCells } from "@/features/storefront/modules/cards/checklist-stock"
import { CardSearch } from "@/features/storefront/modules/cards/card-search"

const ROWS = 10

/** Ten rows from the featured sheet: what's held, then the set's most valuable cards the shop lacks. */
function heroRows(cards: ChecklistCard[]) {
  const singles = cards.filter((c) => c.kind === "single")
  const held = singles.filter((c) => rawCells(c).hasRaw)
  const missing = singles
    .filter((c) => !rawCells(c).hasRaw)
    .sort((a, b) => (marketFor(b)?.marketMinor ?? 0) - (marketFor(a)?.marketMinor ?? 0))
    .slice(0, Math.max(0, ROWS - held.length))
  return [...held.slice(0, ROWS), ...missing].sort((a, b) => a.number && b.number ? Number.parseInt(a.number) - Number.parseInt(b.number) : 0)
}

export function CheckListHero({
  countryCode,
  currencyCode,
  storeName,
  description,
  sets,
  checklist,
}: {
  countryCode: string
  currencyCode: string
  storeName: string
  description: string
  sets: CardSet[]
  checklist: { set: CardSet; cards: ChecklistCard[] } | null
}) {
  const set = checklist?.set
  const singles = checklist?.cards.filter((c) => c.kind === "single") ?? []
  const inStock = singles.filter((c) => rawCells(c).cells.some((cell) => cell.available)).length
  const rows = checklist ? heroRows(checklist.cards) : []
  const indexSets = sets.slice(0, 9)

  return (
    <section className="tc border-b border-cx-line" aria-label={storeName}>
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8 lg:pb-16 lg:pt-12">
        <div className="grid content-start gap-8 lg:col-start-1 lg:row-start-1">
          <div className="grid gap-4">
            <h1 className="font-cx-display text-[44px] leading-[0.95] text-cx-ink sm:text-[64px] lg:text-[72px]" style={{ fontStretch: "87.5%" }}>
              {storeName}
            </h1>
            <p className="max-w-[40ch] text-[17px] leading-[1.45] text-cx-ink-2">
              Pokémon singles by condition, graded slabs, sealed product and pre-orders. {description}
            </p>
          </div>
          <CardSearch countryCode={countryCode} />
        </div>
        <nav aria-label="Sets" className="order-last grid content-start gap-2 lg:order-none lg:col-start-1 lg:row-start-2">
            <div className="flex items-baseline justify-between border-b-2 border-cx-ink pb-2">
              <h2 className="text-[15px] font-bold text-cx-ink">Sets</h2>
              <Link href={`/${countryCode}/sets`} className="text-[14px] text-cx-ink-2 underline underline-offset-4 hover:text-cx-ink">All {sets.length}</Link>
            </div>
            <ol className="grid">
              {indexSets.map((s) => (
                <li key={s.handle}>
                  <Link
                    href={`/${countryCode}/sets/${s.handle}`}
                    className="group grid min-h-12 grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 border-b border-cx-line py-1.5 outline-none hover:bg-cx-surface focus-visible:bg-cx-surface"
                  >
                    <span className="flex h-8 items-center"><SetLogo set={s} className="h-full max-w-[76px] text-[13px]" /></span>
                    <span className="truncate text-[15px] font-semibold text-cx-ink group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                    {s.releaseStatus === "preorder" ? (
                      <span className="tc-stamp bg-cx-accent px-1.5 py-0.5 text-[11px] text-cx-bg">Pre-order</span>
                    ) : (
                      <span className="tc-num text-[13px] text-cx-ink-3">{s.cardsStocked ?? 0} in stock</span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

        {set && checklist ? (
          <div className="grid content-start gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
              <div className="grid gap-2">
                <div className="h-14 sm:h-16"><SetLogo set={set} className="h-full max-w-[220px]" /></div>
                <p className="tc-num text-[14px] text-cx-ink-2">
                  {[set.name, set.code, releaseDay(set.releaseDate)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="tc-num text-right text-[14px] text-cx-ink-2">
                <strong className="block text-[34px] font-bold leading-none text-cx-ink">{inStock}</strong>
                of {set.totalCards ?? singles.length} in stock
              </p>
            </div>
            <CardSheet label={`${set.name} checklist`} actions>
              {rows.map((card, i) => (
                <ChecklistRow key={card.id} card={card} index={i} setName={set.name} currencyCode={currencyCode} />
              ))}
            </CardSheet>
            <Link href={`/${countryCode}/sets/${set.handle}`} className="tc-btn w-fit" data-variant="line">
              Full {set.name} checklist, {set.totalCards ?? singles.length} cards
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
