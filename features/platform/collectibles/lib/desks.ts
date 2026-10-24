import { humanize, type DotTone } from '@/features/platform/components/vault-ui';
import type { QueueSpec } from './desk-data';
import { dateTime, day, money } from './format';

export type DeskKind =
  | 'catalog'
  | 'inventory'
  | 'commerce'
  | 'auctions'
  | 'consignment'
  | 'buylist'
  | 'evidence'
  | 'fulfillment'
  | 'customers';

export type Desk = {
  title: string;
  queues: QueueSpec[];
  /** Headline state on the title line: the sum of these statuses in one queue. */
  attention?: { queue: string; statuses: string[]; label: string; tone: DotTone; clear: string };
  links?: Array<{ label: string; href: string }>;
};

const s = (value: string, tone: DotTone, label?: string) => ({ value, tone, label });

function toneOf(statuses: Array<{ value: string; tone: DotTone }>, value: unknown): DotTone {
  return statuses.find((status) => status.value === value)?.tone ?? 'muted';
}

const join = (...parts: Array<unknown>) =>
  parts.filter((part) => typeof part === 'string' ? part.trim() : typeof part === 'number').join(' · ');

const CATEGORY_STATUSES = [s('active', 'ok'), s('draft', 'muted'), s('archived', 'muted')];
const SPECIMEN_STATUSES = [
  s('intake', 'warn'), s('review', 'warn'), s('available', 'ok'), s('reserved', 'accent'),
  s('sold', 'info'), s('returned', 'warn'), s('withdrawn', 'muted'),
];
const UNIT_STATUSES = [
  s('intake', 'warn'), s('available', 'ok'), s('reserved', 'accent'), s('sold', 'info'),
  s('return_hold', 'warn'), s('withdrawn', 'muted'), s('lost', 'danger'),
];
const RESERVATION_STATUSES = [s('active', 'accent'), s('converted', 'ok'), s('released', 'muted'), s('expired', 'muted'), s('cancelled', 'muted')];
const LISTING_STATUSES = [
  s('draft', 'muted'), s('scheduled', 'warn'), s('published', 'ok'), s('paused', 'warn'),
  s('sold', 'info'), s('ended', 'muted'), s('withdrawn', 'muted'),
];
const OFFER_STATUSES = [
  s('open', 'warn'), s('countered', 'accent'), s('accepted', 'ok'), s('declined', 'muted'),
  s('withdrawn', 'muted'), s('expired', 'muted'), s('converted', 'info'),
];
const AUCTION_STATUSES = [
  s('scheduled', 'warn'), s('active', 'ok', 'Live'), s('ended', 'info'), s('settled', 'muted'),
  s('draft', 'muted'), s('cancelled', 'muted'),
];
const BID_STATUSES = [s('winning', 'ok'), s('accepted', 'accent'), s('superseded', 'muted'), s('rejected', 'danger')];
const INTAKE_STATUSES = [
  s('submitted', 'warn'), s('received', 'warn'), s('inspecting', 'warn'), s('offered', 'accent'),
  s('accepted', 'ok'), s('declined', 'muted'), s('returned', 'muted'),
];
const AGREEMENT_STATUSES = [s('draft', 'muted'), s('sent', 'warn'), s('accepted', 'ok'), s('expired', 'muted'), s('terminated', 'danger')];
const SETTLEMENT_STATUSES = [
  s('pending', 'warn'), s('on_hold', 'warn'), s('approved', 'accent'), s('paid', 'ok'),
  s('failed', 'danger'), s('reversed', 'danger'),
];
const BUYLIST_STATUSES = [s('active', 'ok'), s('draft', 'muted'), s('paused', 'warn'), s('archived', 'muted')];
const TRADE_IN_STATUSES = [
  s('submitted', 'warn'), s('received', 'warn'), s('inspecting', 'warn'), s('quoted', 'accent'),
  s('accepted', 'ok'), s('paid', 'ok'), s('declined', 'muted'), s('returned', 'muted'), s('draft', 'muted'),
];
const VERIFICATION_STATUSES = [
  s('manual_review', 'warn', 'In review'), s('not_checked', 'muted'), s('provider_reported', 'accent'),
  s('matched', 'ok'), s('mismatch', 'danger'), s('unavailable', 'muted'),
];
const PROVENANCE_STATUSES = [s('reported', 'warn'), s('reviewed', 'ok'), s('disputed', 'danger'), s('rejected', 'muted')];
const DISPUTE_STATUSES = [
  s('open', 'danger'), s('evidence_requested', 'warn'), s('review', 'warn'), s('resolved', 'ok'), s('closed', 'muted'),
];
const SELLER_STATUSES = [s('applicant', 'warn'), s('active', 'ok'), s('paused', 'warn'), s('suspended', 'danger'), s('closed', 'muted')];

