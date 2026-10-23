import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

/** Recessed track that holds raised pills. */
export function Track({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn("cx-track", className)}>
      {children}
    </div>
  )
}

export function PillButton({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      data-active={!!active}
      className={cn("cx-pill", className)}
      {...props}
    />
  )
}

export function PillLink({
  active,
  className,
  ...props
}: ComponentProps<typeof LocalizedClientLink> & { active?: boolean }) {
  return (
    <LocalizedClientLink
      aria-current={active ? "page" : undefined}
      data-active={!!active}
      className={cn("cx-pill", className)}
      {...props}
    />
  )
}
