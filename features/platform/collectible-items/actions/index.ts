'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { keystoneClient } from '../../../dashboard/lib/keystoneClient';
import { parseMajorToMinor } from '../../../lib/minor-units';

const LIST_SELECTION = `
  id displayName specimenCode lifecycleStatus updatedAt
  catalogItem { id title maker year catalogNumber category { name } }
  gradeObservations(orderBy: [{ observedAt: desc }], take: 1) { id reportedGrade gradingCompany { code name } }
  inventoryUnits(take: 1) { id sku status location { code name } }
`;

export async function getItems(
  where: Record<string, unknown> = {},
  take = 50,
  skip = 0,
  orderBy: Array<Record<string, string>> = [{ updatedAt: 'desc' }]
) {
  const response = await keystoneClient<{ items: any[]; count: number }>(
    `query CollectibleItems($where: SpecimenWhereInput, $take: Int!, $skip: Int!, $orderBy: [SpecimenOrderByInput!]) {
      items: specimens(where: $where, take: $take, skip: $skip, orderBy: $orderBy) { ${LIST_SELECTION} }
      count: specimensCount(where: $where)
    }`,
    { where, take, skip, orderBy }
  );
  if (!response.success) return response;

  // Listings point at units one-way, so load the live listing per unit separately.
  const unitIds = response.data.items.map((item) => item.inventoryUnits?.[0]?.id).filter(Boolean);
  let listings: any[] = [];
  if (unitIds.length) {
    const listingResponse = await keystoneClient<{ listings: any[] }>(
      `query ItemListings($ids: [ID!]) {
        listings(where: { inventoryUnit: { id: { in: $ids } } }, orderBy: [{ createdAt: desc }], take: 200) {
          id status format priceMinor currencyCode inventoryUnit { id }
        }
      }`,
      { ids: unitIds }
    );
    if (listingResponse.success) listings = listingResponse.data.listings;
  }
  const items = response.data.items.map((item) => ({
    ...item,
    listing: listings.find((listing) => listing.inventoryUnit?.id === item.inventoryUnits?.[0]?.id) ?? null,
  }));
  return { success: true as const, data: { items, count: response.data.count } };
}

const LIFECYCLE_VALUES = ['intake', 'review', 'available', 'reserved', 'sold', 'returned', 'withdrawn'];

export async function getItemStatusCounts() {
  const fields = LIFECYCLE_VALUES.map(
    (value) => `${value}: specimensCount(where: { lifecycleStatus: { equals: "${value}" } })`
  ).join('\n');
  const response = await keystoneClient<Record<string, number>>(`query ItemStatusCounts { all: specimensCount ${fields} }`);
  return response.success ? response.data : { all: 0 };
}

const RECORD_SELECTION = `
  id displayName specimenCode lifecycleStatus attributeValues createdAt updatedAt
  store { id }
  catalogItem {
    id title handle catalogNumber maker year status
    category { id name }
    franchise { name } collectibleSet { name } release { name edition }
  }
  identifiers(orderBy: [{ observedAt: desc }]) { id type issuer value observedAt }
  media(orderBy: [{ createdAt: desc }]) { id kind url altText visibility source capturedAt }
  conditionObservations(orderBy: [{ observedAt: desc }]) { id sourceType scale label score notes observedAt status publiclyVisible observer { name } }
  gradeObservations(orderBy: [{ observedAt: desc }]) { id reportedGrade reportedLabel certificateReference certificateLookupUrl observedAt verificationState publiclyVisible disclaimer gradingCompany { name code } }
  provenanceEvents(orderBy: [{ occurredAt: desc }]) { id eventType occurredAt recordedAt summary source confidence reviewState publiclyVisible }
  custodyEvents(orderBy: [{ occurredAt: desc }]) { id type occurredAt fromLocation { code name } toLocation { code name } actor { name } }
  valuationObservations(orderBy: [{ observedAt: desc }]) { id amountMinor currencyCode sourceType sourceName sourceReference observedAt confidence publiclyVisible notes disclaimer }
  inventoryUnits {
    id sku ownershipBasis status quantity version acquiredAmountMinor currencyCode
    location { id code name }
    commerceVariant { id sku product { id title handle status } }
    movements(orderBy: [{ occurredAt: desc }], take: 20) { id type fromStatus toStatus reason occurredAt actor { name } fromLocation { code } toLocation { code } }
  }
`;

