import { Metadata } from "next"

import { getRegion } from "@/features/storefront/lib/data/regions"
import { getCardProducts, searchCatalog } from "@/features/storefront/lib/data/cards"
import SaveSearch from "@/features/storefront/modules/store/components/search-form/save-search"
import { getUser } from "@/features/storefront/lib/data/user"
import { CardRow, CardSheet } from "@/features/storefront/components/cards"
import { CardSearch } from "@/features/storefront/modules/cards/card-search"
import { ProductSheetRow } from "@/features/storefront/modules/cards/product-sheet-row"

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
  const [stock, catalog] = query && region
    ? await Promise.all([getCardProducts({ countryCode, search: query, limit: 30, sort: "price_desc" }), searchCatalog(query)])
    : [{ products: [], count: 0 }, []]
  const stockedIds = new Set(stock.products.map((p) => p.catalogItem?.id))
  const elsewhere = catalog.filter((c: any) => !stockedIds.has(c.id))

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12" data-testid="search-container">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]">Search</h1>
      <div className="mt-6 max-w-[640px]">
        <CardSearch countryCode={countryCode} defaultValue={query} autoFocus={!query} />
      </div>
      {query && customer ? (
        <div className="mt-3">
          <SaveSearch key={query} query={query} />
        </div>
      ) : null}

      {query ? (
        <div className="mt-10 grid gap-14">
          <section className="grid gap-5" aria-label="In stock">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[18px] font-bold text-cx-ink">In stock</h2>
              <span className="tc-num text-[13px] text-cx-ink-3" data-testid="search-count">{stock.count} for “{query}”</span>
            </div>
            {stock.products.length ? (
              <CardSheet label="Search results in stock" actions>
                {stock.products.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}
              </CardSheet>
            ) : (
              <p className="text-[15px] text-cx-ink-2">Nothing in stock matches. The catalog below has every printed card.</p>
            )}
          </section>
          {elsewhere.length > 0 ? (
            <section className="grid gap-5" aria-label="In the catalog">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[18px] font-bold text-cx-ink">In the catalog</h2>
                <span className="tc-num text-[13px] text-cx-ink-3">{elsewhere.length} cards</span>
              </div>
              <CardSheet label="Catalog matches" heads={false}>
                {elsewhere.map((c: any, i: number) => (
                  <CardRow
                    key={c.id}
                    index={i}
                    status="none"
                    href={`/${countryCode}/cards/${c.id}`}
                    card={{ id: c.id, name: c.title, number: c.cardNumber, rarity: c.rarity, imageUrl: c.imageUrl, setName: c.collectibleSet?.name }}
                    detail={c.collectibleSet?.name}
                  />
                ))}
              </CardSheet>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
