import { Metadata } from "next"

import FeaturedProducts from "@/features/storefront/modules/home/components/featured-products"
import Masthead from "@/features/storefront/modules/home/components/masthead"
import CategoryIndex from "@/features/storefront/modules/home/components/category-index"
import RecentListings from "@/features/storefront/modules/home/components/recent-listings"
import { getCategoriesList } from "@/features/storefront/lib/data/categories"
import { getCollectionsListByRegion } from "@/features/storefront/lib/data/collections"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { getStore } from "@/features/storefront/lib/data/store"
import type { StoreCollection, StoreRegion } from "@/features/storefront/types/storefront"

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore()

  return {
    title: store?.homepageTitle || store?.name || "Collectibles",
    description: store?.homepageDescription || "",
  }
}

export async function HomePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region: StoreRegion | undefined = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const [store, { collections }, { productCategories }] = await Promise.all([
    getStore(),
    getCollectionsListByRegion(0, 3, region.id) as Promise<{ collections: StoreCollection[] }>,
    getCategoriesList(0, 24),
  ])

  const categories = (productCategories || [])
    .filter((c: any) => !c.parentCategory)
    .map((c: any) => ({ id: c.id, title: c.title, handle: c.handle }))

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6">
      <Masthead title={store?.homepageTitle || store?.name} description={store?.homepageDescription} />
      <CategoryIndex categories={categories} />
      <RecentListings countryCode={countryCode} locale={region.locale} />
      {collections?.length > 0 && (
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      )}
    </div>
  )
}
