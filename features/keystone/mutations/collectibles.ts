import { permissions } from '../access';
import { assertOfferAmount, evaluateAuctionBid, isPublicListingAvailable } from '../lib/collectibles-domain';
import { projectPublicListingExtension } from '../lib/collectibles-public-listing';
import {
  buildPublicCollectiblesDiscoveryPageQuery,
  MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET,
} from '../lib/public-collectibles-discovery-page';
export { projectPublicAttributes } from '../lib/public-attributes';
import { isMachinePrincipal } from '../security/principal';

// Auction/offer acceptance and settlement state machines are not implemented yet.
// Keep their public write commands closed rather than saving unfinishable intents.
const AUCTION_LIFECYCLE_RELEASED = false;
const OFFER_LIFECYCLE_RELEASED = false;

const PUBLIC_LISTING_QUERY = `
  id title slug format status priceMinor currencyCode publicSummary publishedAt endsAt
  store { name }
  inventoryUnit {
    id status
    commerceVariant { id product { handle status } }
    specimen {
      id displayName attributeValues
      catalogItem {
        id title handle catalogNumber maker year attributeValues
        category { id name handle attributeDefinitions(where: { public: { equals: true } }, take: 100) { key valueType options public } }
        franchise { id name handle }
        collectibleSet { id name handle }
        release { id name handle edition releaseDate }
      }
      media(where: { visibility: { equals: "public" } }, take: 8) { id kind url altText source capturedAt }
      conditionObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 3) { id sourceType scale label score observedAt status }
      gradeObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 3) { id reportedGrade reportedLabel certificateReference observedAt verificationState disclaimer gradingCompany { id name code } }
      provenanceEvents(where: { publiclyVisible: { equals: true } }, orderBy: { occurredAt: desc }, take: 6) { id eventType occurredAt confidence reviewState }
      valuationObservations(where: { publiclyVisible: { equals: true } }, orderBy: { observedAt: desc }, take: 5) { id amountMinor currencyCode sourceType sourceName observedAt confidence disclaimer }
    }
  }
  auction { id status startAt endAt openingAmountMinor currentAmountMinor currencyCode reserveMet minimumIncrementMinor extensionWindowSeconds bidCount }
`;

export async function marketplaceCollectiblesCapabilities() {
  return {
    platform: 'openfront-collectibles',
    verticals: ['collectibles'],
    discovery: [{
      vertical: 'collectibles',
      resultKind: 'collectibles.specimen-listing',
      criteriaSchema: {
        type: 'object', additionalProperties: false,
        properties: {
          category: { type: 'string', maxLength: 80 },
          format: { enum: ['fixed_price', 'auction'] },
          minPriceMinor: { type: 'integer', minimum: 0 },
          maxPriceMinor: { type: 'integer', minimum: 0 },
        },
      },
      actions: ['discovery.details'],
      extensionSchema: 'openfront.collectibles.specimen-listing/v1',
    }],
  };
}

