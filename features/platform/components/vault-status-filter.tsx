"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Count, Dot, Pill, Track, type DotTone } from "./vault-primitives"

export type StatusOption = { value: string; label: string; count?: number; tone?: DotTone }

/**
 * Status filter for platform lists. Reads and writes the same `!status_matches`
 * URL param the list pages already use.
 */
export function StatusFilter({
  statuses,
  allCount,
  allLabel = "All",
  param = "!status_matches",
  className,
}: {
  statuses: StatusOption[]
  allCount?: number
  allLabel?: string
  param?: string
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  let current = "all"
  const raw = searchParams?.get(param)
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      if (Array.isArray(parsed) && parsed.length > 0) {
        current = typeof parsed[0] === "object" ? parsed[0].value : parsed[0]
      }
    } catch {
      // Ignore a malformed filter in the URL.
    }
  }

  const choose = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (value === "all") params.delete(param)
    else params.set(param, JSON.stringify([value]))
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={cn("px-4 py-3 md:px-6", className)}>
      <Track label="Status">
        <Pill active={current === "all"} onClick={() => choose("all")}>
          {allLabel} <Count>{allCount}</Count>
        </Pill>
        {statuses.map((status) => (
          <Pill key={status.value} active={current === status.value} onClick={() => choose(status.value)}>
            {status.tone && <Dot tone={status.tone} className="translate-y-0" />}
            {status.label} <Count>{status.count}</Count>
          </Pill>
        ))}
      </Track>
    </div>
  )
}

