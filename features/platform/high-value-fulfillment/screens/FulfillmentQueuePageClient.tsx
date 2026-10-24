'use client';

import Link from 'next/link';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Pagination } from '../../../dashboard/components/Pagination';
import { PlatformEmptyState } from '../../components/PlatformEmptyState';
import { BandRow, Count, ListBand, PageTitle, pillClass, trackClass } from '../../components/vault-ui';
import { day } from '../../collectibles/lib/format';
import { QUEUES, type QueueKey } from '../lib/constants';

type Props = {
  queue: QueueKey;
  page: number;
  pageSize: number;
  items: any[];
  count: number;
  counts: Record<QueueKey, number>;
  error: string | null;
};

export function FulfillmentQueuePageClient({ queue, page, pageSize, items, count, counts, error }: Props) {
  return (
    <PageContainer
      title="High-Value Fulfillment"
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'High-Value Fulfillment' },
      ]}
      header={
        <PageTitle
          title="High-Value Fulfillment"
          tone={counts.needs ? 'warn' : 'muted'}
          state={counts.needs ? `${counts.needs} need requirements` : 'All open orders have requirements'}
        />
      }
    >
      <div className="px-4 md:px-6">
        <nav aria-label="Fulfillment queue" className={trackClass}>
          {QUEUES.map((q) => (
            <Link key={q.value} href={`?queue=${q.value}`} data-active={queue === q.value} aria-current={queue === q.value ? 'page' : undefined} className={pillClass}>
              {q.label} <Count>{counts[q.value]}</Count>
            </Link>
          ))}
        </nav>
      </div>
      <div className="space-y-4 px-4 pb-28 md:px-6 md:pb-10">
        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <PlatformEmptyState title={queue === 'needs' ? 'No orders need requirements' : 'No orders'} />
        ) : (
          <ListBand>
            {items.map((order) => (
              <BandRow
                key={order.id}
                href={`/dashboard/platform/high-value-fulfillment/${order.id}`}
                title={`#${order.displayId}`}
                tone={order.hasRequirement ? 'ok' : 'warn'}
                state={order.hasRequirement ? 'Requirements set' : 'Needs requirements'}
                meta={[order.user?.name || order.email, `${order.lineItemsCount ?? 0} items`, order.fulfillmentsCount ? `${order.fulfillmentsCount} shipments` : 'Not shipped', day(order.createdAt)].filter(Boolean).join(' · ')}
                trailing={order.total}
              />
            ))}
          </ListBand>
        )}
        {count > pageSize && (
          <Pagination currentPage={page} total={count} pageSize={pageSize} list={{ singular: 'order', plural: 'orders' }} />
        )}
      </div>
    </PageContainer>
  );
}
