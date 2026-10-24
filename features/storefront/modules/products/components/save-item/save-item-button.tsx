"use client"

import { useState, useTransition } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"

import { toggleWishlistListing } from "@/features/storefront/lib/data/collectibles"

export default function SaveItemButton({ listingId, initialSaved }: { listingId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = () =>
    startTransition(async () => {
      setError(null)
      const result = await toggleWishlistListing(listingId)
      if (result.error) setError(result.error)
      else setSaved(!!result.saved)
    })

  return (
    <div className="flex flex-col gap-1.5">
      <div className="cx-track self-start">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={saved}
          data-active={saved}
          className="cx-pill"
          data-testid="save-item-button"
        >
          {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
          {pending ? "Saving" : saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      </div>
      {error && <p className="text-[13px] text-cx-danger" role="alert">{error}</p>}
    </div>
  )
}
