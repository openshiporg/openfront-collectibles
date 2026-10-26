import { notFound } from "next/navigation"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { CardShelf, type ShelfParams } from "@/features/storefront/modules/cards/card-shelf"
import type { StorefrontProductCategory } from "@/features/storefront/types"

const NOTES: Record<string, string> = {
  singles: "Raw cards, priced by condition from Near Mint to Damaged. Every card shows its TCGplayer market reading.",
  "graded-slabs": "PSA, Beckett and CGC slabs. Each is one copy with its grade and certificate on the label.",
  "sealed-product": "Factory-sealed booster boxes, Elite Trainer Boxes, bundles and packs, including pre-orders.",
}

export default function CategoryTemplate({
  category,
  params,
  countryCode,
}: {
  category: StorefrontProductCategory
  params: ShelfParams
  countryCode: string
}) {
  if (!category || !countryCode) notFound()
  const children = category.category_children ?? []

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="category-container">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]" data-testid="category-page-title">{category.title}</h1>
      <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.5] text-cx-ink-2">{NOTES[category.handle] ?? ""}</p>
      {children.length > 0 && (
        <nav aria-label="Subcategory" className="mt-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <LocalizedClientLink key={c.id} href={`/categories/${c.handle}`} className="tc-run-cell min-h-10 px-3" data-live="true">{c.title}</LocalizedClientLink>
          ))}
        </nav>
      )}
      <div className="mt-8">
        <CardShelf countryCode={countryCode} params={params} category={category.handle} label={category.title} hideKind />
      </div>
    </div>
  )
}
