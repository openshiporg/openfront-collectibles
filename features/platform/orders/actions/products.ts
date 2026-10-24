'use server';

import { keystoneClient } from "../../../dashboard/lib/keystoneClient";

/**
 * Search products with variants for order creation
 */
export async function searchProductsWithVariants(
  search: string = '',
  take: number = 10
) {
  const query = search ? `
    query SearchProducts($search: String!, $take: Int!) {
      products(
        where: {
          OR: [
            { title: { contains: $search, mode: insensitive } }
            { productVariants: { some: { title: { contains: $search, mode: insensitive } } } }
            { productVariants: { some: { sku: { contains: $search, mode: insensitive } } } }
          ]
        }
        take: $take
        orderBy: { createdAt: desc }
      ) {
        id
        title
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
            calculatedPrice {
              calculatedAmount
              originalAmount
              currencyCode
            }
          }
        }
      }
    }
  ` : `
    query GetProducts($take: Int!) {
      products(
        take: $take
        orderBy: { createdAt: desc }
      ) {
        id
        title
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
            calculatedPrice {
              calculatedAmount
              originalAmount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const variables = search ? { search, take } : { take };
  const response = await keystoneClient(query, variables);

  if (response.success) {
    const variants = (response.data?.products || []).flatMap((product: any) => product.productVariants || []);
    const summaries = await getCollectibleSummaries(variants.map((variant: any) => variant.id));
    for (const variant of variants) variant.collectibleSummary = summaries.get(variant.id) || null;
  }

  return response;
}

// Grade and condition for serialized items, e.g. "PSA 9 · Near Mint". Best effort:
// staff who cannot read grading records still get the search results.
async function getCollectibleSummaries(variantIds: string[]): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();
  if (!variantIds.length) return summaries;
  const response = await keystoneClient(`
    query CollectibleSummaries($ids: [ID!]!) {
      inventoryUnits(where: { commerceVariant: { id: { in: $ids } } }, take: 200) {
        commerceVariant { id }
        specimen {
          gradeObservations(orderBy: { observedAt: desc }, take: 1) { reportedGrade gradingCompany { code } }
          conditionObservations(where: { status: { in: ["reported", "reviewed"] } }, orderBy: { observedAt: desc }, take: 1) { label }
        }
      }
    }
  `, { ids: variantIds });
  if (!response.success) return summaries;
  for (const unit of response.data?.inventoryUnits || []) {
    const variantId = unit.commerceVariant?.id;
    if (!variantId) continue;
    const grade = unit.specimen?.gradeObservations?.[0];
    const condition = unit.specimen?.conditionObservations?.[0]?.label;
    const parts = [
      grade?.reportedGrade ? [grade.gradingCompany?.code, grade.reportedGrade].filter(Boolean).join(' ') : null,
      condition || null,
    ].filter((part): part is string => !!part);
    if (parts.length) summaries.set(variantId, parts.join(' · '));
  }
  return summaries;
}
