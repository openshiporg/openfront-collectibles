"use client";

import React, { useState } from "react";
import { ReturnsSection } from "./ReturnsSection";
import { ClaimsSection } from "./ClaimsSection";
import { Count, ListBand, Pill, Track } from "@/features/platform/components/vault-ui";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";

interface OrderSectionTabsProps {
  order: any;
}

type TabType = 'lineItems' | 'returns' | 'claims';

export const OrderSectionTabs = ({ order }: OrderSectionTabsProps) => {
  const [editLineItemId, setEditLineItemId] = useState<string>('');
  const [editLineItemOpen, setEditLineItemOpen] = useState(false);
  
  // Calculate counts for sections
  const lineItemsCount = order.lineItems?.length || 0;
  const returnsCount = order.returns?.length || 0;
  const claimsCount = order.claimOrders?.length || 0;

  // Build tabs array
  const tabs = [
    { 
      key: 'lineItems' as TabType, 
      label: `Line items`,
      count: lineItemsCount,
      data: order.lineItems || []
    },
    ...(returnsCount > 0 ? [{ 
      key: 'returns' as TabType, 
      label: `Returns`,
      count: returnsCount,
      data: order.returns || []
    }] : []),
    ...(claimsCount > 0 ? [{ 
      key: 'claims' as TabType, 
      label: `Claims`,
      count: claimsCount,
      data: order.claimOrders || []
    }] : [])
  ];

  const [activeTab, setActiveTab] = useState<TabType>('lineItems');

  const handleEditLineItem = (lineItemId: string) => {
    setEditLineItemId(lineItemId);
    setEditLineItemOpen(true);
  };

  return (
    <>
      <div className="space-y-3 border-b border-border bg-muted/30 px-4 py-3 md:px-6">
        {tabs.length > 1 && (
          <Track label="Order sections">
            {tabs.map((tab) => (
              <Pill key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                {tab.label} <Count>{tab.count}</Count>
              </Pill>
            ))}
          </Track>
        )}

        {activeTab === 'lineItems' && lineItemsCount > 0 && (
          <ListBand className="bg-background">
            {(order.lineItems || []).map((item: any) => {
              const spec = item.variantData?.title || item.variantTitle;
              const sku = item.sku || item.variantData?.sku;
              return (
                <div key={item.id} className="flex items-start gap-3 px-3 py-2.5">
                  <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.title} className="size-10 object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    {spec && <div className="font-mono text-xs tabular-nums text-foreground/80">{spec}</div>}
                    {(sku || item.variantData?.barcode) && (
                      <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {sku && <>SKU {sku}</>}
                        {sku && item.variantData?.barcode && <span className="mx-1.5">·</span>}
                        {item.variantData?.barcode && <>Barcode {item.variantData.barcode}</>}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs tabular-nums">
                    <div className="text-sm text-foreground">{item.formattedTotal || ""}</div>
                    <div className="text-muted-foreground">
                      {item.quantity}
                      {item.formattedUnitPrice && <> x {item.formattedUnitPrice}</>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Line item actions"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground max-sm:size-10"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditLineItem(item.id)}>
                        Edit Line Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </ListBand>
        )}

        {activeTab === 'returns' && returnsCount > 0 && (
          <ReturnsSection
            order={order}
            returns={order.returns || []}
            totalItems={returnsCount}
          />
        )}

        {activeTab === 'claims' && claimsCount > 0 && (
          <ClaimsSection
            order={order}
            claims={order.claimOrders || []}
            totalItems={claimsCount}
          />
        )}
      </div>

      {/* Edit Line Item Drawer */}
      {editLineItemId && (
        <EditItemDrawerClientWrapper
          listKey="order-line-items"
          itemId={editLineItemId}
          open={editLineItemOpen}
          onClose={() => {
            setEditLineItemOpen(false);
            setEditLineItemId('');
          }}
        />
      )}
    </>
  );
};