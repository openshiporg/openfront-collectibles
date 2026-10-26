'use client'

import { useMemo, useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { ConditionRun, conditionLabel, finishLabel, money, releaseDay } from "@/features/storefront/components/cards"
import type { StockCell } from "@/features/storefront/components/cards"
import { addToCart } from "@/features/storefront/lib/data/cart"

export type BuyVariant = {
  id: string
  stockKind: string | null
  condition: string | null
  finish: string | null
  quantity: number
  priceMinor: number | null
  preorder: boolean
  preorderReleaseDate: string | null
  preorderLimitPerCustomer: number | null
}

const ORDER = ["NM", "LP", "MP", "HP", "DMG"]

/** Buy a single by printing and condition, a slab, or sealed product (with pre-order terms). */
export function CardBuyPanel({ variants, currencyCode }: { variants: BuyVariant[]; currencyCode: string }) {
  const router = useRouter()
  const countryCode = useParams<{ countryCode: string }>()?.countryCode ?? "us"
  const raw = variants.filter((v) => v.stockKind === "raw" && v.condition)
  const finishes = useMemo(() => [...new Set(raw.map((v) => v.finish))], [raw])
  const [finish, setFinish] = useState<string | null>(finishes.find((f) => raw.some((v) => v.finish === f && v.quantity > 0)) ?? finishes[0] ?? null)
  const cells: StockCell[] = raw
    .filter((v) => v.finish === finish)
    .map((v) => ({ condition: v.condition as StockCell["condition"], variantId: v.id, quantity: v.quantity, available: v.quantity > 0, priceMinor: v.priceMinor }))
    .sort((a, b) => ORDER.indexOf(a.condition) - ORDER.indexOf(b.condition))
  const single = raw.length === 0 ? variants[0] : null
  const [condition, setCondition] = useState<string | null>(cells.find((c) => c.available)?.condition ?? null)
  const chosen = single ?? raw.find((v) => v.finish === finish && v.condition === condition) ?? null
  const available = chosen ? chosen.quantity > 0 || chosen.preorder : false
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [pending, start] = useTransition()

  const add = () => {
    if (!chosen) return
    setMessage(null)
    start(async () => {
      const failure = await addToCart({ variantId: chosen.id, quantity: 1, countryCode })
      if (failure) setMessage({ tone: "error", text: String(failure) })
      else {
        setMessage({ tone: "ok", text: "Added to your cart" })
        router.refresh()
      }
    })
  }

  return (
    <section className="tc grid gap-4 border-y-2 border-[var(--tc-ink)] py-5" aria-label="Buy">
      {finishes.length > 1 ? (
        <div className="grid gap-2">
          <span className="text-[12px] font-semibold text-[var(--tc-ink-3)]">Printing</span>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Printing">
            {finishes.map((f) => (
              <button
                key={f ?? "none"}
                type="button"
                role="radio"
                aria-checked={finish === f}
                className="tc-run-cell px-3"
                data-live="true"
                data-selected={finish === f ? "true" : undefined}
                onClick={() => {
                  setFinish(f)
                  setCondition(raw.find((v) => v.finish === f && v.quantity > 0)?.condition ?? null)
                }}
              >
                {finishLabel(f)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {raw.length > 0 ? (
        <div className="grid gap-2">
          <span className="text-[12px] font-semibold text-[var(--tc-ink-3)]">
            Condition{finishes.length === 1 && finish ? `, ${finishLabel(finish)}` : ""}
          </span>
          <ConditionRun cells={cells} selected={condition} onSelect={(cell) => setCondition(cell.condition)} currencyCode={currencyCode} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <span className="tc-num text-[36px] font-bold leading-none text-[var(--tc-ink)]">{chosen ? money(chosen.priceMinor, currencyCode) : "Sold out"}</span>
          <span className="text-[13px] text-[var(--tc-ink-2)]">
            {chosen?.preorder
              ? `Pre-order. Ships ${releaseDay(chosen.preorderReleaseDate, "long")}${chosen.preorderLimitPerCustomer ? `, limit ${chosen.preorderLimitPerCustomer} per customer` : ""}.`
              : chosen && chosen.stockKind === "raw"
                ? `${conditionLabel(chosen.condition)}, ${chosen.quantity} in stock`
                : chosen && chosen.stockKind === "graded"
                  ? chosen.quantity > 0 ? "One slab" : "Sold"
                  : chosen
                    ? `${chosen.quantity} in stock`
                    : "Every copy has sold. Add the card to your want list."}
          </span>
        </div>
        <button type="button" className="tc-btn min-h-12 px-8 text-[16px]" onClick={add} disabled={!available || pending}>
          {pending ? "Adding" : chosen?.preorder ? "Pre-order" : "Add to cart"}
        </button>
      </div>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-[14px] text-cx-danger" : "text-[14px] text-cx-ink-2"}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
