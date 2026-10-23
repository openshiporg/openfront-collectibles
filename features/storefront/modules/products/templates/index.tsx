import React, { Suspense } from "react"

import ImageGallery from "@/features/storefront/modules/products/components/image-gallery"
import ProductActions from "@/features/storefront/modules/products/components/product-actions"
import ProductTabs from "@/features/storefront/modules/products/components/product-tabs"
import RelatedProducts from "@/features/storefront/modules/products/components/related-products"
import ProductInfo from "@/features/storefront/modules/products/templates/product-info"
import ProductDescription from "@/features/storefront/modules/products/templates/product-info/description"
import SkeletonRelatedProducts from "@/features/storefront/modules/skeletons/templates/skeleton-related-products"
import SlabLabel from "@/features/storefront/modules/common/components/collectibles/slab-label"
import { slabFromGrading } from "@/features/storefront/lib/collectible-evidence-presentation"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { StoreProduct, StoreRegion } from "@/features/storefront/types/storefront"

type ProductTemplateProps = {
  product: StoreProduct
  region: StoreRegion
  countryCode: string
  /** Public collectible listing for this product's single variant, if any. */
  collectibleListing?: any
  children?: React.ReactNode
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  collectibleListing,
  children,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const specimen = collectibleListing?.extension?.value?.specimen
  const slab = slabFromGrading(collectibleListing?.extension?.value?.observations?.grading)
  const images = (product as any)?.productImages?.length
    ? (product as any).productImages
    : product.thumbnail
      ? [{ id: "thumbnail", imagePath: product.thumbnail }]
      : []

  return (
    <>
      <div
        className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 pb-12 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:pt-10"
        data-testid="product-container"
      >
        <div className="min-w-0">
          <ImageGallery
            images={images}
            handle={product.handle}
            region={region}
            title={product.title}
            label={specimen?.category}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <ProductInfo product={product} />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper handle={product.handle} region={region} />
          </Suspense>
          {specimen && slab && (
            <SlabLabel
              company={slab?.companyName || slab?.company}
              grade={slab?.grade}
              gradeLabel={slab?.gradeLabel}
              certificate={slab?.certificate}
              verification={slab?.verification}
              title={specimen.displayName || product.title}
              line={[specimen.category, specimen.catalogNumber, specimen.maker, specimen.year].filter(Boolean).join(" · ")}
            />
          )}
          <ProductDescription product={product} />
          <ProductTabs product={product as any} />
        </div>
      </div>
      {children}
      <div
        className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-6 sm:px-6"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
