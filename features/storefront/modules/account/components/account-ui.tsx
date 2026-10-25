import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import StatusDot, { type DotTone } from "@/features/storefront/modules/common/components/collectibles/status-dot"

// Shared account styling on the cx tokens (docs/design/collectibles-redesign-2026-10-23.md).

export const cxInput =
  "h-12 rounded-[2px] border-cx-line bg-cx-surface px-4 text-[15px] text-cx-ink shadow-none placeholder:text-cx-ink-3 focus-visible:border-cx-accent focus-visible:ring-cx-accent/20"

export const cxSubmit = "h-12 w-full rounded-[2px] text-[15px] font-medium"

export function AccountHeading({ title, meta, actions }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-cx-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="font-cx-display font-extrabold text-[30px] leading-[34px] tracking-[-0.01em] text-cx-ink sm:text-[36px] sm:leading-[40px]">
          {title}
        </h1>
        {meta !== undefined && <span className="cx-num shrink-0 text-[13px] text-cx-ink-3">{meta}</span>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Recessed band holding hairline rows. */
export function Band({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("cx-band divide-y divide-cx-line overflow-hidden", className)}>{children}</div>
}

/** Title with a status dot on the same line. */
export function TitleState({ title, tone, state, className }: { title: ReactNode; tone: DotTone; state: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5", className)}>
      <span className="min-w-0 truncate">{title}</span>
      <span className="inline-flex items-baseline gap-1.5 text-[13px] font-normal text-cx-ink-2">
        <StatusDot tone={tone} />
        {state}
      </span>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="cx-band flex flex-col items-start gap-4 px-5 py-8">
      <p className="font-cx-serif text-[20px] leading-[26px] text-cx-ink">{title}</p>
      {children}
    </div>
  )
}

const STATUS_TONES: Record<string, DotTone> = {
  completed: "ok",
  paid: "ok",
  captured: "ok",
  fulfilled: "ok",
  shipped: "ok",
  delivered: "ok",
  approved: "ok",
  active: "ok",
  pending: "warn",
  awaiting: "warn",
  requires_action: "warn",
  not_fulfilled: "warn",
  partially_fulfilled: "warn",
  partially_shipped: "warn",
  not_paid: "warn",
  unpaid: "warn",
  draft: "muted",
  archived: "muted",
  canceled: "danger",
  cancelled: "danger",
  rejected: "danger",
  failed: "danger",
  refunded: "muted",
  overdue: "danger",
}

export function statusTone(status?: string | null): DotTone {
  return (status && STATUS_TONES[status.toLowerCase()]) || "muted"
}

export function statusLabel(status?: string | null) {
  if (!status) return "Unknown"
  const text = status.replaceAll("_", " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
