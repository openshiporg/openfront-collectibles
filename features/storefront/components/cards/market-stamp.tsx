import { money, shortDay } from './format';

/** A market reading as a row prints it: the price, and under it the day it was read. */
export function MarketStamp({ minor, observedAt, currencyCode = 'USD' }: { minor: number | null | undefined; observedAt?: string | null; currencyCode?: string }) {
  if (minor == null) return null;
  return (
    <span className="inline-grid justify-items-end leading-tight" title={observedAt ? `TCGplayer market, read ${shortDay(observedAt)}` : 'TCGplayer market'}>
      <span>{money(minor, currencyCode)}</span>
      {observedAt ? <span className="text-[11px] text-[var(--tc-ink-3)]">{shortDay(observedAt)}</span> : null}
    </span>
  );
}
