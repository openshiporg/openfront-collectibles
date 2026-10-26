import Link from "next/link"
import { getCardFacets, getCardProducts } from "@/features/storefront/lib/data/cards"
import type { CardShelfQuery } from "@/features/storefront/lib/data/cards"
import { CardGrid, CardSheet, FilterBar, conditionLabel, languageLabel } from "@/features/storefront/components/cards"
import { ProductSheetRow } from "./product-sheet-row"
import { ProductCardTile } from "./product-card-tile"

export type ShelfParams = { set?: string; rarity?: string; condition?: string; language?: string; kind?: string; price?: string; sortBy?: string; page?: string }

const PAGE = 30
const PRICE_CAPS = [1000, 2500, 5000, 10000, 25000, 50000]

/** A browse shelf of card products with the card filters above it; every filter lives in the URL. */
export async function CardShelf({
  countryCode,
  params,
  category,
  collection,
  label,
  hideKind,
}: {
  countryCode: string
  params: ShelfParams
  category?: string
  collection?: string
  label: string
  hideKind?: boolean
}) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1") || 1)
  const sort: CardShelfQuery["sort"] = params.sortBy === "price_asc" ? "price_asc" : params.sortBy === "price_desc" ? "price_desc" : params.sortBy === "set" ? "set" : "newest"
  const kind = params.kind === "raw" || params.kind === "graded" || params.kind === "sealed" ? params.kind : undefined
  const priceMax = params.price && /^\d+$/.test(params.price) ? Number(params.price) : undefined
  const [facets, { products, count }] = await Promise.all([
    getCardFacets(countryCode),
    getCardProducts({
      countryCode, category, collection, kind, set: params.set, rarity: params.rarity, condition: params.condition, language: params.language,
      priceMaxMinor: priceMax, sort, limit: PAGE, offset: (page - 1) * PAGE,
    }),
  ])
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const pageHref = (n: number) => {
    const q = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== "page") as [string, string][])
    if (n > 1) q.set("page", String(n))
    return `?${q.toString()}`
  }

  return (
    <div className="tc grid gap-8">
      <FilterBar
        label={`Filter ${label}`}
        filters={[
          ...(hideKind ? [] : [{ id: "kind", label: "Kind", allLabel: "Everything", options: [{ value: "raw", label: "Singles" }, { value: "graded", label: "Graded slabs" }, { value: "sealed", label: "Sealed" }] }]),
          { id: "set", label: "Set", allLabel: "Any set", options: facets.sets },
          { id: "rarity", label: "Rarity", allLabel: "Any rarity", options: facets.rarities.map((r) => ({ value: r, label: r })) },
          { id: "condition", label: "Condition", allLabel: "Any condition", options: ["NM", "LP", "MP", "HP", "DMG"].map((c) => ({ value: c, label: conditionLabel(c) })) },
          { id: "language", label: "Language", allLabel: "Any language", options: facets.languages.map((l) => ({ value: l, label: languageLabel(l) })) },
          { id: "price", label: "Price", allLabel: "Any price", options: PRICE_CAPS.map((c) => ({ value: String(c), label: `Up to $${c / 100}` })) },
          { id: "sortBy", label: "Sort", allLabel: "Newest", options: [{ value: "price_asc", label: "Price, low to high" }, { value: "price_desc", label: "Price, high to low" }, { value: "set", label: "Set and number" }] },
        ]}
      />
      <p className="tc-num text-[13px] text-cx-ink-3" aria-live="polite">{count} {count === 1 ? "product" : "products"}</p>
      {products.length === 0 ? (
        <div className="grid gap-3 border-y border-cx-line py-10">
          <p className="text-[18px] font-semibold text-cx-ink">Nothing matches these filters</p>
          <p className="text-[15px] text-cx-ink-2">Clear a filter, or look the card up in its <Link href={`/${countryCode}/sets`} className="underline underline-offset-4">set checklist</Link> and add it to your want list.</p>
        </div>
      ) : category === "graded-slabs" || kind === "graded" ? (
        // Slabs read by their label, so they keep the slab tile.
        <CardGrid columns={4} label={label}>
          {products.map((p, i) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} eager={i < 4} />)}
        </CardGrid>
      ) : (
        <CardSheet label={label} actions>
          {products.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}
        </CardSheet>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined} className="tc-run-cell min-h-10 min-w-10" data-live="true" data-selected={n === page ? "true" : undefined}>
              {n}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
