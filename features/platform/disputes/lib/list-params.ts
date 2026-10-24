import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause';
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause';

export type RawSearchParams = { [key: string]: string | string[] | undefined };

/**
 * Turns platform list URL params (search, `!field_matches` filters, sortBy, page)
 * into Keystone variables the same way the dashboard ListPage does.
 */
export function listQueryFromParams(list: any, raw: RawSearchParams, defaultPageSize = 25) {
  const params: Record<string, any> = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
  const page = Math.min(Math.max(parseInt(params.page || '1', 10) || 1, 1), 1000);
  const pageSize = Math.min(Math.max(parseInt(params.pageSize || String(defaultPageSize), 10) || defaultPageSize, 1), 100);
  const search = typeof params.search === 'string' ? params.search.trim().slice(0, 80) : '';
  const conditions: Record<string, unknown>[] = [];
  const searchWhere = search ? buildWhereClause(list, { search }) : {};
  const filterWhere = buildWhereClause(list, params);
  if (Object.keys(searchWhere).length) conditions.push(searchWhere);
  if (Object.keys(filterWhere).length) conditions.push(filterWhere);
  const orderBy = buildOrderByClause(list, params);
  return {
    page,
    pageSize,
    search,
    where: conditions.length ? { AND: conditions } : {},
    orderBy,
    skip: (page - 1) * pageSize,
  };
}