export async function publicCollectiblesDiscovery(_root: unknown, { input }: { input?: any }, context: any) {
  if (input?.query !== undefined && typeof input.query !== 'string') throw new Error('Search query must be text');
  const query = String(input?.query || '').trim().slice(0, 80).toLowerCase();
  const limit = input?.limit === undefined ? 12 : Number(input.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 24) throw new Error('Discovery limit must be an integer between 1 and 24');
  const countryCode = String(input?.countryCode || '').trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(countryCode)) throw new Error('A storefront country code is required');
  const criteria = input?.criteria && typeof input.criteria === 'object' && !Array.isArray(input.criteria) ? input.criteria : {};
  const allowedCriteria = new Set(['listingId', 'productVariantId', 'category', 'format', 'minPriceMinor', 'maxPriceMinor']);
  if (Object.keys(criteria).some((key) => !allowedCriteria.has(key))) throw new Error('Unsupported collectible discovery criterion');
  if (criteria.format !== undefined && !['fixed_price', 'auction'].includes(criteria.format)) throw new Error('Listing format is invalid');
  for (const value of [criteria.minPriceMinor, criteria.maxPriceMinor]) {
    if (value !== undefined && (!Number.isSafeInteger(value) || Number(value) < 0)) throw new Error('Price criteria must be non-negative integer minor units');
  }
  if (Number.isSafeInteger(criteria.minPriceMinor) && Number.isSafeInteger(criteria.maxPriceMinor) && Number(criteria.minPriceMinor) > Number(criteria.maxPriceMinor)) {
    throw new Error('Minimum price cannot exceed maximum price');
  }
  const offset = input?.offset === undefined ? 0 : Number(input.offset);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET) {
    throw new Error(`Discovery offset must be an integer between 0 and ${MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET}`);
  }
  const normalizedCriteria: Record<string, unknown> = {};
  if (criteria.listingId !== undefined) {
    if (typeof criteria.listingId !== 'string' || !criteria.listingId || criteria.listingId.length > 128) throw new Error('Listing ID is invalid');
    normalizedCriteria.listingId = criteria.listingId;
  }
  if (criteria.productVariantId !== undefined) {
    if (typeof criteria.productVariantId !== 'string' || !criteria.productVariantId || criteria.productVariantId.length > 128) throw new Error('Product variant ID is invalid');
    normalizedCriteria.productVariantId = criteria.productVariantId;
  }
  if (criteria.category !== undefined) {
    if (typeof criteria.category !== 'string' || criteria.category.length > 80) throw new Error('Category criterion is invalid');
    if (criteria.category) normalizedCriteria.category = criteria.category;
  }
  if (criteria.format !== undefined) normalizedCriteria.format = criteria.format;
  if (criteria.minPriceMinor !== undefined) normalizedCriteria.minPriceMinor = criteria.minPriceMinor;
  if (criteria.maxPriceMinor !== undefined) normalizedCriteria.maxPriceMinor = criteria.maxPriceMinor;

  const sudo = context.sudo();
  const pageQuery = buildPublicCollectiblesDiscoveryPageQuery({ criteria: normalizedCriteria, query, limit, offset });
  const pageRows = await sudo.prisma.$queryRawUnsafe(pageQuery.sql, ...pageQuery.values);
  const rawTotal = pageRows[0]?.total_count ?? 0;
  const totalResults = Number(rawTotal);
  if (!Number.isSafeInteger(totalResults) || totalResults < 0) throw new Error('Public collectible discovery count is invalid');
  const rawObservedAt = pageRows[0]?.observed_at;
  const discoveryObservedAt = rawObservedAt instanceof Date ? rawObservedAt : new Date(rawObservedAt);
  if (!Number.isFinite(discoveryObservedAt.getTime())) throw new Error('Public collectible discovery clock is invalid');
  const listingIds = [...new Set(pageRows.map((row: any) => row.id).filter((id: unknown): id is string => typeof id === 'string'))];
  const loadedListings = listingIds.length
    ? await sudo.query.Listing.findMany({ where: { id: { in: listingIds } }, query: PUBLIC_LISTING_QUERY })
    : [];
  const loadedById = new Map(loadedListings.map((listing: any) => [listing.id, listing]));
  if (loadedById.size !== listingIds.length) throw new Error('Public listings changed during discovery; retry the query');
  const listings = listingIds.map((id) => loadedById.get(id));
  const projectedListings = listings.map((listing: any) => {
    const extension = projectPublicListingExtension(listing);
    if (!extension) throw new Error('Public listing projection changed during discovery; retry the query');
    return { listing, extension };
  });
  const [store] = await sudo.query.Store.findMany({ take: 1, query: 'id' });
  const sourceId = store?.id || 'openfront-collectibles';
  return {
    schemaVersion: 'marketplace.discovery.v1',
    vertical: 'collectibles',
    observedAt: discoveryObservedAt.toISOString(),
    source: { id: sourceId, platform: 'openfront-collectibles' },
    resultKind: 'collectibles.specimen-listing',
    results: projectedListings.map(({ listing, extension }: any) => ({
      ref: { sourceId, kind: 'collectibles.specimen-listing', id: listing.id },
      title: listing.title,
      facts: {
        price: typeof listing.priceMinor === 'number' ? { amountMinor: listing.priceMinor, currency: listing.currencyCode } : undefined,
        available: isPublicListingAvailable(listing, discoveryObservedAt),
        format: listing.format,
        auction: listing.auction ? {
          status: listing.auction.status,
          startAt: listing.auction.startAt,
          endAt: listing.auction.endAt,
          currentAmountMinor: listing.auction.currentAmountMinor,
          currencyCode: listing.auction.currencyCode,
          reserveMet: listing.auction.reserveMet,
          minimumIncrementMinor: listing.auction.minimumIncrementMinor,
          bidCount: listing.auction.bidCount,
        } : undefined,
      },
      extension,
      merchantUrl: `/${countryCode}/products/${encodeURIComponent(listing.inventoryUnit.commerceVariant.product.handle)}`,
    })),
    totalResults,
    truncated: offset + listingIds.length < totalResults,
  };
}

