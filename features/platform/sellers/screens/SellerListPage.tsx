import { notFound } from 'next/navigation';
import { getListByPath } from '../../../dashboard/actions/getListByPath';
import { getAdminMetaAction } from '../../../dashboard/actions';
import { listQueryFromParams, type RawSearchParams } from '../../disputes/lib/list-params';
import { getSellerCounts, getSellers } from '../actions';
import { SellerListPageClient } from './SellerListPageClient';

export async function SellerListPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = await getListByPath('seller-profiles');
  if (!list) notFound();
  const meta = await getAdminMetaAction(list.key);
  const fullList = meta.success ? meta.data.list : list;
  const query = listQueryFromParams(fullList, await searchParams);
  const [response, counts] = await Promise.all([
    getSellers(query.where, query.pageSize, query.skip, query.orderBy),
    getSellerCounts(),
  ]);
  return (
    <SellerListPageClient
      list={fullList}
      items={response.success ? response.data.items : []}
      count={response.success ? response.data.count : 0}
      error={response.success ? null : 'Sellers unavailable'}
      counts={counts}
      page={query.page}
      pageSize={query.pageSize}
      filtered={!!query.search || Object.keys(query.where).length > 0}
    />
  );
}
