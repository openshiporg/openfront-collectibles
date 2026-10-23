"use client";
import { isEqual } from "lodash";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useIntersection } from "../../../../lib/hooks/use-in-view";
import { addToCart } from "@/features/storefront/lib/data/cart";
// Removed HttpTypes import
import { getProductPrice } from "@/features/storefront/lib/util/get-product-price";
import OptionSelect from "./option-select";
import ProductPrice from "../product-price";
import MobileActions from "./mobile-actions";
import { RiLoader2Fill } from "@remixicon/react";

// Define inline types based on GraphQL schema and component usage

// Corresponds to ProductOptionValue in schema
type ProductOptionValueInfo = {
  id: string;
  value: string;
  productOption?: { // Link back to the option - UPDATED
    id: string;
  } | null;
};

// Corresponds to ProductOption in schema
type ProductOptionInfoForActions = {
  id: string;
  title: string;
  name?: string | null;
  metadata?: Record<string, any>;
  productOptionValues?: ProductOptionValueInfo[];
};

// Corresponds to Price in schema
type PriceInfoForActions = {
    amount: number;
    currencyCode: string;
};

// Corresponds to ProductVariant in schema
type ProductVariantInfoForActions = {
  id: string;
  title?: string | null; // Correct field name from schema
  inventoryQuantity?: number | null; // Correct field name from schema
  allowBackorder?: boolean | null; // Correct field name from schema
  collectibleInventoryUnit?: { id: string } | null;
  productOptionValues?: ProductOptionValueInfo[] | null; // Correct field name from schema - UPDATED
  prices?: PriceInfoForActions[] | null; // Correct field name from schema
};

// Corresponds to Region in schema
import { StoreRegion } from "@/features/storefront/types/storefront";

type RegionInfoForActions = StoreRegion;

// Corresponds to Product in schema
import { StoreProduct } from "@/features/storefront/types/storefront";

type ProductInfoForActions = StoreProduct;

type ProductActionsProps = {
  product: any; // Override strict types to prioritize JS logic
  region: any;
  disabled?: boolean;
  onVariantChange?: (variant: any) => void;
};

export default function ProductActions({ product, region, disabled, onVariantChange }: ProductActionsProps) {
  const [options, setOptions] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const params = useParams();
  const countryCode = params?.countryCode as string;

  const variants = product.productVariants;

  const hasOnlyOneVariant = useMemo(() => {
    return variants?.length === 1;
  }, [variants]);

  useEffect(() => {
    const optionObj: any = {};
    for (const option of product.productOptions || []) {
      Object.assign(optionObj, { [option.id]: undefined });
    }
    setOptions(optionObj);
  }, [product]);

  const variantRecord = useMemo(() => {
    const map: any = {};
    for (const variant of variants || []) {
      if (!variant.productOptionValues?.length || !variant.id) continue;
      const temp: any = {};
      for (const optionValue of variant.productOptionValues) {
        if (optionValue.productOption?.id && optionValue.value) {
          temp[optionValue.productOption.id] = optionValue.value;
        }
      }
      map[variant.id] = temp;
    }
    return map;
  }, [variants]);

  const variant = useMemo(() => {
    if (hasOnlyOneVariant && variants?.[0]?.id) {
      return variants[0];
    }
    let variantId: string | undefined;
    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key;
      }
    }
    return variants?.find((v: any) => v.id === variantId);
  }, [options, variantRecord, variants, hasOnlyOneVariant]);

  useEffect(() => {
    onVariantChange?.(variant);
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('variantChange', { detail: variant }));
  }, [variant, onVariantChange]);

  useEffect(() => {
    if (variants?.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id] || {});
    }
  }, [variants, variantRecord]);

  const updateOptions = (update: any) => {
    setOptions({ ...options, ...update });
  };

  const inStock = useMemo(() => {
    if (!variant) return false;
    if (variant.inventoryQuantity <= 0) return false;
    if (variant.allowBackorder === false) return true;
    return true;
  }, [variant]);

  const actionsRef = useRef<HTMLDivElement>(null);
  const inView = useIntersection(actionsRef, "0px");

  const handleAddToCart = async () => {
    if (!variant?.id || !canAddToCart) return null;
    setCartError(null);
    setIsAdding(true);
    try {
      await addToCart({ variantId: variant.id, quantity: 1, countryCode });
    } catch {
      setCartError('Could not add this item to your cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const isValidVariant = useMemo(() => {
    if (hasOnlyOneVariant) return true;
    return variants?.some((v: any) => {
      if (!v.productOptionValues?.length) return false;
      const temp: any = {};
      for (const optionValue of v.productOptionValues) {
        if (optionValue.productOption?.id && optionValue.value) {
          temp[optionValue.productOption.id] = optionValue.value;
        }
      }
      return isEqual(temp, options);
    });
  }, [variants, options, hasOnlyOneVariant]);

  const canAddToCart = !disabled && !isAdding && inStock && isValidVariant;

  const buttonLabel = !variant && !hasOnlyOneVariant
    ? "Select an option"
    : !inStock
    ? "Unavailable"
    : "Add to cart";

  return (
    <>
      <div className="flex flex-col gap-4" ref={actionsRef}>
        <ProductPrice product={product} variant={variant} region={region} />
        {variants?.length > 1 && (
          <div className="flex flex-col gap-4">
            {(product.productOptions || []).map((option: any) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={updateOptions}
                title={option.title}
                disabled={!!disabled || isAdding}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart || !variant || (!hasOnlyOneVariant && !isValidVariant)}
          className="cx-btn w-full"
          data-testid="add-product-button"
        >
          {isAdding && <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" />}
          {isAdding ? "Adding" : buttonLabel}
        </button>
        {cartError && <p className="text-[13px] text-cx-danger" role="alert">{cartError}</p>}
        <MobileActions
          product={product}
          variant={variant}
          region={region}
          options={options}
          updateOptions={updateOptions}
          inStock={canAddToCart}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  );
}
