"use client";

import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Package,
} from "lucide-react";
import { StoreOrder } from "@/features/storefront/types/storefront";
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot";
import OrderSection from "../section";

type FulfillmentCardProps = { order: StoreOrder };

const FulfillmentCard: React.FC<FulfillmentCardProps> = ({ order }) => {
  const [expandedFulfillments, setExpandedFulfillments] = useState<string[]>(
    []
  );

  if (!order.fulfillments || order.fulfillments.length === 0) {
    return (
      <OrderSection title="Shipments">
        <p className="flex items-baseline gap-2 text-[14px] text-cx-ink-2">
          <StatusDot tone="accent" />
          Not shipped yet
        </p>
      </OrderSection>
    );
  }

  const fulfillments = order.fulfillments;

  // Calculate fulfillment statistics
  const lineItemStats = fulfillments.reduce(
    (acc: any, fulfillment: any) => {
      if (!fulfillment.canceledAt && fulfillment.fulfillmentItems) {
        fulfillment.fulfillmentItems.forEach((item: any) => {
          acc.fulfilled += item.quantity;
        });
      }
      return acc;
    },
    { fulfilled: 0 }
  );

  const totalUnfulfilled = (order.unfulfilled || []).reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0
  );
  const total = totalUnfulfilled + lineItemStats.fulfilled;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleFulfillment = (id: string) => {
    setExpandedFulfillments((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  // Sort fulfillments by date (newest first)
  const sortedFulfillments = [...fulfillments].sort((a, b) => {
    if (a.canceledAt && !b.canceledAt) return 1;
    if (!a.canceledAt && b.canceledAt) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <OrderSection
      title="Shipments"
      meta={
        total > 0 ? (
          <span className="cx-num text-[12px] text-cx-ink-3">
            {lineItemStats.fulfilled}/{total} shipped
          </span>
        ) : undefined
      }
    >
      <ul className="cx-band divide-y divide-cx-line overflow-hidden">
        {sortedFulfillments.map((fulfillment, index) => {
          const itemCount =
            fulfillment.fulfillmentItems?.reduce(
              (sum, item) => sum + item.quantity,
              0
            ) || 0;
          const label = fulfillment.shippingLabels?.[0];
          const hasTracking = label?.trackingNumber;
          const expanded = expandedFulfillments.includes(fulfillment.id);
          const tone = fulfillment.canceledAt ? "danger" : hasTracking ? "ok" : "accent";
          const state = fulfillment.canceledAt ? "Cancelled" : hasTracking ? "Shipped" : "Packed";

          return (
            <li key={fulfillment.id} className={fulfillment.canceledAt ? "opacity-60" : undefined}>
              <button
                type="button"
                aria-expanded={expanded}
                className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-cx-surface/60"
                onClick={() => toggleFulfillment(fulfillment.id)}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-medium text-cx-ink">Shipment {index + 1}</span>
                    <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
                      <StatusDot tone={tone} />
                      {state}
                    </span>
                  </span>
                  <span className="cx-num mt-0.5 block text-[12px] text-cx-ink-3">
                    {itemCount} {itemCount === 1 ? "item" : "items"} · {formatDate(fulfillment.createdAt)}
                  </span>
                </span>
                {expanded ? (
                  <ChevronUp className="size-5 shrink-0 text-cx-ink-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-5 shrink-0 text-cx-ink-3" aria-hidden="true" />
                )}
              </button>

              {expanded && fulfillment.fulfillmentItems && (
                <div className="space-y-3 border-t border-cx-line bg-cx-surface px-4 py-3">
                  {label && (label.carrier || label.trackingNumber) && (
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
                      {label.carrier && <span className="cx-num uppercase text-cx-ink-2">{label.carrier}</span>}
                      {label.trackingNumber && (
                        label.trackingUrl ? (
                          <a
                            href={label.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cx-num inline-flex min-h-11 items-center gap-1 text-cx-ink underline-offset-4 hover:underline"
                          >
                            {label.trackingNumber}
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="cx-num text-cx-ink">{label.trackingNumber}</span>
                        )
                      )}
                    </div>
                  )}
                  <ul className="space-y-3">
                    {fulfillment.fulfillmentItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-[8px] bg-cx-well">
                          {item.lineItem.thumbnail ? (
                            <img
                              src={item.lineItem.thumbnail}
                              alt={item.lineItem.title}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <Package className="size-5 text-cx-ink-3" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-cx-serif text-[15px] text-cx-ink">{item.lineItem.title}</p>
                          <p className="cx-num text-[12px] text-cx-ink-3">
                            Qty {item.quantity}
                            {item.lineItem.sku ? ` · SKU ${item.lineItem.sku}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </OrderSection>
  );
};

export default FulfillmentCard;
