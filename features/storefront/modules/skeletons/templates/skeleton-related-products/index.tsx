import repeat from "@/features/storefront/lib/util/repeat"
import SkeletonProductPreview from "@/features/storefront/modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-cx-line pb-3">
        <div className="h-8 w-48 animate-pulse rounded bg-cx-well" />
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {repeat(4).map((index) => (
          <li key={index} className={index > 1 ? "hidden md:block" : undefined}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
