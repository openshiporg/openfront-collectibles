'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { conditionLabel, finishLabel, money } from '@/features/storefront/components/cards';
import { refreshMarketPricesAction, repriceAction } from '../actions';

const button = 'inline-flex min-h-10 items-center justify-center border border-border bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';
const primary = 'inline-flex min-h-10 items-center justify-center bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

export function RefreshMarketPrices() {
  const [state, action, pending] = useActionState(refreshMarketPricesAction, null);
  return (
    <div className="grid gap-3">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <button type="submit" className={button} disabled={pending}>{pending ? 'Refreshing…' : 'Refresh market prices'}</button>
        <span className="text-xs text-muted-foreground">Today&rsquo;s TCGplayer prices for every set with a TCGplayer group, from tcgcsv.com. Market-priced buylist offers follow.</span>
      </form>
      {state && !state.success ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? (
        <div className="text-sm" role="status">
          <p className="text-foreground">
            {state.data.sets.reduce((sum, s) => sum + s.readings, 0)} readings recorded; {state.data.buylistEntries} buylist offers updated.
          </p>
          {state.data.sets.some((s) => s.error) ? (
            <ul className="mt-2 grid gap-1 text-destructive">
              {state.data.sets.filter((s) => s.error).map((s) => <li key={s.set}>{s.set}: {s.error}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { priced: 'Will change', review: 'Needs review', skipped: 'Skipped' };
const REASON: Record<string, string> = { no_rule: 'No rule for this stock', no_market: 'No market reading' };

export function Repricing() {
  const [state, action, pending] = useActionState(repriceAction, null);
  const result = state?.success ? state.data : null;
  const changes = result ? (result.rows as any[]).filter((r) => r.status === 'priced' && r.suggestedMinor !== r.currentMinor) : [];
  const rows = result ? (result.rows as any[]).filter((r) => r.status !== 'priced' || r.suggestedMinor !== r.currentMinor || r.applied) : [];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form action={action}>
          <input type="hidden" name="apply" value="false" />
          <button type="submit" className={button} disabled={pending}>{pending ? 'Working…' : 'Preview repricing'}</button>
        </form>
        {result && !result.apply && changes.length ? (
          <form action={action}>
            <input type="hidden" name="apply" value="true" />
            <button type="submit" className={primary} disabled={pending}>Apply {changes.length} price {changes.length === 1 ? 'change' : 'changes'}</button>
          </form>
        ) : null}
      </div>
      {state && !state.success ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {result ? (
        <p className="text-sm text-muted-foreground" role="status">
          {result.apply
            ? `${result.applied} prices changed. ${result.review} need review; ${result.skipped} skipped.`
            : `${changes.length} would change, ${result.priced - changes.length} already match, ${result.review} need review, ${result.skipped} skipped.`}
        </p>
      ) : null}
      {rows.length ? (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[720px] text-left text-sm tabular-nums">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">Stock</th>
                <th className="py-2 pr-3 text-right font-medium">Market</th>
                <th className="py-2 pr-3 text-right font-medium">Current</th>
                <th className="py-2 pr-3 text-right font-medium">Suggested</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.variantId} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 text-foreground">{row.product}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {row.stockKind === 'raw' ? [conditionLabel(row.condition), finishLabel(row.finish)].filter(Boolean).join(' · ') : row.stockKind === 'sealed' ? 'Sealed' : 'Graded'}
                  </td>
                  <td className="py-2 pr-3 text-right">{money(row.marketMinor)}</td>
                  <td className="py-2 pr-3 text-right">{money(row.currentMinor)}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-foreground">{row.suggestedMinor != null ? money(row.suggestedMinor) : '—'}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.applied ? 'Applied' : STATUS_LABEL[row.status]}
                    {row.status === 'review' ? ` (${row.changeBasisPoints > 0 ? '+' : ''}${(row.changeBasisPoints / 100).toFixed(0)}%)` : ''}
                    {row.status === 'skipped' ? ` · ${REASON[row.reason] ?? row.reason}` : ''}
                    {row.handle ? <> · <Link className="underline underline-offset-2" href={`/dashboard/platform/products?search=${encodeURIComponent(row.handle)}`}>Find</Link></> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
