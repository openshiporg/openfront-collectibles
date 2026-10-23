import SkeletonProductGrid from "@/features/storefront/modules/skeletons/templates/skeleton-product-grid"

const bar = "animate-pulse rounded-full bg-cx-well"

/** Loading state for all items, category and collection pages. */
const SkeletonBrowsePage = ({ testId }: { testId?: string }) => (
  <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6" data-testid={testId}>
    <div className="space-y-6 pb-6 pt-8 sm:pt-12">
      <div className="h-11 w-2/3 max-w-sm animate-pulse rounded-lg bg-cx-well sm:h-14" />
      <div className="flex flex-col gap-3 border-y border-cx-line py-3 lg:flex-row lg:justify-between">
        <div className={`${bar} h-[42px] w-full max-w-md`} />
        <div className={`${bar} h-[42px] w-72`} />
      </div>
    </div>
    <SkeletonProductGrid numberOfProducts={12} />
  </div>
)

export default SkeletonBrowsePage
