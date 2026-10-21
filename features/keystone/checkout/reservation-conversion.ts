import {
  assertCartReservationFence,
  assertInventoryUnitFence,
  checkoutCartIdFromKey,
  type CartReservationFence,
  requireExactlyOne,
} from "./reservation-fencing";

type ListingFence = {
  id: string;
  inventoryUnitId: string | null;
  status: string | null;
  format: string | null;
};

export async function convertCheckoutReservation(
  tx: any,
  expected: {
    cartId: string;
    idempotencyKey: string;
    unitId: string;
    variantId: string;
    listingId: string;
    now: Date;
  },
): Promise<void> {
  if (checkoutCartIdFromKey(expected.idempotencyKey) !== expected.cartId) {
    throw new Error("Checkout reservation key does not identify this cart");
  }
  await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${expected.unitId} FOR UPDATE`;

  const unit = await tx.inventoryUnit.findUnique({
    where: { id: expected.unitId },
    select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true },
  });
  assertInventoryUnitFence(unit, {
    unitId: expected.unitId,
    variantId: expected.variantId,
    status: "reserved",
  });

  const listing: ListingFence | null = await tx.listing.findUnique({
    where: { id: expected.listingId },
    select: { id: true, inventoryUnitId: true, status: true, format: true },
  });
  if (
    !listing ||
    listing.id !== expected.listingId ||
    listing.inventoryUnitId !== expected.unitId ||
    listing.status !== "published" ||
    listing.format !== "fixed_price"
  ) {
    throw new Error("Checkout listing no longer owns the reserved unit");
  }

  const activeHolds: CartReservationFence[] = await tx.reservation.findMany({
    where: { inventoryUnitId: expected.unitId, status: "active" },
    take: 2,
    select: {
      id: true,
      idempotencyKey: true,
      inventoryUnitId: true,
      listingId: true,
      cartId: true,
      purpose: true,
      status: true,
      expiresAt: true,
    },
  });
  const hold = requireExactlyOne(activeHolds, "active reservation for the order's serialized unit");
  assertCartReservationFence(hold, {
    cartId: expected.cartId,
    unitId: expected.unitId,
    listingId: expected.listingId,
    idempotencyKey: expected.idempotencyKey,
    now: expected.now,
    // Payment may already be captured; an active hold this checkout owns still converts after expiry.
    allowExpired: true,
  });

  const converted = await tx.reservation.updateMany({
    where: {
      id: hold.id,
      idempotencyKey: hold.idempotencyKey,
      inventoryUnitId: expected.unitId,
      listingId: expected.listingId,
      cartId: expected.cartId,
      purpose: "cart",
      status: "active",
    },
    data: {
      status: "converted",
      releasedAt: expected.now,
      releaseReason: "order_created",
    },
  });
  if (converted.count !== 1) throw new Error("Checkout reservation changed before order conversion");

  const unitSold = await tx.inventoryUnit.updateMany({
    where: {
      id: expected.unitId,
      commerceVariantId: expected.variantId,
      status: "reserved",
      quantity: 1,
      version: unit.version,
    },
    data: { status: "sold", quantity: 0, version: { increment: 1 } },
  });
  if (unitSold.count !== 1) throw new Error("Serialized inventory unit changed before order conversion");

  const listingSold = await tx.listing.updateMany({
    where: {
      id: expected.listingId,
      inventoryUnitId: expected.unitId,
      status: "published",
      format: "fixed_price",
    },
    data: { status: "sold" },
  });
  if (listingSold.count !== 1) throw new Error("Checkout listing changed before order conversion");
}
