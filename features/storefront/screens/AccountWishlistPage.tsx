import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getWishlist } from "@/features/storefront/lib/data/collectibles"
import { formatMinorAmount } from "@/features/storefront/lib/collectible-evidence-presentation"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { AccountHeading, Band, EmptyState, TitleState } from "@/features/storefront/modules/account/components/account-ui"
import SaveItemButton from "@/features/storefront/modules/products/components/save-item/save-item-button"

export const metadata: Metadata = {
  title: "Wishlist",
}

export async function AccountWishlistPage() {
  const wishlist = await getWishlist()
  if (wishlist === null) notFound()

  return (
    <div className="w-full" data-testid="wishlist-page-wrapper">
      <AccountHeading title="Wishlist" meta={wishlist.length} />
      {wishlist.length === 0 ? (
        <EmptyState title="No saved items">
          <LocalizedClientLink href="/store" className="cx-btn">
            Browse items
          </LocalizedClientLink>
        </EmptyState>
      ) : (
        <Band>
          {wishlist.map((row: any) => {
            const listing = row.listing
            const price =
              typeof listing.priceMinor === "number" && typeof listing.currencyCode === "string"
                ? formatMinorAmount(listing.priceMinor, listing.currencyCode)
                : null
            return (
              <div key={row.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid="wishlist-row">
                <div className="min-w-0">
                  <TitleState
                    className="font-cx-serif text-[18px] leading-[24px] text-cx-ink"
                    title={
                      listing.handle ? (
                        <LocalizedClientLink href={`/products/${listing.handle}`} className="hover:underline">
                          {listing.title}
                        </LocalizedClientLink>
                      ) : (
                        listing.title
                      )
                    }
                    tone={listing.available ? "ok" : "muted"}
                    state={listing.available ? "Available" : "Unavailable"}
                  />
                  {price && <p className="cx-num mt-1 text-[14px] text-cx-ink">{price}</p>}
                </div>
                <SaveItemButton listingId={listing.id} initialSaved />
              </div>
            )
          })}
        </Band>
      )}
    </div>
  )
}
