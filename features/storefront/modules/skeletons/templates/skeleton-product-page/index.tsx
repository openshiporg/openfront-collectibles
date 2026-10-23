import SkeletonRelatedProducts from "@/features/storefront/modules/skeletons/templates/skeleton-related-products"

const block = "animate-pulse rounded-lg bg-cx-well"

const SkeletonProductPage = () => (
  <>
    <div
      className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:pt-10"
      data-testid="product-container-skeleton"
    >
      <div className={`${block} aspect-[4/5] w-full !rounded-[14px]`} />
      <div className="space-y-5">
        <div className={`${block} h-4 w-28`} />
        <div className={`${block} h-10 w-4/5`} />
        <div className={`${block} h-7 w-32`} />
        <div className={`${block} h-40 w-full !rounded-[14px]`} />
        <div className="h-12 w-full animate-pulse rounded-full bg-cx-well" />
      </div>
    </div>
    <div className="mx-auto w-full max-w-[1320px] px-4 py-16 sm:px-6">
      <SkeletonRelatedProducts />
    </div>
  </>
)

export default SkeletonProductPage
