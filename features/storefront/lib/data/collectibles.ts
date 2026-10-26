'use server';

import { gql } from 'graphql-request';
import { openfrontClient } from '../config';
import { revalidatePath } from 'next/cache';
import { getAuthHeaders } from './cookies';

export async function getPublicCollectibleListings(input: Record<string, unknown>) {
  const result: any = await openfrontClient.request(gql`
    query CollectibleListing($input: JSON) {
      publicCollectiblesDiscovery(input: $input)
    }
  `, { input });
  return result.publicCollectiblesDiscovery?.results || [];
}

export async function getPublicCollectibleListingForVariant(productVariantId: string, countryCode: string) {
  if (!productVariantId || productVariantId.length > 128) return null;
  const results = await getPublicCollectibleListings({ criteria: { productVariantId }, countryCode, limit: 2 });
  // Duplicate published listings for one variant are ambiguous; do not guess.
  return results.length === 1 ? results[0] : null;
}

// ---- Collector account: wishlist, saved searches, trade-ins, collector profile ----

async function signedIn() {
  // A cart proof alone is not a signed-in customer.
  const headers = await getAuthHeaders();
  return headers.authorization ? headers : null;
}

export async function getWishlist(): Promise<any[] | null> {
  const headers = await signedIn();
  if (!headers) return null;
  try {
    const result: any = await openfrontClient.request(gql`query ActiveWishlist { activeWishlist }`, {}, headers);
    return Array.isArray(result.activeWishlist) ? result.activeWishlist : [];
  } catch {
    return null;
  }
}

export async function toggleWishlistListing(listingId: string): Promise<{ saved?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to save items' };
  try {
    const result: any = await openfrontClient.request(
      gql`mutation ToggleWishlist($listingId: ID!) { toggleWishlistListing(listingId: $listingId) }`,
      { listingId },
      headers
    );
    revalidatePath('/[countryCode]/account/wishlist', 'page');
    return { saved: !!result.toggleWishlistListing?.saved };
  } catch {
    return { error: 'Could not update your wishlist' };
  }
}

export async function getSavedSearches(): Promise<any[] | null> {
  const headers = await signedIn();
  if (!headers) return null;
  try {
    const result: any = await openfrontClient.request(
      gql`query SavedSearches { savedSearches(orderBy: [{ createdAt: desc }], take: 100) { id name query createdAt } }`,
      {},
      headers
    );
    return result.savedSearches || [];
  } catch {
    return null;
  }
}

export async function saveSearch(_state: unknown, formData: FormData): Promise<{ saved?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to save searches' };
  const query = String(formData.get('q') || '').trim().slice(0, 80);
  if (!query) return { error: 'Enter a search first' };
  try {
    await openfrontClient.request(
      gql`mutation SaveSearch($data: SavedSearchCreateInput!) { createSavedSearch(data: $data) { id } }`,
      { data: { name: query, query } },
      headers
    );
    revalidatePath('/[countryCode]/account/saved-searches', 'page');
    return { saved: true };
  } catch {
    return { error: 'Could not save this search' };
  }
}

export async function deleteSavedSearch(formData: FormData): Promise<void> {
  const headers = await signedIn();
  const id = String(formData.get('id') || '');
  if (!headers || !id) return;
  try {
    await openfrontClient.request(
      gql`mutation DeleteSavedSearch($id: ID!) { deleteSavedSearch(where: { id: $id }) { id } }`,
      { id },
      headers
    );
  } catch {
    // The list re-renders from the server either way.
  }
  revalidatePath('/[countryCode]/account/saved-searches', 'page');
}

export async function getPublicBuylist(): Promise<any[] | null> {
  try {
    const result: any = await openfrontClient.request(gql`query PublicBuylist { publicBuylist }`, {});
    return Array.isArray(result.publicBuylist) ? result.publicBuylist : [];
  } catch {
    return null;
  }
}

export async function submitTradeIn(input: {
  key: string;
  disposition: string;
  items: { buylistEntryId?: string; description: string; condition: string; cardCondition?: string; quantity?: number }[];
}): Promise<{ reference?: string; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to submit a trade-in' };
  try {
    const result: any = await openfrontClient.request(
      gql`mutation SubmitTradeIn($input: JSON!) { submitTradeIn(input: $input) }`,
      { input },
      headers
    );
    revalidatePath('/[countryCode]/account/trade-ins', 'page');
    return { reference: result.submitTradeIn?.reference };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('no longer being bought')) return { error: 'A selected item is no longer on the buylist' };
    if (message.includes('exceeds the quantity')) return { error: 'One item is over the quantity the shop is buying' };
    if (message.includes('not buying that card in that condition')) return { error: 'The shop is not buying one of these cards in that condition' };
    return { error: 'Could not submit your trade-in' };
  }
}

export async function getTradeIns(): Promise<any[] | null> {
  const headers = await signedIn();
  if (!headers) return null;
  try {
    const result: any = await openfrontClient.request(gql`query ActiveTradeIns { activeTradeIns }`, {}, headers);
    return Array.isArray(result.activeTradeIns) ? result.activeTradeIns : [];
  } catch {
    return null;
  }
}

export async function getCollectorProfile(): Promise<any | null | undefined> {
  const headers = await signedIn();
  if (!headers) return undefined;
  try {
    const result: any = await openfrontClient.request(
      gql`query CollectorProfile { collectorProfiles(take: 1, orderBy: [{ createdAt: asc }]) { id displayName interests public } }`,
      {},
      headers
    );
    return result.collectorProfiles?.[0] ?? null;
  } catch {
    return undefined;
  }
}

export async function saveCollectorProfile(_state: unknown, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const headers = await signedIn();
  if (!headers) return { error: 'Sign in to edit your collector profile' };
  const id = String(formData.get('id') || '');
  const displayName = String(formData.get('displayName') || '').trim().slice(0, 120);
  if (!displayName) return { error: 'Display name is required' };
  const interests = String(formData.get('interests') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((value) => value.slice(0, 60));
  const data = { displayName, interests, public: formData.get('public') === 'on' };
  try {
    if (id) {
      await openfrontClient.request(
        gql`mutation UpdateCollectorProfile($id: ID!, $data: CollectorProfileUpdateInput!) { updateCollectorProfile(where: { id: $id }, data: $data) { id } }`,
        { id, data },
        headers
      );
    } else {
      await openfrontClient.request(
        gql`mutation CreateCollectorProfile($data: CollectorProfileCreateInput!) { createCollectorProfile(data: $data) { id } }`,
        { data },
        headers
      );
    }
    revalidatePath('/[countryCode]/account/profile', 'page');
    return { success: true };
  } catch {
    return { error: 'Could not save your collector profile' };
  }
}
