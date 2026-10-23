import Link from 'next/link';
import type { AnalyticsReport } from '@/features/keystone/mutations/getAnalytics';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { PageContainer } from '@/features/dashboard/components/PageContainer';
import { formatMinorToMajor } from '@/features/lib/minor-units';
import { BandRow, Dot, ListBand, PageTitle, SectionTitle, humanize, pillClass, trackClass, type DotTone } from '@/features/platform/components/vault-ui';
import { MetricBand } from '../components/MetricBand';

interface PageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }
const periods = [['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']] as const;

const ORDER_TONES: Record<string, DotTone> = {
  pending: 'info', requires_action: 'warn', completed: 'ok', archived: 'muted', canceled: 'danger',
};

const breadcrumbs = [
  { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
  { type: 'page' as const, label: 'Platform' },
  { type: 'page' as const, label: 'Analytics' },
];

export async function AnalyticsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = typeof params.period === 'string' ? params.period : '30d';
  const period = periods.some(([value]) => value === requested) ? requested : '30d';
  const result = await keystoneClient<{ getAnalytics: AnalyticsReport }>('query Report($timeframe: String) { getAnalytics(timeframe: $timeframe) }', { timeframe: period });

  const periodTrack = (
    <nav aria-label="Reporting range" className={trackClass}>
      {periods.map(([value, label]) => (
        <Link
          key={value}
          href={`/dashboard/platform/analytics?period=${value}`}
          aria-current={period === value ? 'page' : undefined}
          data-active={period === value}
          className={pillClass}
        >
          {label}
        </Link>
      ))}
    </nav>
  );

  if (!result.success) {
    return (
      <PageContainer title="Analytics" breadcrumbs={breadcrumbs} header={<PageTitle title="Analytics" actions={periodTrack} />}>
        <div className="px-4 pb-8 md:px-6">
          <p role="alert" className="inline-flex items-baseline gap-2 text-sm text-foreground">
            <Dot tone="danger" />
            {result.error.includes('Access denied') ? 'Access denied' : 'Analytics unavailable'}
          </p>
        </div>
      </PageContainer>
    );
  }

  const report = result.data.getAnalytics;
  const amount = (value: number, currency: string) => `${value < 0 ? '-' : ''}${formatMinorToMajor(Math.abs(value), currency)}`;
  const exceptions = report.payments.exceptions.length;

  return (
    <PageContainer
      title="Analytics"
      breadcrumbs={breadcrumbs}
      header={
        <PageTitle
          title="Analytics"
          tone={exceptions ? 'warn' : undefined}
          state={exceptions ? `${exceptions} payments need review` : undefined}
          meta={<span className="font-mono tabular-nums">{report.range.start.slice(0, 10)} – {report.range.end.slice(0, 10)}</span>}
          actions={periodTrack}
        />
      }
    >
      <div className="min-w-0 space-y-8 px-4 pb-10 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <MetricBand
            title="Orders"
            rows={[
              { label: 'Placed', value: String(report.orders.total) },
              ...Object.entries(report.orders.byStatus).map(([status, count]) => ({ label: humanize(status), value: String(count) })),
            ]}
          />
          <MetricBand
            title="Customers"
            rows={[
              { label: 'With orders', value: String(report.customers.total) },
              { label: 'New in range', value: String(report.customers.new) },
              { label: 'Ordered in range', value: String(report.customers.active) },
            ]}
          />
          <MetricBand
            title="Catalog"
            rows={[
              { label: 'Products', value: String(report.inventory.total) },
              { label: 'Units on hand', value: String(report.inventory.totalStock) },
            ]}
          />
        </div>

        <section className="min-w-0">
          <SectionTitle meta={report.payments.byCurrency.length ? `${report.payments.byCurrency.length} currencies` : undefined}>Payments</SectionTitle>
          {report.payments.byCurrency.length ? (
            <ListBand>
              <div className="hidden grid-cols-[80px_repeat(4,minmax(0,1fr))] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
                <span>Currency</span><span className="text-right">Captured</span><span className="text-right">Refunded</span><span className="text-right">Net</span><span className="text-right">Records</span>
              </div>
              {report.payments.byCurrency.map(row => (
                <div key={row.currency} className="grid grid-cols-2 gap-x-3 gap-y-1 px-4 py-3 font-mono text-sm tabular-nums sm:grid-cols-[80px_repeat(4,minmax(0,1fr))]">
                  <span className="font-medium text-foreground">{row.currency}</span>
                  <span className="text-right sm:text-right"><span className="mr-2 font-sans text-xs text-muted-foreground sm:hidden">Captured</span>{amount(row.captured, row.currency)}</span>
                  <span className="sm:text-right"><span className="mr-2 font-sans text-xs text-muted-foreground sm:hidden">Refunded</span>{amount(row.refunded, row.currency)}</span>
                  <span className="text-right font-medium text-foreground"><span className="mr-2 font-sans text-xs font-normal text-muted-foreground sm:hidden">Net</span>{amount(row.netTender, row.currency)}</span>
                  <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-right sm:text-sm sm:text-foreground"><span className="mr-2 font-sans sm:hidden">Records</span>{row.count}</span>
                </div>
              ))}
            </ListBand>
          ) : (
            <p className="text-sm text-muted-foreground">No payment records</p>
          )}
        </section>

        {report.orders.total > 0 && (
          <section className="min-w-0">
            <SectionTitle meta={report.orders.total}>Orders by status</SectionTitle>
            <ListBand>
              {Object.entries(report.orders.byStatus).map(([status, count]) => (
                <BandRow
                  key={status}
                  href={`/dashboard/platform/orders?!status_matches=${encodeURIComponent(JSON.stringify([status]))}`}
                  title={<span className="inline-flex items-baseline gap-2"><Dot tone={ORDER_TONES[status] ?? 'muted'} />{humanize(status)}</span>}
                  trailing={count}
                />
              ))}
            </ListBand>
          </section>
        )}

        <section className="min-w-0">
          <SectionTitle meta={report.inventory.products.length}>Catalog stock</SectionTitle>
          {report.inventory.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products</p>
          ) : (
            <ListBand>
              {report.inventory.products.map(product => (
                <BandRow
                  key={product.id}
                  href={`/dashboard/platform/products/${product.id}`}
                  title={product.title}
                  tone={product.status === 'published' ? 'ok' : product.status === 'draft' ? 'muted' : 'warn'}
                  state={humanize(product.status)}
                  meta={`${product.variants} ${product.variants === 1 ? 'variant' : 'variants'}`}
                  trailing={product.quantity}
                />
              ))}
            </ListBand>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
