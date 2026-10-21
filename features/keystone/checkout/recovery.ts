import { randomUUID } from "node:crypto";
import { getOrCreateIdempotencyAttempt } from "../utils/idempotency";
import {
  assertCartReservationFence,
  type CartReservationFence,
  assertCheckoutAttemptFence,
  assertInventoryUnitFence,
  checkoutCartIdFromKey,
  requireExactlyOne,
} from "./reservation-fencing";

type CartInventoryLine = {
  quantity: number;
  productVariant: {
    id: string;
    title?: string;
    inventoryQuantity: number;
    manageInventory: boolean;
    allowBackorder: boolean;
    collectibleInventoryUnit?: { id: string; sku?: string; status?: string; version?: number } | null;
  };
};

export function checkoutKey(cartId: string): string {
  return `checkout:${cartId}`;
}

export async function getOrCreateCheckoutAttempt(
  prisma: any,
  cartId: string,
  paymentSessionId?: string
): Promise<any> {
  const idempotencyKey = checkoutKey(cartId);
  const { attempt, replay } = await getOrCreateIdempotencyAttempt(prisma, {
    key: idempotencyKey,
    requestPath: "completeActiveCart",
    requestParams: { cartId, paymentSessionId: paymentSessionId || null },
  });
  if (attempt.recoveryPoint === "completed") return attempt;
  if (!replay) return attempt;

  const acquired = await prisma.idempotencyKey.updateMany({
    where: {
      id: attempt.id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
      ],
    },
    data: { lockedAt: new Date() },
  });
  if (acquired.count !== 1) throw new Error("Checkout is already in progress");
  return prisma.idempotencyKey.findUnique({ where: { id: attempt.id } });
}

export async function updateCheckoutAttempt(
  prisma: any,
  id: string,
  recoveryPoint: string,
  responseBody?: Record<string, unknown>,
  responseCode?: number
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { id },
    data: {
      recoveryPoint,
      responseBody,
      responseCode,
      lockedAt: ["completed", "failed", "started"].includes(recoveryPoint) ? null : new Date(),
    },
  });
}

function aggregateLines(lines: CartInventoryLine[]) {
  const byVariant = new Map<string, { quantity: number; variant: CartInventoryLine["productVariant"] }>();
  for (const line of lines || []) {
    if (!line.productVariant?.id || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Cart contains an invalid inventory line");
    }
    const current = byVariant.get(line.productVariant.id);
    byVariant.set(line.productVariant.id, {
      variant: line.productVariant,
      quantity: (current?.quantity || 0) + line.quantity,
    });
  }
  return [...byVariant.values()];
}

