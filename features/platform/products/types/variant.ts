import type { ReactNode } from 'react';

export interface OptionForEditor { id: string; title: string; values: { id?: string; value: string; label: string }[] }

export interface PricingRegion {
  id?: string;
  code: string;
  name: string;
  locale?: string;
  taxRate?: number | null;
  currency: { code: string; symbol?: string; symbolNative?: string };
}
export interface VariantImage {
  id: string;
  altText?: string | null;
  imagePath?: string | null;
  image?: { url: string } | null;
}
export interface VariantPrice {
  id: string;
  amount: number;
  compareAmount?: number | null;
  region?: { code: string } | null;
  currency?: { code: string } | null;
}
export interface VariantForEditor {
  id: string;
  title: string;
  sku?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  material?: string | null;
  inventoryQuantity?: number | null;
  primaryImage?: VariantImage | null;
  productOptionValues?: { id?: string; value: string; productOption: { title: string } }[];
  prices?: VariantPrice[];
}
export interface PriceDraft {
  amount: number;
  compareAmount: number | null;
  regionCode: string;
  currencyCode: string;
  priceId?: string;
}
export interface PriceFormProps {
  region: PricingRegion;
  initialPrice?: VariantPrice;
  onSave: (price: PriceDraft) => void;
  onCancel: () => void;
}
export type OptionValueRenderer = (option: { option: string; value: string; label: string }) => ReactNode;
export interface VariantCardProps {
  variant: VariantForEditor;
  onUpdate?: (variant: VariantForEditor) => void;
  onDelete?: (variant: VariantForEditor) => void;
  showActions?: boolean;
  regions?: PricingRegion[];
  onAddPrice?: (variantId: string, price: PriceDraft) => void;
  selectedFilters?: string[];
  onOptionFilter?: (option: string, value: string) => void;
  productImages?: VariantImage[];
  renderOptionValue?: OptionValueRenderer;
}
export interface PendingVariantCardProps {
  variant: VariantForEditor;
  onUpdate: (variant: VariantForEditor) => void;
  onDelete?: (variant: VariantForEditor) => void;
  regions?: PricingRegion[];
  renderOptionValue?: OptionValueRenderer;
}
export interface VariantDriftCardProps {
  variantsToCreate: VariantForEditor[];
  variantsToDelete: VariantForEditor[];
  unchangedVariants: VariantForEditor[];
  onRemoveFromCreate: (variantId: string) => void;
  onRemoveFromDelete: (variantId: string) => void;
  onSaveChanges: (variants: VariantForEditor[]) => void;
  regions?: PricingRegion[];
}
