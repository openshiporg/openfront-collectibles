import { formatCurrency, formatPercentage, formatNumber } from '../lib/analyticsHelpers';
import { MetricBand } from './MetricBand';

interface CustomerInsightsProps {
  customerMetrics?: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    averageCustomerLifetimeValue: number;
    repeatCustomerRate?: number;
    churnRate?: number;
  };
}

export function CustomerInsights({ customerMetrics }: CustomerInsightsProps) {
  return (
    <MetricBand
      title="Customers"
      rows={customerMetrics ? [
        { label: "Total customers", value: formatNumber(customerMetrics.totalCustomers) },
        { label: "New customers", value: formatNumber(customerMetrics.newCustomers) },
        { label: "Retention rate", value: formatPercentage(customerMetrics.retentionRate) },
        { label: "Avg. lifetime value", value: formatCurrency(customerMetrics.averageCustomerLifetimeValue) },
      ] : undefined}
    />
  );
}
