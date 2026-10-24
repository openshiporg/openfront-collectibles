'use client';

import { useRouter } from 'next/navigation';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Pagination } from '../../../dashboard/components/Pagination';
import { FilterList } from '../../../dashboard/components/FilterList';
import { PlatformFilterBar, platformCreateButtonClass } from '../../components/PlatformFilterBar';
import { PlatformEmptyState } from '../../components/PlatformEmptyState';
import { BandRow, ListBand, PageTitle, StatusFilter } from '../../components/vault-ui';
import { day } from '../../collectibles/lib/format';
import { DISPUTE_STATUSES, DISPUTE_TYPES, disputeStatus, disputeTypeLabel } from '../lib/lifecycle';
import { OpenDisputeSheet } from '../components/OpenDisputeSheet';

type Props = {
  list: any;
  items: any[];
  count: number;
  error: string | null;
  counts: { all: number; statuses: Record<string, number> };
  orders: { id: string; displayId: number; email?: string | null; total?: string | null }[];
  page: number;
  pageSize: number;
  filtered: boolean;
};

function age(createdAt?: string) {
  if (!createdAt) return '';
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  return days <= 0 ? 'Today' : `${days}d`;
}

export function DisputeListPageClient({ list, items, count, error, counts, orders, page, pageSize, filtered }: Props) {
  const router = useRouter();
  const open = (counts.statuses.open || 0) + (counts.statuses.evidence_requested || 0) + (counts.statuses.review || 0);

  return (
    <PageContainer
      title="Disputes"
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'Disputes' },
      ]}
      header={<PageTitle title="Disputes" tone={open ? 'warn' : 'muted'} state={open ? `${open} active` : 'None active'} />}
    >
      <div className="px-4 md:px-6">
        <PlatformFilterBar
          list={list}
          customCreateButton={
            <OpenDisputeSheet orders={orders} buttonClassName={platformCreateButtonClass} />
          }
        />
      </div>
      <StatusFilter
        allCount={counts.all}
        statuses={DISPUTE_STATUSES.map((s) => ({ ...s, count: counts.statuses[s.value] || 0 }))}
      />
      <StatusFilter
        className="pt-0"
        param="!type_matches"
        allLabel="All types"
        statuses={DISPUTE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
      />
      <div className="px-4 md:px-6">
        <FilterList list={list} />
      </div>
      <div className="space-y-4 px-4 pb-28 md:px-6 md:pb-10">
        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <PlatformEmptyState
            title={filtered ? 'No matching cases' : 'No disputes'}
            onReset={filtered ? () => router.push('/dashboard/platform/disputes') : undefined}
          />
        ) : (
          <ListBand>
            {items.map((item) => {
              const status = disputeStatus(item.status);
              return (
                <BandRow
                  key={item.id}
                  href={`/dashboard/platform/disputes/${item.id}`}
                  title={item.order ? `Order #${item.order.displayId} · ${disputeTypeLabel(item.type)}` : disputeTypeLabel(item.type)}
                  tone={status.tone}
                  state={status.label}
                  meta={[item.summary, item.assignedTo?.name ? `Assigned to ${item.assignedTo.name}` : 'Unassigned', `Opened ${day(item.createdAt)}`].filter(Boolean).join(' · ')}
                  trailing={`${age(item.createdAt)}${item.evidenceCount ? ` · ${item.evidenceCount} files` : ''}`}
                />
              );
            })}
          </ListBand>
        )}
        {count > pageSize && (
          <Pagination currentPage={page} total={count} pageSize={pageSize} list={{ singular: 'case', plural: 'cases' }} />
        )}
      </div>
    </PageContainer>
  );
}
