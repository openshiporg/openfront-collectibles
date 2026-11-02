import type { ReactNode } from "react"

/** One order record section: mono label heading over a hairline, then content. */
export default function OrderSection({
  title,
  meta,
  children,
  ...props
}: {
  title: ReactNode
  meta?: ReactNode
  children: ReactNode
  [key: string]: unknown
}) {
  return (
    <section className="space-y-4" {...props}>
      <div className="flex items-baseline justify-between gap-3 border-b border-cx-line pb-3">
        <h2 className="deneb-section-label">{title}</h2>
        {meta}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, children, ...props }: { label: string; children: ReactNode; [key: string]: unknown }) {
  return (
    <div className="min-w-0 space-y-1" {...props}>
      <p className="cx-label">{label}</p>
      <div className="space-y-0.5 text-[14px] leading-[20px] text-cx-ink-2">{children}</div>
    </div>
  )
}
