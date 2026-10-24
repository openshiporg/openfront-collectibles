import { notFound } from 'next/navigation';
import { getListByPath } from '../../../dashboard/actions/getListByPath';
import { getAdminMetaAction } from '../../../dashboard/actions';
import { getDisputeCounts, getDisputeFormOptions, getDisputes } from '../actions';
import { listQueryFromParams, type RawSearchParams } from '../lib/list-params';
import { DisputeListPageClient } from './DisputeListPageClient';

export async function DisputeListPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = await getListByPath('dispute-cases');
  if (!list) notFound();
  const meta = await getAdminMetaAction(list.key);
  const fullList = meta.success ? meta.data.list : list;

  const query = listQueryFromParams(fullList, await searchParams);
  const [response, counts, options] = await Promise.all([
    getDisputes(query.where, query.pageSize, query.skip, query.orderBy),
    getDisputeCounts(),
    getDisputeFormOptions(),
  ]);

  return (
    <DisputeListPageClient
      list={fullList}
      items={response.success ? response.data.items : []}
      count={response.success ? response.data.count : 0}
      error={response.success ? null : 'Cases unavailable'}
      counts={counts}
      orders={options.orders}
      page={query.page}
      pageSize={query.pageSize}
      filtered={!!query.search || Object.keys(query.where).length > 0}
    />
  );
}
