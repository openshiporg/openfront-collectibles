import { notFound } from 'next/navigation';

import { getListByPath } from '../../../dashboard/actions/getListByPath';
import { getAdminMetaAction } from '../../../dashboard/actions';
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause';
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Pagination } from '../../../dashboard/components/Pagination';
import { PlatformFilterBar } from '../../components/PlatformFilterBar';
import { PlatformEmptyState } from '../../components/PlatformEmptyState';
import { BandRow, ListBand, PageTitle, StatusFilter, humanize } from '../../components/vault-ui';
import { day, money } from '../../collectibles/lib/format';
import { getSubmissionStatusCounts, getSubmissions, getTradeInOptions } from '../actions';
import { CreateSubmissionButton } from '../components/TradeInActions';
import { SUBMISSION_STATUSES, SUBMISSION_TONES } from '../lib/transitions';

/** Sum of quotes per currency; only shown when every item is quoted in one currency. */
function quotedTotal(items: { quotedAmountMinor: number | null; currencyCode: string | null }[] = []) {
  const quoted = items.filter((i) => i.quotedAmountMinor != null && i.currencyCode);
  if (!quoted.length) return 'Not quoted';
  const currencies = new Set(quoted.map((i) => i.currencyCode));
  if (currencies.size !== 1) return 'Mixed currencies';
  const total = quoted.reduce((sum, i) => sum + (i.quotedAmountMinor as number), 0);
  return `${quoted.length < items.length ? 'Partial ' : ''}${money(total, quoted[0].currencyCode)}`;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function TradeInListPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const params = Object.fromEntries(
    Object.entries(resolved).map(([key, value]) => [key, Array.isArray(value) ? value : value?.toString()]),
  );

  const baseList = await getListByPath('trade-in-submissions');
  if (!baseList) notFound();
  const meta = await getAdminMetaAction(baseList.key);
  const list = meta.success ? meta.data.list : baseList;

  const currentPage = Math.max(1, parseInt(params.page?.toString() || '1', 10) || 1);
  const pageSize = Math.min(100, parseInt(params.pageSize?.toString() || '25', 10) || 25);
  const search = params.search?.toString() || '';
  const filterWhere = buildWhereClause(list, params);
  const searchWhere = search ? buildWhereClause(list, { search }) : {};
  const conditions = [searchWhere, filterWhere].filter((w) => Object.keys(w).length > 0);
  const where = conditions.length ? { AND: conditions } : {};
  const orderBy = buildOrderByClause(list, params);

  const [response, counts, options] = await Promise.all([
    getSubmissions(where, pageSize, (currentPage - 1) * pageSize, orderBy),
    getSubmissionStatusCounts(),
    getTradeInOptions(),
  ]);
  const data = response.success ? response.data : { items: [], count: 0 };
  const statusCounts = counts.success ? counts.data : { all: 0 };
  const customers = options.success ? options.data.customers : [];
  const filtered = conditions.length > 0;

  return (
    <PageContainer
      title="Trade-ins"
      header={<PageTitle title="Trade-ins" meta={`${statusCounts.all ?? 0} submissions`} />}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'Trade-ins' },
      ]}
    >
      <div className="px-4 md:px-6">
        <PlatformFilterBar list={list} customCreateButton={<CreateSubmissionButton customers={customers} />} />
      </div>
      <StatusFilter
        allCount={statusCounts.all}
        statuses={SUBMISSION_STATUSES.map((value) => ({ value, label: humanize(value), count: statusCounts[value] ?? 0, tone: SUBMISSION_TONES[value] }))}
      />
      <div className="px-4 pb-28 md:px-6 md:pb-10">
        {!response.success ? (
          <ListBand><p role="alert" className="px-4 py-3.5 text-sm text-destructive">{response.error}</p></ListBand>
        ) : data.items.length === 0 ? (
          <PlatformEmptyState title={filtered ? 'No matching trade-ins' : 'No trade-ins'} />
        ) : (
          <ListBand>
            {data.items.map((submission: any) => (
              <BandRow
                key={submission.id}
                href={`/dashboard/platform/trade-ins/${submission.id}`}
                title={<span className="font-mono">{submission.reference}</span>}
                tone={SUBMISSION_TONES[submission.status]}
                state={humanize(submission.status)}
                meta={[
                  submission.customer?.name || submission.customer?.email || 'No customer',
                  humanize(submission.disposition),
                  `${submission.itemsCount ?? 0} ${submission.itemsCount === 1 ? 'item' : 'items'}`,
                  `Opened ${day(submission.createdAt)}`,
                ].join(' · ')}
                trailing={quotedTotal(submission.items)}
              />
            ))}
          </ListBand>
        )}
        {data.count > pageSize && (
          <div className="py-4">
            <Pagination currentPage={currentPage} total={data.count} pageSize={pageSize} list={{ singular: 'trade-in', plural: 'trade-ins' }} />
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default TradeInListPage;

