import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getWishlist } from "@/features/storefront/lib/data/collectibles"
import { getWantList } from "@/features/storefront/lib/data/cards"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { formatMinorAmount } from "@/features/storefront/lib/collectible-evidence-presentation"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { AccountHeading, Band, EmptyState, TitleState } from "@/features/storefront/modules/account/components/account-ui"
import SaveItemButton from "@/features/storefront/modules/products/components/save-item/save-item-button"
import { CardRow, CardSheet, conditionLabel, finishLabel, money } from "@/features/storefront/components/cards"
import { WantToggle } from "@/features/storefront/modules/cards/want-toggle"

export const metadata: Metadata = {
  title: "Want list",
}

export async function AccountWishlistPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  const currencyCode = region?.currency?.code?.toUpperCase() || "USD"
  const [wishlist, wants] = await Promise.all([getWishlist(), getWantList(currencyCode)])
  if (wishlist === null || wants === null) notFound()
  const total = wishlist.length + wants.length

  return (
    <div className="tc w-full" data-testid="wishlist-page-wrapper">
      <AccountHeading title="Want list" meta={total} />
      {total === 0 ? (
        <EmptyState title="Nothing on your want list">
          <p className="max-w-[48ch] text-[15px] text-cx-ink-2">Open any set and press Want on a card we don&apos;t have. When one meets your terms, it shows here as in stock.</p>
          <LocalizedClientLink href="/sets" className="cx-btn">Browse sets</LocalizedClientLink>
        </EmptyState>
      ) : null}

      {wants.length > 0 ? (
        <CardSheet label="Cards you want" actions priceHead="In stock" marketHead="Market" runHead="Terms">
          {wants.map((row: any, i: number) => {
            const match = row.inStock?.[0]
            return (
              <CardRow
                key={row.id}
                index={i}
                status={match ? "in" : "wanted"}
                href={match ? `/${countryCode}/products/${match.handle}` : `/${countryCode}/cards/${row.card.id}`}
                card={{ id: row.card.id, name: row.card.name, number: row.card.number, rarity: row.card.rarity, imageUrl: row.card.imageUrl, setName: row.set?.name }}
                detail={[row.set?.name, row.finish ? finishLabel(row.finish) : null].filter(Boolean).join(" · ")}
                run={
                  <span className="text-[12px] text-[var(--tc-ink-3)]">
                    {[row.minimumCondition ? `${conditionLabel(row.minimumCondition)} or better` : "Any condition", row.maxPriceMinor != null ? `up to ${money(row.maxPriceMinor, currencyCode)}` : null].filter(Boolean).join(", ")}
                  </span>
                }
                market={row.marketMinor != null ? money(row.marketMinor, currencyCode) : null}
                price={match ? `${match.condition ?? ""} ${money(match.priceMinor, currencyCode)}`.trim() : <span className="font-normal text-[var(--tc-ink-3)]">Not yet</span>}
                action={<WantToggle catalogItemId={row.card.id} initialWanted label={row.card.name} />}
              />
            )
          })}
        </CardSheet>
      ) : null}

      {wishlist.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 text-[16px] font-bold text-cx-ink">Saved slabs and items</h2>
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
                      className="text-[16px] font-semibold leading-[22px] text-cx-ink"
                      title={listing.handle ? <LocalizedClientLink href={`/products/${listing.handle}`} className="hover:underline">{listing.title}</LocalizedClientLink> : listing.title}
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
        </div>
      ) : null}
    </div>
  )
}
