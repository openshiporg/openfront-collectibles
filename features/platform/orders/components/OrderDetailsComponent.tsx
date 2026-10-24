"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { Dot } from "@/features/platform/components/vault-ui";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { ReturnsSection } from "./ReturnsSection";
import { ClaimsSection } from "./ClaimsSection";
import { CreateClaimModal } from "./modals/CreateClaimModal";
import { CreateReturnModal } from "./modals/CreateReturnModal";
import { OrderSectionTabs } from "./OrderSectionTabs";
import { StatusBadge } from "./StatusBadge";

interface OrderDetailsComponentProps {
  order: any;
  list: any;
  loadingActions?: Record<string, Record<string, boolean>>;
  removeEditItemButton?: boolean;
  renderButtons?: () => React.ReactNode;
}

export const OrderDetailsComponent = ({
  order,
  list,
  loadingActions = {},
  removeEditItemButton,
  renderButtons,
}: OrderDetailsComponentProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[order.id]
  )?.[0];

  const getLoadingText = (action: string) => {
    switch (action) {
      case "deleteOrder":
        return "Deleting Order";
      default:
        return "Loading";
    }
  };

  const ship = order.shippingAddress;
  const shipTo = ship
    ? [
        [ship.firstName, ship.lastName].filter(Boolean).join(" "),
        [ship.city, ship.province].filter(Boolean).join(", "),
        ship.postalCode,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;
  const itemCount = (order.lineItems || []).reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0
  );
  const iconButton =
    "inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground [&_svg]:size-3.5 max-sm:size-10";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={order.id} className="border-0">
          <div className="flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link
                  href={`/dashboard/platform/orders/${order.id}`}
                  className="font-mono text-sm font-medium tabular-nums text-foreground hover:underline underline-offset-4"
                >
                  #{order.displayId}
                </Link>
                <StatusBadge status={order.status} />
                {order.returns?.length > 0 && (
                  <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                    <Dot tone="info" />
                    <span className="font-mono tabular-nums">{order.returns.length}</span>
                    {order.returns.length > 1 ? "returns" : "return"}
                  </span>
                )}
                {currentAction && (
                  <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                    <Dot tone="muted" className="animate-pulse" />
                    {getLoadingText(currentAction)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {order.user && (
                  <Link
                    href={`/dashboard/users/${order.user.id}`}
                    className="min-w-0 truncate text-foreground hover:underline underline-offset-4"
                  >
                    {order.user.name || order.user.email}
                  </Link>
                )}
              </div>
              {shipTo && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{shipTo}</div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="text-right">
                {order.total && (
                  <div className="font-mono text-sm font-medium tabular-nums text-foreground">{order.total}</div>
                )}
                <div className="font-mono text-xs tabular-nums text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label="Order actions" className={iconButton}>
                      <MoreVertical />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                      Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsClaimModalOpen(true)}>
                      Start Claim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsReturnModalOpen(true)}>
                      Start Return
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="secondary" size="icon" className={iconButton} asChild>
                  <AccordionTrigger className="py-0" />
                </Button>
                {renderButtons && renderButtons()}
              </div>
            </div>
          </div>
          <AccordionContent className="pb-0">
            <OrderSectionTabs order={order} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="orders"
        itemId={order.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />

      <CreateClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        order={order}
      />

      <CreateReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        order={order}
      />

    </>
  );
};