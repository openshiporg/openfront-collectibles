import { getInventory } from '../actions';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const list = {
  key: 'ProductVariant',
  path: 'inventory',
  singular: 'Product variant',
  plural: 'Product variants',
  fields: {
    sku: { label: 'SKU', type: 'text', isOrderable: true },
    inventoryQuantity: { label: 'On hand', type: 'integer', isOrderable: true },
    createdAt: { label: 'Created', type: 'timestamp', isOrderable: true },
    updatedAt: { label: 'Updated', type: 'timestamp', isOrderable: true },
  },
  pageSize: 10,
  hideCreate: true,
  initialSort: { field: 'updatedAt', direction: 'desc' },
};

export default async function InventoryListPage({ searchParams }: PageProps) {
  const { InventoryListPageClient } = await import('./InventoryListPageClient');
  const resolved = await searchParams;
  const params = Object.fromEntries(Object.entries(resolved).map(([key, value]) => [
    key,
    Array.isArray(value) ? value[0] : value,
  ]));
  const requestedPage = Number.parseInt(params.page || '1', 10);
  const requestedPageSize = Number.parseInt(params.pageSize || String(list.pageSize), 10);
  const currentPage = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 1000) : 1;
  const pageSize = Number.isSafeInteger(requestedPageSize) ? Math.min(Math.max(requestedPageSize, 1), 50) : list.pageSize;
  const search = typeof params.search === 'string' ? params.search.trim().slice(0, 80) : '';
  const sortInput = typeof params.sortBy === 'string' ? params.sortBy : '';
  const sortBy = sortInput.startsWith('-') ? sortInput.slice(1) : sortInput;
  const sortDirection = sortInput.startsWith('-') ? 'desc' : 'asc';
  const safeSort = Object.prototype.hasOwnProperty.call(list.fields, sortBy) ? sortBy : 'updatedAt';

  const dataResult = await getInventory({ search, page: currentPage, pageSize, sortBy: safeSort, sortDirection });
  const initialData = dataResult.success ? dataResult.data : { items: [], count: 0 };

  return (
    <InventoryListPageClient
      list={list}
      initialData={initialData}
      initialError={dataResult.success ? null : dataResult.error || 'Unable to load inventory.'}
      initialSearchParams={{ page: currentPage, pageSize, search }}
    />
  );
}
