"use client"

import { useMemo, useState, useTransition } from "react"
import { CardRow, CardSheet, CONDITIONS, conditionLabel, finishLabel, money } from "@/features/storefront/components/cards"
import { submitTradeIn } from "@/features/storefront/lib/data/collectibles"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"

export type BuylistEntry = {
  id: string
  catalogItemId: string
  title: string
  number: string | null
  rarity: string | null
  imageUrl: string | null
  set: { handle: string; name: string } | null
  finish: string | null
  minimumCondition: string | null
  hotlist: boolean
  offers: Record<string, { cashMinor: number; creditMinor: number }>
  maximumQuantity: number | null
}

type Line = { entryId: string | null; title: string; condition: string; quantity: number; cashMinor: number; creditMinor: number }

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

function useEntryControls({ entry, currencyCode, onAdd }: { entry: BuylistEntry; currencyCode: string; onAdd: (line: Line) => void }) {
  const conditions = CONDITIONS.filter((c) => entry.offers[c])
  const [condition, setCondition] = useState<string>(conditions[0] ?? "NM")
  const offer = entry.offers[condition]
  return {
    run: (
      <select className="tc-select !min-w-0 w-[118px]" aria-label={`Condition of your ${entry.title}`} value={condition} onChange={(e) => setCondition(e.target.value)}>
        {conditions.map((c) => <option key={c} value={c}>{conditionLabel(c)}</option>)}
      </select>
    ),
    cash: offer ? money(offer.cashMinor, currencyCode) : "—",
    credit: offer ? money(offer.creditMinor, currencyCode) : "—",
    add: (
      <button
        type="button"
        className="tc-btn w-[64px] px-0"
        disabled={!offer}
        aria-label={`Add your ${entry.title}, ${condition}, to the sell list`}
        onClick={() => offer && onAdd({ entryId: entry.id, title: `${entry.title}${entry.number ? ` ${entry.number}` : ""}${entry.set ? `, ${entry.set.name}` : ""}`, condition, quantity: 1, cashMinor: offer.cashMinor, creditMinor: offer.creditMinor })}
      >
        Add
      </button>
    ),
  }
}

function BuylistRow({ entry, index, currencyCode, countryCode, onAdd }: { entry: BuylistEntry; index: number; currencyCode: string; countryCode: string; onAdd: (line: Line) => void }) {
  const controls = useEntryControls({ entry, currencyCode, onAdd })
  return (
    <div id={entry.id} className="contents">
      <CardRow
        index={index}
        status={entry.hotlist ? "wanted" : "none"}
        href={`/${countryCode}/cards/${entry.catalogItemId}`}
        card={{ id: entry.id, name: entry.title, number: entry.number, rarity: entry.rarity, imageUrl: entry.imageUrl, setName: entry.set?.name }}
        detail={[entry.set?.name, entry.finish ? finishLabel(entry.finish) : null, entry.hotlist ? "Hotlist" : null, entry.maximumQuantity != null ? `buying ${entry.maximumQuantity}` : null].filter(Boolean).join(" · ")}
        run={controls.run}
        market={controls.cash}
        price={controls.credit}
        action={controls.add}
      />
    </div>
  )
}

