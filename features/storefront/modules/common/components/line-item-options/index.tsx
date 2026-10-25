interface LineItemOptionsProps {
  variant?: {
    sku?: string
  }
  variantTitle?: string
}

const LineItemOptions = ({
  variant,
  variantTitle
}: LineItemOptionsProps) => {
  if (!variantTitle && !variant?.sku) return null

  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
      {variantTitle && <span className="truncate">{variantTitle}</span>}
      {variant?.sku && <span className="cx-num truncate text-[13px] text-cx-ink-3">SKU {variant.sku}</span>}
    </div>
  )
}

export default LineItemOptions
