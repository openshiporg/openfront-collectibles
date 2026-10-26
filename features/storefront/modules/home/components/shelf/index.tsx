import type { ReactNode } from "react"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

/** A home section: a ruled title line with its link, one sentence, then its contents. */
export function Shelf({ title, note, href, linkLabel, children }: { title: string; note?: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6" aria-labelledby={`shelf-${title}`}>
      <div className="grid gap-2 border-t-2 border-cx-ink pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
        <h2 id={`shelf-${title}`} className="font-cx-display text-[30px] leading-[1.05] text-cx-ink sm:text-[36px]">{title}</h2>
        {href && linkLabel ? (
          <LocalizedClientLink href={href.replace(/^\/[a-z]{2}(?=\/)/, "")} className="w-fit text-[15px] font-semibold text-cx-ink-2 underline decoration-cx-accent decoration-2 underline-offset-[6px] hover:text-cx-ink">
            {linkLabel}
          </LocalizedClientLink>
        ) : null}
        {note ? <p className="max-w-[60ch] text-[15px] leading-[1.5] text-cx-ink-2 sm:col-span-2">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}
