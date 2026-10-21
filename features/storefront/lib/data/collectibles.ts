'use server';

import { gql } from 'graphql-request';
import { openfrontClient } from '../config';

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
