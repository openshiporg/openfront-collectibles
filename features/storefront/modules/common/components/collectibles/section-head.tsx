import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

/** Catalogue section heading: serif title, optional mono count, optional link out. */
export default function SectionHead({
  title,
  meta,
  href,
  linkLabel = "View all",
  as: Heading = "h2",
}: {
  title: ReactNode
  meta?: ReactNode
  href?: string
  linkLabel?: string
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-cx-line pb-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <Heading className="font-cx-serif text-[26px] leading-[30px] tracking-[-0.01em] text-cx-ink sm:text-[30px] sm:leading-[34px]">
          {title}
        </Heading>
        {meta !== undefined && <span className="cx-num shrink-0 text-[12px] text-cx-ink-3">{meta}</span>}
      </div>
      {href && (
        <LocalizedClientLink
          href={href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-[14px] font-medium text-cx-ink-2 hover:text-cx-ink"
        >
          {linkLabel}
          <ArrowUpRight className="size-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </LocalizedClientLink>
      )}
    </div>
  )
}
