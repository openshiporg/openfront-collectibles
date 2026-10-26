'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Tick } from './card-art';
import { RarityMark } from './rarity-mark';
import { cn, shortNumber } from './format';
import type { CardFace, RowStatus } from './types';

/** A printed checklist: column heads, then rows. `actions` opens the trailing action column. */
export function CardSheet({
  children,
  label,
  actions,
  heads = true,
  priceHead = 'Price',
  marketHead = 'Market',
  runHead = 'Condition',
  className,
}: {
  children: ReactNode;
  label: string;
  actions?: boolean;
  heads?: boolean;
  priceHead?: string;
  marketHead?: string;
  runHead?: string;
  className?: string;
}) {
  return (
    <div className={cn('tc tc-sheet', className)} data-actions={actions ? 'true' : undefined} role="table" aria-label={label}>
      {heads ? (
        <div className="tc-sheet-head hidden md:grid" role="row">
          <span role="columnheader"><span className="sr-only">Status</span></span>
          <span role="columnheader" className="tc-num">No.</span>
          <span role="columnheader">Card</span>
          <span role="columnheader"><span className="sr-only">Rarity</span></span>
          <span role="columnheader">{runHead}</span>
          <span role="columnheader" className="text-right">{marketHead}</span>
          <span role="columnheader" className="text-right">{priceHead}</span>
          {actions ? <span role="columnheader"><span className="sr-only">Action</span></span> : null}
        </div>
      ) : null}
      <div className="tc-print" role="rowgroup">{children}</div>
    </div>
  );
}

function useHoverPointer() {
  const [hover, setHover] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHover(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return hover;
}

/**
 * One checklist row. On a pointer, hovering or focusing the number slides the card's art out
 * beside the row and the number opens the card; on touch, the number opens the art in place.
 */
export function CardRow({
  card,
  href,
  status,
  index = 0,
  run,
  market,
  price,
  action,
  detail,
}: {
  card: CardFace;
  href?: string | null;
  status: RowStatus;
  index?: number;
  run?: ReactNode;
  market?: ReactNode;
  price?: ReactNode;
  action?: ReactNode;
  /** Extra line under the name: finish, set, stock note. */
  detail?: ReactNode;
}) {
  const hover = useHoverPointer();
  const [open, setOpen] = useState(false);
  const number = shortNumber(card.number) || '—';
  const numberClass = 'tc-num inline-flex min-h-9 items-center text-[15px] font-semibold text-[var(--tc-ink-2)] underline-offset-4 outline-none hover:text-[var(--tc-ink)] hover:underline focus-visible:text-[var(--tc-ink)] focus-visible:underline';

  return (
    <div className="tc-row" role="row" data-status={status} style={{ ['--tc-i' as string]: Math.min(index, 24) }}>
      <span className="tc-a-tick" role="cell"><Tick state={status} index={index} /></span>
      <span className="tc-a-num" role="cell">
        {hover || !card.imageUrl ? (
          href ? <Link href={href} className={numberClass} aria-label={`Open ${card.name} ${card.number ?? ''}`}>{number}</Link> : <span className={numberClass}>{number}</span>
        ) : (
          <button type="button" className={numberClass} aria-expanded={open} onClick={() => setOpen((v) => !v)} aria-label={`Show ${card.name} ${card.number ?? ''}`}>
            {number}
          </button>
        )}
      </span>
      <span className="tc-a-name" role="cell">
        {href ? (
          <Link href={href} className="tc-name line-clamp-2 block text-[15px] font-semibold leading-snug text-[var(--tc-ink)] outline-none hover:underline focus-visible:underline underline-offset-4 md:line-clamp-1">
            {card.name}
          </Link>
        ) : (
          <span className="tc-name line-clamp-2 block text-[15px] font-semibold leading-snug text-[var(--tc-ink)] md:line-clamp-1">{card.name}</span>
        )}
        {detail ? <span className="block text-[12px] leading-snug text-[var(--tc-ink-3)] md:truncate">{detail}</span> : null}
      </span>
      <span className="tc-a-rarity" role="cell">
        <RarityMark rarity={card.rarity} />
        {market ? <span className="tc-num text-[12px] text-[var(--tc-ink-3)] md:hidden">Mkt {market}</span> : null}
      </span>
      <span className="tc-a-run" role="cell">{run ?? null}</span>
      <span className="tc-a-market tc-num text-[14px] text-[var(--tc-ink-2)]" role="cell">{market}</span>
      <span className="tc-a-price tc-num text-[15px] font-bold text-[var(--tc-ink)]" role="cell">{price}</span>
      {action ? <span className="tc-a-action" role="cell">{action}</span> : null}
      {card.imageUrl && hover ? (
        <span className="tc-peek" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote card art by URL */}
          <img src={card.imageUrl} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}
      {open && card.imageUrl ? (
        <div className="tc-inline-art" role="cell">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote card art by URL */}
          <img src={card.imageUrl} alt={`${card.name} card art`} />
          <div className="grid content-start gap-2 text-[13px] text-[var(--tc-ink-2)]">
            <span className="text-[15px] font-semibold text-[var(--tc-ink)]">{card.name}</span>
            <span className="tc-num">{[card.setName, card.number].filter(Boolean).join(' · ')}</span>
            {card.rarity ? <span>{card.rarity}</span> : null}
            {href ? <Link href={href} className="tc-btn mt-1 w-fit" data-variant="line">Open card</Link> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
