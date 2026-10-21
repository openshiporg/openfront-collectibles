'use server';

import { keystoneClient } from "../../../dashboard/lib/keystoneClient";

export async function getInventory(input: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
} = {}) {
  const page = Number.isSafeInteger(input.page) ? Math.min(Math.max(Number(input.page), 1), 1000) : 1;
  const take = Number.isSafeInteger(input.pageSize) ? Math.min(Math.max(Number(input.pageSize), 1), 50) : 10;
  const skip = (page - 1) * take;
  const search = typeof input.search === 'string' ? input.search.trim().slice(0, 80) : '';
  const sortable = new Set(['sku', 'inventoryQuantity', 'updatedAt', 'createdAt']);
  const sortBy = sortable.has(input.sortBy || '') ? input.sortBy! : 'updatedAt';
  const sortDirection = input.sortDirection === 'asc' ? 'asc' : 'desc';
  const where = search ? {
    OR: [
      { sku: { contains: search, mode: 'insensitive' } },
      { product: { title: { contains: search, mode: 'insensitive' } } },
    ],
  } : {};

  const query = `
    query GetProductVariantInventory($where: ProductVariantWhereInput, $take: Int!, $skip: Int!, $orderBy: [ProductVariantOrderByInput!]) {
      items: productVariants(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        id
        sku
        inventoryQuantity
        manageInventory
        allowBackorder
        createdAt
        updatedAt
        location { id name }
        product { id title thumbnail }
      }
      count: productVariantsCount(where: $where)
    }
  `;
  const response = await keystoneClient(query, {
    where,
    take,
    skip,
    orderBy: [{ [sortBy]: sortDirection }],
  });

  if (response.success) {
    return {
      success: true,
      data: { items: response.data.items || [], count: response.data.count || 0 },
    };
  }
  return {
    success: false,
    error: response.error,
    data: { items: [], count: 0 },
  };
}
