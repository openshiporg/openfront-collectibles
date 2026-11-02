// Browser-safe. Registry marks are drawn in #155eef and tinted with a CSS hue-rotate.
// hue-rotate keeps luminance, so rotating that dark blue toward yellow-green lands on olive
// or brown. The lift multiplies brightness until the mark's strongest channel is full, so
// every rotation reads as a clear colour on the storefront's near-black.
const BASE_RGB = [0x15 / 255, 0x5e / 255, 0xef / 255]

function rotate(rotation: number) {
  const r = (rotation * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  // The CSS Filter Effects hue-rotate matrix.
  const m = [
    [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
    [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283],
    [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
  ]
  return m.map((row) => Math.max(0, Math.min(1, row[0] * BASE_RGB[0] + row[1] * BASE_RGB[1] + row[2] * BASE_RGB[2])))
}

function lift(rotation: number) {
  const peak = Math.max(...rotate(rotation))
  return peak > 0 ? Math.min(3, 1 / peak) : 1
}

/** CSS filter for a registry mark at this rotation, lifted to full brightness. */
export function logoMarkFilter(rotation: string | number) {
  const value = Number.parseFloat(String(rotation)) || 0
  return `hue-rotate(${value}deg) brightness(${lift(value).toFixed(2)})`
}

/** The colour a registry mark shows at this rotation, as hex: for swatches. */
export function logoMarkHex(rotation: string | number) {
  const value = Number.parseFloat(String(rotation)) || 0
  const k = lift(value)
  return `#${rotate(value).map((v) => Math.round(Math.min(1, v * k) * 255).toString(16).padStart(2, "0")).join("")}`
}
