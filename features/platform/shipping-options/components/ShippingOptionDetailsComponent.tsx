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
import { Dot, type DotTone } from "../../components/vault-ui";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";

interface ShippingOption {
  id: string;
  name: string;
  uniqueKey: string;
  priceType: 'flat_rate' | 'calculated' | 'free';
  amount?: number;
  isReturn: boolean;
  adminOnly: boolean;
  region?: {
    id: string;
    name: string;
    code: string;
    currency: {
      code: string;
      symbol: string;
    };
  };
  fulfillmentProvider?: {
    id: string;
    name: string;
    code: string;
  };
  shippingProfile?: {
    id: string;
    name: string;
  };
  calculatedAmount?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ShippingOptionDetailsComponentProps {
  shippingOption: ShippingOption;
  list: any;
}

export function ShippingOptionDetailsComponent({
  shippingOption,
  list,
}: ShippingOptionDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Format price display
  const formatPrice = () => {
    if (shippingOption.priceType === 'free') {
      return 'Free';
    }
    
    if (shippingOption.calculatedAmount) {
      return shippingOption.calculatedAmount;
    }
    
    if (shippingOption.amount && shippingOption.region?.currency) {
      const { symbol, code } = shippingOption.region.currency;
      const amount = shippingOption.amount / 100; // Convert from cents
      return `${symbol}${amount.toFixed(2)} ${code}`;
    }
    
    return shippingOption.priceType === 'calculated' ? 'Calculated' : 'N/A';
  };

  // Determine status
  const getStatus = (): { label: string; tone: DotTone } => {
    if (shippingOption.isReturn) return { label: 'Return', tone: 'info' };
    if (shippingOption.adminOnly) return { label: 'Admin only', tone: 'warn' };
    return { label: 'Active', tone: 'ok' };
  };

  const status = getStatus();

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={shippingOption.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={status.tone} />
                <Link
                  href={`/dashboard/shipping-options/${shippingOption.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {shippingOption.name}
                </Link>
                <span className="font-mono text-sm tabular-nums text-foreground">{formatPrice()}</span>
                <span className="text-xs text-muted-foreground">{status.label}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">{shippingOption.uniqueKey}</span>
                <span className="capitalize">{shippingOption.priceType.replace('_', ' ')}</span>
                {shippingOption.region && (
                  <span>
                    {shippingOption.region.name}{" "}
                    <span className="font-mono uppercase tabular-nums">{shippingOption.region.code}</span>
                  </span>
                )}
                {shippingOption.fulfillmentProvider && <span>{shippingOption.fulfillmentProvider.name}</span>}
                {shippingOption.shippingProfile && <span>{shippingOption.shippingProfile.name}</span>}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                onClick={() => setIsEditDrawerOpen(true)}
                aria-label="Edit"
              >
                <MoreVertical className="stroke-muted-foreground" />
              </Button>
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
            <div className="grid gap-5 border-t border-border bg-background/60 px-4 py-4 sm:grid-cols-3">
              <section>
                <h4 className="mb-2 text-xs font-semibold text-foreground">Pricing</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Type</dt>
                    <dd className="mt-0.5 capitalize text-foreground">{shippingOption.priceType.replace('_', ' ')}</dd>
                  </div>
                  {shippingOption.amount && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Base amount</dt>
                      <dd className="mt-0.5 font-mono tabular-nums text-foreground">{formatPrice()}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-foreground">Configuration</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Return option</dt>
                    <dd className="mt-0.5 text-foreground">{shippingOption.isReturn ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Admin only</dt>
                    <dd className="mt-0.5 text-foreground">{shippingOption.adminOnly ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-foreground">Relationships</h4>
                <dl className="space-y-2 text-sm">
                  {shippingOption.region && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Region</dt>
                      <dd className="mt-0.5 text-foreground">{shippingOption.region.name}</dd>
                    </div>
                  )}
                  {shippingOption.fulfillmentProvider && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Provider</dt>
                      <dd className="mt-0.5 text-foreground">{shippingOption.fulfillmentProvider.name}</dd>
                    </div>
                  )}
                  {shippingOption.shippingProfile && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Profile</dt>
                      <dd className="mt-0.5 text-foreground">{shippingOption.shippingProfile.name}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Edit Shipping Option Drawer */}
      <EditItemDrawerClientWrapper
        listKey="shipping-options"
        itemId={shippingOption.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={() => {
          // Refresh will be handled by the parent component
        }}
      />
    </>
  );
}