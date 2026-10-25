import { Metadata } from "next"
import { notFound } from "next/navigation"

import { deleteSavedSearch, getSavedSearches } from "@/features/storefront/lib/data/collectibles"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { AccountHeading, Band, EmptyState } from "@/features/storefront/modules/account/components/account-ui"

export const metadata: Metadata = {
  title: "Saved searches",
}

export async function AccountSavedSearchesPage() {
  const searches = await getSavedSearches()
  if (searches === null) notFound()

  return (
    <div className="w-full" data-testid="saved-searches-page-wrapper">
      <AccountHeading title="Saved searches" meta={searches.length} />
      {searches.length === 0 ? (
        <EmptyState title="No saved searches">
          <LocalizedClientLink href="/search" className="cx-btn">
            Search items
          </LocalizedClientLink>
        </EmptyState>
      ) : (
        <Band>
          {searches.map((search: any) => (
            <div key={search.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid="saved-search-row">
              <div className="min-w-0">
                <p className="truncate font-cx-serif text-[18px] leading-[24px] text-cx-ink">{search.name}</p>
                <p className="cx-num mt-0.5 text-[13px] text-cx-ink-3">
                  {new Date(search.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                </p>
              </div>
              <div className="cx-track self-start sm:self-auto">
                <LocalizedClientLink href={`/search?q=${encodeURIComponent(search.query || search.name)}`} className="cx-pill" data-active="true">
                  Open
                </LocalizedClientLink>
                <form action={deleteSavedSearch}>
                  <input type="hidden" name="id" value={search.id} />
                  <button type="submit" className="cx-pill" data-testid="delete-saved-search">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </Band>
      )}
    </div>
  )
}
