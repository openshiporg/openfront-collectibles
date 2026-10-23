"use client";

import { StatusFilter } from "@/features/platform/components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    backordered: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "in_stock", label: "In stock", count: statusCounts.in_stock, tone: "ok" },
        { value: "low_stock", label: "Low stock", count: statusCounts.low_stock, tone: "warn" },
        { value: "out_of_stock", label: "Out of stock", count: statusCounts.out_of_stock, tone: "danger" },
        { value: "backordered", label: "Backordered", count: statusCounts.backordered, tone: "info" },
      ]}
    />
  );
}
