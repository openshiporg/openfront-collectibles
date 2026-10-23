import { cn } from "@/lib/utils";
import { useMemo } from "react"

import { getProductPrice } from "@/features/storefront/lib/util/get-product-price"

import { StoreProduct, StoreRegion } from "@/features/storefront/types/storefront";

export default function ProductPrice({
  product,
  variant,
  region,
}: {
  product: StoreProduct;
  variant?: any;
  region: StoreRegion;
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
    region,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  const hasOnlyOneVariant = useMemo(() => {
    return (product.productVariants?.length || 0) === 1
  }, [product])

  if (!selectedPrice) {
    return <div className="block h-9 w-32 animate-pulse rounded bg-cx-well" />;
  }

  const format = (amount: number) =>
    new Intl.NumberFormat(region.locale, {
      style: 'currency',
      currency: selectedPrice.currencyCode,
    }).format(amount / 100);

  const isOnSale = selectedPrice.calculatedAmount < selectedPrice.originalAmount;

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-testid="product-price">
      <span className={cn("cx-num text-[26px] leading-[32px] text-cx-ink", { "text-cx-accent": isOnSale })}>
        {!variant && !hasOnlyOneVariant && <span className="mr-1.5 font-cx text-[14px] text-cx-ink-2">From</span>}
        {format(selectedPrice.calculatedAmount)}
      </span>
      {isOnSale && (
        <>
          <span className="cx-num text-[14px] text-cx-ink-3 line-through">{format(selectedPrice.originalAmount)}</span>
          <span className="cx-num text-[13px] text-cx-accent">
            -{Math.round((1 - selectedPrice.calculatedAmount / selectedPrice.originalAmount) * 100)}%
          </span>
        </>
      )}
    </div>
  );
}
