import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@/features/storefront/modules/skeletons/templates/skeleton-product-grid"
import BrowseHeader from "@/features/storefront/modules/store/components/browse-header"
import { SortOptions } from "@/features/storefront/modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@/features/storefront/modules/store/templates/paginated-products"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { Track, PillLink } from "@/features/storefront/modules/common/components/collectibles/track"
import type { StorefrontProductCategory } from "@/features/storefront/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: StorefrontProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  if (!category || !countryCode) notFound()

  // Walk up to the root so the trail and the active top-level category are known.
  const parents: StorefrontProductCategory[] = []
  let cursor = category.parent_category
  while (cursor && parents.length < 6) {
    parents.unshift(cursor)
    cursor = cursor.parent_category
  }
  const root = parents[0] ?? category
  const children = category.category_children ?? []

  return (
    <div
      className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6"
      data-testid="category-container"
    >
      <BrowseHeader
        title={category.title}
        sortBy={sort}
        activeCategory={root.handle}
        titleTestId="category-page-title"
        eyebrow={
          parents.length > 0 ? (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2">
              {parents.map((parent) => (
                <span key={parent.id} className="inline-flex items-center gap-2">
                  <LocalizedClientLink
                    className="inline-flex min-h-11 items-center hover:text-cx-ink"
                    href={`/categories/${parent.handle}`}
                    data-testid="sort-by-link"
                  >
                    {parent.title}
                  </LocalizedClientLink>
                  <span aria-hidden="true" className="text-cx-ink-3">/</span>
                </span>
              ))}
            </nav>
          ) : undefined
        }
      >
        {children.length > 0 && (
          <Track label="Subcategory">
            {children.map((c) => (
              <PillLink key={c.id} href={`/categories/${c.handle}`}>
                {c.title}
              </PillLink>
            ))}
          </Track>
        )}
      </BrowseHeader>
      <Suspense fallback={<SkeletonProductGrid numberOfProducts={8} />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={category.id}
          countryCode={countryCode}
          label={category.title}
        />
      </Suspense>
    </div>
  )
}
