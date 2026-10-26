import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn, releaseDay } from './format';
import type { SetFace } from './types';

/** One cell per card in the set, filled where the shop (or the collector) has it. */
export function CompletionStrip({ cells, label }: { cells: boolean[]; label: string }) {
  if (!cells.length) return null;
  return (
    <div
      className="tc-strip"
      role="img"
      aria-label={label}
      data-long={cells.length > 90 ? 'true' : undefined}
      style={{ ['--tc-cells' as string]: cells.length, ['--tc-half' as string]: Math.ceil(cells.length / 2) }}
    >
      {cells.map((on, i) => <i key={i} data-on={on ? 'true' : undefined} />)}
    </div>
  );
}

export function SetLogo({ set, className }: { set: SetFace; className?: string }) {
  if (!set.logoUrl) {
    const sized = className?.includes('text-[');
    return <span className={cn('tc-stamp leading-none text-[var(--tc-ink)]', !sized && 'text-[22px]', className)}>{set.name}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- set logo from the Pokémon TCG API host
  return <img src={set.logoUrl} alt={`${set.name} logo`} className={cn('object-contain object-left', className)} loading="lazy" decoding="async" />;
}

/**
 * A set at a glance: logo, code, release, and how much of it is held. `have` counts the
 * held cards; `cells` (optional) draws one strip cell per card number.
 */
export function SetSummary({
  set,
  have,
  haveLabel = 'in stock',
  cells,
  href,
  aside,
  size = 'row',
  titleAs = 'h1',
}: {
  set: SetFace;
  have: number;
  haveLabel?: string;
  cells?: boolean[];
  href?: string;
  aside?: ReactNode;
  size?: 'row' | 'head';
  /** The head's title element; 'p' where the page already has its own h1. */
  titleAs?: 'h1' | 'p';
}) {
  const Title = titleAs;
  const total = set.totalCards ?? set.printedTotal ?? cells?.length ?? 0;
  const preorder = set.releaseStatus === 'preorder';
  const body = (
    <>
      <div className={cn('flex items-center', size === 'head' ? 'h-24 sm:h-32' : 'h-12')}>
        <SetLogo set={set} className={size === 'head' ? 'h-full max-w-[320px]' : 'h-full max-w-[150px]'} />
      </div>
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {size === 'head' ? (
            <Title className="font-cx-display text-[44px] font-bold leading-none tracking-[-0.02em] text-[var(--tc-ink)] sm:text-[64px]">{set.name}</Title>
          ) : (
            <span className="text-[16px] font-semibold leading-tight text-[var(--tc-ink)]">{set.name}</span>
          )}
          {set.code ? <span className="tc-stamp text-[12px] text-[var(--tc-ink-3)]">{set.code}</span> : null}
        </div>
        <span className="tc-num text-[13px] text-[var(--tc-ink-3)]">
          {[set.series, preorder ? `Releases ${releaseDay(set.releaseDate, 'long')}` : releaseDay(set.releaseDate)].filter(Boolean).join(' · ')}
        </span>
        {preorder ? (
          <span className="tc-stamp mt-1 w-fit bg-[var(--tc-accent)] px-1.5 py-0.5 text-[11px] text-[var(--tc-accent-ink)]">Pre-order</span>
        ) : total ? (
          <span className="tc-num text-[13px] text-[var(--tc-ink-2)]">
            <strong className="font-bold text-[var(--tc-ink)]">{have}</strong> of {total} {haveLabel}
          </span>
        ) : null}
      </div>
      {aside ? <div className="justify-self-end">{aside}</div> : null}
      {cells?.length ? <div className="col-span-full"><CompletionStrip cells={cells} label={`${have} of ${cells.length} cards ${haveLabel}`} /></div> : null}
    </>
  );
  const grid = cn('tc grid items-center gap-x-5 gap-y-3', size === 'head' ? 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)_auto]');
  return href ? (
    <Link href={href} className={cn(grid, 'group py-4 outline-none focus-visible:outline-2 focus-visible:outline-[var(--tc-accent)]')}>{body}</Link>
  ) : (
    <div className={grid}>{body}</div>
  );
}
