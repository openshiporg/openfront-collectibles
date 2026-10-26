'use server';

import { gql } from 'graphql-request';
import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { openfrontClient } from '../config';
import { getAuthHeaders } from './cookies';

// Pokémon card reads for the storefront: sets, set checklists, a card's market, the
// collector's binder and want list. Each read fails soft to an empty state.

export type ChecklistVariant = {
  id: string;
  title: string;
  stockKind: 'raw' | 'graded' | 'sealed';
  condition: string | null;
  finish: string | null;
  language: string | null;
  quantity: number | null;
  available: boolean;
  preorder: boolean;
  preorderReleaseDate: string | null;
  preorderLimitPerCustomer: number | null;
  priceMinor: number | null;
};
export type ChecklistStock = { title: string; handle: string; variants: ChecklistVariant[] };
export type ChecklistCard = {
  id: string;
  handle: string;
  kind: 'single' | 'sealed';
  name: string;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  energyTypes: string[];
  hp: string | null;
  artist: string | null;
  imageUrl: string | null;
  imageLargeUrl: string | null;
  sealedFormat: string | null;
  market: Record<string, { lowMinor: number | null; midMinor: number | null; highMinor: number | null; marketMinor: number | null; observedAt: string }>;
  stock: ChecklistStock[];
};
export type CardSet = {
  handle: string;
  name: string;
  code: string | null;
  series: string | null;
  printedTotal: number | null;
  totalCards: number | null;
  releaseDate: string | null;
  releaseStatus: string;
  logoUrl: string | null;
  symbolUrl: string | null;
  cardsStocked?: number;
  sealedStocked?: number;
};

async function signedIn() {
  const headers = await getAuthHeaders();
  return headers.authorization ? headers : null;
}

export const getCardSets = cache(async function (currencyCode: string): Promise<CardSet[]> {
  try {
    const result: any = await openfrontClient.request(gql`query CardSets($currencyCode: String) { publicCardSets(currencyCode: $currencyCode) }`, { currencyCode });
    return Array.isArray(result.publicCardSets) ? result.publicCardSets : [];
  } catch {
    return [];
  }
});

export const getSetChecklist = cache(async function (handle: string, currencyCode: string): Promise<{ set: CardSet; currencyCode: string; cards: ChecklistCard[] } | null> {
  try {
    const result: any = await openfrontClient.request(
      gql`query SetChecklist($handle: String!, $currencyCode: String) { publicSetChecklist(handle: $handle, currencyCode: $currencyCode) }`,
      { handle, currencyCode },
    );
    return result.publicSetChecklist ?? null;
  } catch {
    return null;
  }
});

export const getCardMarket = cache(async function (catalogItemId: string) {
  try {
    const result: any = await openfrontClient.request(gql`query CardMarket($id: ID!) { publicCardMarket(catalogItemId: $id) }`, { id: catalogItemId });
    return result.publicCardMarket as null | {
      card: { id: string; name: string; number: string | null; rarity: string | null; supertype: string | null; energyTypes: string[]; hp: string | null; artist: string | null; imageUrl: string | null; imageLargeUrl: string | null; kind: string; sealedFormat: string | null };
      set: CardSet | null;
      readings: Array<{ finish: string | null; condition: string | null; grade: string; source: string; lowMinor: number | null; midMinor: number | null; highMinor: number | null; marketMinor: number | null; observedAt: string; currencyCode: string }>;
    };
  } catch {
    return null;
  }
});

/** The card facts a product page needs: its catalog card, set, and the variants' card fields. */
export const getProductCard = cache(async function (handle: string) {
  try {
    const result: any = await openfrontClient.request(gql`
      query ProductCard($handle: String!) {
        product(where: { handle: $handle }) {
          id
          catalogItem {
            id handle kind title cardNumber rarity supertype energyTypes hp artist imageUrl imageLargeUrl sealedFormat
            collectibleSet { handle name code series printedTotal totalCards releaseDate releaseStatus logoUrl symbolUrl }
          }
          productVariants { id stockKind cardCondition cardFinish cardLanguage preorder preorderReleaseDate preorderLimitPerCustomer inventoryQuantity }
        }
      }
    `, { handle });
    return result.product ?? null;
  } catch {
    return null;
  }
});

export async function getBinder() {
  const headers = await signedIn();
  if (!headers) return null;
  try {
    const result: any = await openfrontClient.request(gql`query ActiveBinder { activeBinder }`, {}, headers);
    return result.activeBinder ?? null;
  } catch {
    return null;
  }
}

export async function addCardToBinder(input: { catalogItemId: string; finish?: string | null; condition?: string; quantity?: number; costBasisMinor?: number | null }): Promise<{ ok?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to keep a binder' };
  try {
    await openfrontClient.request(gql`mutation AddToBinder($input: JSON!) { addToBinder(input: $input) }`, { input }, headers);
    revalidatePath('/[countryCode]/account/binder', 'page');
    return { ok: true };
  } catch {
    return { error: 'Could not add this card to your binder' };
  }
}

