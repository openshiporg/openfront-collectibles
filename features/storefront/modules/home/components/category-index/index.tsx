import type { CSSProperties } from "react"
import { ArrowRight } from "lucide-react"

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

type IndexCategory = { id: string; title: string; handle: string }

/** The cover's thumb index: one filled tab per top-level category, the main way into the catalogue. */
export default function CategoryIndex({ categories }: { categories: IndexCategory[] }) {
  if (!categories.length) return null

  return (
    <nav aria-label="Categories" className="flex flex-col justify-end gap-1.5 py-3 pl-3 pr-0 sm:py-4 sm:pl-4 lg:py-6 lg:pl-0">
      <ol className="cx-rise grid gap-1.5">
        {categories.map((category, index) => (
          <li key={category.id} className="[margin-left:var(--tab-step)]" style={{ "--tab-step": `${index * 14}px` } as CSSProperties}>
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              className="group flex min-h-[54px] items-center gap-4 rounded-[2px] bg-cx-vault-2 px-5 rounded-r-none pr-8 transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-cx-accent active:scale-[0.99] lg:hover:-translate-x-2"
            >
              <span className="min-w-0 flex-1 truncate font-cx-display text-[21px] font-bold leading-none text-cx-ink transition-colors group-hover:text-cx-bg sm:text-[24px]">
                {category.title}
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-cx-ink-2 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-cx-bg"
                aria-hidden="true"
              />
            </LocalizedClientLink>
          </li>
        ))}
      </ol>
    </nav>
  )
}
