"use server";
import type { ProductWhereInput } from ".keystone/types";
import { gql } from "graphql-request";
import { openfrontClient } from "./config";
import { getCartId, getAuthHeaders } from "./data/cookies";

// Simplified data functions for server-side prefetching

export async function fetchProducts(params: {
  categoryId?: string;
  collectionId?: string;
  limit?: number;
  offset?: number;
  search?: string;
} = {}) {
  const { categoryId, collectionId, limit = 12, offset = 0, search } = params;

  const PRODUCTS_QUERY = gql`
    query GetProducts($take: Int!, $skip: Int!, $where: ProductWhereInput) {
      products(take: $take, skip: $skip, where: $where, orderBy: { createdAt: desc }) {
        id
        title
        handle
        thumbnail
        productVariants {
          id
          title
          sku
          prices {
            id
            amount
            currency {
              code
            }
          }
        }
      }
      productsCount(where: $where)
    }
  `;

  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 10000) throw new Error('Invalid product page');
  if (search && search.length > 200) throw new Error('Search is too long');
  const whereClause: ProductWhereInput = {
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(categoryId ? { productCategories: { some: { id: { equals: categoryId } } } } : {}),
    ...(collectionId ? { productCollections: { some: { id: { equals: collectionId } } } } : {}),
  };

  try {
    const { products, productsCount } = await openfrontClient.request(
      PRODUCTS_QUERY,
      {
        take: limit,
        skip: offset,
        where: whereClause
      }
    );

    return {
      products: products || [],
      count: productsCount || 0
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], count: 0 };
  }
}


export async function fetchProductByHandle(handle: string) {
  if (!handle || handle.length > 200) throw new Error('Invalid product handle');
  const result = await openfrontClient.request<{ product: import('../types').StoreProduct | null }>(gql`
    query ProductDetail($handle: String!) {
      product(where: { handle: $handle }) {
        id title handle thumbnail
        productVariants(take: 100) { id title sku prices(take: 100) { amount currency { code } } }
      }
    }
  `, { handle });
  return result.product;
}

export async function fetchCart() {
  try {
    const cartId = await getCartId();
    if (!cartId) return null;

    const CART_QUERY = gql`
      query GetCart($cartId: ID!) {
        activeCart(cartId: $cartId)
      }
    `;

    const { activeCart } = await openfrontClient.request(
      CART_QUERY,
      { cartId },
      await getAuthHeaders()
    );

    return activeCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

export async function fetchUser() {
  try {
    const headers = await getAuthHeaders();
    const { authenticatedItem } = await openfrontClient.request(
      gql`
        query GetAuthenticatedItem {
          authenticatedItem {
            ... on User {
              id
              email
              firstName
              lastName
              phone
              billingAddress {
                id
                firstName
                lastName
                company
                address1
                address2
                city
                province
                postalCode
                country {
                  id
                  iso2
                  name
                }
                phone
              }
            }
          }
        }
      `,
      {},
      headers
    );
    return authenticatedItem;
  } catch (error) {
    return null;
  }
}

export async function fetchCollections() {
  const COLLECTIONS_QUERY = gql`
    query GetCollections {
      productCollections {
        id
        title
        handle
      }
    }
  `;

  try {
    const { productCollections } = await openfrontClient.request(COLLECTIONS_QUERY);
    return productCollections || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export async function fetchCategories() {
  const CATEGORIES_QUERY = gql`
    query GetCategories {
      productCategories {
        id
        title
        handle
        isActive
      }
    }
  `;

  try {
    const { productCategories } = await openfrontClient.request(CATEGORIES_QUERY);
    return productCategories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
