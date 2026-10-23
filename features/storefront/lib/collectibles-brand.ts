import { LOGO_ICONS } from "@/features/platform/store-settings/lib/icon-registry"

// Untitled UI marks are drawn in #155eef (hue 221) and tinted with hue-rotate.
const REGISTRY_BASE_HUE = 221

// Collectibles' default mark: Kintsugi from the Store Settings registry, rotated to bronze.
export const COLLECTIBLES_LOGO_ICON_ID = "kintsugi"
export const COLLECTIBLES_LOGO_COLOR = "165"
export const COLLECTIBLES_LOGO_ICON =
  LOGO_ICONS.find((icon) => icon.id === COLLECTIBLES_LOGO_ICON_ID)?.lightSvg ?? LOGO_ICONS[0].lightSvg

type BrandSource = { logoIcon?: string | null; logoColor?: string | null } | null | undefined

// The Store model's column default is not a registry mark, so a store that still
// carries it (matched on its path, which survives sanitizing) has no logo chosen yet.
const MODEL_DEFAULT_MARK_PATH = "m22.102 20.86"

function hasChosenLogo(store: BrandSource) {
  const svg = store?.logoIcon?.trim()
  return !!svg && !svg.includes(MODEL_DEFAULT_MARK_PATH)
}

export function storeBrand(store: BrandSource) {
  const chosen = hasChosenLogo(store)
  const logoSvg = chosen ? store!.logoIcon! : COLLECTIBLES_LOGO_ICON
  const rotation = Number.parseFloat(chosen ? store?.logoColor || "0" : COLLECTIBLES_LOGO_COLOR)
  const safeRotation = Number.isFinite(rotation) ? rotation : 0
  const hue = (((REGISTRY_BASE_HUE + safeRotation) % 360) + 360) % 360

  return { logoSvg, logoColor: String(safeRotation), hue: Math.round(hue) }
}
