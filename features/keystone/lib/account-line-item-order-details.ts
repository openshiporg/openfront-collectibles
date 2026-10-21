type JsonRecord = Record<string, unknown>;

export const MAX_ACCOUNT_LINE_ITEM_ORDER_DETAIL_LINES = 100;

export function projectAccountLineItemOrderDetails(value: unknown): JsonRecord | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const order = value as JsonRecord;
  const rows = order.lineItems;
  const count = order.lineItemsCount;
  const lineItemsHasMore = Array.isArray(rows) && Number.isSafeInteger(count) && (count as number) >= rows.length
    ? (count as number) > rows.length
    : null;

  return { ...order, lineItemsHasMore };
}
