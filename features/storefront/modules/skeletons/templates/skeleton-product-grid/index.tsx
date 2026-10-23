import repeat from "@/features/storefront/lib/util/repeat"
import SkeletonProductPreview from "@/features/storefront/modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) => {
  return (
    <div>
      <div className="mb-4 h-3.5 w-16 animate-pulse rounded bg-cx-well" />
      <ul
        className="grid w-full flex-1 grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4"
        data-testid="products-list-loader"
      >
        {repeat(numberOfProducts).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonProductGrid
