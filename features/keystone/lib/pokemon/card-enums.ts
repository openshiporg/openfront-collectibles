// Pokémon TCG stock vocabulary shared by models, mutations, the storefront and platform pages.
// Plain values only: keystone.ts imports this, so no path aliases and no runtime dependencies.

export const CARD_CONDITIONS = [
  { value: 'NM', label: 'Near Mint' },
  { value: 'LP', label: 'Lightly Played' },
  { value: 'MP', label: 'Moderately Played' },
  { value: 'HP', label: 'Heavily Played' },
  { value: 'DMG', label: 'Damaged' },
] as const;
export type CardCondition = (typeof CARD_CONDITIONS)[number]['value'];
export const CONDITION_ORDER: CardCondition[] = CARD_CONDITIONS.map((c) => c.value);

// TCGplayer printings ("subtypes"), the finish dimension of a single.
export const CARD_FINISHES = [
  { value: 'normal', label: 'Normal' },
  { value: 'holofoil', label: 'Holofoil' },
  { value: 'reverse_holofoil', label: 'Reverse Holofoil' },
  { value: 'first_edition_holofoil', label: '1st Edition Holofoil' },
  { value: 'first_edition_normal', label: '1st Edition' },
  { value: 'unlimited_holofoil', label: 'Unlimited Holofoil' },
  { value: 'unlimited_normal', label: 'Unlimited' },
] as const;
export type CardFinish = (typeof CARD_FINISHES)[number]['value'];

export const CARD_LANGUAGES = [
  { value: 'EN', label: 'English' },
  { value: 'JA', label: 'Japanese' },
  { value: 'KO', label: 'Korean' },
  { value: 'ZH', label: 'Chinese' },
  { value: 'FR', label: 'French' },
  { value: 'DE', label: 'German' },
  { value: 'ES', label: 'Spanish' },
  { value: 'IT', label: 'Italian' },
  { value: 'PT', label: 'Portuguese' },
] as const;
export type CardLanguage = (typeof CARD_LANGUAGES)[number]['value'];

export const STOCK_KINDS = [
  { value: 'raw', label: 'Single' },
  { value: 'graded', label: 'Graded slab' },
  { value: 'sealed', label: 'Sealed' },
] as const;
export type StockKind = (typeof STOCK_KINDS)[number]['value'];

export const CATALOG_KINDS = [
  { value: 'single', label: 'Card' },
  { value: 'sealed', label: 'Sealed product' },
] as const;

export const SEALED_FORMATS = [
  { value: 'booster_pack', label: 'Booster pack' },
  { value: 'sleeved_booster', label: 'Sleeved booster' },
  { value: 'booster_bundle', label: 'Booster bundle' },
  { value: 'booster_box', label: 'Booster box' },
  { value: 'elite_trainer_box', label: 'Elite Trainer Box' },
  { value: 'premium_collection', label: 'Premium collection' },
  { value: 'tin', label: 'Tin' },
  { value: 'blister', label: 'Blister' },
  { value: 'case', label: 'Case' },
  { value: 'other', label: 'Other' },
] as const;

export const SET_STATUSES = [
  { value: 'released', label: 'Released' },
  { value: 'preorder', label: 'Pre-order' },
  { value: 'announced', label: 'Announced' },
] as const;

export const GRADERS = [
  { value: 'PSA', label: 'PSA', certUrl: 'https://www.psacard.com/cert/{cert}' },
  { value: 'BGS', label: 'Beckett', certUrl: '' },
  { value: 'CGC', label: 'CGC', certUrl: 'https://www.cgccards.com/certlookup/{cert}/' },
] as const;

export const MARKET_SOURCES = [
  { value: 'tcgplayer', label: 'TCGplayer market' },
  { value: 'store_sale', label: 'Store sale' },
  { value: 'manual', label: 'Manual entry' },
] as const;

export const PRICE_BASES = [
  { value: 'market', label: 'Market price' },
  { value: 'low', label: 'Low price' },
  { value: 'mid', label: 'Mid price' },
] as const;
export type PriceBasis = (typeof PRICE_BASES)[number]['value'];

export const ROUNDING_MODES = [
  { value: 'none', label: 'To the cent' },
  { value: 'ninety_nine', label: 'Up to .99' },
  { value: 'quarter', label: 'Up to the quarter' },
  { value: 'whole', label: 'Up to the dollar' },
] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number]['value'];

export const options = <T extends readonly { value: string; label: string }[]>(list: T) =>
  list.map(({ value, label }) => ({ value, label }));

export function labelOf(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? value ?? '';
}

/** Number ordering for checklist rows: "GG69" sorts after "160", "TG05" within its prefix. */
export function numberSortKey(number: string): number {
  const head = String(number).split('/')[0].trim();
  const match = /^([A-Za-z]*)0*(\d+)([A-Za-z]*)$/.exec(head);
  if (!match) return 9_000_000;
  const prefix = match[1].toUpperCase();
  const prefixRank = prefix ? 1 + ([...prefix].reduce((sum, ch) => sum * 27 + (ch.charCodeAt(0) - 64), 0) % 900) : 0;
  return prefixRank * 10_000 + Number(match[2]);
}

/** Large image from the Pokémon TCG API's small image URL (pokemontcg.io and its scrydex host). */
export function largeCardImage(small: string | null | undefined): string | null {
  if (!small) return null;
  if (small.includes('images.scrydex.com')) return small.replace(/\/small$/, '/large');
  return small.replace(/\.png$/, '_hires.png');
}
