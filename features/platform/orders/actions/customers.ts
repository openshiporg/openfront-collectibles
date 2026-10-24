'use server';

import { keystoneClient } from "../../../dashboard/lib/keystoneClient";

/**
 * Search customers for order creation
 */
export async function searchCustomers(
  search: string = '',
  take: number = 50
) {
  const query = search ? `
    query GetCustomers($where: UserWhereInput!, $take: Int!) {
      users(
        where: $where
        take: $take
        orderBy: { createdAt: desc }
      ) {
        id
        firstName
        lastName
        email
        phone
        addresses {
          id
          firstName
          lastName
          address1
          address2
          city
          province
          postalCode
          phone
          company
          country {
            iso2
            name
          }
        }
      }
    }
  ` : `
    query GetCustomers($take: Int!) {
      users(
        take: $take
        orderBy: { createdAt: desc }
      ) {
        id
        firstName
        lastName
        email
        phone
        addresses {
          id
          firstName
          lastName
          address1
          address2
          city
          province
          postalCode
          phone
          company
          country {
            iso2
            name
          }
        }
      }
    }
  `;

  // firstName/lastName are virtual on User and can't be filtered; match each word
  // of the input against the stored name or email.
  const words = search.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const where = {
    AND: words.map((word) => ({
      OR: [
        { name: { contains: word, mode: 'insensitive' } },
        { email: { contains: word, mode: 'insensitive' } },
      ],
    })),
  };
  const variables = search ? { where, take } : { take };
  const response = await keystoneClient(query, variables);
  
  return response;
}
/**
 * Get a single customer by ID
 */
export async function getCustomer(id: string) {
  const query = `
    query GetCustomer($id: ID!) {
      user(where: { id: $id }) {
        id
        firstName
        lastName
        email
        phone
        addresses {
          id
          firstName
          lastName
          address1
          address2
          city
          province
          postalCode
          phone
          company
          country {
            iso2
            name
          }
        }
      }
    }
  `;

  const response = await keystoneClient(query, { id });
  
  if (response.success) {
    return { success: true, data: response.data.user };
  }
  return response;
} 