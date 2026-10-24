"use client"

import { useActionState } from "react"
import { Bookmark } from "lucide-react"

import { saveSearch } from "@/features/storefront/lib/data/collectibles"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

export default function SaveSearch({ query }: { query: string }) {
  const [state, action, pending] = useActionState(saveSearch, {} as { saved?: boolean; error?: string })

  if (state.saved) {
    return (
      <p className="inline-flex min-h-11 items-baseline gap-2 text-[14px] text-cx-ink-2" role="status">
        <StatusDot tone="ok" />
        Search saved ·{" "}
        <LocalizedClientLink href="/account/saved-searches" className="underline underline-offset-4 hover:text-cx-ink">
          Saved searches
        </LocalizedClientLink>
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="q" value={query} />
      <div className="cx-track">
        <button type="submit" className="cx-pill" disabled={pending} data-testid="save-search-button">
          <Bookmark className="size-4" aria-hidden="true" />
          {pending ? "Saving" : "Save search"}
        </button>
      </div>
      {state.error && (
        <p className="text-[13px] text-cx-danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