export async function getItem(id: string) {
  const response = await keystoneClient<{ specimen: any }>(
    `query CollectibleItem($id: ID!) { specimen(where: { id: $id }) { ${RECORD_SELECTION} } }`,
    { id }
  );
  if (!response.success) return response;
  const specimen = response.data.specimen;
  if (!specimen) return { success: true as const, data: null };

  const unitIds = (specimen.inventoryUnits || []).map((unit: any) => unit.id);
  let listings: any[] = [];
  if (unitIds.length) {
    const listingResponse = await keystoneClient<{ listings: any[] }>(
      `query RecordListings($ids: [ID!]) {
        listings(where: { inventoryUnit: { id: { in: $ids } } }, orderBy: [{ createdAt: desc }], take: 20) {
          id title slug status format priceMinor currencyCode publishedAt publicSummary
        }
      }`,
      { ids: unitIds }
    );
    if (listingResponse.success) listings = listingResponse.data.listings;
  }
  return { success: true as const, data: { ...specimen, listings } };
}

export async function getEvidenceOptions() {
  const response = await keystoneClient<{ gradingCompanies: any[]; inventoryLocations: any[] }>(
    `query EvidenceOptions {
      gradingCompanies(where: { active: { equals: true } }, orderBy: [{ name: asc }], take: 100) { id name code }
      inventoryLocations(where: { status: { equals: "active" } }, orderBy: [{ code: asc }], take: 100) { id code name }
    }`
  );
  return response.success ? response.data : { gradingCompanies: [], inventoryLocations: [] };
}

