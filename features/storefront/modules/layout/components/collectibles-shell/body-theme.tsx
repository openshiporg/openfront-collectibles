"use client"

import { useEffect } from "react"

// Radix portals (sheets, popovers, dialogs) render on <body>, outside the
// storefront wrapper, so the wrapper's theme is mirrored onto <body>.
export function BodyTheme({ className, hue }: { className: string; hue: number }) {
  useEffect(() => {
    const classes = className.split(" ").filter(Boolean)
    document.body.classList.add(...classes)
    document.body.style.setProperty("--cx-h", String(hue))
    return () => {
      document.body.classList.remove(...classes)
      document.body.style.removeProperty("--cx-h")
    }
  }, [className, hue])

  return null
}
