import type { StockCell } from '@/features/storefront/components/cards/types';
import type { ChecklistCard } from '@/features/storefront/lib/data/cards';

// Pure helpers over a checklist card's stock and market, used on server and client.

const ORDER = ['NM', 'LP', 'MP', 'HP', 'DMG'];

/** The single (raw) stock of a checklist card as condition cells, best printing first. */
export function rawCells(card: ChecklistCard) {
  const variants = card.stock.flatMap((p) => p.variants.map((v) => ({ ...v, handle: p.handle }))).filter((v) => v.stockKind === 'raw');
  const finishes = [...new Set(variants.map((v) => v.finish))];
  // Show the printing the shop holds the most of; other printings live on the card page.
  const finish = finishes.sort((a, b) => variants.filter((v) => v.finish === b && v.available).length - variants.filter((v) => v.finish === a && v.available).length)[0] ?? null;
  const cells: StockCell[] = variants
    .filter((v) => v.finish === finish && v.condition)
    .map((v) => ({ condition: v.condition as StockCell['condition'], variantId: v.id, quantity: v.quantity, available: v.available, priceMinor: v.priceMinor }))
    .sort((a, b) => ORDER.indexOf(a.condition) - ORDER.indexOf(b.condition));
  const handle = variants[0]?.handle ?? null;
  return { cells, finish, handle, hasRaw: variants.length > 0 };
}

export function marketFor(card: ChecklistCard, finish?: string | null) {
  if (finish && card.market[finish]) return card.market[finish];
  const entries = Object.values(card.market);
  return entries.sort((a, b) => (b.marketMinor ?? 0) - (a.marketMinor ?? 0))[0] ?? null;
}

