'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { ListBand, PageTitle, PillLink } from '@/features/platform/components/vault-ui';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { PlatformFilterBar } from '../../components/PlatformFilterBar';
import { InventoryDetailsComponent, type InventoryVariant } from '../components/InventoryDetailsComponent';
import { Pagination } from '../../../dashboard/components/Pagination';
import { FilterList } from '../../../dashboard/components/FilterList';
import { useDashboard } from '../../../dashboard/context/DashboardProvider';
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query';
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause';
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause';

interface InventoryListMeta {
  key: string;
  fields: Record<string, { label: string; type: string; isOrderable?: boolean }>;
  pageSize: number;
  initialSort: { field: string; direction: string };
  hideCreate: boolean;
}

interface InventoryListPageClientProps {
  list: InventoryListMeta;
  initialData: { items: InventoryVariant[]; count: number };
  initialError: string | null;
  initialSearchParams: { page: number; pageSize: number; search: string };
}

function EmptyInventory({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      title={onReset ? 'No matching variants' : 'No product variants'}
      icons={[Search]}
      action={onReset ? { label: 'Reset filters', onClick: onReset } : undefined}
    />
  );
}

export function InventoryListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
}: InventoryListPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const { basePath } = useDashboard();
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams?.forEach((value, key) => { params[key] = value; });
    return params;
  }, [searchParams]);
  const parsedPage = Number.parseInt(currentSearchParams.page || String(initialSearchParams.page), 10);
  const parsedSize = Number.parseInt(currentSearchParams.pageSize || String(initialSearchParams.pageSize), 10);
  const currentPage = Number.isSafeInteger(parsedPage) ? Math.min(Math.max(parsedPage, 1), 1000) : 1;
  const pageSize = Number.isSafeInteger(parsedSize) ? Math.min(Math.max(parsedSize, 1), 50) : 10;
  const searchString = (currentSearchParams.search || '').slice(0, 80);

  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams);
    const filterWhere = buildWhereClause(list, currentSearchParams);
    const searchWhere = searchString ? buildWhereClause(list, { search: searchString }) : {};
    const conditions = [searchWhere, filterWhere].filter(where => Object.keys(where).length > 0);
    return {
      where: conditions.length ? { AND: conditions } : {},
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy,
    };
  }, [list, currentSearchParams, currentPage, pageSize, searchString]);

  const selectedFields = `
    id sku inventoryQuantity manageInventory allowBackorder createdAt updatedAt
    location { id name }
    product { id title thumbnail }
  `;
  const { data: queryData, error: queryError } = useListItemsQuery(
    { listKey: list.key, variables, selectedFields },
    { initialData: initialError ? undefined : initialData },
  );
  const data = (queryData as { items: InventoryVariant[]; count: number } | undefined) || initialData;
  const error = queryError ? queryError.message : initialError;

  const handleResetFilters = useCallback(() => router.push(window.location.pathname), [router]);

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Inventory' },
  ];
  const header = (
    <PageTitle
      title="Inventory"
      meta={<span className="font-mono tabular-nums">{data.count} variants</span>}
      actions={<PillLink href="/dashboard/platform/collectible-inventory">Serialized items</PillLink>}
    />
  );
  const isFiltered = Boolean(searchString || Object.keys(currentSearchParams).some(key => key !== 'page' && key !== 'pageSize' && key !== 'sortBy'));

  return (
    <PageContainer title="Inventory" header={header} breadcrumbs={breadcrumbs}>
      <div className="px-4 md:px-6"><PlatformFilterBar list={list} /></div>
      <div className="px-4 md:px-6"><FilterList list={list} /></div>
      {error ? (
        <div className="px-4 md:px-6">
          <Alert variant="destructive"><AlertDescription>Failed to load inventory: {error}</AlertDescription></Alert>
        </div>
      ) : data.count === 0 ? (
        <div className="px-4 md:px-6"><EmptyInventory onReset={isFiltered ? handleResetFilters : undefined} /></div>
      ) : (
        <>
          <div className="px-4 pt-4 md:px-6">
            <ListBand>
              {data.items.map(item => <InventoryDetailsComponent key={item.id} inventory={item} />)}
            </ListBand>
          </div>
          {data.count > pageSize && (
            <div className="px-4 py-4 md:px-6">
              <Pagination currentPage={currentPage} total={data.count} pageSize={pageSize} list={{ singular: 'variant', plural: 'variants' }} />
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
