import { STORE_TEMPLATES } from '../config/templates';

// Helper function to extract display items from JSON data
export function getItemsFromJsonData(jsonData: any, sectionType: string): string[] {
  if (!jsonData) return [];

  switch (sectionType) {
    case 'store':
      return jsonData.store ? [jsonData.store.name || 'Unknown Store'] : ['Impossible Tees'];
    case 'regions':
      return (jsonData.regions || []).map((r: any) =>
        `${r.name || 'Unknown'} (${(r.currencyCode || 'USD').toUpperCase()})`
      );
    case 'paymentProviders':
      return (jsonData.paymentProviders || []).map((p: any) => p.name || 'Unknown Provider');
    case 'shipping':
      return (jsonData.shipping_options || []).map((s: any) => s.name || 'Unknown Shipping');
    case 'categories':
      return (jsonData.categories || []).map((c: any) => c.title || c.name || 'Unknown Category');
    case 'collections':
      return (jsonData.collections || []).map((c: any) => c.title || c.name || 'Unknown Collection');
    case 'products':
      return (jsonData.products || []).map((p: any) => p.title || 'Unknown Product');
    case 'collectibles':
      return (jsonData.collectibles || []).map((p: any) => p.title || p.code || 'Unknown Item');
    case 'cardSets':
      return [
        ...(jsonData.cardSets?.sets || []).map((s: any) => s.name || s.id || 'Unknown Set'),
        ...(jsonData.cardSets?.upcoming ? [jsonData.cardSets.upcoming.name] : []),
      ];
    case 'pricing':
      return [
        ...(jsonData.pricing?.rules || []).map((r: any) => r.name || 'Pricing rule'),
        ...(jsonData.pricing?.buylist ? [jsonData.pricing.buylist.name || 'Buylist'] : []),
      ];
    default:
      return [];
  }
}

// Helper to get the right slice of seed data for a template
export function getSeedForTemplate(template: 'full' | 'minimal' | 'custom', seedData: any, customData?: Record<string, string[]>) {
  const templateToUse = template === 'custom' ? 'minimal' : template;
  const tpl = STORE_TEMPLATES[templateToUse];

  // Get the region codes for this template
  const templateRegionCodes = tpl.regions;

  // Filter products and clean up variant prices to only include relevant regions
  const filteredProducts = (seedData.products as any[])
    .filter((p: any) => tpl.products.includes(p.handle))
    .map((product: any) => ({
      ...product,
      variants: product.variants.map((variant: any) => ({
        ...variant,
        prices: variant.prices.filter((price: any) =>
          templateRegionCodes.includes(price.regionCode)
        )
      }))
    }));

  // Card sets: every set a chosen product draws on; sealed catalog only for chosen sealed products.
  const catalogHandles = new Set(filteredProducts.map((p: any) => p.catalogItem?.connect?.handle).filter(Boolean));
  const chosenSets = new Set(tpl.cardSets);
  const allSetsChosen = tpl.cardSets.length === (seedData.cardSets?.sets || []).length;
  const sealed = (seedData.cardSets?.sealed || []).filter((s: any) => catalogHandles.has(s.handle));
  const pricing = seedData.pricing
    ? {
        rules: seedData.pricing.rules,
        buylist: seedData.pricing.buylist && {
          ...seedData.pricing.buylist,
          entries: (seedData.pricing.buylist.entries || []).filter((e: any) => chosenSets.has(String(e.catalogItemHandle).replace(/-[^-]+$/, ''))),
        },
      }
    : undefined;

  return {
    store: seedData.store,
    regions: (seedData.regions as any[]).filter((r: any) =>
      tpl.regions.includes(r.code)
    ),
    paymentProviders: (seedData.paymentProviders as any[]).filter((p: any) =>
      tpl.paymentProviders.includes(p.code)
    ),
    shipping_options: (seedData.shipping_options as any[]).filter((s: any) =>
      tpl.shipping.includes(s.name)
    ),
    categories: (seedData.categories as any[]).filter((c: any) =>
      tpl.categories.includes(c.handle)
    ),
    collections: (seedData.collections as any[]).filter((c: any) =>
      tpl.collections.includes(c.handle)
    ),
    cardSets: {
      sets: (seedData.cardSets?.sets || []).filter((s: any) => chosenSets.has(s.id)),
      ...(allSetsChosen && seedData.cardSets?.upcoming ? { upcoming: seedData.cardSets.upcoming } : {}),
      sealed,
    },
    products: filteredProducts,
    collectibles: (seedData.collectibles || []).filter((item: any) =>
      filteredProducts.some((product: any) => product.title === item.title)
    ),
    pricing,
  };
}