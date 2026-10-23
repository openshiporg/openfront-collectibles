import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

/** GET form to the search page; works without JavaScript. */
export default function SearchForm({
  countryCode,
  defaultValue,
  autoFocus,
  className,
}: {
  countryCode: string
  defaultValue?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <form action={`/${countryCode}/search`} method="get" role="search" className={cn("relative w-full", className)}>
      <label htmlFor="storefront-search" className="sr-only">
        Search items
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cx-ink-3" aria-hidden="true" />
      <input
        id="storefront-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={80}
        placeholder="Search items"
        className="min-h-12 w-full rounded-full border border-cx-line bg-cx-surface pl-11 pr-28 text-[15px] text-cx-ink placeholder:text-cx-ink-3 focus:outline-2 focus:outline-cx-accent"
        data-testid="search-input"
      />
      <button type="submit" className="cx-btn absolute right-1 top-1 !min-h-10 !px-4 !text-[14px]">
        Search
      </button>
    </form>
  )
}
