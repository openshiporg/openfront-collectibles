import type { Context } from '.keystone/types';
import { permissions } from '../access';

type CollectibleItemInput = {
  code: string;
  title: string;
  category: string;
  categoryName?: string;
  catalogNumber?: string;
  maker?: string;
  year?: number;
  condition: string;
  priceMinor?: number;
  variantSku?: string;
  publish?: boolean;
};

const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

function parseItem(input: unknown): CollectibleItemInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Item details are required');
  const item = input as Record<string, unknown>;
  if (!text(item.code, 128) || !/^[A-Za-z0-9_-]+$/.test(String(item.code).trim())) throw new Error('Item code is invalid');
  if (!text(item.title, 300)) throw new Error('Item title is required');
  if (!text(item.category, 120) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(item.category))) throw new Error('Category handle is invalid');
  if (!text(item.condition, 300)) throw new Error('Condition is required');
  if (item.priceMinor !== undefined && (!Number.isSafeInteger(item.priceMinor) || Number(item.priceMinor) < 0)) throw new Error('Price must be a non-negative whole amount in minor units');
  if (item.year !== undefined && item.year !== null && (!Number.isSafeInteger(item.year) || Number(item.year) < 0 || Number(item.year) > 9999)) throw new Error('Year is invalid');
  return {
    code: String(item.code).trim(),
    title: String(item.title).trim(),
    category: String(item.category),
    categoryName: text(item.categoryName, 120) ? String(item.categoryName).trim() : undefined,
    catalogNumber: typeof item.catalogNumber === 'string' ? item.catalogNumber.slice(0, 120) : '',
    maker: typeof item.maker === 'string' ? item.maker.slice(0, 200) : '',
    year: typeof item.year === 'number' ? item.year : undefined,
    condition: String(item.condition).trim(),
    priceMinor: typeof item.priceMinor === 'number' ? item.priceMinor : undefined,
    variantSku: text(item.variantSku, 128) ? String(item.variantSku).trim() : undefined,
    publish: item.publish !== false,
  };
}

/**
 * Receives one individual collectible into inventory: catalog entry, item,
 * reported condition, inventory unit and receipt movement, and (optionally) a
 * published fixed-price listing tied to the item's product variant.
 * Used by onboarding and by merchants receiving new stock.
 */
export default async function receiveCollectibleItem(
  _root: unknown,
  { input }: { input: unknown },
  context: Context,
) {
  const item = parseItem(input);
  const session = context.session;
  if (
    !session?.itemId ||
    !permissions.canManageCatalog({ session }) ||
    !permissions.canManageInventory({ session }) ||
    (item.publish && !permissions.canManageListings({ session }))
  ) {
    throw new Error('Not authorized');
  }
  const actorId = session.itemId as string;
  const variantSku = item.variantSku || item.code;

  return context.prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`collectible-intake:${item.code}`}))::text AS locked`;
    const stores = await tx.store.findMany({ take: 2, select: { id: true, defaultCurrencyCode: true } });
    if (stores.length !== 1) throw new Error('Set up the store before receiving items');
    const store = stores[0];
    const currencyCode = store.defaultCurrencyCode.toUpperCase();

    const existing = await tx.specimen.findUnique({ where: { specimenCode: item.code }, include: { inventoryUnits: true } });
    if (existing) {
      if (existing.inventoryUnits.length !== 1) throw new Error(`Item ${item.code} already exists and needs review`);
      return { code: item.code, title: item.title, created: false };
    }

    const variants = await tx.productVariant.findMany({
      where: { sku: variantSku },
      take: 2,
      include: { product: true, collectibleInventoryUnit: true, prices: { include: { currency: true } } },
    });
    if (variants.length !== 1) throw new Error(`Create the product variant with SKU ${variantSku} first`);
    const variant = variants[0];
    if (variant.collectibleInventoryUnit) throw new Error(`Product variant ${variantSku} already has an item`);
    if (item.publish && variant.product?.status !== 'published') throw new Error(`Publish the product for ${variantSku} before listing it`);

    const variantPrice = variant.prices.find(price => price.currency?.code?.toUpperCase() === currencyCode && !price.priceListId);
    const priceMinor = item.priceMinor ?? variantPrice?.amount;
    if (item.publish && priceMinor === undefined) throw new Error(`Add a ${currencyCode} price to ${variantSku} before listing it`);
    if (variantPrice && priceMinor !== undefined && priceMinor !== variantPrice.amount) {
      throw new Error(`Listing price must match the ${currencyCode} price of ${variantSku}`);
    }

    const location = await tx.inventoryLocation.upsert({
      where: { code: 'MAIN' },
      create: { storeId: store.id, code: 'MAIN', name: 'Main storage', type: 'shop', publicLabel: 'Store', status: 'active' },
      update: {},
    });
    const category = await tx.collectibleCategory.upsert({
      where: { handle: item.category },
      create: { storeId: store.id, handle: item.category, name: item.categoryName || item.category, status: 'active' },
      update: {},
    });
    const handle = variant.product?.handle || item.code.toLowerCase();
    const catalog = await tx.catalogItem.create({
      data: { storeId: store.id, title: item.title, handle, catalogNumber: item.catalogNumber, maker: item.maker, year: item.year, status: 'active', categoryId: category.id },
    });
    const specimen = await tx.specimen.create({
      data: { storeId: store.id, catalogItemId: catalog.id, specimenCode: item.code, displayName: item.title, lifecycleStatus: 'available' },
    });
    await tx.conditionObservation.create({
      data: { specimenId: specimen.id, observerId: actorId, sourceType: 'operator', label: item.condition, status: 'reported', publiclyVisible: true },
    });
    const unit = await tx.inventoryUnit.create({
      data: { storeId: store.id, specimenId: specimen.id, commerceVariantId: variant.id, sku: item.code, ownershipBasis: 'owned', status: 'available', quantity: 1, version: 1, locationId: location.id, currencyCode },
    });
    await tx.inventoryMovement.create({
      data: { inventoryUnitId: unit.id, type: 'receive', toStatus: 'available', toLocationId: location.id, reason: 'Received into inventory', actorId, idempotencyKey: `intake:${item.code}`, evidence: { source: 'intake', code: item.code } },
    });
    if (item.publish) {
      await tx.listing.create({
        data: {
          storeId: store.id,
          inventoryUnitId: unit.id,
          title: item.title,
          slug: handle,
          format: 'fixed_price',
          status: 'published',
          priceMinor,
          currencyCode,
          offersEnabled: false,
          publicSummary: item.condition,
          publishedAt: new Date(),
          publicationSnapshot: { code: item.code, condition: item.condition, askingPriceMinor: priceMinor },
        },
      });
    }
    return { code: item.code, title: item.title, created: true };
  }, { isolationLevel: 'Serializable', timeout: 20_000 });
}