/** The buylist as a checklist: pick condition, add to the sell list, choose cash or credit, submit. */
export function BuylistBuilder({ entries, currencyCode, countryCode, signedIn }: { entries: BuylistEntry[]; currencyCode: string; countryCode: string; signedIn: boolean }) {
  const [lines, setLines] = useState<Line[]>([])
  const [payout, setPayout] = useState<"cash" | "store_credit">("store_credit")
  const [other, setOther] = useState({ title: "", condition: "NM" })
  const [key, setKey] = useState(newKey)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const add = (line: Line) => setLines((current) => {
    const same = current.findIndex((l) => l.entryId === line.entryId && l.condition === line.condition)
    if (same < 0) return [...current, line]
    return current.map((l, i) => (i === same ? { ...l, quantity: l.quantity + 1 } : l))
  })
  const totals = useMemo(() => lines.reduce((t, l) => ({ cash: t.cash + l.cashMinor * l.quantity, credit: t.credit + l.creditMinor * l.quantity }), { cash: 0, credit: 0 }), [lines])

  const submit = () => {
    setError(null)
    start(async () => {
      const result = await submitTradeIn({
        key,
        disposition: payout,
        items: lines.map((l) => ({
          ...(l.entryId ? { buylistEntryId: l.entryId } : {}),
          description: l.title,
          condition: conditionLabel(l.condition),
          ...(l.entryId ? { cardCondition: l.condition } : {}),
          quantity: l.quantity,
        })),
      })
      if (result.error) setError(result.error)
      else if (result.reference) {
        setReference(result.reference)
        setLines([])
        setKey(newKey())
      }
    })
  }

  return (
    <div className="tc grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <CardSheet label="Buylist" actions runHead="Your copy" marketHead="Cash" priceHead="Credit">
        {entries.map((entry, i) => (
          <BuylistRow key={entry.id} entry={entry} index={i} currencyCode={currencyCode} countryCode={countryCode} onAdd={add} />
        ))}
      </CardSheet>

      <aside className="grid gap-5 border-t-2 border-cx-ink pt-4 lg:sticky lg:top-24" aria-label="Your sell list">
        <h2 className="text-[18px] font-bold text-cx-ink">Your sell list</h2>
        {reference ? (
          <div role="status" className="grid gap-3">
            <p className="text-[16px] font-semibold text-cx-ink">Submitted. Reference <span className="tc-num">{reference}</span></p>
            <p className="text-[14px] text-cx-ink-2">Send the cards in; we inspect them and confirm the offer before paying.</p>
            <LocalizedClientLink href="/account/trade-ins" className="tc-btn w-fit">View your submissions</LocalizedClientLink>
            <button type="button" className="w-fit text-[14px] text-cx-ink-2 underline underline-offset-4" onClick={() => setReference(null)}>Start another</button>
          </div>
        ) : (
          <>
            {lines.length === 0 ? (
              <p className="text-[14px] leading-[1.5] text-cx-ink-2">Add cards from the buylist, or a card that isn&apos;t on it below.</p>
            ) : (
              <ul className="grid divide-y divide-cx-line border-y border-cx-line">
                {lines.map((l, i) => (
                  <li key={`${l.entryId}-${l.condition}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-cx-ink">{l.title}</span>
                      <span className="tc-num text-[12px] text-cx-ink-3">{l.condition}{l.entryId ? ` · ${money(payout === "cash" ? l.cashMinor : l.creditMinor, currencyCode)} each` : " · offer after inspection"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <button type="button" className="tc-run-cell" data-live="true" aria-label={`One fewer ${l.title}`} onClick={() => setLines((c) => c.flatMap((x, j) => (j === i ? (x.quantity > 1 ? [{ ...x, quantity: x.quantity - 1 }] : []) : [x])))}>−</button>
                      <span className="tc-num w-6 text-center text-[14px] text-cx-ink">{l.quantity}</span>
                      <button type="button" className="tc-run-cell" data-live="true" aria-label={`One more ${l.title}`} onClick={() => setLines((c) => c.map((x, j) => (j === i ? { ...x, quantity: x.quantity + 1 } : x)))}>+</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!other.title.trim()) return
                add({ entryId: null, title: other.title.trim(), condition: other.condition, quantity: 1, cashMinor: 0, creditMinor: 0 })
                setOther({ title: "", condition: "NM" })
              }}
            >
              <span className="text-[12px] font-semibold text-cx-ink-3">Not on the buylist</span>
              <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] gap-2">
                <input className="tc-input flex-1" placeholder="Card, set and number" value={other.title} maxLength={200} onChange={(e) => setOther({ ...other, title: e.target.value })} aria-label="Card not on the buylist" />
                <select className="tc-select !min-w-0 w-[80px]" value={other.condition} onChange={(e) => setOther({ ...other, condition: e.target.value })} aria-label="Its condition">
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="submit" className="tc-btn" data-variant="line">Add</button>
              </div>
            </form>

            <div className="grid gap-2" role="radiogroup" aria-label="Payout">
              <span className="text-[12px] font-semibold text-cx-ink-3">Payout</span>
              <div className="grid grid-cols-2 gap-1">
                {(["store_credit", "cash"] as const).map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={payout === p} className="tc-run-cell min-h-11" data-live="true" data-tone="ink" data-selected={payout === p ? "true" : undefined} onClick={() => setPayout(p)}>
                    {p === "cash" ? `Cash ${money(totals.cash, currencyCode)}` : `Credit ${money(totals.credit, currencyCode)}`}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-cx-ink-3">Listed offers are estimates until we inspect the cards.</p>
            </div>

            {signedIn ? (
              <button type="button" className="tc-btn min-h-12" disabled={!lines.length || pending} onClick={submit}>
                {pending ? "Submitting" : `Submit ${lines.reduce((n, l) => n + l.quantity, 0)} cards`}
              </button>
            ) : (
              <LocalizedClientLink href="/account" className="tc-btn min-h-12">Sign in to submit</LocalizedClientLink>
            )}
            {error ? <p role="alert" className="text-[14px] text-cx-danger">{error}</p> : null}
          </>
        )}
      </aside>
    </div>
  )
}
