import { DocumentRenderer } from "./DocumentRenderer"
import { renderers } from "./index"

type ProductDescriptionValue = { document?: any } | string | null | undefined

export default function ProductDescription({ product }: { product: { description?: ProductDescriptionValue } }) {
  const description = product.description
  if (!description) return null

  return (
    <div className="border-t border-cx-line pt-5">
      {typeof description === "string" ? (
        <p className="whitespace-pre-line text-[15px] leading-[24px] text-cx-ink-2" data-testid="product-description">
          {description}
        </p>
      ) : description.document ? (
        <div data-testid="product-description">
          <DocumentRenderer document={description.document} renderers={renderers} />
        </div>
      ) : null}
    </div>
  )
}
