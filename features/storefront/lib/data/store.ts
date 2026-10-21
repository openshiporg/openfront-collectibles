'use server';

import { gql } from 'graphql-request';
import { openfrontClient } from '../config';
import { cache } from 'react';
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo';
import { normalizeStoreLogoColor } from '@/features/platform/store-settings/lib/store-logo';

interface Store {
  id: string;
  name: string;
  defaultCurrencyCode: string;
  homepageTitle?: string;
  homepageDescription?: string;
  logoIcon?: string;
  logoColor?: string;
  metadata?: any;
}

/**
 * Get the first store (assumes single store setup)
 */
export const getStore = cache(async function (): Promise<Store | null> {
  const query = gql`
    query GetStore {
      stores(take: 1) {
        id
        name
        defaultCurrencyCode
        homepageTitle
        homepageDescription
        logoIcon
        logoColor
        metadata
      }
    }
  `;

  try {
    const response = await openfrontClient.request(query);

    if (response.stores && response.stores.length > 0) {
      const store = response.stores[0];
      return { ...store, logoIcon: sanitizeStoreLogoSvg(store.logoIcon || ''), logoColor: normalizeStoreLogoColor(store.logoColor) };
    }

    return null;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
});
