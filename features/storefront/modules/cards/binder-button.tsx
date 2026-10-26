'use client'

import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { addCardToBinder, removeCardFromBinder } from "@/features/storefront/lib/data/cards"
import { CONDITIONS, conditionLabel } from "@/features/storefront/components/cards"

/** "I have this": add a copy to the binder, with its condition and what was paid. */
export function BinderButton({ catalogItemId, finish, label }: { catalogItemId: string; finish?: string | null; label: string }) {
  const router = useRouter()
  const countryCode = useParams<{ countryCode: string }>()?.countryCode ?? "us"
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState("NM")
  const [paid, setPaid] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    start(async () => {
      const dollars = paid.trim() ? Number(paid.replace(/[^0-9.]/g, "")) : null
      const result = await addCardToBinder({
        catalogItemId,
        finish: finish ?? null,
        condition,
        quantity: 1,
        costBasisMinor: dollars != null && Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
      })
      if (result.error) {
        if (result.error.startsWith("Sign in")) router.push(`/${countryCode}/account`)
        else setMessage(result.error)
        return
      }
      setMessage("In your binder")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <span className="inline-grid gap-1">
        <button type="button" className="tc-btn" data-variant="line" onClick={() => { setOpen(true); setMessage(null) }}>
          I have this
        </button>
        {message ? <span role="status" className="text-[12px] text-cx-ink-2">{message}</span> : null}
      </span>
    )
  }
  return (
    <form onSubmit={save} className="tc grid gap-3 border border-cx-line p-3" aria-label={`Add ${label} to your binder`}>
      <div className="grid grid-cols-2 gap-3">
        <label className="tc-field">
          <span>Condition</span>
          <select className="tc-select w-full" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{conditionLabel(c)}</option>)}
          </select>
        </label>
        <label className="tc-field">
          <span>Paid (optional)</span>
          <input className="tc-input tc-num w-full" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0.00" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="tc-btn" disabled={pending}>{pending ? "Adding" : "Add to binder"}</button>
        <button type="button" className="tc-btn" data-variant="line" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {message ? <span role="alert" className="text-[12px] text-cx-danger">{message}</span> : null}
    </form>
  )
}

export function RemoveFromBinder({ id, label }: { id: string; label: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      className="tc-btn w-[64px] px-0"
      data-variant="line"
      disabled={pending}
      aria-label={`Remove ${label} from your binder`}
      onClick={() => start(async () => { await removeCardFromBinder(id); router.refresh() })}
    >
      Remove
    </button>
  )
}
