// Shapes the card slice draws. Storefront and platform pages map their data into these.

export type ConditionCode = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export type StockCell = {
  condition: ConditionCode;
  /** Variant to buy (storefront) or open (platform); absent when the shop has none. */
  variantId?: string | null;
  quantity: number | null;
  available: boolean;
  priceMinor: number | null;
};

export type CardFace = {
  id: string;
  name: string;
  number?: string | null;
  rarity?: string | null;
  setName?: string | null;
  setCode?: string | null;
  imageUrl?: string | null;
  imageLargeUrl?: string | null;
  finish?: string | null;
  language?: string | null;
};

export type MarketReading = {
  lowMinor: number | null;
  midMinor?: number | null;
  highMinor: number | null;
  marketMinor: number | null;
  observedAt: string;
};

/** A row on a checklist sheet: in stock, out (kept on the sheet), wanted, or pre-order. */
export type RowStatus = 'in' | 'out' | 'wanted' | 'preorder' | 'owned' | 'none';

export type SetFace = {
  handle: string;
  name: string;
  code?: string | null;
  series?: string | null;
  releaseDate?: string | null;
  releaseStatus?: string | null;
  logoUrl?: string | null;
  symbolUrl?: string | null;
  printedTotal?: number | null;
  totalCards?: number | null;
};

export type GradeFace = {
  company: string;
  grade: string;
  label?: string | null;
  certificate?: string | null;
  certificateUrl?: string | null;
  sample?: boolean;
};
