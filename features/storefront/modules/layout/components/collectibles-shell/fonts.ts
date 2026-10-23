import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google"

export const cxSans = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--cx-font-sans",
})

export const cxSerif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--cx-font-serif",
})

export const cxMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--cx-font-mono",
})
