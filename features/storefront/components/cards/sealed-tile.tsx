import Link from 'next/link';
import { cn, releaseDay, sealedFormatLabel } from './format';

/**
 * Sealed product as its box end: the set code stamped large, the product type, the set and
 * its date, the set logo small at the foot. Pre-orders carry the street date on the dashed
 * pre-order stamp.
 */
export function BoxEnd({
  setName,
  setCode,
  logoUrl,
  format,
  preorder,
  releaseDate,
  size = 'tile',
}: {
  setName?: string | null;
  setCode?: string | null;
  logoUrl?: string | null;
  format?: string | null;
  preorder?: boolean;
  releaseDate?: string | null;
  size?: 'tile' | 'hero' | 'row';
}) {
  const code = (setCode || setName || 'Sealed').toUpperCase();
  if (size === 'row') {
    return (
      <span className="tc grid h-full w-full grid-rows-[1fr_auto] border border-[var(--tc-line)] bg-[var(--tc-well)] p-1.5">
        <span className="tc-stamp self-center text-center text-[15px] leading-none text-[var(--tc-ink)]">{code}</span>
        <span className="tc-stamp text-center text-[8px] leading-tight text-[var(--tc-ink-3)]">{sealedFormatLabel(format)}</span>
      </span>
    );
  }
  const hero = size === 'hero';
  return (
    <div className="tc tc-sealed" data-preorder={preorder ? 'true' : undefined}>
      <div className={cn('grid content-between gap-4', hero ? 'p-[9%]' : 'p-[10%]')}>
        <div className="grid gap-2">
          <span className="tc-stamp leading-[0.82] text-[var(--tc-ink)]" style={{ fontSize: hero ? 'clamp(64px, 9vw, 120px)' : 'clamp(36px, 7vw, 56px)', fontWeight: 800 }}>
            {code}
          </span>
          <span className={cn('tc-stamp leading-tight text-[var(--tc-ink)]', hero ? 'text-[20px]' : 'text-[13px]')}>{sealedFormatLabel(format) || 'Sealed'}</span>
          <span className={cn('leading-snug text-[var(--tc-ink-2)]', hero ? 'text-[16px]' : 'text-[12px]')}>{setName}</span>
        </div>
        <div className="grid gap-3">
          {preorder ? (
            <span className="tc-preorder-stamp w-fit">Pre-order · ships {releaseDay(releaseDate)}</span>
          ) : releaseDate ? (
            <span className="tc-num text-[12px] text-[var(--tc-ink-3)]">Released {releaseDay(releaseDate)}</span>
          ) : null}
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- set logo from the Pokémon TCG API host
            <img src={logoUrl} alt="" loading="lazy" decoding="async" className={cn('object-contain object-left', hero ? 'h-14 max-w-[60%]' : 'h-8 max-w-[70%]')} />
          ) : null}
        </div>
      </div>
      <div className="tc-sealed-end" aria-hidden="true" />
    </div>
  );
}

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
  const box = <BoxEnd setName={setName} setCode={setCode} logoUrl={logoUrl} format={format} preorder={preorder} releaseDate={releaseDate} size={bare ? 'hero' : 'tile'} />;
  if (bare) return <Tag>{box}</Tag>;
  return (
    <Tag className="tc-tile">
      <Link href={href} className="grid gap-2.5 outline-none" aria-label={title}>
        {box}
        <div className="grid gap-1">
          <span className={cn('text-[15px] font-semibold leading-tight text-[var(--tc-ink)]', soldOut && 'line-through decoration-[var(--tc-ink-3)]')}>{title}</span>
          <span className="flex items-baseline justify-between gap-2">
            <span className="tc-num text-[16px] font-bold text-[var(--tc-ink)]">{soldOut ? 'Sold out' : price}</span>
            {preorder && limit ? <span className="text-[12px] text-[var(--tc-ink-3)]">Limit {limit}</span> : null}
          </span>
        </div>
      </Link>
    </Tag>
  );
}
