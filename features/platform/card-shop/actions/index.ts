'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';

// Card shop desks: sets and checklists, market refresh and repricing, slabs, sealed and the buylist.

type Result<T = unknown> = { success: true; data: T } | { success: false; error: string };

async function run<T>(query: string, variables: Record<string, unknown> = {}): Promise<Result<T>> {
  const response = await keystoneClient<T>(query, variables, { cache: 'no-store' });
  return response.success ? { success: true, data: response.data } : { success: false, error: response.error };
}

export async function getStoreCurrency(): Promise<string> {
  const response = await run<{ stores: { defaultCurrencyCode: string | null }[] }>(`query { stores(take: 1) { defaultCurrencyCode } }`);
  return (response.success && response.data.stores[0]?.defaultCurrencyCode) || 'usd';
}

export async function getCardSets() {
  const currencyCode = await getStoreCurrency();
  const response = await run<{ publicCardSets: any[] }>(`query CardSets($c: String) { publicCardSets(currencyCode: $c) }`, { c: currencyCode });
  return response.success ? { success: true as const, data: { sets: response.data.publicCardSets ?? [], currencyCode } } : response;
}

export async function getSetChecklist(handle: string) {
  const currencyCode = await getStoreCurrency();
  const response = await run<{ publicSetChecklist: any }>(`query Checklist($h: String!, $c: String) { publicSetChecklist(handle: $h, currencyCode: $c) }`, { h: handle, c: currencyCode });
  if (!response.success) return response;
  const checklist = response.data.publicSetChecklist;
  if (!checklist) return { success: true as const, data: null };
  // Product ids for the edit links; the public projection only carries handles.
  const handles = (checklist.cards as any[]).flatMap((card) => (card.stock as any[]).map((s) => s.handle)).filter(Boolean);
  const ids = handles.length
    ? await run<{ products: { id: string; handle: string }[] }>(`query Ids($h: [String!]) { products(where: { handle: { in: $h } }, take: 1000) { id handle } }`, { h: handles })
    : null;
  const idByHandle = Object.fromEntries((ids?.success ? ids.data.products : []).map((p) => [p.handle, p.id]));
  return { success: true as const, data: { ...checklist, idByHandle } };
}

export async function getPricingRules() {
  return run<{ pricingRules: any[] }>(`query { pricingRules(orderBy: [{ appliesTo: asc }, { priority: desc }]) { id name active appliesTo condition basis percentBasisPoints minimumMinor maximumChangeBasisPoints rounding priority } }`);
}

export async function getMarketStatus() {
  return run<{ latest: { observedAt: string; source: string }[]; marketPricesCount: number }>(
    `query { latest: marketPrices(orderBy: { observedAt: desc }, take: 1) { observedAt source } marketPricesCount }`,
  );
}

export async function refreshMarketPricesAction(_prev: unknown, _form?: FormData): Promise<Result<{ observedAt: string; sets: { set: string; readings: number; error?: string }[]; buylistEntries: number }>> {
  const response = await run<{ refreshMarketPrices: any }>(`mutation { refreshMarketPrices(input: {}) }`);
  if (!response.success) return response;
  revalidatePath('/dashboard/platform/pricing');
  revalidatePath('/dashboard/platform/buylist');
  revalidatePath('/dashboard/platform/cards', 'layout');
  return { success: true, data: response.data.refreshMarketPrices };
}

export async function repriceAction(_prev: unknown, form: FormData): Promise<Result<any>> {
  const apply = form.get('apply') === 'true';
  const response = await run<{ repriceInventory: any }>(`mutation Reprice($input: JSON) { repriceInventory(input: $input) }`, { input: { apply } });
  if (!response.success) return response;
  if (apply) {
    revalidatePath('/dashboard/platform/pricing');
    revalidatePath('/dashboard/platform/cards', 'layout');
  }
  return { success: true, data: response.data.repriceInventory };
}

const GRADED_SELECTION = `
  id title sku inventoryQuantity cardFinish
  prices(where: { priceList: null }) { amount currency { code } }
  collectibleInventoryUnit {
    id status ownershipBasis
    specimen {
      specimenCode
      gradeObservations(orderBy: { observedAt: desc }, take: 1) {
        reportedGrade reportedLabel certificateReference certificateLookupUrl
        gradingCompany { code name }
      }
      identifiers(where: { type: { equals: "certificate" } }) { value evidence }
    }
  }
  product {
    id title handle status
    catalogItem { id title cardNumber rarity imageUrl imageLargeUrl year collectibleSet { name code releaseDate } }
  }
`;

