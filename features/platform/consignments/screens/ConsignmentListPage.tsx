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
import { day } from '../../collectibles/lib/format';
import { getConsignmentOptions, getIntakeStatusCounts, getIntakes } from '../actions';
import { CreateIntakeButton } from '../components/ConsignmentActions';
import { INTAKE_STATUSES, INTAKE_TONES } from '../lib/transitions';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function ConsignmentListPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const params = Object.fromEntries(
    Object.entries(resolved).map(([key, value]) => [key, Array.isArray(value) ? value : value?.toString()]),
  );

  const baseList = await getListByPath('consignment-intakes');
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
    getIntakes(where, pageSize, (currentPage - 1) * pageSize, orderBy),
    getIntakeStatusCounts(),
    getConsignmentOptions(),
  ]);
  const data = response.success ? response.data : { items: [], count: 0 };
  const statusCounts = counts.success ? counts.data : { all: 0 };
  const consignors = options.success ? options.data.consignors : [];
  const filtered = conditions.length > 0;

  return (
    <PageContainer
      title="Consignments"
      header={<PageTitle title="Consignments" meta={`${statusCounts.all ?? 0} intakes`} />}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'Consignments' },
      ]}
    >
      <div className="px-4 md:px-6">
        <PlatformFilterBar list={list} customCreateButton={<CreateIntakeButton consignors={consignors} />} />
      </div>
      <StatusFilter
        allCount={statusCounts.all}
        statuses={INTAKE_STATUSES.map((value) => ({ value, label: humanize(value), count: statusCounts[value] ?? 0, tone: INTAKE_TONES[value] }))}
      />
      <div className="px-4 pb-28 md:px-6 md:pb-10">
        {!response.success ? (
          <ListBand><p role="alert" className="px-4 py-3.5 text-sm text-destructive">{response.error}</p></ListBand>
        ) : data.items.length === 0 ? (
          <PlatformEmptyState title={filtered ? 'No matching consignments' : 'No consignments'} />
        ) : (
          <ListBand>
            {data.items.map((intake: any) => (
              <BandRow
                key={intake.id}
                href={`/dashboard/platform/consignments/${intake.id}`}
                title={<span className="font-mono">{intake.reference}</span>}
                tone={INTAKE_TONES[intake.status]}
                state={humanize(intake.status)}
                meta={[
                  intake.consignor?.displayName || 'No consignor',
                  `${intake.itemsCount ?? 0} ${intake.itemsCount === 1 ? 'item' : 'items'}`,
                  intake.agreement ? `Agreement ${humanize(intake.agreement.status).toLowerCase()}` : 'No agreement',
                ].join(' · ')}
                trailing={intake.receivedAt ? `Received ${day(intake.receivedAt)}` : `Opened ${day(intake.createdAt)}`}
              />
            ))}
          </ListBand>
        )}
        {data.count > pageSize && (
          <div className="py-4">
            <Pagination currentPage={currentPage} total={data.count} pageSize={pageSize} list={{ singular: 'consignment', plural: 'consignments' }} />
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default ConsignmentListPage;

