import { Literata, Rokkitt } from "next/font/google"

// Literata for everything read (the serif variable aliases it in globals.css);
// Rokkitt (slab) for stamped labels, numbers and display.
export const cxSans = Literata({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--cx-font-sans",
})

export const cxSerif = cxSans

export const cxMono = Rokkitt({
  subsets: ["latin"],
  display: "swap",
  variable: "--cx-font-display",
})