export async function getGradedSlabs() {
  return run<{ productVariants: any[] }>(`query { productVariants(where: { stockKind: { equals: "graded" } }, orderBy: { createdAt: desc }, take: 500) { ${GRADED_SELECTION} } }`);
}

export async function getSealedStock() {
  const response = await run<{ productVariants: any[] }>(`query {
    productVariants(where: { stockKind: { equals: "sealed" } }, orderBy: [{ preorder: desc }, { createdAt: asc }], take: 500) {
      id title sku inventoryQuantity preorder preorderReleaseDate preorderLimitPerCustomer
      prices(where: { priceList: null }) { amount currency { code } }
      product { id title handle status catalogItem { id title sealedFormat collectibleSet { name code logoUrl releaseDate releaseStatus } } }
    }
  }`);
  if (!response.success) return response;
  const ids = response.data.productVariants.map((v) => v.id);
  const sold = ids.length
    ? await run<{ orderLineItems: { quantity: number; productVariant: { id: string } | null; order: { status: string } | null }[] }>(
        `query Sold($ids: [ID!]) { orderLineItems(where: { productVariant: { id: { in: $ids } } }, take: 5000) { quantity productVariant { id } order { status } } }`,
        { ids },
      )
    : null;
  const soldByVariant: Record<string, number> = {};
  if (sold?.success) {
    for (const line of sold.data.orderLineItems) {
      if (!line.productVariant || line.order?.status === 'canceled') continue;
      soldByVariant[line.productVariant.id] = (soldByVariant[line.productVariant.id] ?? 0) + line.quantity;
    }
  }
  return { success: true as const, data: { variants: response.data.productVariants, soldByVariant, soldKnown: Boolean(sold?.success) } };
}

export async function getActiveBuylist() {
  return run<{ buylists: any[] }>(`query {
    buylists(orderBy: [{ status: asc }, { createdAt: asc }], take: 5) {
      id name status currencyCode cashPercentBasisPoints creditPercentBasisPoints conditionBasisPoints minimumOfferMinor publicNotes
      entries(orderBy: [{ hotlist: desc }, { offerAmountMinor: desc }], take: 500) {
        id cardFinish minimumCondition pricingMode offerAmountMinor creditOfferMinor hotlist maximumQuantity quantityBought active
        catalogItem {
          id title cardNumber rarity imageUrl kind
          collectibleSet { name code }
          marketPrices(orderBy: { observedAt: desc }, take: 6) { finish marketMinor lowMinor observedAt grade }
        }
      }
    }
  }`);
}

/** Per set, one boolean per single in number order: does the shop have a copy for sale? */
export async function getSetStrips(): Promise<Result<Record<string, boolean[]>>> {
  const [catalog, products] = await Promise.all([
    run<{ catalogItems: { id: string; collectibleSet: { handle: string } | null }[] }>(
      `query { catalogItems(where: { kind: { equals: "single" } }, orderBy: { numberSort: asc }, take: 20000) { id collectibleSet { handle } } }`,
    ),
    run<{ products: { catalogItem: { id: string } | null; productVariants: { inventoryQuantity: number }[] }[] }>(
      `query { products(where: { status: { equals: published }, catalogItem: { kind: { equals: "single" } } }, take: 5000) { catalogItem { id } productVariants { inventoryQuantity } } }`,
    ),
  ]);
  if (!catalog.success) return catalog;
  if (!products.success) return products;
  const stocked = new Set(
    products.data.products.filter((p) => p.catalogItem && p.productVariants.some((v) => v.inventoryQuantity > 0)).map((p) => p.catalogItem!.id),
  );
  const strips: Record<string, boolean[]> = {};
  for (const item of catalog.data.catalogItems) {
    const handle = item.collectibleSet?.handle;
    if (!handle) continue;
    (strips[handle] ??= []).push(stocked.has(item.id));
  }
  return { success: true, data: strips };
}
