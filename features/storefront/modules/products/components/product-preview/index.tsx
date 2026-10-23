import { getProductPrice } from "@/features/storefront/lib/util/get-product-price"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { retrievePricedProductById } from "@/features/storefront/lib/data/products"

import { StoreRegion } from "@/features/storefront/types/storefront";

interface ProductPreviewProps {
  productPreview: {
    id: string
    handle: string
    thumbnail: any
    title: string
  }
  isFeatured?: boolean
  region: StoreRegion;
  /** Category or collection shown on the no-photo art. */
  label?: string | null
}

export default async function ProductPreview({
  productPreview,
  isFeatured,
  region,
  label,
}: ProductPreviewProps) {
  const product = await retrievePricedProductById({
    id: productPreview.id,
    regionId: region.id,
  }).then((response) => response.product)

  if (!product) {
    return null
  }

  const firstVariantId = product.productVariants?.[0]?.id || null
  const { cheapestPrice } = getProductPrice({
    product,
    variantId: firstVariantId,
    region,
  })
  const soldOut =
    (product.productVariants?.length ?? 0) > 0 &&
    product.productVariants.every((v: any) => (v.inventoryQuantity ?? 0) <= 0)

  return (
    <LocalizedClientLink
      href={`/products/${productPreview.handle}`}
      className="group block rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cx-accent"
      data-testid="product-wrapper"
    >
      <div className="flex flex-col gap-3">
        <Thumbnail
          thumbnail={productPreview.thumbnail}
          size="full"
          isFeatured={isFeatured}
          title={productPreview.title}
          label={label}
        />
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 font-cx-serif text-[16px] leading-[20px] text-cx-ink sm:text-[17px] sm:leading-[22px]" data-testid="product-title">
            {productPreview.title}
          </h3>
          <div className="flex items-baseline justify-between gap-2">
            {cheapestPrice ? (
              <PreviewPrice price={cheapestPrice} region={region} />
            ) : (
              <span className="text-[13px] text-cx-ink-3">Price not available</span>
            )}
            {soldOut && <span className="text-[12px] text-cx-ink-3">Unavailable</span>}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
