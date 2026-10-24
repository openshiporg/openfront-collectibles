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
import { OrderDetailsComponent } from "../../orders/components/OrderDetailsComponent";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  hasAccount: boolean;
  role?: {
    id: string;
    name: string;
  };
  orders?: Array<{
    id: string;
    displayId: string;
    status: string;
    email: string;
    taxRate?: number;
    canceledAt?: string;
    createdAt: string;
    updatedAt?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    shippingAddress?: {
      id: string;
      company?: string;
      firstName?: string;
      lastName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      phone?: string;
    };
    billingAddress?: {
      id: string;
      company?: string;
      firstName?: string;
      lastName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      phone?: string;
    };
    lineItems?: Array<{
      id: string;
      title: string;
      quantity: number;
      sku?: string;
      thumbnail?: string;
      formattedUnitPrice?: string;
      formattedTotal?: string;
      variantData?: any;
      productData?: any;
    }>;
    total?: string;
  }>;
  addresses?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
    metadata?: any;
  }>;
  carts?: Array<{
    id: string;
    status: string;
    completedAt?: string;
    createdAt: string;
    totalPrice?: string;
    lineItems?: Array<{
      id: string;
      title: string;
      quantity: number;
    }>;
  }>;
  customerGroups?: Array<{
    id: string;
    name: string;
    metadata?: any;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface UserDetailsComponentProps {
  user: User;
  list: any;
}

type TabType = 'orders' | 'addresses' | 'carts' | 'customerGroups';

export function UserDetailsComponent({
  user,
  list,
}: UserDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [currentPages, setCurrentPages] = useState<Record<TabType, number>>({
    orders: 1,
    addresses: 1,
    carts: 1,
    customerGroups: 1
  });
  const [editItemId, setEditItemId] = useState<string>('');
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemType, setEditItemType] = useState<string>('');
  const itemsPerPage = 5;

  // Prepare data for tabs
  const ordersData = user.orders || [];
  const addressesData = user.addresses || [];
  const cartsData = user.carts || [];
  const customerGroupsData = user.customerGroups || [];

  const tabs = [
    { 
      key: 'orders' as TabType, 
      label: `Orders`,
      count: ordersData.length,
      data: ordersData
    },
    { 
      key: 'addresses' as TabType, 
      label: `Addresses`,
      count: addressesData.length,
      data: addressesData
    },
    { 
      key: 'carts' as TabType, 
      label: `Carts`,
      count: cartsData.length,
      data: cartsData
    },
    { 
      key: 'customerGroups' as TabType, 
      label: `Customer Groups`,
      count: customerGroupsData.length,
      data: customerGroupsData
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
        <AccordionItem value={user.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={user.hasAccount ? "ok" : "muted"} />
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {user.name || `${user.firstName} ${user.lastName}`.trim() || user.email}
                </Link>
                <span className="text-xs text-muted-foreground">{user.hasAccount ? "Has account" : "No account"}</span>
                {user.role && (
                  <span className="text-xs text-muted-foreground">{user.role.name}</span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {user.email && <span className="min-w-0 truncate">{user.email}</span>}
                {user.phone && <span className="font-mono tabular-nums">{user.phone}</span>}
                <span>
                  <span className="font-mono tabular-nums">{ordersData.length}</span> {ordersData.length === 1 ? 'order' : 'orders'}
                </span>
                {addressesData.length > 0 && (
                  <span>
                    <span className="font-mono tabular-nums">{addressesData.length}</span> {addressesData.length === 1 ? 'address' : 'addresses'}
                  </span>
                )}
                <span className="font-mono tabular-nums">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
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
                    Edit User
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
                  <Track label="Customer records">
                    {tabs.map((tab) => (
                      <Pill
                        key={tab.key}
                        active={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.key === 'orders' && 'Orders'}
                        {tab.key === 'addresses' && 'Addresses'}
                        {tab.key === 'carts' && 'Carts'}
                        {tab.key === 'customerGroups' && 'Customer Groups'}
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

              {activeTabData && (
                <>
                  {activeTab === 'orders' && (
                    <ListBand>
                      {ordersData.slice(
                        (currentPages.orders - 1) * itemsPerPage,
                        currentPages.orders * itemsPerPage
                      ).map((order) => (
                        <div key={order.id} className="border-0">
                          <OrderDetailsComponent
                            order={order}
                            list={{ key: "Order" }}
                            removeEditItemButton={true}
                          />
                        </div>
                      ))}
                    </ListBand>
                  )}

                  {activeTab === 'addresses' && (
                    <ListBand>
                      {addressesData.slice(
                        (currentPages.addresses - 1) * itemsPerPage,
                        currentPages.addresses * itemsPerPage
                      ).map((address) => (
                        <div key={address.id} className="flex items-start justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {address.firstName} {address.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {address.address1}
                              {address.city && `, ${address.city}`}
                              {address.province && `, ${address.province}`}
                            </div>
                            {address.phone && (
                              <div className="font-mono text-xs tabular-nums text-muted-foreground">
                                {address.phone}
                              </div>
                            )}
                          </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4"
                            aria-label="Address actions"
                          >
                            <MoreVertical className="stroke-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditItem(address.id, 'addresses')}>
                            Edit Address
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        </div>
                      ))}
                    </ListBand>
                  )}

                  {activeTab === 'carts' && (
                    <ListBand>
                      {cartsData.slice(
                        (currentPages.carts - 1) * itemsPerPage,
                        currentPages.carts * itemsPerPage
                      ).map((cart) => (
                        <div key={cart.id} className="flex items-start justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                              <Dot tone={cart.status === 'COMPLETED' ? 'ok' : 'info'} />
                              <span className="text-sm font-medium text-foreground">
                                Cart <span className="font-mono tabular-nums">{cart.id.slice(-8)}</span>
                              </span>
                              <span className="text-xs capitalize text-muted-foreground">{cart.status.toLowerCase()}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              {cart.totalPrice && (
                                <span className="font-mono tabular-nums text-foreground">{cart.totalPrice}</span>
                              )}
                              <span className="font-mono tabular-nums">{new Date(cart.createdAt).toLocaleDateString()}</span>
                              {cart.lineItems && (
                                <span><span className="font-mono tabular-nums">{cart.lineItems.length}</span> items</span>
                              )}
                            </div>
                          </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4"
                            aria-label="Cart actions"
                          >
                            <MoreVertical className="stroke-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditItem(cart.id, 'carts')}>
                            Edit Cart
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        </div>
                      ))}
                    </ListBand>
                  )}

                  {activeTab === 'customerGroups' && (
                    <ListBand>
                      {customerGroupsData.slice(
                        (currentPages.customerGroups - 1) * itemsPerPage,
                        currentPages.customerGroups * itemsPerPage
                      ).map((group) => (
                        <div key={group.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                          <span className="min-w-0 truncate text-sm font-medium text-foreground">{group.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 rounded-full sm:size-8 [&_svg]:size-4"
                            aria-label="Customer Group actions"
                          >
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
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="users"
        itemId={user.id}
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
