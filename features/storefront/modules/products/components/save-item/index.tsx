import { getWishlist } from "@/features/storefront/lib/data/collectibles"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import SaveItemButton from "./save-item-button"

/** Wishlist toggle for a published listing; signed-out customers get a sign-in link. */
export default async function SaveItem({ listingId }: { listingId?: string | null }) {
  if (!listingId) return null
  const wishlist = await getWishlist()
  if (wishlist === null) {
    return (
      <LocalizedClientLink
        href="/account"
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-[2px] text-[14px] text-cx-ink-2 underline-offset-4 hover:text-cx-ink hover:underline"
        data-testid="save-item-signin"
      >
        Sign in to save this item
      </LocalizedClientLink>
    )
  }
  const saved = wishlist.some((row: any) => row?.listing?.id === listingId)
  return <SaveItemButton listingId={listingId} initialSaved={saved} />
}
