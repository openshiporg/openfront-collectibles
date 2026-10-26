'use client';

import { useMemo, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CardRow, ConditionRun, finishLabel, money } from '@/features/storefront/components/cards';
import type { RowStatus, StockCell } from '@/features/storefront/components/cards';
import { addToCart } from '@/features/storefront/lib/data/cart';
import { toggleCardWant } from '@/features/storefront/lib/data/cards';
import type { ChecklistCard } from '@/features/storefront/lib/data/cards';
import { marketFor, rawCells } from './checklist-stock';

/**
 * A storefront checklist row: tick, number, name, the NM-to-DMG run (each live cell selects
 * the copy to buy), market, price, and Add, or Want when the shop has none.
 */
export function ChecklistRow({ card, setName, index, currencyCode, wanted: initiallyWanted = false }: { card: ChecklistCard; setName?: string; index: number; currencyCode: string; wanted?: boolean }) {
  const router = useRouter();
  const countryCode = useParams<{ countryCode: string }>()?.countryCode ?? 'us';
  const { cells, finish, handle, hasRaw } = useMemo(() => rawCells(card), [card]);
  const firstLive = cells.find((c) => c.available) ?? null;
  const [selected, setSelected] = useState<StockCell | null>(firstLive);
  const [wanted, setWanted] = useState(initiallyWanted);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const market = marketFor(card, finish);
  const status: RowStatus = firstLive ? 'in' : hasRaw ? 'out' : wanted ? 'wanted' : 'none';
  const href = handle ? `/${countryCode}/products/${handle}` : `/${countryCode}/cards/${card.id}`;

  const add = () => {
    if (!selected?.variantId) return;
    setMessage(null);
    start(async () => {
      const failure = await addToCart({ variantId: selected.variantId!, quantity: 1, countryCode });
      setMessage(failure ? String(failure) : 'Added');
      if (!failure) router.refresh();
    });
  };
  const want = () => {
    setMessage(null);
    start(async () => {
      const result = await toggleCardWant({ catalogItemId: card.id, finish });
      if (result.error) {
        if (result.error.startsWith('Sign in')) router.push(`/${countryCode}/account`);
        else setMessage(result.error);
        return;
      }
      setWanted(Boolean(result.wanted));
    });
  };

  return (
    <CardRow
      index={index}
      status={status}
      href={href}
      card={{ id: card.id, name: card.name, number: card.number, rarity: card.rarity, imageUrl: card.imageUrl, setName }}
      detail={message ?? (finish && finish !== 'normal' ? finishLabel(finish) : undefined)}
      run={hasRaw ? <ConditionRun cells={cells} selected={selected?.condition} onSelect={setSelected} currencyCode={currencyCode} /> : null}
      market={market?.marketMinor != null ? money(market.marketMinor, currencyCode) : null}
      price={selected ? money(selected.priceMinor, currencyCode) : hasRaw ? <span className="font-normal text-[var(--tc-ink-3)]">Sold out</span> : null}
      action={
        selected ? (
          <button type="button" className="tc-btn w-[64px] px-0" onClick={add} disabled={pending} aria-label={`Add ${card.name}, ${selected.condition}, to cart`}>
            {pending ? '…' : 'Add'}
          </button>
        ) : (
          <button type="button" className="tc-btn w-[64px] px-0" data-variant="line" onClick={want} disabled={pending} aria-pressed={wanted} aria-label={wanted ? `Remove ${card.name} from your want list` : `Add ${card.name} to your want list`}>
            {wanted ? 'Wanted' : 'Want'}
          </button>
        )
      }
    />
  );
}
