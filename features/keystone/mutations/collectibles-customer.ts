import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { isPublicListingAvailable } from '../lib/collectibles-domain';
import { requireHumanOwnerId } from '../security/customer-personalization-owner';

// Storefront commands for collectors. Customers can't read Listing, CatalogItem
// or Buylist directly, so these check ownership and publication, then use the
// sudo Prisma client and return only public projections.

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);

const LISTING_INCLUDE = {
  inventoryUnit: { include: { commerceVariant: { include: { product: true } } } },
  auction: true,
} as const;

function publicListing(listing: any, now: Date) {
  if (!listing) return null;
  const product = listing.inventoryUnit?.commerceVariant?.product;
  return {
    id: listing.id,
    title: listing.title,
    handle: product?.status === 'published' ? product.handle : null,
    priceMinor: listing.priceMinor ?? null,
    currencyCode: listing.currencyCode,
    format: listing.format,
    available: listing.status === 'published' && product?.status === 'published' && isPublicListingAvailable(listing, now),
  };
}

function isPubliclyListed(listing: any, now: Date) {
  return !!listing && listing.status === 'published' &&
    listing.inventoryUnit?.commerceVariant?.product?.status === 'published' &&
    isPublicListingAvailable(listing, now);
}

/** Adds or removes the caller's wishlist entry for a published listing. */
export async function toggleWishlistListing(_root: unknown, { listingId }: { listingId: string }, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const listingKey = id.parse(listingId);
  const prisma = context.sudo().prisma;
  return prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`wishlist:${userId}:${listingKey}`}))::text AS locked`;
    const existing = await tx.wishlistItem.findMany({ where: { userId, listingId: listingKey }, select: { id: true } });
    if (existing.length) {
      await tx.wishlistItem.deleteMany({ where: { id: { in: existing.map((row: any) => row.id) } } });
      return { listingId: listingKey, saved: false };
    }
    const listing = await tx.listing.findUnique({ where: { id: listingKey }, include: LISTING_INCLUDE });
    if (!isPubliclyListed(listing, new Date())) throw new Error('Listing is not available');
    const catalogItemId = (await tx.inventoryUnit.findUnique({
      where: { id: listing.inventoryUnitId },
      select: { specimen: { select: { catalogItemId: true } } },
    }))?.specimen?.catalogItemId ?? null;
    await tx.wishlistItem.create({ data: { userId, listingId: listingKey, catalogItemId, notes: '' } });
    return { listingId: listingKey, saved: true };
  }, { isolationLevel: 'Serializable', timeout: 10_000 });
}

/** The caller's wishlist as public listing projections, newest first. */
export async function activeWishlist(_root: unknown, _args: unknown, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const rows = await context.sudo().prisma.wishlistItem.findMany({
    where: { userId, listingId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { listing: { include: LISTING_INCLUDE } },
  });
  const now = new Date();
  return rows
    .map((row: any) => ({ id: row.id, savedAt: row.createdAt.toISOString(), listing: publicListing(row.listing, now) }))
    .filter((row: any) => row.listing);
}

/** Active buylists with their active entries: what the shop is buying. */
export async function publicBuylist(_root: unknown, _args: unknown, context: any) {
  const buylists = await context.sudo().prisma.buylist.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    take: 20,
    include: {
      entries: {
        where: { active: 'active' },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { catalogItem: { include: { category: true } } },
      },
    },
  });
  return buylists.map((buylist: any) => ({
    id: buylist.id,
    name: buylist.name,
    currencyCode: buylist.currencyCode,
    entries: buylist.entries
      .filter((entry: any) => entry.catalogItem && entry.catalogItem.status !== 'archived')
      .map((entry: any) => ({
        id: entry.id,
        title: entry.catalogItem.title,
        catalogNumber: entry.catalogItem.catalogNumber || null,
        maker: entry.catalogItem.maker || null,
        year: entry.catalogItem.year ?? null,
        category: entry.catalogItem.category?.name ?? null,
        offerAmountMinor: entry.offerAmountMinor,
        maximumQuantity: entry.maximumQuantity ?? null,
      })),
  }));
}

export const tradeInInput = z.object({
  key: z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/),
  disposition: z.enum(['cash', 'store_credit', 'trade']),
  items: z.array(z.object({
    buylistEntryId: id.optional(),
    description: z.string().trim().min(1).max(2000),
    condition: z.string().trim().min(1).max(300),
  }).strict()).min(1).max(20),
}).strict();

function tradeInReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `TI-${day}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/** A signed-in customer submits items for trade-in; the shop quotes after inspection. */
export async function submitTradeIn(_root: unknown, { input }: { input: unknown }, context: any) {
  const customerId = requireHumanOwnerId(context.session);
  const command = tradeInInput.parse(input);
  const receiptKey = `trade-in:${customerId}:${command.key}`;
  const hash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
  return context.sudo().prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${receiptKey}))::text AS locked`;
    const previous = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: receiptKey } });
    if (previous) {
      const params = previous.requestParams as any;
      if (params?.hash !== hash || previous.recoveryPoint !== 'completed') throw new Error('Trade-in was already submitted with different details');
      return previous.responseBody;
    }
    const stores = await tx.store.findMany({ take: 2, select: { id: true, defaultCurrencyCode: true } });
    if (stores.length !== 1) throw new Error('Trade-ins are unavailable');
    const store = stores[0];

    const entryIds = [...new Set(command.items.map((item) => item.buylistEntryId).filter(Boolean))] as string[];
    const entries = entryIds.length
      ? await tx.buylistEntry.findMany({ where: { id: { in: entryIds }, active: 'active', buylist: { status: 'active' } }, include: { buylist: true } })
      : [];
    if (entries.length !== entryIds.length) throw new Error('A selected buylist item is no longer being bought');
    const byId = new Map(entries.map((entry: any) => [entry.id, entry]));
    for (const entry of entries as any[]) {
      const count = command.items.filter((item) => item.buylistEntryId === entry.id).length;
      if (entry.maximumQuantity != null && count > entry.maximumQuantity) throw new Error('A buylist item exceeds the quantity the shop is buying');
    }

    const submission = await tx.tradeInSubmission.create({
      data: { storeId: store.id, customerId, reference: tradeInReference(), status: 'submitted', disposition: command.disposition },
    });
    for (const item of command.items) {
      const entry: any = item.buylistEntryId ? byId.get(item.buylistEntryId) : null;
      await tx.tradeInItem.create({
        data: {
          submissionId: submission.id,
          catalogItemId: entry?.catalogItemId ?? null,
          customerDescription: item.description,
          customerCondition: item.condition,
          currencyCode: (entry?.buylist?.currencyCode || store.defaultCurrencyCode || '').toUpperCase(),
          decisionEvidence: entry ? { buylistEntryId: entry.id, listedOfferMinor: entry.offerAmountMinor } : {},
        },
      });
    }
    const result = { id: submission.id, reference: submission.reference, status: submission.status, itemCount: command.items.length };
    await tx.idempotencyKey.create({
      data: { idempotencyKey: receiptKey, requestMethod: 'CUSTOMER', requestPath: 'collectibles/trade-in', requestParams: { hash, customerId }, responseCode: 200, responseBody: result, recoveryPoint: 'completed' },
    });
    return result;
  }, { isolationLevel: 'Serializable', timeout: 15_000 });
}

/** The caller's trade-ins with item lines and the shop's quotes. */
export async function activeTradeIns(_root: unknown, _args: unknown, context: any) {
  const customerId = requireHumanOwnerId(context.session);
  const rows = await context.sudo().prisma.tradeInSubmission.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { items: { orderBy: { createdAt: 'asc' }, include: { catalogItem: true } } },
  });
  return rows.map((row: any) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    disposition: row.disposition,
    submittedAt: row.createdAt.toISOString(),
    items: row.items.map((item: any) => ({
      id: item.id,
      title: item.catalogItem?.title || null,
      description: item.customerDescription,
      condition: item.customerCondition,
      quotedAmountMinor: item.quotedAmountMinor ?? null,
      acceptedAmountMinor: item.acceptedAmountMinor ?? null,
      currencyCode: item.currencyCode || null,
    })),
  }));
}
