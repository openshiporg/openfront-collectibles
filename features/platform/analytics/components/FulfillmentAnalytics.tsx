import { formatNumber, formatPercentage } from '../lib/analyticsHelpers';
import { MetricBand } from './MetricBand';

interface FulfillmentAnalyticsProps {
  fulfillmentMetrics?: {
    totalFulfillments: number;
    shippedFulfillments: number;
    pendingFulfillments: number;
    canceledFulfillments: number;
    averageFulfillmentTime: number; // in hours
    onTimeDeliveryRate: number; // percentage
    returnsRate: number; // percentage
    activeShippingLabels: number;
  };
}

export function FulfillmentAnalytics({ fulfillmentMetrics }: FulfillmentAnalyticsProps) {
  return (
    <MetricBand
      title="Fulfilment"
      rows={fulfillmentMetrics ? [
        { label: "Orders fulfilled", value: formatNumber(fulfillmentMetrics.totalFulfillments) },
        { label: "Shipped", value: formatNumber(fulfillmentMetrics.shippedFulfillments) },
        { label: "Avg. fulfilment time", value: `${fulfillmentMetrics.averageFulfillmentTime.toFixed(1)}h` },
        { label: "On-time delivery", value: formatPercentage(fulfillmentMetrics.onTimeDeliveryRate) },
      ] : undefined}
    />
  );
}
