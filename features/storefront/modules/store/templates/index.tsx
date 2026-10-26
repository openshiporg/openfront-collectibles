import { CardShelf, type ShelfParams } from "@/features/storefront/modules/cards/card-shelf"

const StoreTemplate = ({ params, countryCode }: { params: ShelfParams; countryCode: string }) => {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="category-container">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]" data-testid="store-page-title">All products</h1>
      <p className="mb-8 mt-4 max-w-[60ch] text-[16px] leading-[1.5] text-cx-ink-2">Singles by condition, graded slabs and sealed product, across every set we carry.</p>
      <CardShelf countryCode={countryCode} params={params} label="All products" />
    </div>
  )
}

export default StoreTemplate
