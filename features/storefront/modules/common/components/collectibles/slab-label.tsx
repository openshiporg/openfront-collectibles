import { cn } from "@/lib/utils"
import StatusDot, { type DotTone } from "./status-dot"

const VERIFICATION: Record<string, { label: string; tone: DotTone }> = {
  matched: { label: "Certificate matched", tone: "ok" },
  provider_reported: { label: "Provider reported", tone: "accent" },
  manual_review: { label: "In review", tone: "warn" },
  not_checked: { label: "Not checked", tone: "muted" },
  unavailable: { label: "Lookup unavailable", tone: "muted" },
  mismatch: { label: "Certificate mismatch", tone: "danger" },
}

export function verificationOf(state?: string | null) {
  return (state && VERIFICATION[state]) || { label: "Not checked", tone: "muted" as DotTone }
}

export type SlabLabelProps = {
  company?: string | null
  grade?: string | null
  gradeLabel?: string | null
  certificate?: string | null
  verification?: string | null
  title: string
  line?: string | null
  size?: "sm" | "lg"
  className?: string
}

/**
 * The grading-slab label: a vault band with the grader and grade, over a paper
 * strip with the item and certificate. Only shows what the record holds; an
 * ungraded item shows the strip alone.
 */
export default function SlabLabel({
  company,
  grade,
  gradeLabel,
  certificate,
  verification,
  title,
  line,
  size = "lg",
  className,
}: SlabLabelProps) {
  const v = verificationOf(verification)
  const lg = size === "lg"
  // A raw (ungraded) item gets the paper strip only; the vault band is for graded items.
  const graded = !!(company || grade)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2px] bg-cx-surface ",
        className
      )}
    >
      {graded && (
      <div className={cn("flex items-stretch justify-between gap-3 bg-cx-vault text-cx-ink", lg ? "px-5 py-4" : "px-3 py-2.5")}>
        <div className="min-w-0">
          <span className={cn("cx-num block uppercase tracking-[0.12em] text-cx-accent-soft", lg ? "text-[13px]" : "text-[13px]")}>
            {company || "Grade"}
          </span>
          {gradeLabel && (
            <span className={cn("mt-1 block truncate text-cx-ink-2", lg ? "text-[13px]" : "text-[13px]")}>{gradeLabel}</span>
          )}
        </div>
        {grade && (
          <span className={cn("font-cx-serif leading-none tracking-[-0.02em]", lg ? "text-[44px]" : "text-[26px]")}>{grade}</span>
        )}
      </div>
      )}
      <div className={cn("space-y-1", lg ? "px-5 py-4" : "px-3 py-2.5")}>
        <p className={cn("font-cx-serif text-cx-ink", lg ? "text-[19px] leading-[24px]" : "line-clamp-2 text-[14px] leading-[18px]")}>{title}</p>
        {line && <p className={cn("text-cx-ink-2", lg ? "text-[13px]" : "truncate text-[13px]")}>{line}</p>}
        {(certificate || verification) && (
          <div className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-1", lg ? "text-[13px]" : "text-[13px]")}>
            {certificate && <span className="cx-num text-cx-ink-2">Cert {certificate}</span>}
            {verification && (
              <span className="inline-flex items-baseline gap-1.5 text-cx-ink-2">
                <StatusDot tone={v.tone} />
                {v.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
