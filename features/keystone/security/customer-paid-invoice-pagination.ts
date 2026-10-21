export const DEFAULT_CUSTOMER_PAID_INVOICE_LIMIT = 10;
// The storefront requests 50 invoices; match the existing customer-account page ceiling.
export const MAX_CUSTOMER_PAID_INVOICE_LIMIT = 50;
// Match the owner-scoped customer-account pagination ceiling; this bounds large Prisma skips.
export const MAX_CUSTOMER_PAID_INVOICE_OFFSET = 100_000;

export function requireCustomerPaidInvoicePagination(limit?: unknown, offset?: unknown) {
  const normalizedLimit = limit === undefined || limit === null
    ? DEFAULT_CUSTOMER_PAID_INVOICE_LIMIT
    : limit;
  const normalizedOffset = offset === undefined || offset === null ? 0 : offset;

  if (!Number.isSafeInteger(normalizedLimit) || (normalizedLimit as number) < 1 || (normalizedLimit as number) > MAX_CUSTOMER_PAID_INVOICE_LIMIT) {
    throw new Error(`Invoice limit must be a safe integer from 1 to ${MAX_CUSTOMER_PAID_INVOICE_LIMIT}`);
  }
  if (!Number.isSafeInteger(normalizedOffset) || (normalizedOffset as number) < 0 || (normalizedOffset as number) > MAX_CUSTOMER_PAID_INVOICE_OFFSET) {
    throw new Error(`Invoice offset must be a safe integer from 0 to ${MAX_CUSTOMER_PAID_INVOICE_OFFSET}`);
  }

  return { limit: normalizedLimit as number, offset: normalizedOffset as number };
}
