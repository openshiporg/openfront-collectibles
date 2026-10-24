'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { PlatformEmptyState } from '../../components/PlatformEmptyState'
import { Dot, ListBand, PageTitle, StatusFilter, humanize, pillClass, trackClass } from '../../components/vault-ui'
import { money } from '../../collectibles/lib/format'
import { LIFECYCLE, LISTING_TONES, UNIT_TONES, lifecycleTone } from '../lib/constants'

type Props = {
  list: any
  data: { items: any[]; count: number }
  error: string | null
  currentPage: number
  pageSize: number
  isFiltered: boolean
  statusCounts: Record<string, number>
}

function ItemRow({ item }: { item: any }) {
  const catalog = item.catalogItem
  const grade = item.gradeObservations?.[0]
  const unit = item.inventoryUnits?.[0]
  const listing = item.listing
  const line = [catalog?.category?.name, catalog?.maker, catalog?.year].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/dashboard/platform/items/${item.id}`}
      className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-background/60 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium text-foreground">{item.displayName}</span>
          <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
            <Dot tone={lifecycleTone(item.lifecycleStatus)} />
            {humanize(item.lifecycleStatus)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground/80">{item.specimenCode}</span>
          {line && <span className="truncate">{line}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-end sm:text-right">
        {grade && (
          <span className="font-mono tabular-nums text-foreground">
            {[grade.gradingCompany?.code, grade.reportedGrade].filter(Boolean).join(' ')}
          </span>
        )}
        {unit && (
          <span className="inline-flex items-baseline gap-1.5">
            <Dot tone={UNIT_TONES[unit.status] ?? 'muted'} />
            {humanize(unit.status)}
            {unit.location?.code && <span className="font-mono">{unit.location.code}</span>}
          </span>
        )}
        {listing ? (
          <span className="inline-flex items-baseline gap-1.5">
            <Dot tone={LISTING_TONES[listing.status] ?? 'muted'} />
            {humanize(listing.status)}
            {listing.priceMinor != null && <span className="font-mono tabular-nums text-foreground">{money(listing.priceMinor, listing.currencyCode)}</span>}
          </span>
        ) : (
          <span>Not listed</span>
        )}
      </div>
    </Link>
  )
}

export function ItemListPageClient({ list, data, error, currentPage, pageSize, isFiltered, statusCounts }: Props) {
  const router = useRouter()
  const header = (
    <PageTitle
      title="Items"
      meta={<span className="font-mono tabular-nums">{statusCounts.all ?? data.count} items</span>}
      actions={
        <div className={trackClass}>
          <Link href="/dashboard/platform/items/receive" data-active="true" className={pillClass}>
            Receive item
          </Link>
        </div>
      }
    />
  )

  return (
    <PageContainer
      title="Items"
      header={header}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'Items' },
      ]}
    >
      <div className="px-4 md:px-6">
        <PlatformFilterBar list={list} />
      </div>
      <StatusFilter
        param="!lifecycleStatus_matches"
        allCount={statusCounts.all}
        statuses={LIFECYCLE.map((status) => ({ ...status, count: statusCounts[status.value] ?? 0 }))}
      />
      <div className="px-4 md:px-6">
        <FilterList list={list} />
      </div>
      <div className="px-4 pb-28 md:px-6 md:pb-10">
        {error ? (
          <ListBand>
            <p className="flex items-baseline gap-2 px-4 py-3.5 text-sm text-muted-foreground" role="alert">
              <Dot tone="danger" />
              {error}
            </p>
          </ListBand>
        ) : data.count === 0 ? (
          isFiltered ? (
            <PlatformEmptyState title="No results" onReset={() => router.push(window.location.pathname)} />
          ) : (
            <PlatformEmptyState title="No items" />
          )
        ) : (
          <ListBand>
            {data.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ListBand>
        )}
        {data.count > pageSize && (
          <div className="py-4">
            <Pagination currentPage={currentPage} total={data.count} pageSize={pageSize} list={{ singular: 'item', plural: 'items' }} />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
