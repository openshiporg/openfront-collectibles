"use client"

import { cn } from "@/lib/utils"
import React, { useMemo, useState } from "react"
import { X, ChevronUp } from "lucide-react"
import { getProductPrice } from "@/features/storefront/lib/util/get-product-price"
import OptionSelect from "./option-select"
import { StoreRegion, StoreProduct } from "@/features/storefront/types/storefront"

type ProductVariantInfo = {
  id: string
  title?: string | null
  inventoryQuantity?: number | null
  allowBackorder?: boolean | null
  productOptionValues?: { id: string; value: string; productOption?: { id: string } | null }[] | null
  prices?: { amount: number; currencyCode: string }[] | null
}

type MobileActionsProps = {
  product: StoreProduct
  region: StoreRegion
  variant?: ProductVariantInfo
  options: Record<string, string | undefined>
  updateOptions: (update: Record<string, string>) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

export default function MobileActions({
  product,
  region,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}: MobileActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
    region,
  })

  const selectedPrice = useMemo(() => {
    if (!price) return null
    return price.variantPrice || price.cheapestPrice || null
  }, [price])

  const isSimple = (product.productVariants?.length ?? 0) <= 1

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(region.locale || "en-US", {
      style: "currency",
      currency,
    }).format(amount / 100)
  }

  const label = isAdding
    ? "Adding"
    : !variant
    ? "Select an option"
    : !inStock
    ? "Unavailable"
    : "Add to cart"

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-cx-vault/60 transition-opacity duration-300 lg:hidden",
          isOpen ? "z-[100] opacity-100" : "pointer-events-none z-[-1] opacity-0"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-x-0 rounded-t-[22px] bg-cx-bg shadow-[0_-12px_32px_rgb(26_23_18/0.2)] transition-all duration-300 ease-out lg:hidden",
          isOpen ? "bottom-0 z-[101]" : "-bottom-full z-[-1]"
        )}
        role="dialog"
        aria-label="Options"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-cx-line px-4 py-3">
          <h2 className="font-cx-serif text-[20px] text-cx-ink">Options</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex size-11 items-center justify-center rounded-full text-cx-ink hover:bg-cx-well"
            aria-label="Close options"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-4 py-5">
          <div className="flex flex-col gap-5">
            {(product.productOptions || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={updateOptions}
                title={option.title}
                disabled={optionsDisabled}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-cx-line px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={async () => {
              await handleAddToCart()
              setIsOpen(false)
            }}
            disabled={!inStock || !variant || !!isAdding}
            className="cx-btn w-full"
          >
            {label}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[99] border-t border-cx-line bg-cx-bg/95 backdrop-blur transition-all duration-300 lg:hidden",
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        )}
        data-testid="mobile-actions"
      >
        <div className="flex items-center gap-3 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="truncate font-cx-serif text-[15px] leading-[20px] text-cx-ink">{product.title}</p>
            {selectedPrice && (
              <p
                className={cn(
                  "cx-num text-[13px] text-cx-ink-2",
                  selectedPrice.calculatedAmount < selectedPrice.originalAmount && "text-cx-accent"
                )}
              >
                {formatPrice(selectedPrice.calculatedAmount, selectedPrice.currencyCode)}
              </p>
            )}
          </div>
          {!isSimple && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex min-h-12 max-w-[40%] items-center gap-1.5 rounded-[2px] bg-cx-surface px-4 text-[14px] font-medium text-cx-ink ring-1 ring-cx-line"
            >
              <span className="truncate">
                {variant ? Object.values(options).filter(Boolean).join(" / ") : "Options"}
              </span>
              <ChevronUp className={cn("size-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || !variant || !!isAdding}
            className="cx-btn shrink-0 px-5"
          >
            {label}
          </button>
        </div>
      </div>
    </>
  )
}
