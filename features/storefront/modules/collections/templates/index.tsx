import { CardShelf, type ShelfParams } from "@/features/storefront/modules/cards/card-shelf"
import type { StorefrontCollection } from "@/features/storefront/types"

export default function CollectionTemplate({
  collection,
  params,
  countryCode,
}: {
  collection: StorefrontCollection
  params: ShelfParams
  countryCode: string
}) {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="collection-container">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]">{collection.title}</h1>
      <div className="mt-8">
        <CardShelf countryCode={countryCode} params={params} collection={collection.handle} label={collection.title} />
      </div>
    </div>
  )
}
