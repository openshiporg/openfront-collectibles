'use client';

import { useMemo, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CardRow, ConditionRun, MarketStamp, finishLabel, money, sealedFormatLabel, shortDay } from '@/features/storefront/components/cards';
import type { RowStatus, StockCell } from '@/features/storefront/components/cards';
import { addToCart } from '@/features/storefront/lib/data/cart';
import type { CardProduct } from '@/features/storefront/lib/data/cards';

const ORDER = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const GRADE_RE = /\b(PSA|BGS|CGC)\s+(10|[1-9](?:\.5)?)\b/;

/**
 * A shop product printed as a checklist row: a single with its condition run, a slab with its
 * grade, or sealed product with its type and street date. Add buys the selected copy.
 */
export function ProductSheetRow({ product, index }: { product: CardProduct; index: number }) {
  const router = useRouter();
  const countryCode = useParams<{ countryCode: string }>()?.countryCode ?? 'us';
  const item = product.catalogItem;
  const set = item?.collectibleSet;
  const kind = product.productVariants[0]?.stockKind ?? (item?.kind === 'sealed' ? 'sealed' : 'raw');
  const currency = product.productVariants.find((v) => v.prices[0])?.prices[0]?.currency?.code?.toUpperCase() || 'USD';

  const raw = product.productVariants.filter((v) => v.stockKind === 'raw' && v.cardCondition);
  const finish = useMemo(() => {
    const finishes = [...new Set(raw.map((v) => v.cardFinish))];
    return finishes.sort((a, b) => raw.filter((v) => v.cardFinish === b && v.inventoryQuantity > 0).length - raw.filter((v) => v.cardFinish === a && v.inventoryQuantity > 0).length)[0] ?? null;
  }, [raw]);
  const cells: StockCell[] = raw
    .filter((v) => v.cardFinish === finish)
    .map((v) => ({ condition: v.cardCondition as StockCell['condition'], variantId: v.id, quantity: v.inventoryQuantity, available: v.inventoryQuantity > 0, priceMinor: v.prices[0]?.amount ?? null }))
    .sort((a, b) => ORDER.indexOf(a.condition) - ORDER.indexOf(b.condition));
  const single = kind !== 'raw' ? product.productVariants[0] : null;
  const [selected, setSelected] = useState<StockCell | null>(cells.find((c) => c.available) ?? null);
  const buyId = single ? single.id : selected?.variantId ?? null;
  const buyPrice = single ? single.prices[0]?.amount ?? null : selected?.priceMinor ?? null;
  const available = single ? single.inventoryQuantity > 0 || single.preorder : Boolean(selected?.available);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reading = (item?.marketPrices ?? []).find((m) => kind === 'sealed' || !finish || m.finish === finish) ?? null;
  const status: RowStatus = single?.preorder ? 'preorder' : available ? 'in' : 'out';
  const grade = kind === 'graded' ? GRADE_RE.exec(product.title) : null;
  const href = `/${countryCode}/products/${product.handle}`;

  const add = () => {
    if (!buyId) return;
    setMessage(null);
    start(async () => {
      const failure = await addToCart({ variantId: buyId, quantity: 1, countryCode });
      setMessage(failure ? String(failure) : 'Added');
      if (!failure) router.refresh();
    });
  };

  const detail = message ?? [
    set?.name,
    kind === 'raw' && finish && finish !== 'normal' ? finishLabel(finish) : null,
    kind === 'sealed' ? sealedFormatLabel(item?.sealedFormat) : null,
    single?.preorder ? `ships ${shortDay(single.preorderReleaseDate)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <CardRow
      index={index}
      status={status}
      href={href}
      card={{
        id: product.id,
        name: kind === 'sealed' ? product.title.replace(/\s*\(Pre-order\)$/, '') : item?.title || product.title,
        number: kind === 'sealed' ? set?.code || null : item?.cardNumber || null,
        rarity: kind === 'sealed' ? null : item?.rarity || null,
        imageUrl: kind === 'sealed' ? null : item?.imageUrl || null,
        setName: set?.name,
      }}
      detail={detail}
      run={
        kind === 'raw' ? (
          <ConditionRun cells={cells} selected={selected?.condition} onSelect={setSelected} currencyCode={currency} />
        ) : kind === 'graded' && grade ? (
          <span className="tc-stamp inline-flex h-[26px] items-center border border-[var(--tc-ink-3)] px-2 text-[12px] text-[var(--tc-ink)]">{grade[1]} {grade[2]}</span>
        ) : single?.preorder ? (
          <span className="tc-preorder-stamp">Pre-order{single.preorderLimitPerCustomer ? ` · limit ${single.preorderLimitPerCustomer}` : ''}</span>
        ) : kind === 'sealed' ? (
          <span className="tc-num text-[12px] text-[var(--tc-ink-3)]">{single ? `${single.inventoryQuantity} in stock` : ''}</span>
        ) : null
      }
      market={kind === 'graded' ? null : <MarketStamp minor={reading?.marketMinor} observedAt={reading?.observedAt} currencyCode={currency} />}
      price={available ? money(buyPrice, currency) : <span className="font-normal text-[var(--tc-ink-3)]">Sold out</span>}
      action={
        <button type="button" className="tc-btn w-[64px] px-0" onClick={add} disabled={!available || pending} aria-label={`Add ${product.title} to cart`}>
          {pending ? '…' : 'Add'}
        </button>
      }
    />
  );
}
