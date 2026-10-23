import { getProductsList } from "@/features/storefront/lib/data/products"
import { StoreCollection, StoreRegion } from "@/features/storefront/types/storefront"

import SectionHead from "@/features/storefront/modules/common/components/collectibles/section-head"
import ProductPreview from "@/features/storefront/modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: StoreCollection
  region: StoreRegion
}) {
  const {
    response: { products },
  } = await getProductsList({
    countryCode: region.countries?.[0]?.iso2 || "us",
    queryParams: {
      collectionId: collection.id,
    },
  })
  const pricedProducts = products

  if (!pricedProducts?.length) {
    return null
  }

  return (
    <section className="space-y-6 pt-16 sm:pt-20">
      <SectionHead title={collection.title} href={`/collections/${collection.handle}`} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {pricedProducts.slice(0, 8).map((product: any) => (
          <li key={product.id}>
            <ProductPreview productPreview={product} region={region} isFeatured label={collection.title} />
          </li>
        ))}
      </ul>
    </section>
  )
}
