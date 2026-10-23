"use client"

import { ListBand } from "./vault-ui"

/** Empty and no-results states for platform lists: a label, and a reset when filtered. */
export function PlatformEmptyState({
  title,
  onReset,
  resetLabel = "Reset filters",
}: {
  title: string
  onReset?: () => void
  resetLabel?: string
}) {
  return (
    <ListBand>
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center rounded-full bg-background px-4 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] transition-colors hover:bg-background/80 dark:bg-zinc-800"
          >
            {resetLabel}
          </button>
        )}
      </div>
    </ListBand>
  )
}