export async function removeCardFromBinder(binderCardId: string): Promise<{ ok?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to keep a binder' };
  try {
    await openfrontClient.request(gql`mutation RemoveFromBinder($id: ID!) { removeFromBinder(binderCardId: $id) }`, { id: binderCardId }, headers);
    revalidatePath('/[countryCode]/account/binder', 'page');
    return { ok: true };
  } catch {
    return { error: 'Could not remove this card' };
  }
}

export async function getWantList(currencyCode: string) {
  const headers = await signedIn();
  if (!headers) return null;
  try {
    const result: any = await openfrontClient.request(gql`query ActiveWantList($currencyCode: String) { activeWantList(currencyCode: $currencyCode) }`, { currencyCode }, headers);
    return Array.isArray(result.activeWantList) ? result.activeWantList : [];
  } catch {
    return null;
  }
}

export async function toggleCardWant(input: { catalogItemId: string; finish?: string | null; minimumCondition?: string | null; maxPriceMinor?: number | null }): Promise<{ wanted?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to keep a want list' };
  try {
    const result: any = await openfrontClient.request(gql`mutation ToggleWant($input: JSON!) { toggleWantList(input: $input) }`, { input }, headers);
    revalidatePath('/[countryCode]/account/wishlist', 'page');
    return { wanted: Boolean(result.toggleWantList?.wanted) };
  } catch {
    return { error: 'Could not update your want list' };
  }
}

export type CardProduct = {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  thumbnail: string | null;
  createdAt: string;
  catalogItem: null | {
    id: string; handle: string; kind: string; title: string; cardNumber: string; numberSort: number | null; rarity: string; imageUrl: string; imageLargeUrl: string; sealedFormat: string | null;
    collectibleSet: null | { handle: string; name: string; code: string; releaseDate: string | null; releaseStatus: string | null; logoUrl: string };
    marketPrices?: Array<{ finish: string | null; marketMinor: number | null; observedAt: string }>;
  };
  productVariants: Array<{
    id: string; title: string; stockKind: string | null; cardCondition: string | null; cardFinish: string | null; cardLanguage: string | null;
    inventoryQuantity: number; preorder: boolean; preorderReleaseDate: string | null; preorderLimitPerCustomer: number | null;
    prices: Array<{ amount: number; currency: { code: string } | null }>;
  }>;
};

export type CardShelfQuery = {
  countryCode: string;
  category?: string;
  collection?: string;
  set?: string;
  rarity?: string;
  condition?: string;
  language?: string;
  kind?: 'raw' | 'graded' | 'sealed';
  preorder?: boolean;
  priceMaxMinor?: number;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'number' | 'set';
  limit?: number;
  offset?: number;
};

/** Published card products with their catalog card, set and stock; filtered, then sorted here. */
export const getCardProducts = cache(async function (query: CardShelfQuery): Promise<{ products: CardProduct[]; count: number }> {
  const variantWhere: Record<string, unknown> = {
    prices: { some: { region: { countries: { some: { iso2: { equals: query.countryCode } } } } } },
  };
  if (query.condition) variantWhere.cardCondition = { equals: query.condition };
  if (query.language) variantWhere.cardLanguage = { equals: query.language };
  if (query.kind) variantWhere.stockKind = { equals: query.kind };
  if (query.preorder) variantWhere.preorder = { equals: true };
  const catalogWhere: Record<string, unknown> = {};
  if (query.set) catalogWhere.collectibleSet = { handle: { equals: query.set } };
  if (query.rarity) catalogWhere.rarity = { equals: query.rarity };
  const where: Record<string, unknown> = {
    status: { equals: 'published' },
    productVariants: { some: variantWhere },
  };
  if (Object.keys(catalogWhere).length) where.catalogItem = catalogWhere;
  else where.NOT = [{ catalogItem: null }];
  if (query.category) where.productCategories = { some: { handle: { equals: query.category } } };
  if (query.collection) where.productCollections = { some: { handle: { equals: query.collection } } };
  if (query.search) {
    const { name, number } = parseCardQuery(query.search);
    const AND: Record<string, unknown>[] = [];
    if (name) {
      AND.push({ OR: [
        { title: { contains: name, mode: 'insensitive' } },
        { catalogItem: { collectibleSet: { name: { contains: name, mode: 'insensitive' } } } },
      ] });
    }
    if (number) {
      const head = number.split('/')[0].toUpperCase();
      const padded = /^\d+$/.test(head) ? head.padStart(3, '0') : head;
      AND.push({ OR: [{ catalogItem: { cardNumber: { startsWith: `${head}/` } } }, { catalogItem: { cardNumber: { startsWith: `${padded}/` } } }] });
    }
    if (AND.length) where.AND = AND;
  }
  try {
    const result: any = await openfrontClient.request(gql`
      query CardProducts($where: ProductWhereInput!, $countryCode: String!) {
        products(where: $where, take: 400, orderBy: [{ createdAt: desc }]) {
          id title handle subtitle thumbnail createdAt
          catalogItem {
            id handle kind title cardNumber numberSort rarity imageUrl imageLargeUrl sealedFormat
            collectibleSet { handle name code releaseDate releaseStatus logoUrl }
            marketPrices(where: { grade: { equals: "" } }, orderBy: [{ observedAt: desc }], take: 4) { finish marketMinor observedAt }
          }
          productVariants {
            id title stockKind cardCondition cardFinish cardLanguage inventoryQuantity preorder preorderReleaseDate preorderLimitPerCustomer
            prices(where: { region: { countries: { some: { iso2: { equals: $countryCode } } } } }) { amount currency { code } }
          }
        }
      }
    `, { where, countryCode: query.countryCode });
    let products: CardProduct[] = result.products ?? [];
    const low = (p: CardProduct) => {
      const amounts = p.productVariants.filter((v) => v.inventoryQuantity > 0 || v.preorder).flatMap((v) => v.prices.map((x) => x.amount));
      return amounts.length ? Math.min(...amounts) : Number.POSITIVE_INFINITY;
    };
    if (query.priceMaxMinor != null) products = products.filter((p) => low(p) <= query.priceMaxMinor!);
    const sort = query.sort ?? 'newest';
    if (sort === 'price_asc') products.sort((a, b) => low(a) - low(b));
    if (sort === 'price_desc') products.sort((a, b) => (low(b) === Infinity ? -1 : low(b)) - (low(a) === Infinity ? -1 : low(a)));
    if (sort === 'number') products.sort((a, b) => (a.catalogItem?.numberSort ?? 0) - (b.catalogItem?.numberSort ?? 0));
    if (sort === 'set') products.sort((a, b) => String(b.catalogItem?.collectibleSet?.releaseDate ?? '').localeCompare(String(a.catalogItem?.collectibleSet?.releaseDate ?? '')) || (a.catalogItem?.numberSort ?? 0) - (b.catalogItem?.numberSort ?? 0));
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 24;
    return { products: products.slice(offset, offset + limit), count: products.length };
  } catch {
    return { products: [], count: 0 };
  }
});

