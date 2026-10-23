'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, ArrowUpRight } from 'lucide-react';
import { ProductImage } from '../../components/ProductImage';
import { Dot, ListBand, SectionTitle } from '@/features/platform/components/vault-ui';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// Local types for FulfillmentHistory component
interface FulfillmentHistoryOrder {
  id: string;
  unfulfilled?: Array<{
    id: string;
    quantity: number;
  }>;
}

interface FulfillmentHistoryFulfillment {
  id: string;
  createdAt: string;
  canceledAt?: string;
  items?: Array<{
    id: string;
    quantity: number;
    lineItem: {
      title: string;
      variantTitle?: string;
      sku?: string;
      thumbnail?: string;
      formattedUnitPrice: string;
    };
  }>;
  shippingLabels?: Array<{
    id: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    labelUrl?: string;
  }>;
}

interface FulfillmentHistoryProps {
  fulfillments: FulfillmentHistoryFulfillment[];
  order: FulfillmentHistoryOrder;
  onDelete: (id: string) => void;
}
import { cn } from '@/lib/utils';

export function FulfillmentHistory({
  fulfillments,
  order,
  onDelete,
}: FulfillmentHistoryProps) {
  const [expandedFulfillments, setExpandedFulfillments] = useState<string[]>(
    []
  );

  // Calculate total line items and their statuses
  const lineItemStats = fulfillments.reduce(
    (acc: any, fulfillment: any) => {
      if (!fulfillment.canceledAt && fulfillment.items) {
        fulfillment.items.forEach((item: any) => {
          acc.fulfilled += item.quantity;
        });
      }
      return acc;
    },
    { fulfilled: 0 }
  );

  // Calculate totals from unfulfilled items
  const totalUnfulfilled = (order.unfulfilled || []).reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0
  );
  const total = totalUnfulfilled + lineItemStats.fulfilled;
  const fulfilledPercentage = (lineItemStats.fulfilled / total) * 100;
  const openPercentage = 100 - fulfilledPercentage;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Filter fulfillments based on search and sort by status and date
  const filteredFulfillments = fulfillments
    .sort((a: any, b: any) => {
      // First sort by canceled status
      if (a.canceledAt && !b.canceledAt) return 1;
      if (!a.canceledAt && b.canceledAt) return -1;
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const toggleFulfillment = (id: string) => {
    setExpandedFulfillments((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const renderFulfillmentItems = (items: Array<{
    id: string;
    quantity: number;
    lineItem: {
      title: string;
      variantTitle?: string;
      sku?: string;
      thumbnail?: string;
      formattedUnitPrice: string;
    };
  }>) => {
    return items.map((item) => (
      <div key={item.id} className="flex items-start gap-3 px-3 py-2.5">
        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
          <ProductImage
            src={item.lineItem.thumbnail}
            alt={item.lineItem.title}
            width={40}
            height={40}
            className="size-10"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground">{item.lineItem.title}</h4>
          {item.lineItem.variantTitle && (
            <p className="font-mono text-xs tabular-nums text-foreground/80">{item.lineItem.variantTitle}</p>
          )}
          {item.lineItem.sku && (
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">SKU {item.lineItem.sku}</p>
          )}
        </div>
        <div className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-sm text-foreground">{item.quantity}</span> x {item.lineItem.formattedUnitPrice}
        </div>
      </div>
    ));
  };

  const textAction =
    'inline-flex min-h-8 cursor-pointer items-center text-sm font-medium text-muted-foreground hover:text-foreground max-sm:min-h-10';

  return (
    <section>
      <SectionTitle meta={filteredFulfillments.length}>Fulfilments</SectionTitle>
      <ListBand>
        <div className="px-4 py-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border">
            <div className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400" style={{ width: `${fulfilledPercentage}%` }} />
          </div>
          <dl className="mt-3 flex items-baseline justify-between gap-4 text-sm">
            <div className="flex items-baseline gap-2">
              <Dot tone="ok" />
              <dt className="text-muted-foreground">Fulfilled</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {lineItemStats.fulfilled}{' '}
                <span className="text-muted-foreground">{fulfilledPercentage.toFixed(1)}%</span>
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <Dot tone="warn" />
              <dt className="text-muted-foreground">Open</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {totalUnfulfilled}{' '}
                <span className="text-muted-foreground">{openPercentage.toFixed(1)}%</span>
              </dd>
            </div>
          </dl>
        </div>

        {filteredFulfillments.map((fulfillment) => {
          const count =
            fulfillment.items?.reduce(
              (sum: number, item: { quantity: number }) => sum + item.quantity,
              0
            ) || 0;
          const expanded = expandedFulfillments.includes(fulfillment.id);
          const label = fulfillment.shippingLabels?.[0];
          return (
            <div
              key={fulfillment.id}
              className={cn(
                'px-4 py-3 transition-opacity duration-200',
                fulfillment.canceledAt && !expanded && 'opacity-60 hover:opacity-100'
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link
                      href={`/dashboard/fulfillments/${fulfillment.id}`}
                      className="min-w-0 truncate font-mono text-sm tabular-nums text-foreground hover:underline underline-offset-4"
                    >
                      {fulfillment.id}
                    </Link>
                    <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                      <Dot tone={fulfillment.canceledAt ? 'danger' : 'ok'} />
                      {fulfillment.canceledAt ? 'Cancelled' : 'Fulfilled'}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDate(fulfillment.createdAt.toString())}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button
                    type="button"
                    onClick={() => toggleFulfillment(fulfillment.id)}
                    aria-expanded={expanded}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-background px-3 text-xs font-medium text-foreground shadow-xs ring-1 ring-border max-sm:min-h-10"
                  >
                    <span className="font-mono tabular-nums">{count}</span>
                    {count === 1 ? 'item' : 'items'}
                    {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </button>
                  {!fulfillment.canceledAt && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className={textAction}>
                          Cancel
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-3" side="left">
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <p className="text-[13px] font-medium">
                              Cancel fulfillment?
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This action cannot be undone.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 rounded-full text-xs"
                              onClick={() => onDelete(fulfillment.id)}
                            >
                              Cancel fulfillment
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {label && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className={textAction}>
                          Label
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-3" side="left">
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <p className="text-[13px] font-medium">
                              {fulfillment.canceledAt ? 'Cancelled shipping label' : 'Shipping label'}
                            </p>
                            {label.carrier && (
                              <p className="text-xs text-muted-foreground">
                                Carrier <span className="font-medium text-foreground">{label.carrier.toUpperCase()}</span>
                              </p>
                            )}
                            {label.trackingNumber && (
                              <p className="break-all text-xs text-muted-foreground">
                                Tracking <span className="font-mono tabular-nums text-foreground">{label.trackingNumber}</span>
                              </p>
                            )}
                          </div>
                          {fulfillment.canceledAt ? (
                            <div className="text-xs text-muted-foreground">Label cancelled</div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {label.trackingUrl && (
                                <Link
                                  href={label.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
                                >
                                  Track package <ArrowUpRight className="size-3" />
                                </Link>
                              )}
                              {label.labelUrl && (
                                <Link
                                  href={label.labelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
                                >
                                  Download label <ArrowUpRight className="size-3" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              {expanded && (
                <ListBand className="mt-3 bg-background">
                  {renderFulfillmentItems(fulfillment.items || [])}
                </ListBand>
              )}
            </div>
          );
        })}
      </ListBand>
    </section>
  );

}