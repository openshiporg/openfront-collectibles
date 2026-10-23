import { formatCurrency, formatPercentage, formatNumber } from '../lib/analyticsHelpers';
import { MetricBand } from './MetricBand';

interface CartAnalyticsProps {
  cartMetrics?: {
    totalCarts: number;
    abandonedCarts: number;
    abandonmentRate: number;
    averageCartValue: number;
    conversionRate?: number;
    completedOrders?: number;
  };
}

export function CartAnalytics({ cartMetrics }: CartAnalyticsProps) {
  return (
    <MetricBand
      title="Carts"
      rows={cartMetrics ? [
        { label: "Total carts", value: formatNumber(cartMetrics.totalCarts) },
        { label: "Abandoned carts", value: formatNumber(cartMetrics.abandonedCarts) },
        {
          label: "Conversion rate",
          value: formatPercentage(cartMetrics.conversionRate ?? (cartMetrics.totalCarts > 0 ? (cartMetrics.completedOrders || 0) / cartMetrics.totalCarts * 100 : 0)),
        },
        { label: "Avg. cart value", value: formatCurrency(cartMetrics.averageCartValue) },
      ] : undefined}
    />
  );
}
