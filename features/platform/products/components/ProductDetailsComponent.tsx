"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Dot } from "@/features/platform/components/vault-ui";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ProductImage } from "../../components/ProductImage";
import { ProductSectionTabs } from "./ProductSectionTabs";
import { StatusBadge } from "./StatusBadge";

interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  inventoryQuantity?: number;
  manageInventory?: boolean;
}

interface ProductImage {
  id: string;
  image?: { url: string };
  imagePath?: string;
  altText?: string;
}

interface Product {
  id: string;
  title: string;
  handle?: string;
  status: string;
  subtitle?: string;
  thumbnail?: string;
  discountable?: boolean;
  isGiftcard?: boolean;
  createdAt: string;
  updatedAt?: string;
  productType?: {
    id: string;
    value: string;
  };
  productVariants?: ProductVariant[];
  productImages?: ProductImage[];
  productCategories?: Array<{
    id: string;
    title: string;
  }>;
  productCollections?: Array<{
    id: string;
    title: string;
  }>;
}

interface ProductDetailsComponentProps {
  product: Product;
  list: any;
}

export function ProductDetailsComponent({
  product,
  list,
}: ProductDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const variantCount = product.productVariants?.length || 0;
  const imageCount = product.productImages?.length || 0;
  const totalInventory =
    product.productVariants?.reduce(
      (sum, variant) => sum + (variant.inventoryQuantity || 0),
      0
    ) || 0;

  const imageUrl =
    product.thumbnail ||
    product.productImages?.[0]?.image?.url ||
    product.productImages?.[0]?.imagePath;

  const stockTone =
    variantCount === 0 ? "muted" : totalInventory <= 0 ? "danger" : "ok";
  const iconButton =
    "inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground [&_svg]:size-3.5 max-sm:size-10";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={product.id} className="border-0">
          <div className="flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted md:size-14">
                <ProductImage
                  src={imageUrl}
                  alt={product.title}
                  width={56}
                  height={56}
                  className="h-full w-full"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    href={`/dashboard/platform/products/${product.id}`}
                    className="text-sm font-medium text-foreground hover:underline underline-offset-4"
                  >
                    {product.title}
                  </Link>
                  <StatusBadge status={product.status as any} />
                  {product.isGiftcard && (
                    <span className="text-xs text-muted-foreground">Gift card</span>
                  )}
                </div>
                {product.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{product.subtitle}</p>
                )}
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-baseline gap-1.5">
                    <Dot tone={stockTone} />
                    <span className="font-mono tabular-nums text-foreground">{totalInventory}</span>
                    in stock
                  </span>
                  <span>
                    <span className="font-mono tabular-nums text-foreground">{variantCount}</span> variants
                  </span>
                  {imageCount > 0 && (
                    <span>
                      <span className="font-mono tabular-nums text-foreground">{imageCount}</span> image{imageCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {product.productType && <span>{product.productType.value}</span>}
                  {product.handle && <span className="font-mono">{product.handle}</span>}
                  <span className="font-mono tabular-nums">
                    {new Date(product.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Edit product"
                className={iconButton}
                onClick={() => setIsEditDrawerOpen(true)}
              >
                <MoreVertical />
              </button>
              <Button variant="secondary" size="icon" className={iconButton} asChild>
                <AccordionTrigger className="py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            {variantCount > 0 ? (
              <ProductSectionTabs product={product} />
            ) : (
              <div className="border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:px-6">
                No variants
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="products"
        itemId={product.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}