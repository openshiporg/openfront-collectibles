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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ItemPagination } from "../../orders/components/ItemPagination";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ProductImage } from "../../components/ProductImage";
import { Count, Dot, ListBand, Pill, Track, type DotTone } from "../../components/vault-ui";

interface Product {
  id: string;
  title: string;
  status: string;
  thumbnail?: string;
  productVariants?: { id: string }[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

interface CollectionDetailsComponentProps {
  collection: Collection;
  list: any;
}

type TabType = 'products';

export function CollectionDetailsComponent({
  collection,
  list,
}: CollectionDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [editProductId, setEditProductId] = useState<string>('');
  const [editProductOpen, setEditProductOpen] = useState(false);
  const itemsPerPage = 12;
  
  const products = collection.products || [];
  const totalProducts = products.length;
  
  // Calculate pagination for products
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  // Build tabs array
  const tabs = [
    { 
      key: 'products' as TabType, 
      label: 'Products',
      count: totalProducts,
      data: products
    }
  ];

  
  const handleEditProduct = (productId: string) => {
    setEditProductId(productId);
    setEditProductOpen(true);
  };
  
  // Status dot tones
  const getStatusTone = (status: string): DotTone => {
    switch (status) {
      case 'published':
        return 'ok';
      case 'draft':
        return 'muted';
      case 'proposed':
        return 'info';
      case 'rejected':
        return 'danger';
      default:
        return 'muted';
    }
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={collection.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Link
                  href={`/dashboard/product-collections/${collection.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {collection.title}
                </Link>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{collection.handle}</span>
                <span>
                  <span className="font-mono tabular-nums">{totalProducts}</span> product{totalProducts !== 1 ? "s" : ""}
                </span>
                <span className="font-mono tabular-nums">
                  {new Date(collection.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                aria-label="Edit"
                onClick={() => setIsEditDrawerOpen(true)}
              >
                <MoreVertical className="stroke-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                asChild
              >
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            <div className="space-y-3 border-t border-border bg-background/60 px-4 py-3">
              <Track label="Sections">
                {tabs.map((tab) => (
                  <Pill key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                    {tab.label} <Count>{tab.count}</Count>
                  </Pill>
                ))}
              </Track>

              {activeTab === 'products' && totalProducts > 0 && (
                <div className="space-y-3">
                  {totalProducts > itemsPerPage && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {startIndex + 1}-{Math.min(endIndex, totalProducts)} / {totalProducts}
                      </span>
                      <ItemPagination
                        currentPage={currentPage}
                        totalItems={totalProducts}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}

                  <ListBand>
                    {paginatedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 px-3 py-2">
                        <ProductImage
                          src={product.thumbnail}
                          alt={product.title}
                          className="size-10 shrink-0 rounded-md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <Dot tone={getStatusTone(product.status)} />
                            <Link
                              href={`/dashboard/platform/products/${product.id}`}
                              className="truncate text-sm font-medium text-foreground hover:underline"
                            >
                              {product.title}
                            </Link>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span className="capitalize">{product.status}</span>
                            {product.productVariants && product.productVariants.length > 0 && (
                              <span>
                                <span className="font-mono tabular-nums">{product.productVariants.length}</span> variant{product.productVariants.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Product actions">
                              <MoreVertical className="stroke-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                              Edit Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </ListBand>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="product-collections"
        itemId={collection.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />

      {/* Edit Product Drawer */}
      {editProductId && (
        <EditItemDrawerClientWrapper
          listKey="products"
          itemId={editProductId}
          open={editProductOpen}
          onClose={() => {
            setEditProductOpen(false);
            setEditProductId('');
          }}
        />
      )}
    </>
  );
}