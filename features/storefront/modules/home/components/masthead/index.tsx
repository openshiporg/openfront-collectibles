import type { ReactNode } from "react"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

/**
 * Home cover: the stock book's cloth cover, with the merchant's own title and
 * description stamped on it and the category thumb index down its edge.
 */
export default function Masthead({
  title,
  description,
  index,
}: {
  title?: string | null
  description?: string | null
  index?: ReactNode
}) {
  if (!title && !description && !index) return null

  return (
    <section
      aria-labelledby={title ? "cx-cover-title" : undefined}
      className="mt-4 grid overflow-hidden rounded-[2px] bg-cx-vault sm:mt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      <div className="cx-rise flex flex-col justify-end gap-6 px-5 pb-8 pt-16 sm:px-10 sm:pb-12 sm:pt-28 lg:min-h-[520px]">
        {title && (
          <h1
            id="cx-cover-title"
            className="max-w-[14ch] font-cx-display text-[48px] leading-[0.92] tracking-[-0.02em] text-cx-ink [text-wrap:balance] sm:text-[80px] lg:text-[104px]"
          >
            {title}
          </h1>
        )}
        {description && (
          <p className="max-w-[46ch] text-[17px] leading-[27px] text-cx-ink-2 sm:text-[19px] sm:leading-[30px]">
            {description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <LocalizedClientLink href="/store" className="cx-btn">
            Browse all items
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/trade-in"
            className="inline-flex min-h-12 items-center px-3 font-cx-display text-[17px] font-semibold text-cx-ink-2 underline decoration-cx-vault-2 decoration-2 underline-offset-[6px] transition-colors hover:text-cx-ink hover:decoration-cx-accent"
          >
            Trade in
          </LocalizedClientLink>
        </div>
      </div>
      {index}
    </section>
  )
}
