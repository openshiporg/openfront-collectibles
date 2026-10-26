'use client'

import { useState } from "react"

/** The number is the navigation: jump the sheet to a card number. */
export function JumpToNumber() {
  const [value, setValue] = useState("")
  const [missing, setMissing] = useState(false)
  const jump = (event: React.FormEvent) => {
    event.preventDefault()
    const n = value.trim().split("/")[0].replace(/^0+(?=\d)/, "")
    const target = document.getElementById(`no-${n}`) ?? document.getElementById(`no-${n.padStart(3, "0")}`)
    const row = target?.querySelector<HTMLElement>(".tc-row") ?? target
    if (!row) { setMissing(true); return }
    setMissing(false)
    row.scrollIntoView({ behavior: "smooth", block: "center" })
    row.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true })
  }
  return (
    <form onSubmit={jump} className="tc-field" aria-label="Jump to a card number">
      <span>Jump to number</span>
      <div className="flex">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setMissing(false) }}
          inputMode="text"
          maxLength={12}
          placeholder="199"
          className="tc-input tc-num w-[96px]"
          aria-invalid={missing}
          aria-describedby={missing ? "jump-missing" : undefined}
        />
        <button type="submit" className="tc-btn min-h-10">Go</button>
      </div>
      {missing ? <span id="jump-missing" role="status" className="text-[12px] text-cx-danger">Not on this list</span> : null}
    </form>
  )
}
