import { CompletionStrip } from './set-summary';
import { money } from './format';

/**
 * A collector's binder in numbers: market value, what they paid where they recorded it,
 * copies and distinct cards, and how far through each set they are.
 */
export function BinderSummary({
  valueMinor,
  costMinor,
  pricedCost,
  copies,
  distinct,
  currencyCode = 'USD',
  sets,
}: {
  valueMinor: number;
  costMinor: number | null;
  /** Market value of only the cards with a recorded cost, to compare like with like. */
  pricedCost?: number | null;
  copies: number;
  distinct: number;
  currencyCode?: string;
  sets: Array<{ name: string; owned: number; total: number; cells?: boolean[] }>;
}) {
  const gain = costMinor != null && pricedCost != null ? pricedCost - costMinor : null;
  return (
    <section className="tc grid gap-6" aria-label="Binder summary">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t-2 border-[var(--tc-ink)] pt-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[12px] font-semibold text-[var(--tc-ink-3)]">Market value</dt>
          <dd className="tc-num text-[32px] font-bold leading-tight text-[var(--tc-ink)]">{money(valueMinor, currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold text-[var(--tc-ink-3)]">Paid</dt>
          <dd className="tc-num text-[18px] font-semibold text-[var(--tc-ink)]">{costMinor != null ? money(costMinor, currencyCode) : 'Not recorded'}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold text-[var(--tc-ink-3)]">Gain on recorded cost</dt>
          <dd className="tc-num text-[18px] font-semibold" style={{ color: gain == null ? 'var(--tc-ink-3)' : gain >= 0 ? 'var(--tc-up)' : 'var(--tc-down)' }}>
            {gain == null ? '—' : `${gain >= 0 ? 'Up' : 'Down'} ${money(Math.abs(gain), currencyCode)}`}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold text-[var(--tc-ink-3)]">Cards</dt>
          <dd className="tc-num text-[18px] font-semibold text-[var(--tc-ink)]">{copies} <span className="text-[14px] font-normal text-[var(--tc-ink-3)]">({distinct} different)</span></dd>
        </div>
      </dl>
      {sets.length ? (
        <ul className="grid gap-4" aria-label="Set completion">
          {sets.map((set) => (
            <li key={set.name} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="font-semibold text-[var(--tc-ink)]">{set.name}</span>
                <span className="tc-num text-[var(--tc-ink-2)]"><strong className="text-[var(--tc-ink)]">{set.owned}</strong> of {set.total}</span>
              </div>
              <CompletionStrip cells={set.cells ?? Array.from({ length: set.total }, (_, i) => i < set.owned)} label={`${set.owned} of ${set.total} owned`} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
