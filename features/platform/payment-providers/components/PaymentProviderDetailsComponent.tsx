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
import Link from "next/link";
import { Count, Dot, ListBand, Pill, Track } from "../../components/vault-ui";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ItemPagination } from "../../orders/components/ItemPagination";

const statusColors = {
  "active": "emerald",
  "inactive": "zinc"
} as const;

interface PaymentProvider {
  id: string;
  name: string;
  code: string;
  isInstalled: boolean;
  metadata?: any;
  regions?: Array<{
    id: string;
    name: string;
    code: string;
    currency?: {
      code: string;
      symbol: string;
    };
    countries?: Array<{
      id: string;
      name: string;
      iso2: string;
    }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentProviderDetailsComponentProps {
  paymentprovider: PaymentProvider;
  list: any;
}

type TabType = 'regions';

export function PaymentProviderDetailsComponent({
  paymentprovider,
  list,
}: PaymentProviderDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('regions');
  const [currentPage, setCurrentPage] = useState(1);
  const [editRegionId, setEditRegionId] = useState('');
  const [editRegionOpen, setEditRegionOpen] = useState(false);
  
  const itemsPerPage = 5;
  const regions = paymentprovider.regions || [];
  
  const tabs = [
    {
      key: 'regions' as TabType,
      label: `${regions.length} Region${regions.length !== 1 ? 's' : ''}`,
      count: regions.length,
      data: regions
    }
  ];
  
  const activeTabData = tabs.find(tab => tab.key === activeTab);
  
  const resetPage = () => {
    setCurrentPage(1);
  };

  const rowIcon = "size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={paymentprovider.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={paymentprovider.isInstalled ? "ok" : "muted"} />
                <Link
                  href={`/dashboard/payment-providers/${paymentprovider.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {paymentprovider.name}
                </Link>
                <span className="text-xs text-muted-foreground">{paymentprovider.isInstalled ? "Installed" : "Not installed"}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">{paymentprovider.code}</span>
                {regions.length > 0 && (
                  <span>
                    <span className="font-mono tabular-nums">{regions.length}</span> region{regions.length !== 1 ? 's' : ''}
                  </span>
                )}
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
                    Edit Payment Provider
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className={rowIcon} asChild>
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            {regions.length > 0 && (
              <div className="space-y-3 border-t border-border bg-background/60 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Track label="Provider details">
                    {tabs.map((tab) => (
                      <Pill
                        key={tab.key}
                        active={activeTab === tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          resetPage();
                        }}
                      >
                        Regions <Count>{tab.count}</Count>
                      </Pill>
                    ))}
                  </Track>
                  {activeTabData && activeTabData.count > itemsPerPage && (
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, activeTabData.count)}–{Math.min(currentPage * itemsPerPage, activeTabData.count)} / {activeTabData.count}
                      </span>
                      <ItemPagination
                        currentPage={currentPage}
                        totalItems={activeTabData.count}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>

                {activeTabData && activeTab === 'regions' && (
                  <ListBand>
                    {regions
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((region, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 text-sm">
                              <span className="truncate text-foreground">{region.name}</span>
                              <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{region.code}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              {region.currency && (
                                <span className="font-mono tabular-nums">{region.currency.symbol} {region.currency.code}</span>
                              )}
                              {region.countries && region.countries.length > 0 && (
                                <span>
                                  <span className="font-mono tabular-nums">{region.countries.length}</span> countr{region.countries.length === 1 ? 'y' : 'ies'}
                                </span>
                              )}
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
                                setEditRegionId(region.id);
                                setEditRegionOpen(true);
                              }}>
                                Edit Region
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                  </ListBand>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Edit Payment Provider Drawer */}
      <EditItemDrawerClientWrapper
        listKey={list.key}
        itemId={paymentprovider.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
      
      {/* Edit Region Drawer */}
      <EditItemDrawerClientWrapper
        listKey="regions"
        itemId={editRegionId}
        open={editRegionOpen}
        onClose={() => {
          setEditRegionOpen(false);
          setEditRegionId('');
        }}
      />
    </>
  );
}
