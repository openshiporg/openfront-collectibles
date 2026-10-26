import { Search } from "lucide-react"

/** Search by card name, number or set; a plain GET form so it works before hydration. */
export function CardSearch({ countryCode, defaultValue, autoFocus }: { countryCode: string; defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action={`/${countryCode}/search`} method="get" role="search" className="tc grid gap-2">
      <label htmlFor="card-search" className="text-[13px] font-semibold text-cx-ink-3">Find a card</label>
      <div className="flex h-12 items-stretch border-2 border-cx-ink bg-cx-bg focus-within:border-cx-accent">
        <input
          id="card-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={80}
          placeholder="Charizard, 199/165, Prismatic"
          className="min-w-0 flex-1 bg-transparent px-3.5 text-[16px] text-cx-ink caret-[var(--color-cx-accent)] outline-none placeholder:text-cx-ink-3"
        />
        <button type="submit" className="inline-flex w-12 items-center justify-center bg-cx-ink text-cx-bg transition-colors hover:bg-cx-accent" aria-label="Search">
          <Search className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
