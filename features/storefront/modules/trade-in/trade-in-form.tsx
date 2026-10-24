"use client"

import { useState, useTransition } from "react"
import { Plus, X } from "lucide-react"

import { submitTradeIn } from "@/features/storefront/lib/data/collectibles"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

type Entry = { id: string; title: string; catalogNumber?: string | null; offer: string }
type Row = { buylistEntryId: string; description: string; condition: string }

const DISPOSITIONS = [
  { value: "cash", label: "Cash" },
  { value: "store_credit", label: "Store credit" },
  { value: "trade", label: "Trade" },
]

const field =
  "min-h-12 w-full rounded-xl border border-cx-line bg-cx-surface px-4 text-[15px] text-cx-ink placeholder:text-cx-ink-3 focus:outline-2 focus:outline-cx-accent"

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function TradeInForm({ entries }: { entries: Entry[] }) {
  const [rows, setRows] = useState<Row[]>([{ buylistEntryId: "", description: "", condition: "" }])
  const [disposition, setDisposition] = useState("cash")
  const [key, setKey] = useState(newKey)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (rows.some((row) => !row.description.trim() || !row.condition.trim())) {
      setError("Each item needs a description and condition")
      return
    }
    startTransition(async () => {
      const result = await submitTradeIn({
        key,
        disposition,
        items: rows.map((row) => ({
          ...(row.buylistEntryId ? { buylistEntryId: row.buylistEntryId } : {}),
          description: row.description.trim(),
          condition: row.condition.trim(),
        })),
      })
      if (result.error) setError(result.error)
      else if (result.reference) setReference(result.reference)
    })
  }

  if (reference) {
    return (
      <div className="cx-band space-y-4 px-5 py-6" role="status" data-testid="trade-in-confirmation">
        <p className="flex items-baseline gap-2 font-cx-serif text-[22px] text-cx-ink">
          <StatusDot tone="ok" />
          Trade-in submitted
        </p>
        <p className="cx-num text-[15px] text-cx-ink">{reference}</p>
        <div className="flex flex-wrap gap-3">
          <LocalizedClientLink href="/account/trade-ins" className="cx-btn">
            View trade-ins
          </LocalizedClientLink>
          <button
            type="button"
            className="inline-flex min-h-12 items-center rounded-full px-4 text-[15px] text-cx-ink-2 hover:text-cx-ink"
            onClick={() => {
              setReference(null)
              setRows([{ buylistEntryId: "", description: "", condition: "" }])
              setKey(newKey())
            }}
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="trade-in-form">
      <div className="space-y-2">
        <p className="cx-label">Payment</p>
        <div className="cx-track" role="radiogroup" aria-label="Payment">
          {DISPOSITIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={disposition === option.value}
              data-active={disposition === option.value}
              className="cx-pill"
              onClick={() => setDisposition(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <fieldset key={index} className="cx-band space-y-3 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <legend className="cx-label">Item {index + 1}</legend>
              {rows.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove item ${index + 1}`}
                  className="inline-flex size-10 items-center justify-center rounded-full text-cx-ink-2 hover:bg-cx-surface hover:text-cx-ink"
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {entries.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-[13px] text-cx-ink-2">Buylist item</span>
                <select
                  className={field}
                  value={row.buylistEntryId}
                  onChange={(event) => update(index, { buylistEntryId: event.target.value })}
                >
                  <option value="">Not on the buylist</option>
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title}
                      {entry.catalogNumber ? ` · ${entry.catalogNumber}` : ""} · {entry.offer}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-[13px] text-cx-ink-2">Description</span>
              <textarea
                className={`${field} min-h-24 py-3`}
                maxLength={2000}
                required
                value={row.description}
                onChange={(event) => update(index, { description: event.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[13px] text-cx-ink-2">Condition</span>
              <input
                className={field}
                maxLength={300}
                required
                value={row.condition}
                onChange={(event) => update(index, { condition: event.target.value })}
              />
            </label>
          </fieldset>
        ))}
        {rows.length < 20 && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-[14px] font-medium text-cx-ink-2 hover:text-cx-ink"
            onClick={() => setRows((current) => [...current, { buylistEntryId: "", description: "", condition: "" }])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add item
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-baseline gap-2 text-[14px] text-cx-danger" role="alert">
          <StatusDot tone="danger" />
          {error}
        </p>
      )}
      <button type="submit" className="cx-btn w-full sm:w-auto" disabled={pending} data-testid="submit-trade-in">
        {pending ? "Submitting" : "Submit trade-in"}
      </button>
    </form>
  )
}
