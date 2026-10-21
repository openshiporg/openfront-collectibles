export const DEFAULT_CUSTOMER_ORDER_LIMIT = 10;
// Both current storefront account-order consumers request the default 10; retain a 50-row ceiling.
export const MAX_CUSTOMER_ORDER_LIMIT = 50;
// Match the existing owner-scoped customer-account pagination ceiling.
export const MAX_CUSTOMER_ORDER_OFFSET = 100_000;
export const MAX_CUSTOMER_ORDER_LINE_ITEMS = 100;

export function requireCustomerOrderPagination(limit?: unknown, offset?: unknown) {
  const normalizedLimit = limit === undefined || limit === null ? DEFAULT_CUSTOMER_ORDER_LIMIT : limit;
  const normalizedOffset = offset === undefined || offset === null ? 0 : offset;

  if (!Number.isSafeInteger(normalizedLimit) || (normalizedLimit as number) < 1 || (normalizedLimit as number) > MAX_CUSTOMER_ORDER_LIMIT) {
    throw new Error(`Order limit must be a safe integer from 1 to ${MAX_CUSTOMER_ORDER_LIMIT}`);
  }
  if (!Number.isSafeInteger(normalizedOffset) || (normalizedOffset as number) < 0 || (normalizedOffset as number) > MAX_CUSTOMER_ORDER_OFFSET) {
    throw new Error(`Order offset must be a safe integer from 0 to ${MAX_CUSTOMER_ORDER_OFFSET}`);
  }

  return { limit: normalizedLimit as number, offset: normalizedOffset as number };
}
