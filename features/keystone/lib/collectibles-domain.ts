export function isAuctionOpenAt(
  auction: { status?: unknown; startAt?: unknown; endAt?: unknown } | null | undefined,
  now: Date
): boolean {
  const timestamp = (value: unknown) => {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.getTime();
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const startAt = timestamp(auction?.startAt);
  const endAt = timestamp(auction?.endAt);
  return auction?.status === 'active' && startAt !== null && endAt !== null && startAt < endAt &&
    Number.isFinite(now.getTime()) && now.getTime() >= startAt && now.getTime() < endAt;
}

export function isPublicListingAvailable(listing: any, now: Date): boolean {
  const inventoryStatus = listing?.inventoryUnit?.status;
  if (listing?.format === 'fixed_price') return inventoryStatus === 'available';
  return listing?.format === 'auction' && ['available', 'reserved'].includes(inventoryStatus) &&
    isAuctionOpenAt(listing?.auction, now);
}

export type AuctionBidState = {
  status: string;
  startAt: Date;
  endAt: Date;
  openingAmountMinor: number;
  currentAmountMinor: number;
  minimumIncrementMinor: number;
  leadingBidderId?: string | null;
  extensionWindowSeconds?: number | null;
  extensionSeconds?: number | null;
  maximumExtensions?: number | null;
  extensionCount?: number | null;
};

function nonNegativeMinor(value: unknown, label: string): number {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative integer in minor units`);
  }
  return amount;
}

export function minimumNextBid(auction: Pick<AuctionBidState, 'currentAmountMinor' | 'openingAmountMinor' | 'minimumIncrementMinor' | 'leadingBidderId'>): number {
  const opening = nonNegativeMinor(auction.openingAmountMinor, 'Opening amount');
  const current = nonNegativeMinor(auction.currentAmountMinor, 'Current amount');
  const increment = nonNegativeMinor(auction.minimumIncrementMinor, 'Minimum increment');
  if (increment < 1) throw new Error('Minimum increment must be at least one minor unit');
  return auction.leadingBidderId ? current + increment : Math.max(opening, current);
}

export function evaluateAuctionBid(
  auction: AuctionBidState,
  input: { bidderId: string; amountMinor: number; now: Date },
): { nextEndAt: Date; nextExtensionCount: number; minimumAcceptedMinor: number } {
  if (auction.status !== 'active') throw new Error('Auction is not active');
  if (input.now < auction.startAt) throw new Error('Auction has not started');
  if (input.now >= auction.endAt) throw new Error('Auction has ended');
  if (!input.bidderId) throw new Error('Authenticated bidder is required');
  if (auction.leadingBidderId === input.bidderId) throw new Error('The current leader cannot bid against their own leading bid');

  const amount = nonNegativeMinor(input.amountMinor, 'Bid amount');
  const minimumAcceptedMinor = minimumNextBid(auction);
  if (amount < minimumAcceptedMinor) {
    throw new Error(`Bid must be at least ${minimumAcceptedMinor} minor units`);
  }

  const extensionWindow = Math.max(0, Number(auction.extensionWindowSeconds || 0));
  const extensionSeconds = Math.max(0, Number(auction.extensionSeconds || 0));
  const maximumExtensions = Math.max(0, Number(auction.maximumExtensions || 0));
  const extensionCount = Math.max(0, Number(auction.extensionCount || 0));
  const remainingMs = auction.endAt.getTime() - input.now.getTime();
  const shouldExtend = extensionSeconds > 0 && extensionCount < maximumExtensions && remainingMs <= extensionWindow * 1000;

  return {
    minimumAcceptedMinor,
    nextEndAt: shouldExtend ? new Date(auction.endAt.getTime() + extensionSeconds * 1000) : auction.endAt,
    nextExtensionCount: shouldExtend ? extensionCount + 1 : extensionCount,
  };
}

export function calculateConsignmentSettlement(input: {
  grossAmountMinor: number;
  commissionBasisPoints: number;
  fixedFeeMinor?: number;
  refundHoldbackMinor?: number;
}) {
  const grossAmountMinor = nonNegativeMinor(input.grossAmountMinor, 'Gross amount');
  const fixedFeeMinor = nonNegativeMinor(input.fixedFeeMinor || 0, 'Fixed fee');
  const refundHoldbackMinor = nonNegativeMinor(input.refundHoldbackMinor || 0, 'Refund holdback');
  const bps = Number(input.commissionBasisPoints);
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) throw new Error('Commission must be between 0 and 10000 basis points');
  const commissionAmountMinor = Math.floor((grossAmountMinor * bps) / 10_000);
  const feeAmountMinor = commissionAmountMinor + fixedFeeMinor;
  const payableAmountMinor = grossAmountMinor - feeAmountMinor - refundHoldbackMinor;
  if (payableAmountMinor < 0) throw new Error('Settlement deductions cannot exceed gross proceeds');
  return { grossAmountMinor, commissionAmountMinor, fixedFeeMinor, feeAmountMinor, refundHoldbackMinor, payableAmountMinor };
}

export function assertOfferAmount(input: { amountMinor: number; minimumOfferMinor?: number | null; listingPriceMinor?: number | null }) {
  const amountMinor = nonNegativeMinor(input.amountMinor, 'Offer amount');
  if (amountMinor < 1) throw new Error('Offer amount must be positive');
  if (input.minimumOfferMinor != null && amountMinor < input.minimumOfferMinor) {
    throw new Error(`Offer must be at least ${input.minimumOfferMinor} minor units`);
  }
  return amountMinor;
}
