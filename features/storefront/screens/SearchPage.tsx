import { Metadata } from "next"

import { getRegion } from "@/features/storefront/lib/data/regions"
import { searchProducts } from "@/features/storefront/lib/data/products"
import ProductPreview from "@/features/storefront/modules/products/components/product-preview"
import SearchForm from "@/features/storefront/modules/store/components/search-form"
import SaveSearch from "@/features/storefront/modules/store/components/search-form/save-search"
import { getUser } from "@/features/storefront/lib/data/user"

export const metadata: Metadata = {
  title: "Search",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

export async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const raw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q
  const query = String(raw || "").trim().slice(0, 80)

  const [region, customer] = await Promise.all([getRegion(countryCode), getUser().catch(() => null)])
  let failed = false
  let result: { products: any[]; count: number } = { products: [], count: 0 }
  if (query && region) {
    try {
      result = await searchProducts({ query, countryCode })
    } catch {
      failed = true
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="search-container">
      <h1 className="font-cx-display font-extrabold text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px]">
        Search
      </h1>
      <div className="mt-5 max-w-[640px]">
        <SearchForm countryCode={countryCode} defaultValue={query} autoFocus={!query} />
      </div>
      {query && customer && !failed && (
        <div className="mt-3">
          <SaveSearch key={query} query={query} />
        </div>
      )}

      {query && (
        <div className="mt-10">
          <p className="cx-num mb-4 text-[13px] text-cx-ink-3" data-testid="search-count">
            {failed ? "Search unavailable" : `${result.count} ${result.count === 1 ? "item" : "items"} for “${query}”`}
          </p>
          {!failed && result.products.length === 0 ? (
            <div className="cx-band flex min-h-40 items-center p-6">
              <p className="font-cx-serif text-[22px] text-cx-ink">No matching items</p>
            </div>
          ) : (
            region && (
              <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4" data-testid="search-results">
                {result.products.map((product) => (
                  <li key={product.id}>
                    <ProductPreview productPreview={product} region={region as any} />
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
    </div>
  )
}
