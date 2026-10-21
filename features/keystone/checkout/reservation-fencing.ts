export type CartReservationFence = {
  id: string;
  idempotencyKey: string;
  inventoryUnitId: string | null;
  listingId: string | null;
  cartId: string | null;
  purpose: string | null;
  status: string | null;
  expiresAt: Date | null;
};

export function checkoutCartIdFromKey(idempotencyKey: string): string {
  const prefix = "checkout:";
  if (typeof idempotencyKey !== "string" || !idempotencyKey.startsWith(prefix)) {
    throw new Error("Checkout reservation key is invalid");
  }
  const cartId = idempotencyKey.slice(prefix.length);
  if (!cartId || cartId.includes(":")) throw new Error("Checkout reservation key is invalid");
  return cartId;
}

export function requireExactlyOne<T>(rows: T[], description: string): T {
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`Expected exactly one ${description}`);
  }
  return rows[0];
}

export function assertCartReservationFence(
  reservation: CartReservationFence,
  expected: { cartId: string; unitId: string; listingId: string; idempotencyKey: string; now: Date; allowExpired?: boolean },
): void {
  const legacyKey = `${expected.idempotencyKey}:${expected.unitId}`;
  const retryKeyPrefix = `${legacyKey}:`;
  const keyMatchesCheckout = reservation?.idempotencyKey === legacyKey ||
    (typeof reservation?.idempotencyKey === "string" &&
      reservation.idempotencyKey.startsWith(retryKeyPrefix) &&
      reservation.idempotencyKey.length > retryKeyPrefix.length);
  if (
    !reservation?.id ||
    !reservation.idempotencyKey ||
    !keyMatchesCheckout ||
    reservation.status !== "active" ||
    reservation.purpose !== "cart" ||
    reservation.cartId !== expected.cartId ||
    reservation.inventoryUnitId !== expected.unitId ||
    reservation.listingId !== expected.listingId ||
    !(reservation.expiresAt instanceof Date) ||
    (!expected.allowExpired && reservation.expiresAt.getTime() <= expected.now.getTime())
  ) {
    throw new Error("Checkout reservation is not an active, unexpired hold for this cart, listing, and unit");
  }
}

export function assertCheckoutCommitAttemptFence(
  attempt: { id?: string; idempotencyKey?: string; requestPath?: string; requestParams?: unknown; recoveryPoint?: string } | null,
  expected: { attemptId: string; idempotencyKey: string; cartId: string },
): void {
  const params = attempt?.requestParams;
  if (
    !attempt ||
    attempt.id !== expected.attemptId ||
    attempt.idempotencyKey !== expected.idempotencyKey ||
    attempt.requestPath !== "completeActiveCart" ||
    !params || typeof params !== "object" || Array.isArray(params) ||
    (params as Record<string, unknown>).cartId !== expected.cartId ||
    !["resources_reserved", "payment_confirmed"].includes(attempt.recoveryPoint || "")
  ) {
    throw new Error("Checkout attempt does not own this order commit");
  }
}

export function assertInventoryUnitFence(
  unit: { id?: string; commerceVariantId?: string | null; status?: string | null; quantity?: number | null; version?: number | null } | null,
  expected: { unitId: string; variantId: string; status: "available" | "reserved" },
): asserts unit is { id: string; commerceVariantId: string; status: "available" | "reserved"; quantity: number; version: number } {
  if (
    !unit ||
    unit.id !== expected.unitId ||
    unit.commerceVariantId !== expected.variantId ||
    unit.status !== expected.status ||
    unit.quantity !== 1 ||
    !Number.isInteger(unit.version) ||
    (unit.version as number) < 0
  ) {
    throw new Error("Serialized inventory unit no longer matches the checkout hold");
  }
}

export function assertCheckoutAttemptFence(
  attempt: { id?: string; idempotencyKey?: string; requestPath?: string; requestParams?: unknown; recoveryPoint?: string } | null,
  expected: { attemptId: string; idempotencyKey: string; cartId: string },
): asserts attempt is { id: string; idempotencyKey: string; requestPath: string; recoveryPoint: string } {
  const params = attempt?.requestParams;
  if (
    !attempt ||
    attempt.id !== expected.attemptId ||
    attempt.idempotencyKey !== expected.idempotencyKey ||
    attempt.requestPath !== "completeActiveCart" ||
    !params || typeof params !== "object" || Array.isArray(params) ||
    (params as Record<string, unknown>).cartId !== expected.cartId ||
    !["stock_reserved", "resources_reserved"].includes(attempt.recoveryPoint || "")
  ) {
    throw new Error("Checkout attempt no longer owns releasable resources");
  }
}
