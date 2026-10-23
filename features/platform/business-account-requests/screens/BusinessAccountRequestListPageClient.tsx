/**
 * BusinessAccountRequestListPageClient - Client Component  
 * Based on dashboard ListPageClient but hardcoded for business account requests
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlatformEmptyState } from '../../components/PlatformEmptyState'
import { Button } from '@/components/ui/button'
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { PlatformFilterBar, platformCreateButtonClass } from '../../components/PlatformFilterBar'
import { ListBand, PageTitle } from '../../components/vault-ui'
import { StatusTabs } from '../components/StatusTabs'
import { BusinessAccountRequestDetailsComponent } from '../components/BusinessAccountRequestDetailsComponent'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { CreateItemDrawerClientWrapper } from '@/features/platform/components/CreateItemDrawerClientWrapper'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useSort } from '../../../dashboard/hooks/useSort'
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'

interface BusinessAccountRequestListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number  
    search: string
  }
  statusCounts: {
    pending: number
    all: number
    approved: number
    not_approved: number
    requires_info: number
  } | null
}

function EmptyStateDefault() {
  return <PlatformEmptyState title="No account requests" />
}

function EmptyStateSearch({ onResetFilters }: { onResetFilters: () => void }) {
  return <PlatformEmptyState title="No results" onReset={onResetFilters} />
}

export function BusinessAccountRequestListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts
}: BusinessAccountRequestListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams() ?? new URLSearchParams()
  const { basePath } = useDashboard()
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list)
  const sort = useSort(list)

  // Extract current search params (reactive to URL changes)
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10)
  const searchString = currentSearchParams.search || ''

  // Build query variables from current search params
  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams)
    const filterWhere = buildWhereClause(list, currentSearchParams)
    const searchParameters = searchString ? { search: searchString } : {}
    const searchWhere = buildWhereClause(list, searchParameters)

    // Combine search and filters
    const whereConditions = []
    if (Object.keys(searchWhere).length > 0) {
      whereConditions.push(searchWhere)
    }
    if (Object.keys(filterWhere).length > 0) {
      whereConditions.push(filterWhere)
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    return {
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    }
  }, [list, currentSearchParams, currentPage, pageSize, searchString])

  // For business account requests, use raw GraphQL string to include relationship fields (same as action)
  const querySelectedFields = `
    id
    businessName
    businessType
    monthlyOrderVolume
    requestedCreditLimit
    formattedRequestedCredit
    businessDescription
    status
    statusLabel
    submittedAt
    reviewNotes
    approvedCreditLimit
    formattedApprovedCredit
    user {
      id
      name
      email
    }
  `

  // Use React Query hook with server-side initial data
  // Use React Query hook with server-side initial data
  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      initialData: initialError ? undefined : initialData,
    }
  )

  // Use query data, fallback to initial data
  const data = queryData || initialData
  const error = queryError ? queryError.message : initialError

  // Handle page change - simplified since FilterBar handles search/filters
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    
    if (newPage && newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.push(newUrl)
  }, [router])

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    router.push(window.location.pathname)
  }, [router])

  if (!list) {
    return (
      <PageContainer title="List not found">
        <Alert variant="destructive">
          <AlertDescription>
            The requested list was not found.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Account Requests' }
  ]

  const header = <PageTitle title="Account Requests" />

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title="Account Requests" header={header} breadcrumbs={breadcrumbs}>
      {/* Filter Bar - includes search, filters, sorting, and create button */}
      <div className="px-4 md:px-6">
        <PlatformFilterBar 
          list={list}
          customCreateButton={
            <Button 
              onClick={() => setIsCreateDrawerOpen(true)}
              size="icon"
              className={platformCreateButtonClass}
            >
              <Plus />
              <span className="hidden lg:inline">Create {list.singular}</span>
            </Button>
          }
        />
      </div>

      {/* Status Tabs */}
      {statusCounts && (
        <StatusTabs statusCounts={statusCounts} />
      )}

      {/* Active Filters */}
      <div className="px-4 md:px-6">
        <FilterList list={list} />
      </div>

      {/* Users list */}
      {error ? (
        <div className="px-4 md:px-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load items: {error}
            </AlertDescription>
          </Alert>
        </div>
      ) : isEmpty ? (
        <div className="px-4 md:px-6">
          <EmptyStateDefault />
        </div>
      ) : data?.count === 0 ? (
        <div className="px-4 md:px-6">
          <EmptyStateSearch onResetFilters={handleResetFilters} />
        </div>
      ) : (
        <>
          {/* Data grid - full width */}
          <div className="px-4 md:px-6 pb-6">
            <ListBand>
              {data?.items?.map((user: any) => (
                <BusinessAccountRequestDetailsComponent key={user.id} businessAccountRequest={user} list={list} />
              ))}
            </ListBand>
          </div>
          
          {/* Pagination */}
          {data && data.count > pageSize && (
            <div className="px-4 md:px-6 py-4">
              <Pagination
                currentPage={currentPage}
                total={data.count}
                pageSize={pageSize}
                list={{ singular: 'account request', plural: 'account requests' }}
              />
            </div>
          )}
        </>
      )}

      {/* Create Item Drawer */}
      <CreateItemDrawerClientWrapper
        listKey="business-account-requests"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          router.refresh();
        }}
      />
    </PageContainer>
  )
}
