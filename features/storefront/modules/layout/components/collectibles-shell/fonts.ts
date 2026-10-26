import { Archivo } from "next/font/google"

// Archivo throughout, on its width axis: normal width for names and reading,
// the condensed cut (font-stretch) for numbers, codes and stamped labels.
export const cxSans = Archivo({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  variable: "--cx-font-sans",
})

// The display and reading faces are the same family; globals.css aliases their variables.
export const cxSerif = cxSans
export const cxMono = cxSans
