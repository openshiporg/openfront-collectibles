import type { ReactNode } from 'react';
import { CONDITIONS, money } from './format';

/** A card's printed facts as a definition list; empty values are left out. */
export function CardFacts({ facts }: { facts: Array<{ label: string; value: ReactNode }> }) {
  const shown = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  return (
    <dl className="tc grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-4 border-t border-[var(--tc-line)] text-[14px]">
      {shown.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="border-b border-[var(--tc-line)] py-2.5 text-[var(--tc-ink-3)]">{fact.label}</dt>
          <dd className="border-b border-[var(--tc-line)] py-2.5 text-[var(--tc-ink)]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What the shop pays for a card, by condition: cash and store credit side by side. */
export function OfferTable({ offers, currencyCode = 'USD' }: { offers: Record<string, { cashMinor: number; creditMinor: number }>; currencyCode?: string }) {
  const rows = CONDITIONS.filter((c) => offers[c]);
  if (!rows.length) return null;
  return (
    <table className="tc tc-num w-full text-[13px]">
      <thead>
        <tr className="text-left text-[var(--tc-ink-3)]">
          <th className="py-1 font-semibold">Condition</th>
          <th className="py-1 text-right font-semibold">Cash</th>
          <th className="py-1 text-right font-semibold">Credit</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c} className="border-t border-[var(--tc-line)]">
            <td className="py-1.5 font-semibold text-[var(--tc-ink-2)]">{c}</td>
            <td className="py-1.5 text-right text-[var(--tc-ink)]">{money(offers[c].cashMinor, currencyCode)}</td>
            <td className="py-1.5 text-right font-bold text-[var(--tc-ink)]">{money(offers[c].creditMinor, currencyCode)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
