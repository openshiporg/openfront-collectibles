/**
 * CreatePage for Dashboard 2
 * Server component following Dashboard 1's pattern
 */

import { notFound } from 'next/navigation'
import { CreatePageClient } from './CreatePageClient'
import { getListByPath } from '../../actions/getListByPath'

interface CreatePageParams {
  params: Promise<{
    listKey: string
  }>
}

export async function CreatePage({ params }: CreatePageParams) {
  const resolvedParams = await params
  const { listKey } = resolvedParams

  const list = await getListByPath(listKey)

  // A list hidden for this role (no query access) is a 404, same as the sidebar hiding it.
  if (!list || list.isHidden) {
    notFound()
  }

  return <CreatePageClient listKey={listKey} list={list} />
}

export default CreatePage