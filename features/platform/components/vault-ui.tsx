// Collectibles platform kit: the same raised-pill-in-recessed-track control,
// title-line status dots and list bands as the storefront, built on the
// dashboard's own tokens so pages sit naturally in the shared shell in light and dark.

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dot, type DotTone } from "./vault-primitives"

export { DOT_TONES, Dot, trackClass, pillClass, Track, Pill, Count } from "./vault-primitives"
export type { DotTone } from "./vault-primitives"
export { StatusFilter } from "./vault-status-filter"
export type { StatusOption } from "./vault-status-filter"

/** Page title with an optional state dot on the same line. */
export function PageTitle({
  title,
  tone,
  state,
  meta,
  actions,
}: {
  title: string
  tone?: DotTone
  state?: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {state && (
            <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground">
              {tone && <Dot tone={tone} />}
              {state}
            </span>
          )}
        </div>
        {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** One recessed band with hairline rows, instead of stacked cards. */
export function ListBand({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "divide-y divide-border overflow-hidden rounded-xl bg-muted/40 shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-inset ring-border/60",
        className
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {meta && <span className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</span>}
    </div>
  )
}

/** A list-band row: title with its status dot on the same line, meta below, trailing value. */
export function BandRow({
  href,
  title,
  tone,
  state,
  meta,
  trailing,
}: {
  href?: string
  title: ReactNode
  tone?: DotTone
  state?: string
  meta?: ReactNode
  trailing?: ReactNode
}) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          {state && (
            <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
              {tone && <Dot tone={tone} />}
              {state}
            </span>
          )}
        </div>
        {meta && <div className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right font-mono text-xs tabular-nums text-foreground">{trailing}</div>}
    </>
  )
  const cls = "flex min-h-12 items-center gap-3 px-4 py-2.5"
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-background/60")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** Raised pill link (secondary in-page action). */
export function PillLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-background px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.08)] transition-colors hover:bg-muted max-sm:min-h-10 dark:bg-zinc-800 dark:hover:bg-zinc-700",
        className
      )}
    >
      {children}
      <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

/** Humanise a stored enum value: `return_hold` → `Return hold`. */
export function humanize(value?: string | null) {
  if (!value) return ""
  const text = value.replaceAll("_", " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
