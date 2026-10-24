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
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ItemPagination } from "../../orders/components/ItemPagination";
import { Count, Dot, ListBand, Pill, Track } from "../../components/vault-ui";

interface Region {
  id: string;
  name: string;
  code: string;
  taxRate: number;
  createdAt: string;
  updatedAt?: string;
  automaticTaxes: boolean;
  currency: {
    id: string;
    code: string;
    symbol: string;
    symbolNative: string;
  };
  countries: Array<{
    id: string;
    iso2: string;
    displayName: string;
  }>;
  paymentProviders?: Array<{
    id: string;
    name: string;
    code: string;
    isInstalled: boolean;
  }>;
  fulfillmentProviders?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

interface RegionDetailsComponentProps {
  region: Region;
  list: any;
}

type TabType = 'currency' | 'countries' | 'payment' | 'fulfillment';

interface TabContentProps {
  items: any[];
  currentPage: number;
  itemsPerPage: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

function TabContent({ items, currentPage, itemsPerPage, renderItem }: TabContentProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return (
    <div className="space-y-2 py-4">
      {items.length > itemsPerPage && (
        <div className="text-xs text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, items.length)} of{" "}
          {items.length} items
        </div>
      )}
      <ListBand>
        {paginatedItems.map((item, index) => (
          <div key={index} className="px-3 py-2">
            {renderItem(item, index)}
          </div>
        ))}
      </ListBand>
    </div>
  );
}

export function RegionDetailsComponent({
  region,
  list,
}: RegionDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('currency');
  const [currentPages, setCurrentPages] = useState<Record<TabType, number>>({
    currency: 1,
    countries: 1,
    payment: 1,
    fulfillment: 1
  });
  
  // Individual edit drawers
  const [editCurrencyOpen, setEditCurrencyOpen] = useState(false);
  const [editCountryOpen, setEditCountryOpen] = useState(false);
  const [editCountryId, setEditCountryId] = useState<string>('');
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string>('');
  const [editFulfillmentOpen, setEditFulfillmentOpen] = useState(false);
  const [editFulfillmentId, setEditFulfillmentId] = useState<string>('');
  
  const itemsPerPage = 5;
  
  // Determine if region is "active" based on whether it has countries
  const isActive = region.countries && region.countries.length > 0;

  // Prepare data for tabs
  const currencyData = [{
    id: region.currency.id,
    code: region.currency.code,
    symbol: region.currency.symbol,
    symbolNative: region.currency.symbolNative,
    taxRate: region.taxRate,
    automaticTaxes: region.automaticTaxes
  }];

  const paymentProviders = region.paymentProviders || [];
  const fulfillmentProviders = region.fulfillmentProviders || [];

  const tabs = [
    { 
      key: 'currency' as TabType, 
      label: `${currencyData.length} Currency${currencyData.length !== 1 ? 's' : ''}`,
      count: currencyData.length,
      data: currencyData
    },
    { 
      key: 'countries' as TabType, 
      label: `${region.countries.length} Countr${region.countries.length !== 1 ? 'ies' : 'y'}`,
      count: region.countries.length,
      data: region.countries
    },
    { 
      key: 'payment' as TabType, 
      label: `${paymentProviders.length} Payment Provider${paymentProviders.length !== 1 ? 's' : ''}`,
      count: paymentProviders.length,
      data: paymentProviders
    },
    { 
      key: 'fulfillment' as TabType, 
      label: `${fulfillmentProviders.length} Fulfillment Provider${fulfillmentProviders.length !== 1 ? 's' : ''}`,
      count: fulfillmentProviders.length,
      data: fulfillmentProviders
    }
  ].filter(tab => tab.count > 0);

  const handlePageChange = (tabKey: TabType, newPage: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [tabKey]: newPage
    }));
  };

  const activeTabData = tabs.find(tab => tab.key === activeTab);

  const tabLabels: Record<TabType, string> = {
    currency: 'Currency',
    countries: 'Countries',
    payment: 'Payment Providers',
    fulfillment: 'Fulfillment Providers',
  };
  const rowIcon = "size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={region.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={isActive ? "ok" : "muted"} />
                <Link
                  href={`/dashboard/regions/${region.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {region.name}
                </Link>
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{region.code}</span>
                <span className="text-xs text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground">
                  {region.currency.symbol} {region.currency.code.toUpperCase()}
                </span>
                <span>
                  <span className="font-mono tabular-nums">{region.countries.length}</span>{" "}
                  {region.countries.length === 1 ? 'country' : 'countries'}
                </span>
                <span>
                  Tax <span className="font-mono tabular-nums">{(region.taxRate * 100).toFixed(1)}%</span>
                </span>
                <span className="font-mono tabular-nums">
                  {new Date(region.createdAt).toLocaleDateString("en-US", {
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
                  <Button variant="ghost" size="icon" className={rowIcon} aria-label="Actions">
                    <MoreVertical className="stroke-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                    Edit Region
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className={rowIcon} asChild>
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            <div className="space-y-3 border-t border-border bg-background/60 px-4 py-4">
              {tabs.length > 0 && (
                <Track label="Region details">
                  {tabs.map((tab) => (
                    <Pill
                      key={tab.key}
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tabLabels[tab.key]} <Count>{tab.count}</Count>
                    </Pill>
                  ))}
                </Track>
              )}

              {activeTabData && (
                <>
                  {activeTabData.count > itemsPerPage && (
                    <div className="flex justify-end">
                      <ItemPagination
                        currentPage={currentPages[activeTab]}
                        totalItems={activeTabData.count}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(newPage) => handlePageChange(activeTab, newPage)}
                      />
                    </div>
                  )}

                  <ListBand>
                    {activeTab === 'currency' &&
                      currencyData.slice(
                        (currentPages.currency - 1) * itemsPerPage,
                        currentPages.currency * itemsPerPage
                      ).map((currency, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 text-sm">
                              <span className="font-mono tabular-nums text-muted-foreground">{currency.symbol}</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">{currency.code.toUpperCase()}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              <span>Tax <span className="font-mono tabular-nums">{(currency.taxRate * 100).toFixed(1)}%</span></span>
                              <span>{currency.automaticTaxes ? 'Automatic taxes' : 'No automatic taxes'}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={rowIcon} aria-label="Actions">
                        <MoreVertical className="stroke-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditCurrencyOpen(true)}>
                        Edit Currency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                      ))}

                    {activeTab === 'countries' &&
                      region.countries.slice(
                        (currentPages.countries - 1) * itemsPerPage,
                        currentPages.countries * itemsPerPage
                      ).map((country, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="flex min-w-0 flex-1 items-baseline gap-2.5 text-sm">
                            <span className="w-6 shrink-0 font-mono text-xs uppercase tabular-nums text-muted-foreground">{country.iso2}</span>
                            <span className="truncate text-foreground">{country.displayName}</span>
                          </div>
                          <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={rowIcon} aria-label="Actions">
                        <MoreVertical className="stroke-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                          setEditCountryId(country.id);
                          setEditCountryOpen(true);
                        }}>
                        Edit Country
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                      ))}

                    {activeTab === 'payment' &&
                      paymentProviders.slice(
                        (currentPages.payment - 1) * itemsPerPage,
                        currentPages.payment * itemsPerPage
                      ).map((provider, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 text-sm">
                              <Dot tone={provider.isInstalled ? "ok" : "danger"} />
                              <span className="truncate text-foreground">{provider.name}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {provider.isInstalled ? 'Installed' : 'Not installed'}
                            </div>
                          </div>
                          <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={rowIcon} aria-label="Actions">
                        <MoreVertical className="stroke-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                          setEditPaymentId(provider.id);
                          setEditPaymentOpen(true);
                        }}>
                        Edit Payment Provider
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                      ))}

                    {activeTab === 'fulfillment' &&
                      fulfillmentProviders.slice(
                        (currentPages.fulfillment - 1) * itemsPerPage,
                        currentPages.fulfillment * itemsPerPage
                      ).map((provider, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-foreground">{provider.name}</div>
                            <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{provider.code}</div>
                          </div>
                          <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={rowIcon} aria-label="Actions">
                        <MoreVertical className="stroke-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                          setEditFulfillmentId(provider.id);
                          setEditFulfillmentOpen(true);
                        }}>
                        Edit Fulfillment Provider
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                      ))}
                  </ListBand>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Edit Region Drawer */}
      <EditItemDrawerClientWrapper
        listKey="regions"
        itemId={region.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={() => {
          // Refresh will be handled by the parent component
        }}
      />

      {/* Edit Currency Drawer */}
      <EditItemDrawerClientWrapper
        listKey="currencies"
        itemId={region.currency.id}
        open={editCurrencyOpen}
        onClose={() => setEditCurrencyOpen(false)}
      />

      {/* Edit Country Drawer */}
      {editCountryId && (
        <EditItemDrawerClientWrapper
          listKey="countries"
          itemId={editCountryId}
          open={editCountryOpen}
          onClose={() => {
            setEditCountryOpen(false);
            setEditCountryId('');
          }}
        />
      )}

      {/* Edit Payment Provider Drawer */}
      {editPaymentId && (
        <EditItemDrawerClientWrapper
          listKey="payment-providers"
          itemId={editPaymentId}
          open={editPaymentOpen}
          onClose={() => {
            setEditPaymentOpen(false);
            setEditPaymentId('');
          }}
        />
      )}

      {/* Edit Fulfillment Provider Drawer */}
      {editFulfillmentId && (
        <EditItemDrawerClientWrapper
          listKey="fulfillment-providers"
          itemId={editFulfillmentId}
          open={editFulfillmentOpen}
          onClose={() => {
            setEditFulfillmentOpen(false);
            setEditFulfillmentId('');
          }}
        />
      )}
    </>
  );
}