export async function reserveCartInventory(
  prisma: any,
  lines: CartInventoryLine[],
  idempotencyKey: string,
  checkoutAttemptId?: string
): Promise<void> {
  const reservations = aggregateLines(lines);
  const cartId = checkoutCartIdFromKey(idempotencyKey);
  await prisma.$transaction(async (tx: any) => {
    for (const { variant, quantity } of reservations) {
      const collectibleUnit = variant.collectibleInventoryUnit;
      let existingCartHold = false;
      if (collectibleUnit) {
        if (quantity !== 1) throw new Error(`Serialized specimen ${collectibleUnit.sku || collectibleUnit.id} can only be purchased once`);
        const unitId = collectibleUnit.id;
        await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
        const current = await tx.inventoryUnit.findUnique({
          where: { id: unitId },
          select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true },
        });
        if (!current || current.commerceVariantId !== variant.id || current.quantity !== 1 || !Number.isInteger(current.version)) {
          throw new Error("Serialized inventory unit no longer matches this cart line");
        }
        const listings: Array<{ id: string; inventoryUnitId: string | null }> = await tx.listing.findMany({
          where: { inventoryUnitId: unitId, status: "published", format: "fixed_price" },
          take: 2,
          select: { id: true, inventoryUnitId: true },
        });
        const listing = requireExactlyOne(listings, "published fixed-price listing for the serialized unit");
        if (listing.inventoryUnitId !== unitId) throw new Error("Fixed-price listing does not own this inventory unit");

        const activeHolds: CartReservationFence[] = await tx.reservation.findMany({
          where: { inventoryUnitId: unitId, status: "active" },
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
        if (activeHolds.length > 0) {
          const hold = requireExactlyOne(activeHolds, "active reservation for the serialized unit");
          assertCartReservationFence(hold, { cartId, unitId, listingId: listing.id, idempotencyKey, now: new Date(), allowExpired: true });
          assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "reserved" });
          existingCartHold = true;
        } else {
          assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "available" });
          const claimed = await tx.inventoryUnit.updateMany({
            where: {
              id: unitId,
              commerceVariantId: variant.id,
              status: "available",
              quantity: 1,
              version: current.version,
            },
            data: { status: "reserved", version: { increment: 1 } },
          });
          if (claimed.count !== 1) throw new Error("Serialized inventory unit changed during reservation");
          await tx.reservation.create({
            data: {
              inventoryUnitId: unitId,
              listingId: listing.id,
              cartId,
              purpose: "cart",
              status: "active",
              idempotencyKey: `${idempotencyKey}:${unitId}:${randomUUID()}`,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
          });
        }
      }
      if (!variant.manageInventory || existingCartHold) continue;

      const result = await tx.productVariant.updateMany({
        where: {
          id: variant.id,
          ...(variant.allowBackorder
            ? {}
            : { inventoryQuantity: { gte: quantity } }),
        },
        data: { inventoryQuantity: { decrement: quantity } },
      });
      if (result.count !== 1) {
        throw new Error(`Insufficient stock for ${variant.title || variant.id}`);
      }

      await tx.stockMovement.create({
        data: {
          type: "REMOVE",
          quantity,
          reason: "checkout_reservation",
          note: idempotencyKey,
          variantId: variant.id,
        },
      });
    }
    if (checkoutAttemptId) {
      await tx.idempotencyKey.update({
        where: { id: checkoutAttemptId },
        data: { recoveryPoint: "stock_reserved", lockedAt: new Date() },
      });
    }
  });
}

export async function reserveDiscountUsage(
  prisma: any,
  discounts: Array<{ id: string; code?: string }>,
  checkoutAttemptId?: string
): Promise<void> {
  await prisma.$transaction(async (tx: any) => {
    for (const discount of discounts) {
      const current = await tx.discount.findUnique({
        where: { id: discount.id },
        select: {
          usageCount: true,
          usageLimit: true,
          isDisabled: true,
          startsAt: true,
          endsAt: true,
        },
      });
      if (!current) throw new Error("Discount not found");
      const now = new Date();
      if (
        current.isDisabled ||
        current.startsAt > now ||
        (current.endsAt && current.endsAt <= now)
      ) {
        throw new Error(`Discount ${discount.code || discount.id} is no longer active`);
      }
      if (current.usageLimit !== null && current.usageCount >= current.usageLimit) {
        throw new Error(`Discount ${discount.code || discount.id} has reached its usage limit`);
      }
      const result = await tx.discount.updateMany({
        where: {
          id: discount.id,
          usageCount: current.usageCount,
          isDisabled: false,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        data: { usageCount: { increment: 1 } },
      });
      if (result.count !== 1) throw new Error("Discount usage changed; retry checkout");
    }
    if (checkoutAttemptId) {
      await tx.idempotencyKey.update({
        where: { id: checkoutAttemptId },
        data: { recoveryPoint: "resources_reserved", lockedAt: new Date() },
      });
    }
  });
}

export async function releaseDiscountUsage(
  prisma: any,
  discounts: Array<{ id: string }>
): Promise<void> {
  if (!discounts?.length) return;
  await prisma.$transaction(
    discounts.map((discount) =>
      prisma.discount.updateMany({
        where: { id: discount.id, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } },
      })
    )
  );
}