/** Distinct values present in the published card catalog, for filter menus. */
export const getCardFacets = cache(async function (countryCode: string) {
  const { products } = await getCardProducts({ countryCode, limit: 400 });
  const sets = new Map<string, { value: string; label: string; date: string }>();
  const rarities = new Set<string>();
  const languages = new Set<string>();
  for (const p of products) {
    const set = p.catalogItem?.collectibleSet;
    if (set) sets.set(set.handle, { value: set.handle, label: set.name, date: set.releaseDate ?? '' });
    if (p.catalogItem?.rarity) rarities.add(p.catalogItem.rarity);
    p.productVariants.forEach((v) => v.cardLanguage && languages.add(v.cardLanguage));
  }
  return {
    sets: [...sets.values()].sort((a, b) => b.date.localeCompare(a.date)).map(({ value, label }) => ({ value, label })),
    rarities: [...rarities].sort(),
    languages: [...languages].sort(),
  };
});

/** Split a card search into name words and an optional card number ("Charizard 199", "199/165"). */
function parseCardQuery(raw: string) {
  const words = raw.trim().split(/\s+/).filter(Boolean)
  const numberIndex = words.findIndex((w) => /^[A-Za-z]{0,3}\d{1,3}(\/[A-Za-z]{0,3}\d{1,3})?$/.test(w))
  const number = numberIndex >= 0 ? words[numberIndex] : null
  const name = words.filter((_, i) => i !== numberIndex).join(' ')
  return { name, number }
}

/** Catalog cards (stocked or not) matching a name, set or number, newest sets first. */
export const searchCatalog = cache(async function (raw: string) {
  const { name, number } = parseCardQuery(raw.slice(0, 80))
  if (!name && !number) return []
  const AND: Record<string, unknown>[] = [{ kind: { equals: 'single' } }]
  if (name) AND.push({ OR: [{ title: { contains: name, mode: 'insensitive' } }, { collectibleSet: { name: { contains: name, mode: 'insensitive' } } }] })
  if (number) {
    const head = number.split('/')[0].toUpperCase()
    const padded = /^\d+$/.test(head) ? head.padStart(3, '0') : head
    AND.push({ OR: [{ cardNumber: { startsWith: `${head}/` } }, { cardNumber: { startsWith: `${padded}/` } }, { cardNumber: { equals: head } }] })
  }
  try {
    const result: any = await openfrontClient.request(gql`
      query SearchCatalog($where: CatalogItemWhereInput!) {
        catalogItems(where: $where, take: 60, orderBy: [{ numberSort: asc }]) {
          id title cardNumber rarity imageUrl
          collectibleSet { handle name releaseDate }
        }
      }
    `, { where: { AND } })
    const rows: any[] = result.catalogItems ?? []
    return rows.sort((a, b) => String(b.collectibleSet?.releaseDate ?? '').localeCompare(String(a.collectibleSet?.releaseDate ?? '')))
  } catch {
    return []
  }
})
