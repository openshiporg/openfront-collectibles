import Link from 'next/link';
import { cn, releaseDay, sealedFormatLabel } from './format';

/**
 * Sealed product as its box end: the set logo on the face, the end label below with format,
 * set and code; pre-order product carries the street date on a yellow end.
 */
export function SealedTile({
  title,
  setName,
  setCode,
  logoUrl,
  format,
  price,
  href,
  preorder,
  releaseDate,
  limit,
  soldOut,
  bare,
  as = 'li',
}: {
  title: string;
  setName?: string | null;
  setCode?: string | null;
  logoUrl?: string | null;
  format?: string | null;
  price?: string | null;
  href: string;
  preorder?: boolean;
  releaseDate?: string | null;
  limit?: number | null;
  soldOut?: boolean;
  /** Just the box: no caption under it (the page around it carries the title and price). */
  bare?: boolean;
  as?: 'li' | 'div';
}) {
  const Tag = as;
  return (
    <Tag className="tc-tile">
      <Link href={href} className="grid gap-2.5 outline-none" aria-label={title}>
        <div className="tc tc-sealed tc-art" data-preorder={preorder ? 'true' : undefined}>
          <div className="tc-sealed-face">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- set logo from the Pokémon TCG API host
              <img src={logoUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="text-center text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-[var(--tc-ink)]" style={{ fontStretch: '75%' }}>{setName}</span>
            )}
          </div>
          <div className="tc-sealed-end">
            <span className="tc-stamp text-[13px] leading-tight">{sealedFormatLabel(format) || 'Sealed'}</span>
            <span className="tc-num tc-dim text-[11px] text-[var(--tc-ink-3)]">
              {preorder ? `Ships ${releaseDay(releaseDate)}` : [setName, setCode].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
        {bare ? null : <div className="grid gap-1">
          <span className={cn('text-[15px] font-semibold leading-tight text-[var(--tc-ink)]', soldOut && 'line-through decoration-[var(--tc-ink-3)]')}>{title}</span>
          <span className="flex items-baseline justify-between gap-2">
            <span className="tc-num text-[16px] font-bold text-[var(--tc-ink)]">{soldOut ? 'Sold out' : price}</span>
            {preorder && limit ? <span className="text-[12px] text-[var(--tc-ink-3)]">Limit {limit}</span> : null}
          </span>
        </div>}
      </Link>
    </Tag>
  );
}
