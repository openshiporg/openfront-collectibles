'use client'

import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { toggleCardWant } from "@/features/storefront/lib/data/cards"

/** Want / Wanted on a catalog card; signs the collector in first when needed. */
export function WantToggle({ catalogItemId, initialWanted = false, label, finish, wide }: { catalogItemId: string; initialWanted?: boolean; label: string; finish?: string | null; wide?: boolean }) {
  const router = useRouter()
  const countryCode = useParams<{ countryCode: string }>()?.countryCode ?? "us"
  const [wanted, setWanted] = useState(initialWanted)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const toggle = () => start(async () => {
    setError(null)
    const result = await toggleCardWant({ catalogItemId, finish: finish ?? null })
    if (result.error) {
      if (result.error.startsWith("Sign in")) router.push(`/${countryCode}/account`)
      else setError(result.error)
      return
    }
    setWanted(Boolean(result.wanted))
    router.refresh()
  })
  return (
    <span className="inline-grid gap-1">
      <button
        type="button"
        className={wide ? "tc-btn" : "tc-btn w-[64px] px-0"}
        data-variant="line"
        aria-pressed={wanted}
        disabled={pending}
        onClick={toggle}
        aria-label={wanted ? `Remove ${label} from your want list` : `Add ${label} to your want list`}
      >
        {wide ? (wanted ? "On your want list" : "Add to want list") : wanted ? "Wanted" : "Want"}
      </button>
      {error ? <span role="alert" className="text-[12px] text-cx-danger">{error}</span> : null}
    </span>
  )
}
