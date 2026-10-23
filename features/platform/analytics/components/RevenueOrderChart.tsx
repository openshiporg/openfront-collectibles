"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Pill, Track } from "@/features/platform/components/vault-ui";
import { ChartPanel } from "./MetricBand";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { formatCurrency, formatNumber } from "../lib/analyticsHelpers";

interface RevenueOrderChartProps {
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    orders: number;
    displayRevenue: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  currencySymbol?: string;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// Custom Tooltip Component
interface CustomTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricView: string;
  currencySymbol?: string;
}

function CustomTooltipContent({
  active,
  payload,
  label,
  metricView,
  currencySymbol = '$',
}: CustomTooltipContentProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const entry = payload[0];
  const value = entry.value as number;

  return (
    <div className="bg-popover text-popover-foreground grid min-w-32 items-start gap-1.5 rounded-lg border px-3 py-1.5 text-xs">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="size-2 rounded-xs" 
              style={{ backgroundColor: metricView === 'revenue' ? "var(--chart-1)" : "var(--chart-3)" }} 
            />
            <span className="text-muted-foreground">
              {metricView === 'revenue' ? 'Revenue' : 'Orders'}
            </span>
          </div>
          <span className="text-foreground font-mono font-medium tabular-nums">
            {metricView === 'revenue' ? `${currencySymbol}${value.toFixed(2)}` : formatNumber(value)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function RevenueOrderChart({
  timeSeriesData,
  totalRevenue,
  totalOrders,
  currencySymbol = '$',
}: RevenueOrderChartProps) {
  const id = useId();
  const [metricView, setMetricView] = useState("revenue");

  const firstDate = timeSeriesData[0]?.date as string;
  const lastDate = timeSeriesData[timeSeriesData.length - 1]?.date as string;

  return (
    <ChartPanel
      title="Sales"
      value={metricView === "revenue" ? `${currencySymbol}${(totalRevenue / 100).toFixed(2)}` : formatNumber(totalOrders)}
      control={
        <Track label="Sales metric">
          <Pill active={metricView === "revenue"} onClick={() => setMetricView("revenue")}>Revenue</Pill>
          <Pill active={metricView === "orders"} onClick={() => setMetricView("orders")}>Orders</Pill>
        </Track>
      }
    >
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={timeSeriesData}
            margin={{ left: -12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={`${id}-fillRevenue`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="55%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={`${id}-fillOrders`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                <stop offset="55%" stopColor="var(--chart-3)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 2"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={12}
              stroke="var(--border)"
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (metricView === 'revenue') {
                  if (value === 0) return `${currencySymbol}0`;
                  
                  // displayRevenue is already in dollars (converted from cents in ImprovedAnalyticsDashboard)
                  if (value < 1000) {
                    return `${currencySymbol}${value.toFixed(0)}`;
                  }
                  
                  // If $1000 or more, show as K
                  return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <ChartTooltip
              content={
                <CustomTooltipContent metricView={metricView} currencySymbol={currencySymbol} />
              }
            />
            <Area
              strokeWidth={2}
              dataKey={metricView === 'revenue' ? "displayRevenue" : "orders"}
              type="stepBefore"
              fill={metricView === 'revenue' ? `url(#${id}-fillRevenue)` : `url(#${id}-fillOrders)`}
              fillOpacity={0.1}
              stroke={metricView === 'revenue' ? "var(--chart-1)" : "var(--chart-3)"}
            />
          </AreaChart>
        </ChartContainer>
    </ChartPanel>
  );
}