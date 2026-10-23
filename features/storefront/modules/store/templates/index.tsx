import { Suspense } from "react"

import SkeletonProductGrid from "@/features/storefront/modules/skeletons/templates/skeleton-product-grid"
import BrowseHeader from "@/features/storefront/modules/store/components/browse-header"
import { SortOptions } from "@/features/storefront/modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div
      className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6"
      data-testid="category-container"
    >
      <BrowseHeader title="All items" sortBy={sort} titleTestId="store-page-title" />
      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
