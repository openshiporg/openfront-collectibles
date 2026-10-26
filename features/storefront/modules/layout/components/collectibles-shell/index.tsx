import type { CSSProperties, ReactNode } from "react"

import { getStore } from "@/features/storefront/lib/data/store"
import { storeBrand } from "@/features/storefront/lib/collectibles-brand"
import { BodyTheme } from "./body-theme"
import { cxSans } from "./fonts"

export const CX_THEME_CLASS = `cx-sf tc ${cxSans.variable}`

export default async function CollectiblesShell({ children }: { children: ReactNode }) {
  const store = await getStore()
  const { hue } = storeBrand(store)

  return (
    <div
      className={`${CX_THEME_CLASS} flex min-h-screen flex-col antialiased`}
      style={{ "--cx-h": hue } as CSSProperties}
    >
      <BodyTheme className={CX_THEME_CLASS} hue={hue} />
      {children}
    </div>
  )
}
