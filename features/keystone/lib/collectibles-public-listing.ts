import { projectPublicAttributes } from './public-attributes';
import { projectPublicObservations } from '../mutations/collectibles-public-projection';

export function projectPublicListingExtension(listing: any) {
  const specimen = listing?.inventoryUnit?.specimen;
  if (typeof listing?.id !== 'string' || !listing.id || typeof specimen?.id !== 'string' || !specimen.id) return null;
  if (!['fixed_price', 'auction'].includes(listing.format)) return null;
  if (typeof listing.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(listing.currencyCode)) return null;
  if (listing.priceMinor != null && (!Number.isSafeInteger(listing.priceMinor) || listing.priceMinor < 0)) return null;
  const definitions = specimen.catalogItem?.category?.attributeDefinitions || [];
  return {
    schema: 'openfront.collectibles.specimen-listing/v1',
    value: {
      listing: {
        id: listing.id,
        title: typeof listing.title === 'string' ? listing.title : '',
        format: listing.format,
        priceMinor: listing.priceMinor ?? null,
        currencyCode: listing.currencyCode,
      },
      specimen: {
        id: specimen.id,
        displayName: typeof specimen.displayName === 'string' ? specimen.displayName : '',
        category: typeof specimen.catalogItem?.category?.name === 'string' ? specimen.catalogItem.category.name : 'Uncategorized',
        catalogReference: typeof specimen.catalogItem?.handle === 'string' ? specimen.catalogItem.handle : null,
        attributes: {
          ...projectPublicAttributes(specimen.catalogItem?.attributeValues, definitions),
          ...projectPublicAttributes(specimen.attributeValues, definitions),
        },
      },
      observations: projectPublicObservations(specimen),
    },
  };
}
