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
import { Count, Dot, ListBand, Pill, Track, type DotTone } from "../../components/vault-ui";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ItemPagination } from "../../orders/components/ItemPagination";
import { OrderDetailsComponent } from "../../orders/components/OrderDetailsComponent";

const statusTones: Record<string, DotTone> = {
  active: "ok",
  suspended: "danger",
  pending: "warn",
  paid: "ok",
  overdue: "danger",
  not_approved: "danger",
};

interface Account {
  id: string;
  accountNumber: string;
  title: string;
  description?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  creditLimit: number;
  balanceDue: number;
  formattedTotal: string;
  formattedCurrentBalance: string;
  formattedCreditLimit: string;
  availableCredit: number;
  currency: {
    id: string;
    code: string;
    symbol: string;
  };
  dueDate?: string;
  paidAt?: string;
  suspendedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  orders: Array<{
    id: string;
    displayId: string;
    total: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface AccountDetailsComponentProps {
  account: Account;
  list: any;
}

type TabType = 'orders';

export function InvoiceDetailsComponent({
  invoice,
  list,
}: any) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [currentPages, setCurrentPages] = useState<Record<TabType, number>>({
    orders: 1
  });
  const [editItemId, setEditItemId] = useState<string>('');
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemType, setEditItemType] = useState<string>('');
  const itemsPerPage = 5;

  // Prepare data for tabs
  const ordersData: { id: string; displayId: number; total: string }[] = invoice.orders || [];

  const tabs = [
    { 
      key: 'orders' as TabType, 
      label: `Orders`,
      count: ordersData.length,
      data: ordersData
    }
  ].filter(tab => tab.count > 0);

  const activeTabData = tabs.find(tab => tab.key === activeTab);

  const handlePageChange = (tabKey: TabType, newPage: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [tabKey]: newPage
    }));
  };

  const handleEditItem = (itemId: string, itemType: string) => {
    setEditItemId(itemId);
    setEditItemType(itemType);
    setEditItemOpen(true);
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={invoice.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={statusTones[invoice.status] || "muted"} />
                <Link
                  href={`/dashboard/platform/accounts/${invoice.id}`}
                  className="font-mono text-sm font-semibold tabular-nums text-foreground hover:underline"
                >
                  {invoice.invoiceNumber || invoice.accountNumber}
                </Link>
                <span className="text-xs capitalize text-muted-foreground">{invoice.status?.replaceAll('_', ' ')}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {invoice.user.email && (
                  <span className="min-w-0 truncate">{invoice.user.name} ({invoice.user.email})</span>
                )}
                <span className="font-mono tabular-nums text-foreground">
                  {invoice.formattedCurrentBalance || invoice.formattedTotal}
                </span>
                <span>
                  <span className="font-mono tabular-nums">{ordersData.length}</span> {ordersData.length === 1 ? 'order' : 'orders'}
                </span>
                {invoice.dueDate && (
                  <span>Due <span className="font-mono tabular-nums">{new Date(invoice.dueDate).toLocaleDateString()}</span></span>
                )}
                <span className="font-mono tabular-nums">
                  {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                    aria-label="Actions"
                  >
                    <MoreVertical className="stroke-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                    Edit Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <div className="space-y-3 border-t border-border bg-background/60 px-4 py-4">
              {tabs.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Track label="Account records">
                    {tabs.map((tab) => (
                      <Pill
                        key={tab.key}
                        active={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.key === 'orders' && 'Orders'}
                        <Count>{tab.count}</Count>
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
              )}

              {activeTabData && activeTab === 'orders' && (
                <ListBand>
                  {ordersData.slice(
                    (currentPages.orders - 1) * itemsPerPage,
                    currentPages.orders * itemsPerPage
                  ).map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                      <div className="flex min-w-0 flex-1 items-baseline gap-3 text-sm">
                        <span className="font-mono tabular-nums text-foreground">#{order.displayId}</span>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{order.total}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4"
                            aria-label="Order actions"
                          >
                            <MoreVertical className="stroke-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditItem(order.id, 'orders')}>
                            Edit Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </ListBand>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="accounts"
        itemId={invoice.id}
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
