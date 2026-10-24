import { Archive, Building2, CircleCheck, Package } from 'lucide-react';

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
  displayNames: Record<string, string[]>;
}

const products = [
  '1999-first-edition-fire-dragon-holo',
  'amazing-adventures-12',
  '1881-silver-dollar',
  'orbit-ranger-prototype',
  'harbor-at-dusk-study',
  '1968-meridian-diver',
  '1977-championship-final-ticket',
];
const productNames = [
  '1999 First Edition Fire Dragon Holo', 'Amazing Adventures No. 12', '1881 Silver Dollar',
  'Orbit Ranger Prototype Figure', 'Harbor at Dusk — Study', '1968 Meridian Diver', '1977 Championship Final Ticket',
];
const categories = ['trading-cards', 'comics', 'coins', 'toys', 'art', 'watches', 'memorabilia'];
const categoryNames = ['Trading Cards', 'Comics', 'Coins', 'Toys', 'Art', 'Watches', 'Memorabilia'];

export const STORE_TEMPLATES: Record<'full' | 'minimal' | 'custom', StoreTemplate> = {
  full: {
    name: 'Complete Setup',
    description: 'Start with a fully configured store including multiple regions, payment methods, and a catalog of collectibles across seven categories.',
    icon: <Building2 className="h-5 w-5" />,
    regions: ['na', 'eu'], paymentProviders: ['pp_stripe_stripe', 'pp_system_default'],
    shipping: ['Tracked shipping', 'High-value signature service', 'Return shipping'],
    categories, collections: ['fresh-to-the-vault', 'staff-picks', 'under-500'], products,
    displayNames: {
      store: ['Northstar Collectibles'], regions: ['North America (USD)', 'Europe (EUR)'],
      paymentProviders: ['Stripe', 'Bank transfer (manual review)'], shipping: ['Tracked shipping', 'High-value signature service', 'Return shipping'],
      categories: categoryNames, collections: ['Fresh to the vault', 'Staff picks', 'Under $500'], products: productNames,
      collectibles: productNames,
    },
  },
  minimal: {
    name: 'Basic Setup',
    description: 'Start with just the essentials - one region, one payment method, and one collectible.',
    icon: <Package className="h-5 w-5" />,
    regions: ['na'], paymentProviders: ['pp_system_default'], shipping: ['Tracked shipping'],
    categories: ['trading-cards'], collections: ['fresh-to-the-vault'], products: [products[0]],
    displayNames: {
      store: ['Northstar Collectibles'], regions: ['North America (USD)'], paymentProviders: ['Bank transfer (manual review)'],
      shipping: ['Tracked shipping'], categories: ['Trading Cards'], collections: ['Fresh to the vault'],
      products: [productNames[0]], collectibles: [productNames[0]],
    },
  },
  custom: {
    name: 'Custom Setup', description: 'Customize your setup with your own JSON templates for each section.',
    icon: <CircleCheck className="h-5 w-5" />,
    regions: ['na'], paymentProviders: ['pp_system_default'], shipping: ['Tracked shipping'],
    categories: ['trading-cards'], collections: ['fresh-to-the-vault'], products: [products[0]],
    displayNames: {
      store: ['Northstar Collectibles'], regions: ['North America (USD)'], paymentProviders: ['Bank transfer (manual review)'],
      shipping: ['Tracked shipping'], categories: ['Trading Cards'], collections: ['Fresh to the vault'],
      products: [productNames[0]], collectibles: [productNames[0]],
    },
  },
};

export interface SectionDefinition {
  id: number;
  type: string;
  label: string;
  getItemsFn: (template: 'full' | 'minimal' | 'custom') => string[];
  jsonKey: 'store' | 'regions' | 'paymentProviders' | 'shipping_options' | 'categories' | 'collections' | 'products' | 'collectibles';
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: 1, type: 'store', label: 'Store Information', getItemsFn: () => ['Northstar Collectibles'], jsonKey: 'store' },
  { id: 2, type: 'regions', label: 'Regions & Countries', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.regions, jsonKey: 'regions' },
  { id: 3, type: 'paymentProviders', label: 'Payment Providers', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.paymentProviders, jsonKey: 'paymentProviders' },
  { id: 4, type: 'shipping', label: 'Shipping Options', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.shipping, jsonKey: 'shipping_options' },
  { id: 5, type: 'categories', label: 'Product Categories', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.categories, jsonKey: 'categories' },
  { id: 6, type: 'collections', label: 'Collections', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.collections, jsonKey: 'collections' },
  { id: 7, type: 'products', label: 'Products', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.products, jsonKey: 'products' },
  { id: 8, type: 'collectibles', label: 'Collectible Items', getItemsFn: (t) => STORE_TEMPLATES[t].displayNames.collectibles, jsonKey: 'collectibles' },
];
