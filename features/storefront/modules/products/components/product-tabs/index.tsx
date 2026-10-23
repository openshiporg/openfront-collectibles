type ProductForTabs = {
  id: string;
  productCollections?: { title?: string | null; handle?: string | null }[] | null;
  productVariants?: { id: string; sku?: string | null; isUniqueCollectible?: boolean | null }[] | null;
};

type ProductTabsProps = {
  product: ProductForTabs;
};

/** Item facts as a recessed band of label/value rows. Only fields the record holds. */
const ProductTabs = ({ product }: ProductTabsProps) => {
  const variants = product.productVariants || []
  const single = variants.length === 1 ? variants[0] : null
  const rows: { label: string; value: string; mono?: boolean }[] = []

  if (single?.sku) rows.push({ label: "SKU", value: single.sku, mono: true })
  if (product.productCollections?.length) {
    rows.push({
      label: "Collection",
      value: product.productCollections.map((c) => c.title).filter(Boolean).join(", "),
    })
  }
  if (variants.length > 1) rows.push({ label: "Variants", value: String(variants.length), mono: true })

  if (!rows.length) return null

  return (
    <dl className="cx-band divide-y divide-cx-line overflow-hidden" data-testid="product-facts">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3 text-[14px]">
          <dt className="shrink-0 text-cx-ink-2">{row.label}</dt>
          <dd className={row.mono ? "cx-num truncate text-[13px] text-cx-ink" : "truncate text-right text-cx-ink"}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default ProductTabs
