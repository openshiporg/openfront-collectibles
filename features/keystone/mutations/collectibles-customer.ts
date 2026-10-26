import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { isPublicListingAvailable } from '../lib/collectibles-domain';
import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import { offerForCondition } from '../lib/pokemon/pricing';

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

const BUY_CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;

function offersByCondition(entry: any, buylist: any) {
  const offers: Record<string, { cashMinor: number; creditMinor: number }> = {};
  for (const condition of BUY_CONDITIONS) {
    const cashMinor = offerForCondition(entry.offerAmountMinor, buylist, condition, entry.minimumCondition);
    const creditMinor = offerForCondition(entry.creditOfferMinor ?? entry.offerAmountMinor, buylist, condition, entry.minimumCondition);
    if (cashMinor > 0 || creditMinor > 0) offers[condition] = { cashMinor, creditMinor };
  }
  return offers;
}

/** Active buylists with their active entries: what the shop is buying, at what offer per condition. */
export async function publicBuylist(_root: unknown, _args: unknown, context: any) {
  const buylists = await context.sudo().prisma.buylist.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    take: 20,
    include: {
      entries: {
        where: { active: 'active' },
        orderBy: [{ hotlist: 'desc' }, { offerAmountMinor: 'desc' }],
        take: 500,
        include: { catalogItem: { include: { category: true, collectibleSet: true } } },
      },
    },
  });
  return buylists.map((buylist: any) => ({
    id: buylist.id,
    name: buylist.name,
    currencyCode: buylist.currencyCode,
    notes: buylist.publicNotes || null,
    cashPercentBasisPoints: buylist.cashPercentBasisPoints,
    creditPercentBasisPoints: buylist.creditPercentBasisPoints,
    minimumOfferMinor: buylist.minimumOfferMinor ?? 0,
    entries: buylist.entries
      .filter((entry: any) => entry.catalogItem && entry.catalogItem.status !== 'archived')
      .filter((entry: any) => entry.maximumQuantity == null || entry.quantityBought < entry.maximumQuantity)
      .map((entry: any) => ({
        id: entry.id,
        catalogItemId: entry.catalogItem.id,
        title: entry.catalogItem.title,
        catalogNumber: entry.catalogItem.catalogNumber || null,
        number: entry.catalogItem.cardNumber || null,
        rarity: entry.catalogItem.rarity || null,
        kind: entry.catalogItem.kind,
        imageUrl: entry.catalogItem.imageUrl || null,
        set: entry.catalogItem.collectibleSet ? { handle: entry.catalogItem.collectibleSet.handle, name: entry.catalogItem.collectibleSet.name, code: entry.catalogItem.collectibleSet.code || null, logoUrl: entry.catalogItem.collectibleSet.logoUrl || null } : null,
        maker: entry.catalogItem.maker || null,
        year: entry.catalogItem.year ?? null,
        category: entry.catalogItem.category?.name ?? null,
        finish: entry.cardFinish ?? null,
        minimumCondition: entry.minimumCondition ?? null,
        hotlist: entry.hotlist,
        offerAmountMinor: entry.offerAmountMinor,
        creditOfferMinor: entry.creditOfferMinor ?? null,
        offers: offersByCondition(entry, buylist),
        maximumQuantity: entry.maximumQuantity == null ? null : Math.max(0, entry.maximumQuantity - entry.quantityBought),
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
    cardCondition: z.enum(BUY_CONDITIONS).optional(),
    quantity: z.number().int().min(1).max(500).optional(),
  }).strict()).min(1).max(100),
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
      const count = command.items.filter((item) => item.buylistEntryId === entry.id).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
      if (entry.maximumQuantity != null && count > entry.maximumQuantity - entry.quantityBought) throw new Error('A buylist item exceeds the quantity the shop is buying');
    }

    const submission = await tx.tradeInSubmission.create({
      data: { storeId: store.id, customerId, reference: tradeInReference(), status: 'submitted', disposition: command.disposition },
    });
    for (const item of command.items) {
      const entry: any = item.buylistEntryId ? byId.get(item.buylistEntryId) : null;
      const offers = entry && item.cardCondition ? offersByCondition(entry, entry.buylist)[item.cardCondition] : undefined;
      if (entry && item.cardCondition && !offers) throw new Error('The shop is not buying that card in that condition');
      const quantity = item.quantity ?? 1;
      await tx.tradeInItem.create({
        data: {
          submissionId: submission.id,
          catalogItemId: entry?.catalogItemId ?? null,
          buylistEntryId: entry?.id ?? null,
          customerDescription: item.description,
          customerCondition: item.condition,
          cardCondition: item.cardCondition ?? null,
          cardFinish: entry?.cardFinish ?? null,
          quantity,
          currencyCode: (entry?.buylist?.currencyCode || store.defaultCurrencyCode || '').toUpperCase(),
          // The listed offer is an estimate; the shop quotes after inspecting the cards.
          decisionEvidence: entry ? {
            buylistEntryId: entry.id, listedOfferMinor: entry.offerAmountMinor, listedCreditMinor: entry.creditOfferMinor,
            condition: item.cardCondition ?? null,
            estimateCashMinor: offers ? offers.cashMinor * quantity : null,
            estimateCreditMinor: offers ? offers.creditMinor * quantity : null,
          } : {},
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
      cardCondition: item.cardCondition ?? null,
      quantity: item.quantity ?? 1,
      quotedAmountMinor: item.quotedAmountMinor ?? null,
      quotedCreditMinor: item.quotedCreditMinor ?? null,
      estimateCashMinor: (item.decisionEvidence as any)?.estimateCashMinor ?? null,
      estimateCreditMinor: (item.decisionEvidence as any)?.estimateCreditMinor ?? null,
      acceptedAmountMinor: item.acceptedAmountMinor ?? null,
      currencyCode: item.currencyCode || null,
    })),
  }));
}
