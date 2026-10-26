import type { ReactNode } from 'react';
import Link from 'next/link';
import { CardArt, CardBadge } from './card-art';
import { RarityMark } from './rarity-mark';
import { cn, money, shortNumber } from './format';
import type { CardFace } from './types';

/** Responsive grid for tiles: two across on a phone, up to `columns` on desktop. */
export function CardGrid({ children, columns = 5, className, label }: { children: ReactNode; columns?: 3 | 4 | 5 | 6; className?: string; label?: string }) {
  return (
    <ul className={cn('tc tc-grid', className)} style={{ ['--tc-cols' as string]: columns }} aria-label={label}>
      {children}
    </ul>
  );
}

/**
 * One card as a tile: art with its badges, then name, set and number, then the price line.
 * `price` is preformatted by the caller (from-price, slab price, sealed price).
 */
export function CardTile({
  card,
  href,
  price,
  priceNote,
  badges,
  soldOut,
  eager,
}: {
  card: CardFace;
  href: string;
  price?: string | null;
  priceNote?: ReactNode;
  badges?: ReactNode;
  soldOut?: boolean;
  eager?: boolean;
}) {
  return (
    <li className="tc-tile">
      <Link href={href} className="group grid gap-2.5 outline-none" aria-label={`${card.name}${card.number ? `, ${card.number}` : ''}`}>
        <CardArt src={card.imageUrl} alt={`${card.name} card art`} badges={badges} eager={eager} sizes="(max-width: 640px) 46vw, 240px" />
        <div className="grid gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className={cn('text-[15px] font-semibold leading-tight text-[var(--tc-ink)]', soldOut && 'line-through decoration-[var(--tc-ink-3)]')}>{card.name}</span>
            <RarityMark rarity={card.rarity} className="mt-[3px] shrink-0" />
          </div>
          <span className="tc-num text-[13px] leading-tight text-[var(--tc-ink-3)]">
            {[card.setName, shortNumber(card.number) && card.number].filter(Boolean).join(' · ')}
          </span>
          <span className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="tc-num text-[16px] font-bold text-[var(--tc-ink)]">{price || (soldOut ? 'Sold out' : '')}</span>
            {priceNote ? <span className="text-[12px] text-[var(--tc-ink-3)]">{priceNote}</span> : null}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function fromPrice(prices: Array<number | null | undefined>, currencyCode: string) {
  const values = prices.filter((p): p is number => typeof p === 'number');
  if (!values.length) return null;
  const min = Math.min(...values);
  return values.length > 1 && Math.max(...values) !== min ? `from ${money(min, currencyCode)}` : money(min, currencyCode);
}

export { CardBadge };
