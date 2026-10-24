"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Count, Dot, ListBand, Pill, Track } from "../../components/vault-ui";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ItemPagination } from "../../orders/components/ItemPagination";

interface PriceList {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  customerGroups?: Array<{
    id: string;
    name: string;
    metadata?: any;
  }>;
  prices?: Array<{
    id: string;
    amount: number;
    currency?: {
      id: string;
      code: string;
      symbol: string;
    };
    variant?: {
      id: string;
      title: string;
      product?: {
        id: string;
        title: string;
      };
    };
  }>;
  rules?: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface PriceListDetailsComponentProps {
  pricelist: PriceList;
  list: any;
}

type TabType = 'customerGroups' | 'prices' | 'rules';

export function PriceListDetailsComponent({
  pricelist,
  list,
}: PriceListDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('customerGroups');
  const [currentPages, setCurrentPages] = useState<Record<TabType, number>>({
    customerGroups: 1,
    prices: 1,
    rules: 1
  });
  const [editItemId, setEditItemId] = useState<string>('');
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemType, setEditItemType] = useState<string>('');
  const itemsPerPage = 5;

  // Prepare data for tabs
  const customerGroupsData = pricelist.customerGroups || [];
  const pricesData = pricelist.prices || [];
  const rulesData = pricelist.rules || [];

  const tabs = [
    { 
      key: 'customerGroups' as TabType, 
      label: `Customer Groups`,
      count: customerGroupsData.length,
      data: customerGroupsData
    },
    { 
      key: 'prices' as TabType, 
      label: `Prices`,
      count: pricesData.length,
      data: pricesData
    },
    { 
      key: 'rules' as TabType, 
      label: `Rules`,
      count: rulesData.length,
      data: rulesData
    }
  ].filter(tab => tab.count > 0);

  const activeTabData = tabs.find(tab => tab.key === activeTab);

  const handlePageChange = (tabKey: TabType, newPage: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [tabKey]: newPage
    }));
  };

  const formatCurrency = (amount: number, currency?: { code: string; symbol: string }) => {
    if (!currency) return `$${(amount / 100).toFixed(2)}`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
    }).format(amount / 100);
  };

  const handleEditItem = (itemId: string, itemType: string) => {
    setEditItemId(itemId);
    setEditItemType(itemType);
    setEditItemOpen(true);
  };

  const statusTone = pricelist.status === "active" ? "ok" : "muted";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={pricelist.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                {pricelist.status && <Dot tone={statusTone} />}
                <Link
                  href={`/dashboard/price-lists/${pricelist.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {pricelist.name}
                </Link>
                {pricelist.status && (
                  <span className="text-xs capitalize text-muted-foreground">{pricelist.status}</span>
                )}
                <span className="text-xs capitalize text-muted-foreground">{pricelist.type}</span>
              </div>

              {pricelist.description && (
                <p className="mt-1 text-sm text-muted-foreground">{pricelist.description}</p>
              )}

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {customerGroupsData.length > 0 && (
                  <span><span className="font-mono tabular-nums">{customerGroupsData.length}</span> {customerGroupsData.length === 1 ? 'group' : 'groups'}</span>
                )}
                {pricesData.length > 0 && (
                  <span><span className="font-mono tabular-nums">{pricesData.length}</span> {pricesData.length === 1 ? 'price' : 'prices'}</span>
                )}
                {pricelist.startsAt && (
                  <span>Starts <span className="font-mono tabular-nums">{new Date(pricelist.startsAt).toLocaleDateString()}</span></span>
                )}
                {pricelist.endsAt && (
                  <span>Ends <span className="font-mono tabular-nums">{new Date(pricelist.endsAt).toLocaleDateString()}</span></span>
                )}
                <span className="font-mono tabular-nums">
                  {new Date(pricelist.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Actions">
                    <MoreVertical className="stroke-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                    Edit Price List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="size-10 rounded-full sm:size-8 [&_svg]:size-4" asChild>
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            {tabs.length > 0 ? (
              <div className="space-y-3 border-t border-border bg-background/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Track label="Sections">
                    {tabs.map((tab) => (
                      <Pill key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                        {tab.label} <Count>{tab.count}</Count>
                      </Pill>
                    ))}
                  </Track>
                  {activeTabData && activeTabData.count > itemsPerPage && (
                    <ItemPagination
                      currentPage={currentPages[activeTab]}
                      totalItems={activeTabData.count}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(newPage) => handlePageChange(activeTab, newPage)}
                    />
                  )}
                </div>

                {activeTab === 'customerGroups' && (
                  <ListBand>
                    {customerGroupsData.slice(
                      (currentPages.customerGroups - 1) * itemsPerPage,
                      currentPages.customerGroups * itemsPerPage
                    ).map((group) => (
                      <div key={group.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{group.name}</div>
                          
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Actions">
                              <MoreVertical className="stroke-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(group.id, 'customer-groups')}>
                              Edit Customer Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </ListBand>
                )}
                {activeTab === 'prices' && (
                  <ListBand>
                    {pricesData.slice(
                      (currentPages.prices - 1) * itemsPerPage,
                      currentPages.prices * itemsPerPage
                    ).map((price) => (
                      <div key={price.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-sm font-medium tabular-nums text-foreground">{formatCurrency(price.amount, price.currency)}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">{price.variant?.product?.title} {price.variant?.title}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Actions">
                              <MoreVertical className="stroke-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(price.id, 'prices')}>
                              Edit Price
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </ListBand>
                )}
                {activeTab === 'rules' && (
                  <ListBand>
                    {rulesData.slice(
                      (currentPages.rules - 1) * itemsPerPage,
                      currentPages.rules * itemsPerPage
                    ).map((rule) => (
                      <div key={rule.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{rule.name}</div>
                          <div className="mt-0.5 flex gap-x-3 text-xs text-muted-foreground"><span className="capitalize">{rule.type}</span><span className="font-mono tabular-nums">{rule.value}</span></div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Actions">
                              <MoreVertical className="stroke-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(rule.id, 'price-list-rules')}>
                              Edit Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </ListBand>
                )}
              </div>
            ) : (
              <div className="border-t border-border bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                No customer groups, prices or rules
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="price-lists"
        itemId={pricelist.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />

      {/* Edit Item Drawer */}
      {editItemId && (
        <EditItemDrawerClientWrapper
          listKey={editItemType}
          itemId={editItemId}
          open={editItemOpen}
          onClose={() => {
            setEditItemOpen(false);
            setEditItemId('');
            setEditItemType('');
          }}
        />
      )}
    </>
  );
}