type Result = { success: true } | { success: false; error: string };

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isoOrUndefined = (value: unknown) => {
  if (typeof value !== 'string' || !value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
};
const oneOf = (value: unknown, options: readonly string[]) =>
  typeof value === 'string' && options.includes(value) ? value : undefined;

const MUTATIONS: Record<string, { list: string; input: string }> = {
  identifier: { list: 'createSpecimenIdentifier', input: 'SpecimenIdentifierCreateInput' },
  condition: { list: 'createConditionObservation', input: 'ConditionObservationCreateInput' },
  grade: { list: 'createGradeObservation', input: 'GradeObservationCreateInput' },
  provenance: { list: 'createProvenanceEvent', input: 'ProvenanceEventCreateInput' },
  custody: { list: 'createCustodyEvent', input: 'CustodyEventCreateInput' },
  valuation: { list: 'createValuationObservation', input: 'ValuationObservationCreateInput' },
  media: { list: 'createCollectibleMedia', input: 'CollectibleMediaCreateInput' },
};

/** Appends one evidence record to an item. Evidence is create-only in the schema. */
export async function addItemEvidence(
  kind: string,
  specimenId: string,
  values: Record<string, unknown>
): Promise<Result> {
  const mutation = MUTATIONS[kind];
  if (!mutation || !specimenId) return { success: false, error: 'Unknown record type' };
  const specimen = { connect: { id: specimenId } };
  let data: Record<string, unknown>;

  switch (kind) {
    case 'identifier': {
      const value = text(values.value, 300);
      if (!value) return { success: false, error: 'Identifier value is required' };
      data = { specimen, type: oneOf(values.type, ['operator', 'serial', 'edition', 'manufacturer', 'registry', 'certificate', 'other']) ?? 'other', issuer: text(values.issuer, 200), value };
      break;
    }
    case 'condition': {
      const label = text(values.label, 300);
      if (!label) return { success: false, error: 'Condition label is required' };
      data = {
        specimen, label, scale: text(values.scale, 100), score: text(values.score, 50), notes: text(values.notes, 4000),
        sourceType: oneOf(values.sourceType, ['operator', 'seller', 'buyer', 'provider', 'import']) ?? 'operator',
        status: oneOf(values.status, ['reported', 'reviewed', 'superseded', 'disputed']) ?? 'reported',
        publiclyVisible: values.publiclyVisible === true,
        observedAt: isoOrUndefined(values.observedAt),
      };
      break;
    }
    case 'grade': {
      const reportedGrade = text(values.reportedGrade, 50);
      if (!reportedGrade) return { success: false, error: 'Grade is required' };
      if (typeof values.gradingCompanyId !== 'string' || !values.gradingCompanyId) return { success: false, error: 'Grading company is required' };
      const lookup = text(values.certificateLookupUrl, 500);
      if (lookup && !/^https:\/\//.test(lookup)) return { success: false, error: 'Certificate lookup must be an https URL' };
      data = {
        specimen, reportedGrade, reportedLabel: text(values.reportedLabel, 200),
        gradingCompany: { connect: { id: values.gradingCompanyId } },
        certificateReference: text(values.certificateReference, 160), certificateLookupUrl: lookup,
        verificationState: oneOf(values.verificationState, ['not_checked', 'provider_reported', 'matched', 'mismatch', 'unavailable', 'manual_review']) ?? 'not_checked',
        publiclyVisible: values.publiclyVisible === true,
        observedAt: isoOrUndefined(values.observedAt),
      };
      break;
    }
    case 'provenance': {
      const summary = text(values.summary, 2000);
      if (!summary) return { success: false, error: 'Summary is required' };
      data = {
        specimen, summary, source: text(values.source, 500),
        eventType: oneOf(values.eventType, ['claimed_origin', 'ownership', 'sale', 'exhibition', 'publication', 'restoration', 'loss', 'recovery', 'other']) ?? 'other',
        confidence: oneOf(values.confidence, ['unreviewed', 'low', 'medium', 'high', 'provider_reported']) ?? 'unreviewed',
        reviewState: oneOf(values.reviewState, ['reported', 'reviewed', 'disputed', 'rejected']) ?? 'reported',
        publiclyVisible: values.publiclyVisible === true,
        occurredAt: isoOrUndefined(values.occurredAt),
      };
      break;
    }
    case 'custody': {
      const type = oneOf(values.type, ['intake', 'received', 'stored', 'moved', 'released', 'shipped', 'delivered', 'returned', 'inspection']);
      if (!type) return { success: false, error: 'Custody type is required' };
      data = {
        specimen, type,
        occurredAt: isoOrUndefined(values.occurredAt),
        counterpartyReference: text(values.counterpartyReference, 300),
        idempotencyKey: `custody:${randomUUID()}`,
        ...(typeof values.fromLocationId === 'string' && values.fromLocationId ? { fromLocation: { connect: { id: values.fromLocationId } } } : {}),
        ...(typeof values.toLocationId === 'string' && values.toLocationId ? { toLocation: { connect: { id: values.toLocationId } } } : {}),
      };
      break;
    }
    case 'valuation': {
      const sourceName = text(values.sourceName, 300);
      const currencyCode = text(values.currencyCode, 3).toUpperCase();
      if (!sourceName) return { success: false, error: 'Source name is required' };
      if (!/^[A-Z]{3}$/.test(currencyCode)) return { success: false, error: 'Currency must be a three-letter code' };
      let amountMinor: number;
      try {
        amountMinor = parseMajorToMinor(String(values.amount ?? ''), currencyCode);
      } catch {
        return { success: false, error: 'Enter an exact amount in the currency' };
      }
      data = {
        specimen, amountMinor, currencyCode, sourceName, sourceReference: text(values.sourceReference, 500), notes: text(values.notes, 4000),
        sourceType: oneOf(values.sourceType, ['operator', 'comparable_sale', 'price_guide', 'auction_result', 'provider', 'seller', 'other']) ?? 'operator',
        confidence: oneOf(values.confidence, ['unreviewed', 'low', 'medium', 'high', 'provider_reported']) ?? 'unreviewed',
        publiclyVisible: values.publiclyVisible === true,
        observedAt: isoOrUndefined(values.observedAt),
      };
      break;
    }
    case 'media': {
      const url = text(values.url, 2000);
      if (!/^https:\/\//.test(url)) return { success: false, error: 'Media URL must be an https URL' };
      data = {
        specimen, url, altText: text(values.altText, 300), source: text(values.source, 300),
        kind: oneOf(values.kind, ['image', 'video', 'document', 'scan']) ?? 'image',
        visibility: oneOf(values.visibility, ['public', 'restricted', 'private']) ?? 'restricted',
        ...(typeof values.storeId === 'string' && values.storeId ? { store: { connect: { id: values.storeId } } } : {}),
      };
      break;
    }
    default:
      return { success: false, error: 'Unknown record type' };
  }

  // Drop empty optional strings so Keystone keeps its defaults.
  for (const key of Object.keys(data)) if (data[key] === '' || data[key] === undefined) delete data[key];

  const response = await keystoneClient(
    `mutation AddItemEvidence($data: ${mutation.input}!) { ${mutation.list}(data: $data) { id } }`,
    { data }
  );
  if (!response.success) return { success: false, error: 'Record not saved. Check your permissions and the values.' };
  revalidatePath(`/dashboard/platform/items/${specimenId}`);
  return { success: true };
}

export async function getReceiveOptions(search = '') {
  const term = search.trim().slice(0, 80);
  const response = await keystoneClient<{ productVariants: any[]; collectibleCategories: any[]; stores: any[] }>(
    `query ReceiveOptions($where: ProductVariantWhereInput!) {
      productVariants(where: $where, orderBy: [{ updatedAt: desc }], take: 25) {
        id sku title
        product { id title status }
        prices(where: { priceList: null }) { amount currency { code } }
      }
      collectibleCategories(orderBy: [{ sortOrder: asc }, { name: asc }], take: 200) { id name handle status }
      stores(take: 1) { defaultCurrencyCode }
    }`,
    {
      where: {
        collectibleInventoryUnit: null,
        ...(term
          ? { OR: [{ sku: { contains: term, mode: 'insensitive' } }, { product: { title: { contains: term, mode: 'insensitive' } } }] }
          : {}),
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Options unavailable' };
  return { success: true as const, data: response.data };
}

export async function receiveItem(input: Record<string, unknown>): Promise<{ success: true; id: string | null } | { success: false; error: string }> {
  const code = text(input.code, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return { success: false, error: 'Item code may use letters, numbers, dashes and underscores' };
  if (!text(input.title, 300)) return { success: false, error: 'Title is required' };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(input.category || ''))) return { success: false, error: 'Category handle is invalid' };
  if (!text(input.condition, 300)) return { success: false, error: 'Condition is required' };
  const yearText = text(input.year, 4);
  const year = yearText ? Number(yearText) : undefined;
  if (year !== undefined && (!Number.isInteger(year) || year < 0 || year > 9999)) return { success: false, error: 'Year is invalid' };

  const payload = {
    code,
    title: text(input.title, 300),
    category: String(input.category),
    ...(text(input.categoryName, 120) ? { categoryName: text(input.categoryName, 120) } : {}),
    catalogNumber: text(input.catalogNumber, 120),
    maker: text(input.maker, 200),
    ...(year !== undefined ? { year } : {}),
    condition: text(input.condition, 300),
    variantSku: text(input.variantSku, 128) || undefined,
    publish: input.publish === true,
  };

  const response = await keystoneClient<{ receiveCollectibleItem: { created?: boolean } }>(
    'mutation ReceiveItem($input: JSON!) { receiveCollectibleItem(input: $input) }',
    { input: payload }
  );
  if (!response.success) return { success: false, error: 'Item not received. Check the variant, its price and your permissions.' };
  if (response.data.receiveCollectibleItem?.created === false) return { success: false, error: `Item ${code} already exists` };

  const lookup = await keystoneClient<{ specimens: { id: string }[] }>(
    'query ReceivedItem($code: String!) { specimens(where: { specimenCode: { equals: $code } }, take: 1) { id } }',
    { code }
  );
  revalidatePath('/dashboard/platform/items');
  return { success: true, id: lookup.success ? lookup.data.specimens[0]?.id ?? null : null };
}
