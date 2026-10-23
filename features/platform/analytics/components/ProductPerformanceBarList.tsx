"use client";

import React, { useState } from "react";
import { Pill, Track } from "@/features/platform/components/vault-ui";
import { ChartPanel } from "./MetricBand";
import { BarList } from "./BarList";
import { formatCurrency, formatNumber } from "../lib/analyticsHelpers";

interface ProductData {
  name: string;
  revenue: number;
  quantity: number;
}

interface ProductPerformanceBarListProps {
  data: ProductData[];
  title?: string;
  description?: string;
  currencySymbol?: string;
}

export function ProductPerformanceBarList({
  data,
  title = "Top Products",
  description = "Best performing products by revenue and quantity sold",
  currencySymbol = '$',
}: ProductPerformanceBarListProps) {
  const [metricView, setMetricView] = useState("revenue");

  // Transform data based on selected metric
  const barListData = data.map((product) => ({
    name: product.name,
    value: metricView === "revenue" ? product.revenue : product.quantity,
  }));

  return (
    <ChartPanel
      title={title}
      control={
        <Track label="Product metric">
          <Pill active={metricView === "revenue"} onClick={() => setMetricView("revenue")}>Revenue</Pill>
          <Pill active={metricView === "quantity"} onClick={() => setMetricView("quantity")}>Quantity</Pill>
        </Track>
      }
    >
        <BarList
          data={barListData}
          valueFormatter={(value) => 
            metricView === "revenue" 
              ? `${currencySymbol}${value.toFixed(2)}` // Value is already in dollars
              : formatNumber(value)
          }
          showAnimation={true}
        />
    </ChartPanel>
  );
}