"use client";

import { useState } from "react";
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
import { MoreVertical, Edit, Trash } from "lucide-react";
import { Dot, ListBand, SectionTitle } from "../../components/vault-ui";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { Discount } from "../actions";

interface DiscountDetailsComponentProps {
  discount: Discount;
  list: any;
}

export function DiscountDetailsComponent({ discount, list }: DiscountDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const isActive = !discount.isDisabled && (!discount.endsAt || new Date(discount.endsAt) > new Date());
  const statusTone = isActive ? "ok" : discount.isDisabled ? "muted" : "danger";
  const statusText = isActive ? "Active" : discount.isDisabled ? "Disabled" : "Expired";

  const usagePercentage = discount.usageLimit ? (discount.usageCount || 0) / discount.usageLimit * 100 : 0;

  const valueLabel = discount.discountRule
    ? discount.discountRule.type === 'percentage'
      ? `${discount.discountRule.value}%`
      : discount.discountRule.type === 'fixed'
      ? `$${discount.discountRule.value}`
      : 'Free shipping'
    : null;

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={discount.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={statusTone} />
                <Link
                  href={`/dashboard/platform/discounts?focus=${discount.id}`}
                  className="font-mono text-sm font-semibold tabular-nums text-foreground hover:underline"
                >
                  {discount.code}
                </Link>
                <span className="text-xs text-muted-foreground">{statusText}</span>
                {discount.discountRule && (
                  <span className="text-xs capitalize text-muted-foreground">{discount.discountRule.type}</span>
                )}
              </div>

              {discount.discountRule?.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {discount.discountRule.description}
                </p>
              )}

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {valueLabel && (
                  <span className="font-mono tabular-nums text-foreground">{valueLabel} off</span>
                )}
                <span>
                  <span className="font-mono tabular-nums">{discount.usageCount || 0}</span>
                  {discount.usageLimit ? <> / <span className="font-mono tabular-nums">{discount.usageLimit}</span></> : null} uses
                </span>
                {discount.orders && discount.orders.length > 0 && (
                  <span><span className="font-mono tabular-nums">{discount.orders.length}</span> orders</span>
                )}
                <span className="font-mono tabular-nums">
                  {new Date(discount.createdAt).toLocaleDateString("en-US", {
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
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Discount
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
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
            <div className="space-y-4 border-t border-border bg-background/60 px-4 py-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="mt-0.5 capitalize text-foreground">{discount.discountRule?.type || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Value</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                    {discount.discountRule?.value
                      ? discount.discountRule.type === 'percentage'
                        ? `${discount.discountRule.value}%`
                        : `$${discount.discountRule.value}`
                      : '—'
                    }
                  </dd>
                </div>
                {discount.startsAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Starts</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(discount.startsAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {discount.endsAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Ends</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(discount.endsAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>

              {discount.usageLimit && (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {discount.usageCount || 0} / {discount.usageLimit}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]">
                    <div
                      className="h-1.5 rounded-full bg-foreground transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {discount.orders && discount.orders.length > 0 && (
                <div>
                  <SectionTitle meta={discount.orders.length}>Recent orders</SectionTitle>
                  <ListBand className="max-h-48 overflow-y-auto">
                    {discount.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="font-mono tabular-nums text-foreground">#{order.displayId}</span>
                          <span className="truncate text-muted-foreground">{order.user.name}</span>
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {order.currency.symbol}{order.total}
                        </span>
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
        listKey="discounts"
        itemId={discount.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}