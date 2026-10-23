import { ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

type IndexCategory = { id: string; title: string; handle: string }

/** Typographic index of top-level categories: the main way into the catalogue. */
export default function CategoryIndex({ categories }: { categories: IndexCategory[] }) {
  if (!categories.length) return null

  return (
    <nav aria-label="Categories" className="pt-2">
      <ol className="grid md:grid-cols-2 md:gap-x-10">
        {categories.map((category, index) => (
          <li key={category.id} className="border-b border-cx-line">
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              className="group flex min-h-[72px] items-center gap-4 py-4 sm:min-h-[84px]"
            >
              <span className="cx-num w-7 shrink-0 text-[12px] text-cx-ink-3">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate font-cx-serif text-[28px] leading-[32px] tracking-[-0.01em] text-cx-ink transition-colors group-hover:text-cx-accent sm:text-[34px] sm:leading-[38px]">
                {category.title}
              </span>
              <ArrowUpRight
                className="size-5 shrink-0 text-cx-ink-3 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cx-accent"
                aria-hidden="true"
              />
            </LocalizedClientLink>
          </li>
        ))}
      </ol>
    </nav>
  )
}