export const DESKS: Record<DeskKind, Desk> = {
  catalog: {
    title: 'Catalog & Items',
    attention: { queue: 'specimens', statuses: ['intake', 'review'], label: 'awaiting review', tone: 'warn', clear: 'Nothing awaiting review' },
    queues: [
      {
        key: 'specimens', title: 'Items', type: 'Specimen', list: 'specimens', path: 'specimens',
        statusField: 'lifecycleStatus', statuses: SPECIMEN_STATUSES,
        fields: 'displayName specimenCode lifecycleStatus catalogItem { year maker category { name } } gradeObservationsCount',
        row: (r) => ({
          title: r.displayName || r.specimenCode,
          state: humanize(r.lifecycleStatus), tone: toneOf(SPECIMEN_STATUSES, r.lifecycleStatus),
          meta: join(r.specimenCode, r.catalogItem?.category?.name, r.catalogItem?.maker, r.catalogItem?.year),
          trailing: r.gradeObservationsCount ? `${r.gradeObservationsCount} grade` : undefined,
        }),
      },
      {
        key: 'catalog-items', title: 'Catalog', type: 'CatalogItem', list: 'catalogItems', path: 'catalog-items',
        statusField: 'status', statuses: CATEGORY_STATUSES,
        fields: 'title catalogNumber maker year status category { name } specimensCount',
        row: (r) => ({
          title: r.title, state: humanize(r.status), tone: toneOf(CATEGORY_STATUSES, r.status),
          meta: join(r.category?.name, r.catalogNumber, r.maker, r.year),
          trailing: `${r.specimensCount ?? 0} held`,
        }),
      },
      {
        key: 'categories', title: 'Categories', type: 'CollectibleCategory', list: 'collectibleCategories', path: 'collectible-categories',
        statusField: 'status', statuses: CATEGORY_STATUSES, orderBy: 'sortOrder', take: 8,
        fields: 'name handle status attributeDefinitionsCount childrenCount',
        row: (r) => ({
          title: r.name, state: humanize(r.status), tone: toneOf(CATEGORY_STATUSES, r.status),
          meta: join(r.handle, r.childrenCount ? `${r.childrenCount} sub` : null),
          trailing: `${r.attributeDefinitionsCount ?? 0} attr`,
        }),
      },
    ],
  },
  inventory: {
    title: 'Inventory & Custody',
    attention: { queue: 'units', statuses: ['intake', 'return_hold', 'lost'], label: 'need attention', tone: 'warn', clear: 'Nothing on hold' },
    queues: [
      {
        key: 'units', title: 'Inventory', type: 'InventoryUnit', list: 'inventoryUnits', path: 'inventory-units',
        statusField: 'status', statuses: UNIT_STATUSES,
        fields: 'sku status ownershipBasis acquiredAmountMinor currencyCode specimen { displayName } location { code }',
        row: (r) => ({
          title: r.specimen?.displayName || r.sku, state: humanize(r.status), tone: toneOf(UNIT_STATUSES, r.status),
          meta: join(r.sku, humanize(r.ownershipBasis), r.location?.code),
          trailing: r.acquiredAmountMinor != null ? money(r.acquiredAmountMinor, r.currencyCode) : undefined,
        }),
      },
      {
        key: 'holds', title: 'Holds', type: 'Reservation', list: 'reservations', path: 'reservations',
        statusField: 'status', statuses: RESERVATION_STATUSES, where: { status: { equals: 'active' } },
        fields: 'purpose status expiresAt inventoryUnit { sku specimen { displayName } }',
        row: (r) => ({
          title: r.inventoryUnit?.specimen?.displayName || r.inventoryUnit?.sku || 'Unit',
          state: humanize(r.purpose), tone: 'accent',
          meta: join(r.inventoryUnit?.sku),
          trailing: r.expiresAt ? `Until ${dateTime(r.expiresAt)}` : undefined,
        }),
      },
      {
        key: 'custody', title: 'Custody history', type: 'CustodyEvent', list: 'custodyEvents', path: 'custody-events',
        orderBy: 'occurredAt',
        fields: 'type occurredAt specimen { displayName specimenCode } fromLocation { code } toLocation { code }',
        row: (r) => ({
          title: r.specimen?.displayName || r.specimen?.specimenCode || 'Item',
          state: humanize(r.type), tone: r.type === 'returned' ? 'warn' : 'muted',
          meta: join(r.fromLocation?.code && r.toLocation?.code ? `${r.fromLocation.code} to ${r.toLocation.code}` : r.toLocation?.code || r.fromLocation?.code),
          trailing: day(r.occurredAt),
        }),
      },
    ],
  },
  commerce: {
    title: 'Listings & Offers',
    attention: { queue: 'offers', statuses: ['open', 'countered'], label: 'open offers', tone: 'warn', clear: 'No open offers' },
    links: [{ label: 'Orders', href: '/dashboard/platform/orders' }],
    queues: [
      {
        key: 'listings', title: 'Listings', type: 'Listing', list: 'listings', path: 'listings',
        statusField: 'status', statuses: LISTING_STATUSES,
        fields: 'title format status priceMinor currencyCode inventoryUnit { sku }',
        row: (r) => ({
          title: r.title, state: humanize(r.status), tone: toneOf(LISTING_STATUSES, r.status),
          meta: join(r.inventoryUnit?.sku, humanize(r.format)),
          trailing: r.priceMinor != null ? money(r.priceMinor, r.currencyCode) : 'Unpriced',
        }),
      },
      {
        key: 'offers', title: 'Offers', type: 'Offer', list: 'offers', path: 'offers',
        statusField: 'status', statuses: OFFER_STATUSES,
        fields: 'status currentAmountMinor currencyCode expiresAt listing { title }',
        row: (r) => ({
          title: r.listing?.title || 'Listing', state: humanize(r.status), tone: toneOf(OFFER_STATUSES, r.status),
          meta: r.expiresAt ? `Expires ${dateTime(r.expiresAt)}` : undefined,
          trailing: money(r.currentAmountMinor, r.currencyCode),
        }),
      },
    ],
  },
  auctions: {
    title: 'Auctions',
    attention: { queue: 'auctions', statuses: ['active'], label: 'live', tone: 'ok', clear: 'No live auctions' },
    links: [{ label: 'Orders', href: '/dashboard/platform/orders' }],
    queues: [
      {
        key: 'auctions', title: 'Auctions', type: 'Auction', list: 'auctions', path: 'auctions',
        statusField: 'status', statuses: AUCTION_STATUSES, orderBy: 'endAt',
        fields: 'status startAt endAt currentAmountMinor openingAmountMinor currencyCode reserveMet bidCount listing { title }',
        row: (r) => ({
          title: r.listing?.title || 'Auction', state: AUCTION_STATUSES.find((x) => x.value === r.status)?.label || humanize(r.status),
          tone: toneOf(AUCTION_STATUSES, r.status),
          meta: join(`Ends ${dateTime(r.endAt)}`, `${r.bidCount ?? 0} bids`, r.reserveMet ? 'Reserve met' : 'Reserve not met'),
          trailing: money(r.bidCount ? r.currentAmountMinor : r.openingAmountMinor, r.currencyCode),
        }),
      },
      {
        key: 'bids', title: 'Bids', type: 'Bid', list: 'bids', path: 'bids',
        statusField: 'status', statuses: BID_STATUSES, orderBy: 'acceptedAt',
        fields: 'status amountMinor currencyCode acceptedAt rejectionReason auction { listing { title } }',
        row: (r) => ({
          title: r.auction?.listing?.title || 'Auction', state: humanize(r.status), tone: toneOf(BID_STATUSES, r.status),
          meta: join(dateTime(r.acceptedAt), r.rejectionReason),
          trailing: money(r.amountMinor, r.currencyCode),
        }),
      },
    ],
  },
  consignment: {
    title: 'Consignment',
    attention: { queue: 'intakes', statuses: ['submitted', 'received', 'inspecting'], label: 'in intake', tone: 'warn', clear: 'Intake clear' },
    queues: [
      {
        key: 'intakes', title: 'Intake', type: 'ConsignmentIntake', list: 'consignmentIntakes', path: 'consignment-intakes',
        statusField: 'status', statuses: INTAKE_STATUSES,
        fields: 'reference status receivedAt itemsCount consignor { displayName }',
        row: (r) => ({
          title: r.consignor?.displayName || r.reference, state: humanize(r.status), tone: toneOf(INTAKE_STATUSES, r.status),
          meta: join(r.reference, r.receivedAt ? `Received ${day(r.receivedAt)}` : null),
          trailing: `${r.itemsCount ?? 0} items`,
        }),
      },
      {
        key: 'agreements', title: 'Agreements', type: 'ConsignmentAgreement', list: 'consignmentAgreements', path: 'consignment-agreements',
        statusField: 'status', statuses: AGREEMENT_STATUSES,
        fields: 'version status commissionBasisPoints fixedFeeMinor currencyCode consignor { displayName } intake { reference }',
        row: (r) => ({
          title: r.consignor?.displayName || r.intake?.reference || 'Agreement', state: humanize(r.status),
          tone: toneOf(AGREEMENT_STATUSES, r.status),
          meta: join(r.intake?.reference, `v${r.version}`),
          trailing: typeof r.commissionBasisPoints === 'number' ? `${(r.commissionBasisPoints / 100).toFixed(2)}%` : undefined,
        }),
      },
      {
        key: 'settlements', title: 'Settlements', type: 'ConsignmentSettlement', list: 'consignmentSettlements', path: 'consignment-settlements',
        statusField: 'status', statuses: SETTLEMENT_STATUSES,
        fields: 'reference status payableAmountMinor currencyCode consignor { displayName }',
        row: (r) => ({
          title: r.consignor?.displayName || r.reference, state: humanize(r.status), tone: toneOf(SETTLEMENT_STATUSES, r.status),
          meta: r.reference, trailing: money(r.payableAmountMinor, r.currencyCode),
        }),
      },
    ],
  },
  buylist: {
    title: 'Buylist & Trade-In',
    attention: { queue: 'submissions', statuses: ['submitted', 'received', 'inspecting'], label: 'to inspect', tone: 'warn', clear: 'Nothing to inspect' },
    queues: [
      {
        key: 'submissions', title: 'Submissions', type: 'TradeInSubmission', list: 'tradeInSubmissions', path: 'trade-in-submissions',
        statusField: 'status', statuses: TRADE_IN_STATUSES,
        fields: 'reference status disposition itemsCount createdAt',
        row: (r) => ({
          title: r.reference, state: humanize(r.status), tone: toneOf(TRADE_IN_STATUSES, r.status),
          meta: join(humanize(r.disposition), day(r.createdAt)),
          trailing: `${r.itemsCount ?? 0} items`,
        }),
      },
      {
        key: 'items', title: 'Inspection', type: 'TradeInItem', list: 'tradeInItems', path: 'trade-in-items',
        fields: 'customerDescription customerCondition quotedAmountMinor acceptedAmountMinor currencyCode catalogItem { title } submission { reference } inspectedConditionObservation { label }',
        row: (r) => ({
          title: r.catalogItem?.title || r.customerDescription || 'Item',
          state: r.acceptedAmountMinor != null ? 'Accepted' : r.quotedAmountMinor != null ? 'Quoted' : r.inspectedConditionObservation ? 'Inspected' : 'Not inspected',
          tone: r.acceptedAmountMinor != null ? 'ok' : r.quotedAmountMinor != null ? 'accent' : r.inspectedConditionObservation ? 'info' : 'warn',
          meta: join(r.submission?.reference, r.inspectedConditionObservation?.label ?? (r.customerCondition ? `Reported ${r.customerCondition}` : null)),
          trailing: r.acceptedAmountMinor != null ? money(r.acceptedAmountMinor, r.currencyCode) : r.quotedAmountMinor != null ? money(r.quotedAmountMinor, r.currencyCode) : undefined,
        }),
      },
      {
        key: 'buylists', title: 'Buylists', type: 'Buylist', list: 'buylists', path: 'buylists',
        statusField: 'status', statuses: BUYLIST_STATUSES,
        fields: 'name status currencyCode entriesCount',
        row: (r) => ({
          title: r.name, state: humanize(r.status), tone: toneOf(BUYLIST_STATUSES, r.status),
          meta: r.currencyCode, trailing: `${r.entriesCount ?? 0} wanted`,
        }),
      },
    ],
  },
  evidence: {
    title: 'Condition & Grading',
    attention: { queue: 'grades', statuses: ['manual_review', 'mismatch'], label: 'grades to review', tone: 'warn', clear: 'No grades to review' },
    queues: [
      {
        key: 'grades', title: 'Grades & certificates', type: 'GradeObservation', list: 'gradeObservations', path: 'grade-observations',
        statusField: 'verificationState', statuses: VERIFICATION_STATUSES, orderBy: 'observedAt',
        fields: 'reportedGrade reportedLabel certificateReference verificationState publiclyVisible observedAt gradingCompany { code } specimen { displayName }',
        row: (r) => ({
          title: r.specimen?.displayName || 'Item',
          state: VERIFICATION_STATUSES.find((x) => x.value === r.verificationState)?.label || humanize(r.verificationState),
          tone: toneOf(VERIFICATION_STATUSES, r.verificationState),
          meta: join(r.certificateReference ? `Cert ${r.certificateReference}` : null, r.publiclyVisible ? 'Public' : 'Private', day(r.observedAt)),
          trailing: join(r.gradingCompany?.code, r.reportedGrade),
        }),
      },
      {
        key: 'provenance', title: 'Provenance', type: 'ProvenanceEvent', list: 'provenanceEvents', path: 'provenance-events',
        statusField: 'reviewState', statuses: PROVENANCE_STATUSES, orderBy: 'recordedAt',
        fields: 'eventType summary confidence reviewState occurredAt specimen { displayName }',
        row: (r) => ({
          title: r.specimen?.displayName || 'Item', state: humanize(r.reviewState), tone: toneOf(PROVENANCE_STATUSES, r.reviewState),
          meta: join(humanize(r.eventType), r.summary),
          trailing: r.occurredAt ? day(r.occurredAt) : humanize(r.confidence),
        }),
      },
      {
        key: 'disputes', title: 'Disputes', type: 'DisputeCase', list: 'disputeCases', path: 'dispute-cases',
        statusField: 'status', statuses: DISPUTE_STATUSES,
        fields: 'type status summary createdAt order { displayId }',
        row: (r) => ({
          title: humanize(r.type), state: humanize(r.status), tone: toneOf(DISPUTE_STATUSES, r.status),
          meta: join(r.order?.displayId ? `Order #${r.order.displayId}` : null, r.summary),
          trailing: day(r.createdAt),
        }),
      },
    ],
  },
  fulfillment: {
    title: 'High-Value Fulfillment',
    links: [{ label: 'Orders to fulfil', href: '/dashboard/platform/orders' }],
    queues: [
      {
        key: 'requirements', title: 'Requirements', type: 'FulfillmentRequirement', list: 'fulfillmentRequirements', path: 'fulfillment-requirements',
        fields: 'declaredValueMinor currencyCode signatureRequired insuranceRequested packagingInstructions order { displayId }',
        row: (r) => ({
          title: r.order?.displayId ? `Order #${r.order.displayId}` : 'Order',
          state: r.signatureRequired ? 'Signature' : 'No signature', tone: r.signatureRequired ? 'accent' : 'muted',
          meta: join(r.insuranceRequested ? 'Insurance requested' : null, r.packagingInstructions),
          trailing: r.declaredValueMinor != null ? money(r.declaredValueMinor, r.currencyCode) : undefined,
        }),
      },
      {
        key: 'shipments', title: 'Shipments', type: 'ShipmentEvidence', list: 'shipmentEvidences', path: 'shipment-evidences',
        orderBy: 'observedAt',
        fields: 'type provider providerReference status observedAt requirement { order { displayId } }',
        row: (r) => ({
          title: r.requirement?.order?.displayId ? `Order #${r.requirement.order.displayId}` : r.provider,
          state: humanize(r.type),
          tone: r.type === 'exception' ? 'danger' : r.type === 'delivery' || r.type === 'signature' ? 'ok' : 'muted',
          meta: join(r.provider, r.providerReference, r.status),
          trailing: day(r.observedAt),
        }),
      },
    ],
  },
  customers: {
    title: 'Collectors & Sellers',
    attention: { queue: 'sellers', statuses: ['applicant'], label: 'seller applications', tone: 'warn', clear: 'No seller applications' },
    links: [
      { label: 'New collector', href: '/dashboard/collector-profiles/create' },
      { label: 'New seller', href: '/dashboard/seller-profiles/create' },
      { label: 'Users', href: '/dashboard/platform/users' },
    ],
    queues: [
      {
        key: 'sellers', title: 'Sellers', type: 'SellerProfile', list: 'sellerProfiles', path: 'seller-profiles',
        statusField: 'status', statuses: SELLER_STATUSES,
        fields: 'displayName status identityEvidenceState createdAt',
        row: (r) => ({
          title: r.displayName, state: humanize(r.status), tone: toneOf(SELLER_STATUSES, r.status),
          meta: `Identity ${humanize(r.identityEvidenceState).toLowerCase()}`,
          trailing: day(r.createdAt),
        }),
      },
      {
        key: 'collectors', title: 'Collectors', type: 'CollectorProfile', list: 'collectorProfiles', path: 'collector-profiles',
        fields: 'displayName public createdAt',
        row: (r) => ({
          title: r.displayName, state: r.public ? 'Public' : 'Private', tone: r.public ? 'ok' : 'muted',
          trailing: day(r.createdAt),
        }),
      },
    ],
  },
};
