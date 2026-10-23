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
import { GiftCard } from "../actions";

interface GiftCardDetailsComponentProps {
  giftcard: GiftCard;
  list: any;
}

type TabType = 'transactions';

export function GiftCardDetailsComponent({
  giftcard,
  list,
}: GiftCardDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [currentPages, setCurrentPages] = useState<Record<TabType, number>>({
    transactions: 1
  });
  const [editItemId, setEditItemId] = useState<string>('');
  const [editItemOpen, setEditItemOpen] = useState(false);
  const itemsPerPage = 5;

  const isActive = !giftcard.isDisabled && (!giftcard.endsAt || new Date(giftcard.endsAt) > new Date());
  const usagePercentage = giftcard.value > 0 ? ((giftcard.value - giftcard.balance) / giftcard.value) * 100 : 0;
  const hasBeenUsed = giftcard.value !== giftcard.balance;

  // Prepare data for tabs
  const transactionsData = giftcard.giftCardTransactions || [];

  const tabs = [
    { 
      key: 'transactions' as TabType, 
      label: `Transactions`,
      count: transactionsData.length,
      data: transactionsData
    }
  ];

  const activeTabData = tabs.find(tab => tab.key === activeTab);

  const handlePageChange = (tabKey: TabType, newPage: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [tabKey]: newPage
    }));
  };

  const formatCurrency = (amount: number) => {
    const currency = giftcard.region?.currency?.code || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const handleEditItem = (itemId: string) => {
    setEditItemId(itemId);
    setEditItemOpen(true);
  };

  const statusTone = isActive ? "ok" : giftcard.isDisabled ? "muted" : "danger";
  const statusText = isActive ? "Active" : giftcard.isDisabled ? "Disabled" : "Expired";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={giftcard.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={statusTone} />
                <Link
                  href={`/dashboard/gift-cards/${giftcard.id}`}
                  className="font-mono text-sm font-semibold tabular-nums text-foreground hover:underline"
                >
                  {giftcard.code}
                </Link>
                <span className="text-xs text-muted-foreground">{statusText}</span>
                {giftcard.order && giftcard.order.user && (
                  <Link
                    href={`/dashboard/platform/users/${giftcard.order.user.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {giftcard.order.user.name || giftcard.order.user.email}
                  </Link>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-mono tabular-nums text-foreground">{formatCurrency(giftcard.balance)}</span>
                  {" / "}
                  <span className="font-mono tabular-nums">{formatCurrency(giftcard.value)}</span>
                </span>
                {hasBeenUsed && (
                  <span><span className="font-mono tabular-nums">{usagePercentage.toFixed(0)}%</span> used</span>
                )}
                {giftcard.order && (
                  <span>
                    Order{" "}
                    <Link
                      href={`/dashboard/platform/orders/${giftcard.order.id}`}
                      className="font-mono tabular-nums text-foreground hover:underline"
                    >
                      #{giftcard.order.displayId}
                    </Link>
                    <span className="ml-1.5 font-mono tabular-nums">{giftcard.order.total}</span>
                  </span>
                )}
                {giftcard.endsAt && (
                  <span>Expires <span className="font-mono tabular-nums">{new Date(giftcard.endsAt).toLocaleDateString()}</span></span>
                )}
                <span className="font-mono tabular-nums">
                  {new Date(giftcard.createdAt).toLocaleDateString("en-US", {
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
                    Edit Gift Card
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="size-10 rounded-full sm:size-8 [&_svg]:size-4" asChild>
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
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

              {activeTabData && activeTab === 'transactions' && (
                <ListBand>
                  {transactionsData.length > 0 ? (
                    transactionsData.slice(
                      (currentPages.transactions - 1) * itemsPerPage,
                      currentPages.transactions * itemsPerPage
                    ).map((transaction) => (
                      transaction.order && (
                        <div key={transaction.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2.5">
                              <Link
                                href={`/dashboard/platform/orders/${transaction.order.id}`}
                                className="font-mono text-sm font-medium tabular-nums text-foreground hover:underline"
                              >
                                #{transaction.order.displayId}
                              </Link>
                              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              Order total <span className="font-mono tabular-nums">{transaction.order.total}</span>
                            </div>
                          </div>
                          <span className="font-mono text-sm tabular-nums text-foreground">
                            -{formatCurrency(transaction.amount)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4" aria-label="Transaction actions">
                                <MoreVertical className="stroke-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditItem(transaction.id)}>
                                Edit Transaction
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No transactions
                    </div>
                  )}
                </ListBand>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="gift-cards"
        itemId={giftcard.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />

      {/* Edit Item Drawer */}
      {editItemId && (
        <EditItemDrawerClientWrapper
          listKey="gift-card-transactions"
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
}