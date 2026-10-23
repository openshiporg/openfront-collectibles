import { Suspense } from "react"

import SkeletonProductGrid from "@/features/storefront/modules/skeletons/templates/skeleton-product-grid"
import BrowseHeader from "@/features/storefront/modules/store/components/browse-header"
import { SortOptions } from "@/features/storefront/modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@/features/storefront/modules/store/templates/paginated-products"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import type { StorefrontCollection } from "@/features/storefront/types"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: StorefrontCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6" data-testid="collection-container">
      <BrowseHeader
        title={collection.title}
        sortBy={sort}
        showCategories={false}
        eyebrow={
          <LocalizedClientLink href="/store" className="inline-flex min-h-11 items-center hover:text-cx-ink">
            Collection
          </LocalizedClientLink>
        }
      />
      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={collection.products?.length || 8}
          />
        }
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          collectionId={collection.id}
          countryCode={countryCode}
          label={collection.title}
        />
      </Suspense>
    </div>
  )
}
