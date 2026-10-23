import repeat from "@/features/storefront/lib/util/repeat"
import SkeletonProductPreview from "@/features/storefront/modules/skeletons/components/skeleton-product-preview"

const block = "animate-pulse rounded-lg bg-cx-well"

const SkeletonHomePage = () => (
  <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 sm:px-6">
    <div className="space-y-4 border-b border-cx-line pb-12 pt-12 sm:pt-20">
      <div className={`${block} h-14 w-4/5 max-w-2xl sm:h-20`} />
      <div className={`${block} h-5 w-3/5 max-w-lg`} />
    </div>
    <ul className="divide-y divide-cx-line border-b border-cx-line">
      {repeat(5).map((i) => (
        <li key={i} className="flex items-center gap-4 py-5">
          <div className={`${block} h-4 w-6`} />
          <div className={`${block} h-8 w-48`} />
        </li>
      ))}
    </ul>
    <div className="space-y-6 pt-16">
      <div className={`${block} h-8 w-56`} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {repeat(4).map((i) => (
          <li key={i} className={i > 1 ? "hidden md:block" : undefined}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  </div>
)

export default SkeletonHomePage
