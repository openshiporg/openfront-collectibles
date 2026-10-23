"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListBand, SectionTitle } from "@/features/platform/components/vault-ui";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchProductsWithVariants } from "../actions";
import { motion, AnimatePresence } from "framer-motion";


type ProductVariant = {
  id: string;
  title: string;
  sku?: string;
  product: {
    id: string;
    title: string;
    thumbnail?: string;
  };
  prices: {
    id: string;
    amount: number;
    currency: { code: string };
    calculatedPrice: {
      calculatedAmount: number;
      originalAmount: number;
      currencyCode: string;
    };
  }[];
};

type LineItem = {
  id: string;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  total: number;
};

interface LineItemsManagerProps {
  lineItems: LineItem[];
  onLineItemsChange: (lineItems: LineItem[]) => void;
  className?: string;
}

export function LineItemsManager({
  lineItems,
  onLineItemsChange,
  className,
}: LineItemsManagerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search logic from CartDialog
  const searchProducts = async (search: string) => {
    setIsLoading(true);
    try {
      const result = await searchProductsWithVariants(search, 10);
      
      if (result.success && result.data?.products) {
        const allVariants: ProductVariant[] = [];
        result.data.products.forEach((product: any) => {
          product.productVariants.forEach((variant: any) => {
            allVariants.push({
              ...variant,
              product: {
                id: product.id,
                title: product.title,
                thumbnail: product.thumbnail
              }
            });
          });
        });
        setVariants(allVariants);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      searchProducts("");
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (open) {
        searchProducts(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, open]);

  const formatPriceVal = (variant: ProductVariant) => {
    const price = variant.prices?.[0];
    if (!price) return 0;
    const amount = price.calculatedPrice?.calculatedAmount || price.amount;
    return amount / 100;
  };

  const addToCart = (variant: ProductVariant) => {
    const existingItem = lineItems.find(item => item.variant.id === variant.id);
    const unitPrice = formatPriceVal(variant);
    
    if (existingItem) {
      onLineItemsChange(
        lineItems.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * unitPrice }
            : item
        )
      );
    } else {
      const newItem: LineItem = {
        id: `item-${Date.now()}-${variant.id}`,
        variant,
        quantity: 1,
        unitPrice,
        total: unitPrice,
      };
      onLineItemsChange([...lineItems, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    onLineItemsChange(lineItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const nextItems = lineItems.flatMap((item) => {
      if (item.id !== itemId) return [item];

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) return [];

      return [{
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.unitPrice,
      }];
    });

    onLineItemsChange(nextItems);
  };

  const currencyOf = (variant?: ProductVariant) =>
    variant?.prices?.[0]?.currency?.code || variant?.prices?.[0]?.calculatedPrice?.currencyCode || 'USD';

  const formatPrice = (price: number, currency = currencyOf(lineItems[0]?.variant)) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const getSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const groupedProducts = variants.reduce((acc, variant) => {
    const productId = variant.product.id;
    if (!acc[productId]) {
      acc[productId] = {
        product: variant.product,
        variants: []
      };
    }
    acc[productId].variants.push(variant);
    return acc;
  }, {} as Record<string, { product: any; variants: ProductVariant[] }>);

  return (
    <section className={className}>
      <SectionTitle meta={lineItems.length || undefined}>Line items</SectionTitle>
      <ListBand>
        {/* Search Bar Inline */}
        <div className="px-4 py-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-10 w-full justify-start gap-2 rounded-full text-left text-muted-foreground bg-background hover:bg-background border-input font-normal"
              >
                <Search className="h-4 w-4 text-muted-foreground opacity-70" />
                <span className="truncate">Search products or variants</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search products..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="max-h-[300px] overflow-y-auto w-full">
                  {isLoading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : Object.keys(groupedProducts).length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No products found
                    </div>
                  ) : (
                    Object.values(groupedProducts).map(({ product, variants: prodVariants }) => (
                      <CommandGroup key={product.id} heading={product.title} className="text-foreground border-t first:border-t-0 p-1">
                        {prodVariants.map((variant) => {
                          const unitPrice = formatPriceVal(variant);
                          const existingQty = lineItems.find(i => i.variant.id === variant.id)?.quantity || 0;
                          return (
                            <CommandItem
                              key={variant.id}
                              value={variant.id}
                              onSelect={() => {
                                addToCart(variant);
                                // don't close so they can keep adding
                              }}
                              className="flex items-center justify-between py-2 cursor-pointer w-full"
                            >
                              <div className="flex flex-col gap-0.5 max-w-[70%]">
                                <span className="font-medium text-sm truncate">{variant.title}</span>
                                {variant.sku && <span className="font-mono text-xs tabular-nums text-muted-foreground">{variant.sku}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-medium tabular-nums">{formatPrice(unitPrice, currencyOf(variant))}</span>
                                {existingQty > 0 ? (
                                  <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1.5 font-mono text-xs tabular-nums text-background">
                                    {existingQty}
                                  </div>
                                ) : (
                                  <Plus className="h-4 w-4 text-muted-foreground opacity-50" />
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Existing Items */}
        <div className="relative divide-y divide-border">
          {lineItems.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No items added</div>
          ) : (
            <AnimatePresence initial={false}>
              {lineItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.variant.product.thumbnail ? (
                        <img
                          src={item.variant.product.thumbnail}
                          alt={item.variant.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        null
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      <span className="font-medium text-sm truncate text-foreground pr-4">
                        {item.variant.product.title}
                      </span>
                      {item.variant.title && (
                        <span className="truncate font-mono text-xs tabular-nums text-foreground/80">
                          {item.variant.title}{item.variant.sku ? <span className="text-muted-foreground"> · {item.variant.sku}</span> : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {/* Quantity Control */}
                    <div className="flex items-center gap-0.5 rounded-full bg-muted p-[3px]">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="inline-flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-xs max-sm:size-10"
                      >
                        <Minus className="size-3" strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="inline-flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-xs max-sm:size-10"
                      >
                        <Plus className="size-3" strokeWidth={3} />
                      </button>
                    </div>

                    <div className="flex flex-col items-end min-w-[70px]">
                      <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                        {formatPrice(item.total, currencyOf(item.variant))}
                      </span>
                      {item.quantity > 1 && (
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {formatPrice(item.unitPrice, currencyOf(item.variant))} ea
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive max-sm:size-10"
                        title="Remove item"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Subtotal */}
        {lineItems.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Selected</span>
            <span className="font-mono font-semibold tabular-nums">{formatPrice(getSubtotal())}</span>
          </div>
        )}
      </ListBand>
    </section>
  );
}