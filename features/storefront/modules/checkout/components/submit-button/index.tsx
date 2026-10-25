"use client"

import React from "react"
import { useFormStatus } from "react-dom"
import { RiLoader2Fill } from "@remixicon/react"
import { cn } from "@/lib/utils"

type ButtonVariant = "secondary" | "outline" | "destructive" | "link" | "default" | "ghost" | null;
type ButtonSize = "default" | "sm" | "lg" | "icon" | null

const VARIANTS: Record<string, string> = {
  default: "cx-btn",
  destructive: "cx-btn !bg-cx-danger",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-cx-surface px-5 text-[14px] font-medium text-cx-ink shadow-[0_1px_2px_rgb(26_23_18/0.14),0_0_0_0.5px_rgb(26_23_18/0.1)] hover:bg-cx-bg disabled:opacity-50",
  outline:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-cx-line bg-transparent px-5 text-[14px] font-medium text-cx-ink hover:bg-cx-well disabled:opacity-50",
  ghost:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-4 text-[14px] font-medium text-cx-ink hover:bg-cx-well disabled:opacity-50",
  link: "inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-cx-ink underline-offset-4 hover:underline disabled:opacity-50",
}

export function SubmitButton({
  children,
  variant = "default",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: ButtonVariant
  className?: string
  size?: ButtonSize
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      className={cn(VARIANTS[variant || "default"], className)}
      type="submit"
      disabled={pending}
      data-testid={dataTestId}
    >
      {pending && <RiLoader2Fill className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
