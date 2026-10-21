export const DEFAULT_CUSTOMER_ACCOUNT_LIMIT = 10;
export const MAX_CUSTOMER_ACCOUNT_LIMIT = 50;
export const MAX_CUSTOMER_ACCOUNT_OFFSET = 100_000;
export const MAX_CUSTOMER_ACCOUNT_LINE_ITEMS = 100;

export function getCustomerAccountPagination(limit?: unknown, offset?: unknown) {
  const normalizedLimit = limit === undefined || limit === null ? DEFAULT_CUSTOMER_ACCOUNT_LIMIT : limit;
  const normalizedOffset = offset === undefined || offset === null ? 0 : offset;

  if (
    !Number.isSafeInteger(normalizedLimit) ||
    (normalizedLimit as number) < 1 ||
    (normalizedLimit as number) > MAX_CUSTOMER_ACCOUNT_LIMIT
  ) {
    throw new Error(`Customer account limit must be a safe integer from 1 to ${MAX_CUSTOMER_ACCOUNT_LIMIT}`);
  }
  if (
    !Number.isSafeInteger(normalizedOffset) ||
    (normalizedOffset as number) < 0 ||
    (normalizedOffset as number) > MAX_CUSTOMER_ACCOUNT_OFFSET
  ) {
    throw new Error(`Customer account offset must be a safe integer from 0 to ${MAX_CUSTOMER_ACCOUNT_OFFSET}`);
  }

  return { limit: normalizedLimit as number, offset: normalizedOffset as number };
}