async function releaseCartUnitHold(
  tx: any,
  variant: CartInventoryLine["productVariant"],
  cartId: string,
  now: Date,
  releaseReason: string,
): Promise<void> {
  const unitId = variant.collectibleInventoryUnit?.id;
  if (!unitId) return;
  await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
  const current = await tx.inventoryUnit.findUnique({
    where: { id: unitId },
    select: { id: true, commerceVariantId: true, status: true, quantity: true, version: true },
  });
  assertInventoryUnitFence(current, { unitId, variantId: variant.id, status: "reserved" });

  const activeHolds: CartReservationFence[] = await tx.reservation.findMany({
    where: { inventoryUnitId: unitId, status: "active" },
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
  const hold = requireExactlyOne(activeHolds, "active reservation for the serialized unit");
  if (!hold.listingId) throw new Error("Checkout reservation has no listing identity");
  const listing = await tx.listing.findUnique({
    where: { id: hold.listingId },
    select: { id: true, inventoryUnitId: true },
  });
  if (!listing || listing.inventoryUnitId !== unitId) {
    throw new Error("Checkout reservation listing does not own this inventory unit");
  }
  // The owning checkout may always release its own hold, expired or not.
  assertCartReservationFence(hold, { cartId, unitId, listingId: listing.id, idempotencyKey: checkoutKey(cartId), now, allowExpired: true });

  const released = await tx.reservation.updateMany({
    where: {
      id: hold.id,
      idempotencyKey: hold.idempotencyKey,
      inventoryUnitId: unitId,
      listingId: listing.id,
      cartId,
      purpose: "cart",
      status: "active",
    },
    data: { status: "released", releasedAt: now, releaseReason },
  });
  if (released.count !== 1) throw new Error("Checkout reservation changed before release");

  const unitReleased = await tx.inventoryUnit.updateMany({
    where: {
      id: unitId,
      commerceVariantId: variant.id,
      status: "reserved",
      quantity: 1,
      version: current.version,
    },
    data: { status: "available", version: { increment: 1 } },
  });
  if (unitReleased.count !== 1) throw new Error("Serialized inventory unit changed before release");
}

export async function releaseCheckoutResources(
  prisma: any,
  lines: CartInventoryLine[],
  discounts: Array<{ id: string }>,
  idempotencyKey: string,
  checkoutAttemptId: string,
  errorMessage: string
): Promise<void> {
  const reservations = aggregateLines(lines);
  const cartId = checkoutCartIdFromKey(idempotencyKey);
  const now = new Date();
  await prisma.$transaction(async (tx: any) => {
    const attempt = await tx.idempotencyKey.findUnique({
      where: { id: checkoutAttemptId },
      select: { id: true, idempotencyKey: true, requestPath: true, requestParams: true, recoveryPoint: true },
    });
    assertCheckoutAttemptFence(attempt, { attemptId: checkoutAttemptId, idempotencyKey, cartId });

    for (const { variant, quantity } of reservations) {
      if (variant.collectibleInventoryUnit) {
        await releaseCartUnitHold(tx, variant, cartId, now, errorMessage);
      }
      if (!variant.manageInventory) continue;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { inventoryQuantity: { increment: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          type: "RECEIVE",
          quantity,
          reason: "checkout_release",
          note: idempotencyKey,
          variantId: variant.id,
        },
      });
    }
    for (const discount of discounts || []) {
      const released = await tx.discount.updateMany({
        where: { id: discount.id, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } },
      });
      if (released.count !== 1) throw new Error("Discount reservation changed before release");
    }
    const attemptReleased = await tx.idempotencyKey.updateMany({
      where: {
        id: checkoutAttemptId,
        idempotencyKey,
        recoveryPoint: attempt.recoveryPoint,
      },
      data: {
        recoveryPoint: "started",
        responseBody: { error: errorMessage },
        responseCode: 409,
        lockedAt: null,
      },
    });
    if (attemptReleased.count !== 1) throw new Error("Checkout attempt changed before resource release");
  });
}

export async function releaseCartInventory(
  prisma: any,
  lines: CartInventoryLine[],
  idempotencyKey: string
): Promise<void> {
  const reservations = aggregateLines(lines);
  const cartId = checkoutCartIdFromKey(idempotencyKey);
  const now = new Date();
  await prisma.$transaction(async (tx: any) => {
    for (const { variant, quantity } of reservations) {
      if (variant.collectibleInventoryUnit) {
        await releaseCartUnitHold(tx, variant, cartId, now, "checkout_release");
      }
      if (!variant.manageInventory) continue;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { inventoryQuantity: { increment: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          type: "RECEIVE",
          quantity,
          reason: "checkout_release",
          note: idempotencyKey,
          variantId: variant.id,
        },
      });
    }
  });
}
