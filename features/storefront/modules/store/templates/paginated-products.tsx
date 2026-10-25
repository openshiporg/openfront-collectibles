import { getProductsListWithSort, getProductsListByPrice } from "../../../lib/data/products"
import { getRegion } from "../../../lib/data/regions"
import ProductPreview from "../../products/components/product-preview"
import { Pagination } from "../components/pagination"
import { SortOptions } from "../components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type GetProductsListParams = {
  limit: number
  collectionId?: string
  categoryId?: string
  id?: string[]
  isGiftcard?: boolean
}

export default async function PaginatedProducts({
  sortBy: sortByOption,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  label,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  label?: string | null
}) {
  const queryParams: GetProductsListParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collectionId"] = collectionId
  }

  if (categoryId) {
    queryParams["categoryId"] = categoryId
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let products: any[] = []
  let count = 0

  // Use different queries based on sort option
  if (sortByOption === "price_asc" || sortByOption === "price_desc") {
    // Use the custom price sorting query
    const priceOrder = sortByOption === "price_asc" ? "asc" : "desc"
    const result = await getProductsListByPrice({
      page,
      queryParams,
      priceOrder,
      countryCode,
    })
    products = result.response.products
    count = result.response.count
  } else {
    // Use standard sorting (created_at)
    const result = await getProductsListWithSort({
      page,
      queryParams,
      sortBy: { createdAt: "desc" },
      countryCode,
    })
    products = result.response.products
    count = result.response.count
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <p className="cx-num mb-4 text-[13px] text-cx-ink-3" data-testid="products-count">
        {count} {count === 1 ? "item" : "items"}
      </p>
      {products.length === 0 ? (
        <div className="cx-band flex min-h-48 flex-col items-start justify-center gap-4 p-6">
          <p className="font-cx-serif text-[22px] text-cx-ink">No items here yet</p>
        </div>
      ) : (
        <ul
          className="grid w-full grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4"
          data-testid="products-list"
        >
          {products.map((p: any) => {
            return (
              <li key={p.id}>
                <ProductPreview productPreview={p as any} region={region as any} label={label} />
              </li>
            )
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
