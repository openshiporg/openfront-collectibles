import { Metadata } from "next"

import { getRegion } from "@/features/storefront/lib/data/regions"
import { getStore } from "@/features/storefront/lib/data/store"
import { getCardProducts, getCardSets, getSetChecklist } from "@/features/storefront/lib/data/cards"
import { getPublicBuylist } from "@/features/storefront/lib/data/collectibles"
import type { StoreRegion } from "@/features/storefront/types/storefront"
import { CheckListHero } from "@/features/storefront/modules/home/components/checklist-hero"
import { Shelf } from "@/features/storefront/modules/home/components/shelf"
import { CardGrid, SetSummary } from "@/features/storefront/components/cards"
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

  return (
    <div className="pb-24">
      <CheckListHero
        countryCode={countryCode}
        currencyCode={currencyCode}
        storeName={store?.name || "Card shop"}
        description={store?.homepageDescription || ""}
        sets={sets}
        checklist={checklist}
      />

      <div className="mx-auto grid w-full max-w-[1320px] gap-16 px-4 pt-16 sm:px-6 sm:pt-20">
        {upcoming && preorders.products.length > 0 ? (
          <Shelf
            title={`${upcoming.name} pre-orders`}
            note={`Ships on the ${new Date(upcoming.releaseDate ?? "").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} street date. Limits per customer.`}
            href={`/${countryCode}/collections/delta-reign-pre-orders`}
            linkLabel="All pre-orders"
          >
            <CardGrid columns={4} label={`${upcoming.name} pre-orders`}>
              {preorders.products.map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}
            </CardGrid>
          </Shelf>
        ) : null}

        {slabs.products.length > 0 ? (
          <Shelf title="Graded slabs" note="PSA, Beckett and CGC. Each slab is one copy, shown with its grade and certificate." href={`/${countryCode}/categories/graded-slabs`} linkLabel="All slabs">
            <CardGrid columns={4} label="Graded slabs">
              {slabs.products.map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}
            </CardGrid>
          </Shelf>
        ) : null}

        {chase.products.length > 0 ? (
          <Shelf title="Chase cards" note="Special illustration rares, alt arts and the cards each set is opened for." href={`/${countryCode}/collections/chase`} linkLabel="All chase cards">
            <CardGrid columns={5} label="Chase cards">
              {chase.products.map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}
            </CardGrid>
          </Shelf>
        ) : null}

        {inStockSealed.length > 0 ? (
          <Shelf title="Sealed product" note="Booster boxes, Elite Trainer Boxes, bundles and packs, factory sealed." href={`/${countryCode}/categories/sealed-product`} linkLabel="All sealed">
            <CardGrid columns={5} label="Sealed product">
              {inStockSealed.slice(0, 10).map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}
            </CardGrid>
          </Shelf>
        ) : null}

        <BuylistTeaser buylists={buylists} countryCode={countryCode} />

        {sets.length > 0 ? (
          <Shelf title="Every set we carry" note="Each set is a full checklist: what we hold is ticked, the rest you can add to your want list." href={`/${countryCode}/sets`} linkLabel="Set index">
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
    </div>
  )
}
