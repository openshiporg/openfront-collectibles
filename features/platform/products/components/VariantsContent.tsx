"use client";

import React, { useState } from "react";
import { Count, Dot, ListBand, Pill, Track } from "@/features/platform/components/vault-ui";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemPagination } from "../../orders/components/ItemPagination";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";

interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  inventoryQuantity?: number;
  manageInventory?: boolean;
}

interface VariantsContentProps {
  productId: string;
  variants: ProductVariant[];
  categories?: Array<{ id: string; title: string; }>;
  collections?: Array<{ id: string; title: string; }>;
}

type TabType = 'variants' | 'categories' | 'collections';

export const VariantsContent = ({
  productId,
  variants,
  categories = [],
  collections = [],
}: VariantsContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('variants');
  const [currentPage, setCurrentPage] = useState(1);
  const [editItemId, setEditItemId] = useState<string>('');
  const [editItemOpen, setEditItemOpen] = useState(false);
  const itemsPerPage = 5;

  // Build tabs array - always show all tabs
  const tabs = [
    { 
      key: 'variants' as TabType, 
      label: 'Variants',
      count: variants.length,
      data: variants
    },
    { 
      key: 'categories' as TabType, 
      label: 'Categories',
      count: categories.length,
      data: categories
    },
    { 
      key: 'collections' as TabType, 
      label: 'Collections',
      count: collections.length,
      data: collections
    }
  ];

  // Calculate pagination for current active tab
  const activeTabData = tabs.find(tab => tab.key === activeTab);
  const currentItems = activeTabData?.data || [];
  const totalItems = currentItems.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = currentItems.slice(startIndex, endIndex);

  const handleEditItem = (itemId: string) => {
    setEditItemId(itemId);
    setEditItemOpen(true);
  };

  const stockTone = (variant: ProductVariant) => {
    if (!variant.manageInventory) return "muted" as const;
    const qty = variant.inventoryQuantity || 0;
    if (qty <= 0) return "danger" as const;
    if (qty <= 5) return "warn" as const;
    return "ok" as const;
  };

  return (
    <>
      <div className="space-y-3 border-b border-border bg-muted/30 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Track label="Product sections">
            {tabs.map((tab) => (
              <Pill key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                {tab.label} <Count>{tab.count}</Count>
              </Pill>
            ))}
          </Track>
          {totalItems > itemsPerPage && (
            <ItemPagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {totalItems > 0 && activeTab === 'variants' && (
          <ListBand className="bg-background">
            {paginatedItems.map((variant: any) => (
              <div key={variant.id} className="flex items-start gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <Dot tone={stockTone(variant)} />
                    <span className="font-mono text-sm tabular-nums text-foreground">{variant.title}</span>
                  </div>
                  {variant.sku && (
                    <div className="pl-[18px] font-mono text-[11px] tabular-nums text-muted-foreground">SKU {variant.sku}</div>
                  )}
                </div>
                <div className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {variant.manageInventory ? (
                    <><span className="text-sm text-foreground">{variant.inventoryQuantity || 0}</span> in stock</>
                  ) : (
                    <span className="font-sans">Not tracked</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Variant actions"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground max-sm:size-10"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditItem(variant.id)}>
                      Edit Variant
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </ListBand>
        )}

        {totalItems > 0 && activeTab !== 'variants' && (
          <div className="flex flex-wrap gap-1.5">
            {paginatedItems.map((entry: any) => (
              <span
                key={entry.id}
                className="inline-flex min-h-7 items-center rounded-full bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border"
              >
                {entry.title}
              </span>
            ))}
          </div>
        )}

        {totalItems > itemsPerPage && (
          <div className="font-mono text-xs tabular-nums text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
          </div>
        )}

        {totalItems === 0 && (
          <p className="text-sm text-muted-foreground">
            No {activeTab}
          </p>
        )}
      </div>

      {/* Edit Variant Drawer */}
      {editItemId && (
        <EditItemDrawerClientWrapper
          listKey="product-variants"
          itemId={editItemId}
          open={editItemOpen}
          onClose={() => {
            setEditItemOpen(false);
            setEditItemId('');
          }}
        />
      )}
    </>
  );
};