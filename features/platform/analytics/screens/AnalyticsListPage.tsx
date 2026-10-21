import Link from 'next/link';
import type { AnalyticsReport } from '@/features/keystone/mutations/getAnalytics';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { PageContainer } from '@/features/dashboard/components/PageContainer';
import { formatMinorToMajor } from '@/features/lib/minor-units';

interface PageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }
const periods = [['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']] as const;
export async function AnalyticsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = typeof params.period === 'string' ? params.period : '30d';
  const period = periods.some(([value]) => value === requested) ? requested : '30d';
  const result = await keystoneClient<{ getAnalytics: AnalyticsReport }>('query Report($timeframe: String) { getAnalytics(timeframe: $timeframe) }', { timeframe: period });
  if (!result.success) return <PageContainer title="Analytics"><p role="alert">{result.error.includes('Access denied') ? 'Access denied' : 'Analytics unavailable'}</p></PageContainer>;
  const report = result.data.getAnalytics;
  const amount = (value: number, currency: string) => `${value < 0 ? '-' : ''}${formatMinorToMajor(Math.abs(value), currency)}`;
  return <PageContainer title="Analytics" header={<h1 className="text-2xl font-semibold">Analytics</h1>}>
    <div className="min-w-0 space-y-8 px-4 pb-8 md:px-6">
      <nav aria-label="Reporting range" className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {periods.map(([value, label]) => <Link key={value} href={`/dashboard/platform/analytics?period=${value}`} aria-current={period === value ? 'page' : undefined} className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-3 text-sm ${period === value ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>{label}</Link>)}
      </nav>
      <p className="text-sm text-muted-foreground">{report.range.start.slice(0, 10)} – {report.range.end.slice(0, 10)}</p>
      <section className="space-y-3"><h2 className="font-medium">Payments</h2>
        {report.payments.byCurrency.length ? <table className="w-full table-fixed text-left text-sm"><thead><tr>{['Currency', 'Captured', 'Refunded', 'Net', 'Records'].map(label => <th key={label} className="break-words p-2 font-medium">{label}</th>)}</tr></thead><tbody>{report.payments.byCurrency.map(row => <tr key={row.currency} className="border-t"><td className="p-2">{row.currency}</td><td className="break-all p-2 tabular-nums">{amount(row.captured, row.currency)}</td><td className="break-all p-2 tabular-nums">{amount(row.refunded, row.currency)}</td><td className="break-all p-2 tabular-nums">{amount(row.netTender, row.currency)}</td><td className="p-2">{row.count}</td></tr>)}</tbody></table> : <p className="text-sm text-muted-foreground">No payment records</p>}
        {report.payments.exceptions.length > 0 && <p role="status" className="text-sm text-destructive">Payments needing review · {report.payments.exceptions.length}</p>}
      </section>
      <section className="space-y-3"><h2 className="font-medium">Orders</h2>
        {report.orders.total ? <table className="w-full table-fixed text-left text-sm"><thead><tr><th className="p-2">Status</th><th className="p-2">Records</th></tr></thead><tbody>{Object.entries(report.orders.byStatus).map(([status, count]) => <tr key={status} className="border-t"><td className="p-2">{status.replaceAll('_', ' ')}</td><td className="p-2">{count}</td></tr>)}</tbody></table> : <p className="text-sm text-muted-foreground">No orders</p>}
      </section>
      <section className="space-y-3"><h2 className="font-medium">Catalog inventory</h2>
        <table className="w-full table-fixed text-left text-sm"><thead><tr>{['Product', 'Status', 'Variants', 'Quantity'].map(label => <th key={label} className="break-words p-2">{label}</th>)}</tr></thead><tbody>{report.inventory.products.length === 0 && <tr className="border-t"><td colSpan={4} className="p-2 text-muted-foreground">No products</td></tr>}{report.inventory.products.map(product => <tr key={product.id} className="border-t"><td className="break-words p-2"><Link className="inline-flex min-h-11 min-w-11 items-center underline" href={`/dashboard/platform/products/${product.id}`}>{product.title}</Link></td><td className="break-words p-2">{product.status}</td><td className="p-2">{product.variants}</td><td className="p-2">{product.quantity}</td></tr>)}</tbody></table>
      </section>
    </div>
  </PageContainer>;
}
