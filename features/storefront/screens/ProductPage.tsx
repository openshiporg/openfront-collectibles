import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle } from "@/features/storefront/lib/data/products"
import { getRegion } from "@/features/storefront/lib/data/regions"
import ProductTemplate from "@/features/storefront/modules/products/templates"
import { CollectibleEvidencePanel } from "@/features/storefront/modules/products/components/collectible-evidence"
import { getPublicCollectibleListingForVariant } from "@/features/storefront/lib/data/collectibles"
import { StoreProduct, StoreRegion } from "@/features/storefront/types/storefront"
import { getCardMarket, getCardProducts, getProductCard } from "@/features/storefront/lib/data/cards"
import { slabFromGrading } from "@/features/storefront/lib/collectible-evidence-presentation"
import { GRADERS } from "@/features/keystone/lib/pokemon/card-enums"
import { CardDetail } from "@/features/storefront/modules/cards/card-detail"
import { CardBuyPanel } from "@/features/storefront/modules/cards/card-buy-panel"
import { ProductCardTile, slabGrade } from "@/features/storefront/modules/cards/product-card-tile"
import { CardGrid, CardSheet } from "@/features/storefront/components/cards"
import { ProductSheetRow } from "@/features/storefront/modules/cards/product-sheet-row"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params
  const region: StoreRegion | undefined = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const { product }: { product: StoreProduct | null } = await getProductByHandle({
    handle,
    regionId: region.id,
  })

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title}`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title}`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export async function ProductPage(props: Props) {
  const params = await props.params
  const { handle, countryCode } = params
  const region: StoreRegion | undefined = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const { product }: { product: StoreProduct | null } = await getProductByHandle({
    handle,
    regionId: region.id,
  })

  if (!product) {
    notFound()
  }

  let collectibleListing: any = null
  let collectibleEvidenceUnavailable = false
  if (product.productVariants?.length === 1) {
    try {
      collectibleListing = await getPublicCollectibleListingForVariant(product.productVariants[0].id, countryCode)
    } catch {
      collectibleEvidenceUnavailable = true
    }
  }

  const card = await getProductCard(handle)
  if (card?.catalogItem) {
    const item = card.catalogItem
    const currencyCode = region.currency?.code?.toUpperCase() || "USD"
    const [market, setMore] = await Promise.all([
      getCardMarket(item.id),
      item.collectibleSet ? getCardProducts({ countryCode, set: item.collectibleSet.handle, limit: 11, sort: "price_desc" }) : Promise.resolve({ products: [], count: 0 }),
    ])
    const priced = new Map((product.productVariants ?? []).map((v: any) => [v.id, v.prices?.[0]?.amount ?? null]))
    const variants = (card.productVariants ?? []).map((v: any) => ({
      id: v.id,
      stockKind: v.stockKind,
      condition: v.cardCondition,
      finish: v.cardFinish,
      quantity: Math.max(0, v.inventoryQuantity ?? 0),
      priceMinor: priced.get(v.id) ?? null,
      preorder: Boolean(v.preorder),
      preorderReleaseDate: v.preorderReleaseDate,
      preorderLimitPerCustomer: v.preorderLimitPerCustomer,
    }))
    const graded = variants.some((v: any) => v.stockKind === "graded")
    const evidence = slabFromGrading(collectibleListing?.extension?.value?.observations?.grading)
    const fallback = graded ? slabGrade({ ...(product as any), subtitle: (product as any).subtitle ?? null }) : null
    const company = evidence?.company || fallback?.company || null
    const certificate = evidence?.certificate || null
    const template = GRADERS.find((g) => g.value === company)?.certUrl
    const sample = certificate ? certificate.startsWith("SAMPLE-") : false
    const grade = graded && company && (evidence?.grade || fallback?.grade)
      ? {
          company,
          grade: (evidence?.grade || fallback?.grade) as string,
          label: evidence?.gradeLabel || fallback?.label || null,
          certificate,
          sample,
          certificateUrl: certificate && !sample && template ? template.replace("{cert}", encodeURIComponent(certificate)) : null,
        }
      : null
    const preorderVariant = variants.find((v: any) => v.preorder)
    const sameCard = setMore.products.filter((p) => p.handle !== product.handle && p.catalogItem?.id === item.id)
    const moreFromSet = setMore.products.filter((p) => p.handle !== product.handle && p.catalogItem?.id !== item.id).slice(0, 5)
    const set = item.collectibleSet
      ? { ...item.collectibleSet, code: item.collectibleSet.code || null, series: item.collectibleSet.series || null, logoUrl: item.collectibleSet.logoUrl || null, symbolUrl: item.collectibleSet.symbolUrl || null }
      : null
    return (
      <>
        <CardDetail
          countryCode={countryCode}
          card={{
            id: item.id, name: item.title, number: item.cardNumber || null, rarity: item.rarity || null, supertype: item.supertype || null,
            energyTypes: Array.isArray(item.energyTypes) ? item.energyTypes : [], hp: item.hp || null, artist: item.artist || null,
            imageUrl: item.imageUrl || product.thumbnail || null, imageLargeUrl: item.imageLargeUrl || null, kind: item.kind, sealedFormat: item.sealedFormat || null,
          }}
          title={item.kind === "sealed" ? product.title : undefined}
          set={set}
          readings={market?.readings ?? []}
          grade={grade}
          slabYear={item.collectibleSet?.releaseDate ? new Date(item.collectibleSet.releaseDate).getUTCFullYear() : null}
          primaryFinish={variants.find((v: any) => v.finish)?.finish ?? null}
          preorder={preorderVariant ? { releaseDate: preorderVariant.preorderReleaseDate, limit: preorderVariant.preorderLimitPerCustomer } : null}
          purchase={<CardBuyPanel variants={variants} currencyCode={currencyCode} />}
        />
        {sameCard.length > 0 || moreFromSet.length > 0 ? (
          <div className="mx-auto grid w-full max-w-[1320px] gap-14 px-4 pb-24 sm:px-6">
            {sameCard.length > 0 ? (
              <section className="grid gap-5" aria-label="Other copies of this card">
                <h2 className="border-b-2 border-cx-ink pb-2 text-[18px] font-bold text-cx-ink">Other copies of {item.title}</h2>
                <CardGrid columns={5}>{sameCard.map((p) => <ProductCardTile key={p.id} product={p} countryCode={countryCode} />)}</CardGrid>
              </section>
            ) : null}
            {moreFromSet.length > 0 && item.collectibleSet ? (
              <section className="grid gap-5" aria-label={`More from ${item.collectibleSet.name}`}>
                <h2 className="border-b-2 border-cx-ink pb-2 text-[18px] font-bold text-cx-ink">More from {item.collectibleSet.name}</h2>
                <CardSheet label={`More from ${item.collectibleSet.name}`} actions>{moreFromSet.map((p, i) => <ProductSheetRow key={p.id} product={p} index={i} />)}</CardSheet>
              </section>
            ) : null}
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <ProductTemplate
        product={product}
        region={region}
        countryCode={countryCode}
        collectibleListing={collectibleListing}
      >
        <CollectibleEvidencePanel result={collectibleListing} unavailable={collectibleEvidenceUnavailable} />
      </ProductTemplate>
    </>
  )
}
