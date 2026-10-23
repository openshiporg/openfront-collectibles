import { cn } from "@/lib/utils"

const TONES = {
  ok: "bg-cx-ok",
  warn: "bg-cx-warn",
  danger: "bg-cx-danger",
  accent: "bg-cx-accent",
  muted: "bg-cx-ink-3",
} as const

export type DotTone = keyof typeof TONES

/** 8px dot for a title line: give the parent `items-baseline`. */
export default function StatusDot({ tone = "muted", className }: { tone?: DotTone; className?: string }) {
  return <span aria-hidden="true" className={cn("cx-dot", TONES[tone], className)} />
}
