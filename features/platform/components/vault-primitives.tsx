import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export const DOT_TONES = {
  ok: "bg-emerald-500 dark:bg-emerald-400",
  warn: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-red-500 dark:bg-red-400",
  info: "bg-blue-500 dark:bg-blue-400",
  accent: "bg-amber-700 dark:bg-amber-400",
  muted: "bg-zinc-400 dark:bg-zinc-500",
} as const

export type DotTone = keyof typeof DOT_TONES

/** 8px dot meant to sit on a title line: give the parent `items-baseline`. */
export function Dot({ tone = "muted", className }: { tone?: DotTone; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 translate-y-[-0.1em] rounded-full", DOT_TONES[tone], className)}
    />
  )
}

export const trackClass =
  "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-muted p-[3px] shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] no-scrollbar dark:bg-muted/60"

export const pillClass =
  "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:data-[active=true]:bg-zinc-800 max-sm:min-h-10"

export function Track({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn(trackClass, className)}>
      {children}
    </div>
  )
}

export function Pill({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" aria-pressed={!!active} data-active={!!active} className={cn(pillClass, className)} {...props} />
  )
}

export function Count({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{children ?? 0}</span>
}

