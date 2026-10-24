/**
 * ItemListPage - Server Component
 * Specimens (individual collectibles) with lifecycle status, grade, holding and listing.
 */

import { notFound } from 'next/navigation'
import { getListByPath } from '../../../dashboard/actions/getListByPath'
import { getAdminMetaAction } from '../../../dashboard/actions'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'
import { getItems, getItemStatusCounts } from '../actions'
import { ItemListPageClient } from './ItemListPageClient'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function ItemListPage({ searchParams }: PageProps) {
  const resolved = await searchParams
  const params = Object.fromEntries(
    Object.entries(resolved).map(([key, value]) => [key, Array.isArray(value) ? value : value?.toString()])
  )

  const list = await getListByPath('specimens')
  if (!list) notFound()

  const currentPage = Math.max(parseInt(params.page?.toString() || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(params.pageSize?.toString() || '25', 10) || 25, 1), 100)
  const search = params.search?.toString() || ''

  const orderBy = buildOrderByClause(list, params)
  const filterWhere = buildWhereClause(list, params)
  const searchWhere = search ? buildWhereClause(list, { search }) : {}
  const conditions = [searchWhere, filterWhere].filter((where) => Object.keys(where).length > 0)
  const where = conditions.length ? { AND: conditions } : {}

  const [response, statusCounts, meta] = await Promise.all([
    getItems(where, pageSize, (currentPage - 1) * pageSize, orderBy),
    getItemStatusCounts(),
    getAdminMetaAction(list.key),
  ])

  return (
    <ItemListPageClient
      list={{ ...(meta.success ? meta.data.list : list), hideCreate: true }}
      data={response.success ? response.data : { items: [], count: 0 }}
      error={response.success ? null : 'Items unavailable'}
      currentPage={currentPage}
      pageSize={pageSize}
      isFiltered={!!search || Object.keys(filterWhere).length > 0}
      statusCounts={statusCounts}
    />
  )
}

export default ItemListPage
