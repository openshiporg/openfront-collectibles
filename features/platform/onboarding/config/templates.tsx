import { Building2, CircleCheck, Package } from 'lucide-react';
import seedData from '../lib/seed.json';

export interface StoreTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
  regions: string[];
  paymentProviders: string[];
  shipping: string[];
  categories: string[];
  collections: string[];
  products: string[];
  cardSets: string[];
  displayNames: Record<string, string[]>;
}

type SeedProduct = { handle: string; title: string; metadata?: { kind?: string }; variants: Array<{ preorder?: boolean }>; catalogItem?: { connect?: { handle?: string } } };
const seed = seedData as unknown as {
  store: { name: string };
  regions: Array<{ code: string; name: string; currencyCode: string }>;
  paymentProviders: Array<{ code: string; name: string }>;
  shipping_options: Array<{ name: string }>;
  categories: Array<{ handle: string; name: string }>;
  collections: Array<{ handle: string; title: string }>;
  cardSets: { sets: Array<{ id: string; name: string }>; upcoming?: { handle: string; name: string } };
  products: SeedProduct[];
  collectibles: Array<{ title: string }>;
  pricing: { rules: Array<{ name: string }>; buylist?: { name: string } };
};

const regionName = (code: string) => {
  const region = seed.regions.find((r) => r.code === code);
  return region ? `${region.name} (${region.currencyCode.toUpperCase()})` : code;
};
const providerName = (code: string) => seed.paymentProviders.find((p) => p.code === code)?.name ?? code;
const categoryName = (handle: string) => seed.categories.find((c) => c.handle === handle)?.name ?? handle;
const collectionName = (handle: string) => seed.collections.find((c) => c.handle === handle)?.title ?? handle;
const productTitle = (handle: string) => seed.products.find((p) => p.handle === handle)?.title ?? handle;
const setName = (id: string) => seed.cardSets.sets.find((s) => s.id === id)?.name ?? seed.cardSets.upcoming?.name ?? id;
const pricingNames = [...seed.pricing.rules.map((r) => r.name), ...(seed.pricing.buylist ? [seed.pricing.buylist.name] : [])];

// The starter shop: a handful of modern singles and in-stock sealed, from two sets.
const STARTER_SETS = ['sv3pt5', 'sv8pt5'];
const starterProducts = seed.products
  .filter((p) => p.metadata?.kind !== 'graded' && !p.variants.some((v) => v.preorder))
  .filter((p) => STARTER_SETS.some((set) => p.catalogItem?.connect?.handle?.startsWith(`${set}-`)))
  .map((p) => p.handle);

const allSets = seed.cardSets.sets.map((s) => s.id);
const allProducts = seed.products.map((p) => p.handle);

function template(spec: Omit<StoreTemplate, 'displayNames'>): StoreTemplate {
  const productSet = new Set(spec.products);
  return {
    ...spec,
    displayNames: {
      store: [seed.store.name],
      regions: spec.regions.map(regionName),
      paymentProviders: spec.paymentProviders.map(providerName),
      shipping: spec.shipping,
      categories: spec.categories.map(categoryName),
      collections: spec.collections.map(collectionName),
      cardSets: [...spec.cardSets.map(setName), ...(spec.cardSets.length === allSets.length && seed.cardSets.upcoming ? [seed.cardSets.upcoming.name] : [])],
      products: spec.products.map(productTitle),
      collectibles: seed.collectibles.filter((item) => seed.products.some((p) => productSet.has(p.handle) && p.title === item.title)).map((item) => item.title),
      pricing: pricingNames,
    },
  };
}

export const STORE_TEMPLATES: Record<'full' | 'minimal' | 'custom', StoreTemplate> = {
  full: template({
    name: 'Complete card shop',
    description: 'A full Pokémon card shop: 19 sets as checklists with market prices, singles by condition, graded slabs, sealed product with pre-orders, pricing rules and a buylist.',
    icon: <Building2 className="h-5 w-5" />,
    regions: seed.regions.map((r) => r.code),
    paymentProviders: seed.paymentProviders.map((p) => p.code),
    shipping: seed.shipping_options.map((s) => s.name),
    categories: seed.categories.map((c) => c.handle),
    collections: seed.collections.map((c) => c.handle),
    cardSets: allSets,
    products: allProducts,
  }),
  minimal: template({
    name: 'Starter shop',
    description: 'Two modern sets with market prices, a few singles and sealed boxes, one region and bank transfer.',
    icon: <Package className="h-5 w-5" />,
    regions: ['na'],
    paymentProviders: ['pp_system_default'],
    shipping: [seed.shipping_options[0].name],
    categories: ['singles', 'sealed-product'],
    collections: ['chase'],
    cardSets: STARTER_SETS,
    products: starterProducts,
  }),
  custom: template({
    name: 'Custom setup',
    description: 'Start from the starter shop and edit the JSON for each section.',
    icon: <CircleCheck className="h-5 w-5" />,
    regions: ['na'],
    paymentProviders: ['pp_system_default'],
    shipping: [seed.shipping_options[0].name],
    categories: ['singles', 'sealed-product'],
    collections: ['chase'],
    cardSets: STARTER_SETS,
    products: starterProducts,
  }),
};

export interface SectionDefinition {
  id: number;
  type: string;
  label: string;
  getItemsFn: (template: 'full' | 'minimal' | 'custom') => string[];
  jsonKey: 'store' | 'regions' | 'paymentProviders' | 'shipping_options' | 'categories' | 'collections' | 'cardSets' | 'products' | 'collectibles' | 'pricing';
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: 1, type: 'store', label: 'Store Information', getItemsFn: () => [seed.store.name], jsonKey: 'store' },
  { id: 2, type: 'regions', label: 'Regions & Countries', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.regions, jsonKey: 'regions' },
  { id: 3, type: 'paymentProviders', label: 'Payment Providers', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.paymentProviders, jsonKey: 'paymentProviders' },
  { id: 4, type: 'shipping', label: 'Shipping Options', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.shipping, jsonKey: 'shipping_options' },
  { id: 5, type: 'categories', label: 'Product Categories', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.categories, jsonKey: 'categories' },
  { id: 6, type: 'collections', label: 'Collections', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.collections, jsonKey: 'collections' },
  { id: 7, type: 'cardSets', label: 'Card Sets & Market Prices', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.cardSets, jsonKey: 'cardSets' },
  { id: 8, type: 'products', label: 'Singles, Slabs & Sealed', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.products, jsonKey: 'products' },
  { id: 9, type: 'collectibles', label: 'Graded Slabs', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.collectibles, jsonKey: 'collectibles' },
  { id: 10, type: 'pricing', label: 'Pricing Rules & Buylist', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.pricing, jsonKey: 'pricing' },
];
