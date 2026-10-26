import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCardMarket, getCardProducts, getSetChecklist } from "@/features/storefront/lib/data/cards"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { CardDetail } from "@/features/storefront/modules/cards/card-detail"
import { CardSheet } from "@/features/storefront/components/cards"
import { ProductSheetRow } from "@/features/storefront/modules/cards/product-sheet-row"

type Props = { params: Promise<{ countryCode: string; id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  const market = await getCardMarket(id)
  return { title: market ? `${market.card.name}${market.card.number ? ` ${market.card.number}` : ""}${market.set ? `, ${market.set.name}` : ""}` : "Card" }
}

/** Any card in the catalog, stocked or not: its facts, market record, binder and want list. */
export async function CatalogCardPage(props: Props) {
  const { countryCode, id } = await props.params
  const market = await getCardMarket(id)
  if (!market) notFound()
  const region = await getRegion(countryCode)
  const currencyCode = region?.currency?.code?.toUpperCase() || "USD"
  const [checklist, setProducts] = await Promise.all([
    market.set ? getSetChecklist(market.set.handle, currencyCode) : Promise.resolve(null),
    market.set ? getCardProducts({ countryCode, set: market.set.handle, limit: 60 }) : Promise.resolve({ products: [], count: 0 }),
  ])
  const copies = setProducts.products.filter((p) => p.catalogItem?.id === id)
  const primaryFinish = Object.keys(checklist?.cards.find((c) => c.id === id)?.market ?? {})[0] ?? null

  return (
    <>
      <CardDetail
        countryCode={countryCode}
        card={market.card}
        set={market.set}
        readings={market.readings}
        primaryFinish={primaryFinish}
        purchase={
          copies.length === 0 ? (
            <section className="tc grid gap-2 border-y-2 border-cx-ink py-5" aria-label="Availability">
              <p className="text-[18px] font-semibold text-cx-ink">Not in stock</p>
              <p className="max-w-[52ch] text-[15px] leading-[1.5] text-cx-ink-2">
                We don&apos;t hold a copy of this card right now. Add it to your want list and it shows as in stock there when one arrives.
              </p>
            </section>
          ) : null
        }
      />
      {copies.length > 0 ? (
        <section className="tc mx-auto grid w-full max-w-[1320px] gap-5 px-4 pb-24 sm:px-6" aria-label="Copies in stock">
          <h2 className="border-b-2 border-cx-ink pb-2 text-[18px] font-bold text-cx-ink">In stock</h2>
          <CardSheet label="In stock" actions>{copies.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}</CardSheet>
        </section>
      ) : null}
    </>
  )
}
