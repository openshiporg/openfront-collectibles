import type { ReactNode } from "react"

import { getCategoriesList } from "@/features/storefront/lib/data/categories"
import { Track, PillLink } from "@/features/storefront/modules/common/components/collectibles/track"
import RefinementList from "@/features/storefront/modules/store/components/refinement-list"
import { SortOptions } from "@/features/storefront/modules/store/components/refinement-list/sort-products"

/**
 * Browse page head: serif title, category track and sort track.
 * `activeCategory` is the handle of the current top-level category, if any.
 */
export default async function BrowseHeader({
  title,
  eyebrow,
  sortBy,
  activeCategory,
  showCategories = true,
  titleTestId,
  children,
}: {
  title: string
  eyebrow?: ReactNode
  sortBy: SortOptions
  activeCategory?: string
  showCategories?: boolean
  titleTestId?: string
  children?: ReactNode
}) {
  const { productCategories } = showCategories ? await getCategoriesList(0, 24) : { productCategories: [] }
  const topLevel = (productCategories || []).filter((c: any) => !c.parentCategory)

  return (
    <header className="space-y-6 pb-6 pt-8 sm:pt-12">
      <div className="space-y-2">
        {eyebrow && <div className="text-[13px] text-cx-ink-2">{eyebrow}</div>}
        <h1
          className="font-cx-serif text-[40px] leading-[44px] tracking-[-0.015em] text-cx-ink sm:text-[56px] sm:leading-[58px]"
          data-testid={titleTestId}
        >
          {title}
        </h1>
      </div>
      {children}
      <div className="flex flex-col gap-3 border-y border-cx-line py-3 lg:flex-row lg:items-center lg:justify-between">
        {topLevel.length > 0 ? (
          <Track label="Category" className="self-start">
            <PillLink href="/store" active={!activeCategory}>
              All
            </PillLink>
            {topLevel.map((c: any) => (
              <PillLink key={c.id} href={`/categories/${c.handle}`} active={activeCategory === c.handle}>
                {c.title}
              </PillLink>
            ))}
          </Track>
        ) : (
          <span />
        )}
        <RefinementList sortBy={sortBy} data-testid="sort-by-container" />
      </div>
    </header>
  )
}
