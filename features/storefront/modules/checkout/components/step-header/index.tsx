import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

/** Raised pill used for secondary in-page actions (edit a completed step, apply a code). */
export const secondaryPill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-cx-surface px-4 text-[14px] font-medium text-cx-ink transition-colors hover:bg-cx-bg disabled:opacity-50"

/**
 * Checkout step heading: mono step number, serif title, and a done dot on the
 * title line once the step is complete.
 */
export default function StepHeader({
  step,
  title,
  done,
  muted,
  action,
}: {
  step: number
  title: string
  done?: boolean
  muted?: boolean
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="cx-num text-[13px] text-cx-ink-3">{String(step).padStart(2, "0")}</span>
        <h2
          className={cn(
            "font-cx-serif text-[24px] leading-[28px] tracking-[-0.01em] sm:text-[28px] sm:leading-[32px]",
            muted ? "text-cx-ink-3" : "text-cx-ink"
          )}
        >
          {title}
        </h2>
        {done && (
          <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
            <StatusDot tone="ok" />
            Done
          </span>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** One step card. */
export function StepSection({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: unknown }) {
  return (
    <section
      className={cn("rounded-[2px] bg-cx-surface p-4 ring-1 ring-cx-line sm:p-6", className)}
      {...props}
    >
      {children}
    </section>
  )
}

/** Summary block shown when a step is collapsed. */
export function SummaryBlock({ label, children, ...props }: { label: string; children: ReactNode; [key: string]: unknown }) {
  return (
    <div className="min-w-0 space-y-1" {...props}>
      <p className="cx-label">{label}</p>
      <div className="space-y-0.5 text-[14px] leading-[20px] text-cx-ink-2">{children}</div>
    </div>
  )
}

/** Recessed band that holds choice rows; the chosen row is raised. */
export const optionBand = "cx-band flex flex-col gap-1 p-1.5"

export function optionRow(selected: boolean, disabled?: boolean) {
  return cn(
    "flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-[2px] px-4 py-3 text-left text-[15px] text-cx-ink transition-[background-color,box-shadow] duration-150",
    selected
      ? "bg-cx-surface"
      : "hover:bg-cx-surface/60",
    disabled && "cursor-not-allowed opacity-50"
  )
}