export async function placeCollectibleBid(_root: unknown, { auctionId, amountMinor, idempotencyKey }: any, context: any) {
  if (!AUCTION_LIFECYCLE_RELEASED) throw new Error('Auction bidding is unavailable until award, payment-default, and settlement recovery workflows are complete');
  const bidderId = context.session?.itemId;
  if (!bidderId || isMachinePrincipal(context.session)) throw new Error('A signed-in customer is required to bid');
  const key = String(idempotencyKey || '').trim();
  if (key.length < 8 || key.length > 200) throw new Error('Idempotency key must be between 8 and 200 characters');
  const amount = Number(amountMinor);
  const sudo = context.sudo();

  const bidId = await sudo.prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${auctionId} FOR UPDATE`;
    const replay = await tx.bid.findUnique({ where: { idempotencyKey: key } });
    if (replay) {
      if (replay.bidderId !== bidderId || replay.auctionId !== auctionId || replay.amountMinor !== amount) throw new Error('Idempotency key was already used for a different bid');
      return replay.id;
    }
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: { listing: { include: { inventoryUnit: true } } },
    });
    if (!auction?.listing?.inventoryUnit) throw new Error('Auction inventory is unavailable');
    const inventory = auction.listing.inventoryUnit;
    if (!['available', 'reserved'].includes(inventory.status || '')) throw new Error('Auction inventory is unavailable');
    if (inventory.status === 'reserved' && !auction.reservationId) throw new Error('Auction inventory is reserved by another workflow');
    const evaluated = evaluateAuctionBid({ ...auction, leadingBidderId: auction.leadingBidderId }, { bidderId, amountMinor: amount, now: new Date() });

    let reservationId = auction.reservationId;
    if (!reservationId) {
      const reservation = await tx.reservation.create({ data: {
        inventoryUnitId: inventory.id,
        listingId: auction.listing.id,
        auctionId: auction.id,
        purpose: 'auction', status: 'active', ownerUserId: bidderId,
        expiresAt: evaluated.nextEndAt,
        idempotencyKey: `auction:${auction.id}`,
      } });
      reservationId = reservation.id;
      await tx.inventoryUnit.update({ where: { id: inventory.id }, data: { status: 'reserved', version: { increment: 1 } } });
    } else {
      await tx.reservation.update({ where: { id: reservationId }, data: { ownerUserId: bidderId, expiresAt: evaluated.nextEndAt } });
    }
    const bid = await tx.bid.create({ data: {
      auctionId: auction.id, bidderId, amountMinor: amount, currencyCode: auction.currencyCode,
      status: 'accepted', acceptedAt: new Date(), resultingEndAt: evaluated.nextEndAt, idempotencyKey: key,
    } });
    if (auction.leadingBidderId) {
      await tx.bid.updateMany({ where: { auctionId: auction.id, bidderId: auction.leadingBidderId, status: 'accepted' }, data: { status: 'superseded' } });
    }
    await tx.auction.update({ where: { id: auction.id }, data: {
      currentAmountMinor: amount,
      leadingBidderId: bidderId,
      bidCount: { increment: 1 },
      endAt: evaluated.nextEndAt,
      extensionCount: evaluated.nextExtensionCount,
      reserveMet: auction.reserveAmountMinor == null ? true : amount >= auction.reserveAmountMinor,
      reservationId,
    } });
    return bid.id;
  }, { isolationLevel: 'Serializable', timeout: 15_000 });

  return sudo.query.Bid.findOne({ where: { id: bidId }, query: 'id amountMinor currencyCode status acceptedAt resultingEndAt auction { id currentAmountMinor endAt reserveMet bidCount leadingBidder { id } }' });
}

export async function submitCollectibleOffer(_root: unknown, { listingId, amountMinor, expiresAt, message, idempotencyKey }: any, context: any) {
  if (!OFFER_LIFECYCLE_RELEASED) throw new Error('Offers are unavailable until counter, acceptance, expiry, reservation, and conversion workflows are complete');
  const buyerId = context.session?.itemId;
  if (!buyerId || isMachinePrincipal(context.session)) throw new Error('A signed-in customer is required to make an offer');
  const key = String(idempotencyKey || '').trim();
  if (key.length < 8 || key.length > 200) throw new Error('Idempotency key must be between 8 and 200 characters');
  const sudo = context.sudo();
  const offerId = await sudo.prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${listingId} FOR UPDATE`;
    const replay = await tx.offer.findUnique({ where: { idempotencyKey: key } });
    if (replay) {
      if (replay.buyerId !== buyerId || replay.listingId !== listingId || replay.currentAmountMinor !== Number(amountMinor)) throw new Error('Idempotency key was already used for a different offer');
      return replay.id;
    }
    const listing = await tx.listing.findUnique({ where: { id: listingId }, include: { inventoryUnit: true } });
    if (!listing || listing.status !== 'published' || listing.format !== 'fixed_price' || !listing.offersEnabled || listing.inventoryUnit?.status !== 'available') throw new Error('Listing is not accepting offers');
    const amount = assertOfferAmount({ amountMinor, minimumOfferMinor: listing.minimumOfferMinor, listingPriceMinor: listing.priceMinor });
    const expiry = new Date(expiresAt);
    if (!Number.isFinite(expiry.getTime()) || expiry <= new Date() || expiry.getTime() > Date.now() + 30 * 86400_000) throw new Error('Offer expiry must be within the next 30 days');
    const offer = await tx.offer.create({ data: { listingId, buyerId, sellerId: listing.sellerId, status: 'open', currentAmountMinor: amount, currencyCode: listing.currencyCode, expiresAt: expiry, currentRevision: 1, idempotencyKey: key } });
    await tx.offerRevision.create({ data: { offerId: offer.id, sequence: 1, actorType: 'buyer', actorId: buyerId, action: 'created', amountMinor: amount, currencyCode: listing.currencyCode, message: String(message || '').slice(0, 1000), occurredAt: new Date(), idempotencyKey: `${key}:revision:1` } });
    return offer.id;
  }, { isolationLevel: 'Serializable', timeout: 15_000 });
  return sudo.query.Offer.findOne({ where: { id: offerId }, query: 'id status currentAmountMinor currencyCode expiresAt currentRevision listing { id title slug } revisions { id sequence actorType action amountMinor message occurredAt }' });
}
