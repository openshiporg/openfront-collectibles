import { Metadata } from "next"

import { getRegion } from "@/features/storefront/lib/data/regions"
import { getStore } from "@/features/storefront/lib/data/store"
import { getCardProducts, getCardSets, getSetChecklist } from "@/features/storefront/lib/data/cards"
import { getPublicBuylist } from "@/features/storefront/lib/data/collectibles"
import type { StoreRegion } from "@/features/storefront/types/storefront"
import { CheckListHero } from "@/features/storefront/modules/home/components/checklist-hero"
import { Shelf } from "@/features/storefront/modules/home/components/shelf"
import { CardGrid, CardSheet, SetSummary } from "@/features/storefront/components/cards"
import { ProductSheetRow } from "@/features/storefront/modules/cards/product-sheet-row"
import { ProductCardTile } from "@/features/storefront/modules/cards/product-card-tile"
import { BuylistTeaser } from "@/features/storefront/modules/home/components/buylist-teaser"

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore()

  return {
    title: store?.name ? `${store.name}: ${store.homepageTitle || "Pokémon cards"}` : store?.homepageTitle || "Pokémon cards",
    description: store?.homepageDescription || "",
  }
}

export async function HomePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region: StoreRegion | undefined = await getRegion(countryCode)
  if (!region) return null
  const currencyCode = region.currency?.code?.toUpperCase() || "USD"

  const [store, sets, preorders, slabs, chase, sealed, buylists] = await Promise.all([
    getStore(),
    getCardSets(currencyCode),
    getCardProducts({ countryCode, preorder: true, limit: 8, sort: "price_desc" }),
    getCardProducts({ countryCode, kind: "graded", limit: 8, sort: "price_desc" }),
    getCardProducts({ countryCode, collection: "chase", kind: "raw", limit: 10, sort: "price_desc" }),
    getCardProducts({ countryCode, kind: "sealed", limit: 40, sort: "set" }),
    getPublicBuylist(),
  ])

  // The featured sheet: the newest released set the shop holds at least five singles from.
  const released = sets.filter((s) => s.releaseStatus !== "preorder")
  const featuredSet = released.find((s) => (s.cardsStocked ?? 0) >= 5) ?? [...released].sort((a, b) => (b.cardsStocked ?? 0) - (a.cardsStocked ?? 0))[0]
  const checklist = featuredSet ? await getSetChecklist(featuredSet.handle, currencyCode) : null
  const upcoming = sets.find((s) => s.releaseStatus === "preorder") ?? null
  const inStockSealed = sealed.products.filter((p) => !p.productVariants.some((v) => v.preorder))
  const hasShelves = Boolean(
    (upcoming && preorders.products.length) || slabs.products.length || chase.products.length ||
    inStockSealed.length || buylists?.[0]?.entries?.length || sets.length,
  )

  return (
    <div className={hasShelves ? "pb-24" : undefined}>
      <CheckListHero
        countryCode={countryCode}
        currencyCode={currencyCode}
        storeName={store?.name || "Card shop"}
        description={store?.homepageDescription || ""}
        sets={sets}
        checklist={checklist}
      />

      {hasShelves ? (
      <div className="mx-auto grid w-full max-w-[1320px] gap-16 px-4 pt-16 sm:px-6 sm:pt-20">
        {upcoming && preorders.products.length > 0 ? (
          <Shelf title={`${upcoming.name} pre-orders`} href={`/${countryCode}/collections/delta-reign-pre-orders`} linkLabel="All pre-orders">
            <CardSheet label={`${upcoming.name} pre-orders`} actions runHead="" priceHead="Price">
              {preorders.products.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}
            </CardSheet>
          </Shelf>
        ) : null}

        {slabs.products.length > 0 ? (
          <Shelf title="Graded slabs" href={`/${countryCode}/categories/graded-slabs`} linkLabel="All slabs">
            <CardGrid columns={4} label="Graded slabs">
              {slabs.products.map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}
            </CardGrid>
          </Shelf>
        ) : null}

        {chase.products.length > 0 ? (
          <Shelf title="Chase cards" href={`/${countryCode}/collections/chase`} linkLabel="All chase cards">
            <CardSheet label="Chase cards" actions>
              {chase.products.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}
            </CardSheet>
          </Shelf>
        ) : null}

        {inStockSealed.length > 0 ? (
          <Shelf title="Sealed product" href={`/${countryCode}/categories/sealed-product`} linkLabel="All sealed">
            <CardSheet label="Sealed product" actions runHead="Stock">
              {inStockSealed.slice(0, 10).map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}
            </CardSheet>
          </Shelf>
        ) : null}

        <BuylistTeaser buylists={buylists} countryCode={countryCode} />

        {sets.length > 0 ? (
          <Shelf title="Every set we carry" href={`/${countryCode}/sets`} linkLabel="Set index">
            <ul className="tc grid divide-y divide-[var(--tc-line)] border-y border-[var(--tc-line)] sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0">
              {sets.map((set) => (
                <li key={set.handle} className="sm:border-b sm:border-[var(--tc-line)]">
                  <SetSummary set={set} have={set.cardsStocked ?? 0} href={`/${countryCode}/sets/${set.handle}`} />
                </li>
              ))}
            </ul>
          </Shelf>
        ) : null}
      </div>
      ) : null}
    </div>
  )
}
