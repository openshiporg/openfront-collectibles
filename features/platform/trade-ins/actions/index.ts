'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { parseMajorToMinor } from '@/features/lib/minor-units';
import { QUOTABLE, SUBMISSION_STATUSES, canMove } from '../lib/transitions';

type Result<T = unknown> = { success: true; data: T } | { success: false; error: string };

const LIST_SELECTION = `
  id reference status disposition createdAt
  customer { id name email }
  itemsCount
  items { id quotedAmountMinor currencyCode }
`;

const DETAIL_SELECTION = `
  id reference status disposition createdAt updatedAt
  customer { id name email }
  items {
    id customerDescription customerCondition quotedAmountMinor acceptedAmountMinor currencyCode createdAt
    catalogItem { id title catalogNumber maker year }
    specimen { id displayName specimenCode }
    inspectedConditionObservation { id label score observedAt }
  }
`;

function fail(error: string): Result<never> {
  return { success: false, error };
}

function refresh(id?: string) {
  revalidatePath('/dashboard/platform/trade-ins');
  if (id) revalidatePath(`/dashboard/platform/trade-ins/${id}`);
}

export async function getSubmissions(where: Record<string, unknown>, take: number, skip: number, orderBy: unknown) {
  const response = await keystoneClient<{ items: any[]; count: number }>(
    `query TradeInSubmissions($where: TradeInSubmissionWhereInput!, $take: Int!, $skip: Int!, $orderBy: [TradeInSubmissionOrderByInput!]!) {
      items: tradeInSubmissions(where: $where, take: $take, skip: $skip, orderBy: $orderBy) { ${LIST_SELECTION} }
      count: tradeInSubmissionsCount(where: $where)
    }`,
    { where, take, skip, orderBy: Array.isArray(orderBy) && orderBy.length ? orderBy : [{ createdAt: 'desc' }] },
  );
  return response.success ? { success: true as const, data: response.data } : fail('Trade-ins unavailable');
}

export async function getSubmissionStatusCounts(): Promise<Result<Record<string, number>>> {
  const fields = SUBMISSION_STATUSES.map((status, i) => `s${i}: tradeInSubmissionsCount(where: { status: { equals: "${status}" } })`).join('\n');
  const response = await keystoneClient<Record<string, number>>(`query TradeInCounts { all: tradeInSubmissionsCount\n${fields} }`);
  if (!response.success) return fail('Counts unavailable');
  const counts: Record<string, number> = { all: response.data.all ?? 0 };
  SUBMISSION_STATUSES.forEach((status, i) => { counts[status] = response.data[`s${i}`] ?? 0; });
  return { success: true, data: counts };
}

export async function getSubmission(id: string) {
  const response = await keystoneClient<{ submission: any }>(
    `query TradeInSubmission($id: ID!) { submission: tradeInSubmission(where: { id: $id }) { ${DETAIL_SELECTION} } }`,
    { id },
  );
  if (!response.success) return fail('Trade-in unavailable');
  const submission = response.data.submission;
  if (!submission) return { success: true as const, data: null };

  // Active buylist offers for the catalogue items in this submission.
  const catalogIds = [...new Set((submission.items || []).map((i: any) => i.catalogItem?.id).filter(Boolean))];
  let offers: Record<string, { offerAmountMinor: number; currencyCode: string; buylist: string; maximumQuantity: number | null }> = {};
  if (catalogIds.length) {
    const entries = await keystoneClient<{ entries: any[] }>(
      `query BuylistOffers($ids: [ID!]!) {
        entries: buylistEntries(
          where: { active: { equals: "active" }, buylist: { status: { equals: "active" } }, catalogItem: { id: { in: $ids } } }
          take: 100
        ) { offerAmountMinor maximumQuantity catalogItem { id } buylist { name currencyCode } }
      }`,
      { ids: catalogIds },
    );
    if (entries.success) {
      for (const entry of entries.data.entries || []) {
        const key = entry.catalogItem?.id;
        // Keep the best offer when several active buylists want the same item.
        if (key && (!offers[key] || entry.offerAmountMinor > offers[key].offerAmountMinor)) {
          offers[key] = {
            offerAmountMinor: entry.offerAmountMinor,
            currencyCode: entry.buylist?.currencyCode,
            buylist: entry.buylist?.name,
            maximumQuantity: entry.maximumQuantity ?? null,
          };
        }
      }
    }
  }
  return { success: true as const, data: { submission, offers } };
}

export async function getTradeInOptions() {
  const response = await keystoneClient<{ customers: any[]; catalogItems: any[]; stores: any[] }>(
    `query TradeInOptions {
      customers: users(take: 200, orderBy: [{ createdAt: desc }]) { id name email }
      catalogItems(where: { status: { in: ["draft", "active"] } }, take: 300, orderBy: [{ title: asc }]) { id title catalogNumber year }
      stores(take: 1) { id defaultCurrencyCode }
    }`,
  );
  if (!response.success) return fail('Options unavailable');
  return {
    success: true as const,
    data: {
      customers: response.data.customers || [],
      catalogItems: response.data.catalogItems || [],
      storeId: response.data.stores?.[0]?.id as string | undefined,
      currencyCode: String(response.data.stores?.[0]?.defaultCurrencyCode || 'USD').toUpperCase(),
    },
  };
}

const REFERENCE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/;

export async function createSubmission(input: { customerId: string; reference: string; disposition: string }): Promise<Result<{ id: string }>> {
  const reference = String(input.reference || '').trim();
  if (!REFERENCE.test(reference)) return fail('Reference must be 2–64 letters, numbers, dashes or underscores');
  if (!input.customerId) return fail('Customer is required');
  if (!['cash', 'store_credit', 'trade'].includes(input.disposition)) return fail('Payout type is invalid');
  const options = await getTradeInOptions();
  const storeId = options.success ? options.data.storeId : undefined;
  const response = await keystoneClient<{ createTradeInSubmission: { id: string } }>(
    `mutation CreateTradeIn($data: TradeInSubmissionCreateInput!) { createTradeInSubmission(data: $data) { id } }`,
    {
      data: {
        reference,
        status: 'draft',
        disposition: input.disposition,
        customer: { connect: { id: input.customerId } },
        ...(storeId ? { store: { connect: { id: storeId } } } : {}),
      },
    },
  );
  if (!response.success) return fail('Could not create the trade-in. Check the reference is unique.');
  refresh();
  return { success: true, data: { id: response.data.createTradeInSubmission.id } };
}

async function loadState(id: string) {
  const response = await keystoneClient<{ submission: any }>(
    `query TradeInState($id: ID!) { submission: tradeInSubmission(where: { id: $id }) { id status items { id quotedAmountMinor acceptedAmountMinor } } }`,
    { id },
  );
  return response.success ? response.data.submission : null;
}

export async function transitionSubmission(id: string, to: string): Promise<Result<null>> {
  const submission = await loadState(id);
  if (!submission) return fail('Trade-in not found');
  if (!canMove(submission.status, to)) return fail(`Cannot move from ${submission.status} to ${to}`);
  const items: any[] = submission.items || [];
  if (to === 'submitted' && items.length === 0) return fail('Add at least one item first');
  if (to === 'quoted' && (items.length === 0 || items.some((i) => i.quotedAmountMinor == null))) return fail('Quote every item first');

  // Accepting fixes the amounts: items without an accepted amount take their quote.
  if (to === 'accepted') {
    for (const item of items) {
      if (item.acceptedAmountMinor == null && item.quotedAmountMinor != null) {
        const updated = await keystoneClient(
          `mutation AcceptQuote($id: ID!, $amount: Int!) { updateTradeInItem(where: { id: $id }, data: { acceptedAmountMinor: $amount }) { id } }`,
          { id: item.id, amount: item.quotedAmountMinor },
        );
        if (!updated.success) return fail('Could not record the accepted amounts');
      }
    }
  }

  const response = await keystoneClient(
    `mutation MoveTradeIn($id: ID!, $status: String!) { updateTradeInSubmission(where: { id: $id }, data: { status: $status }) { id } }`,
    { id, status: to },
  );
  if (!response.success) return fail('Update rejected');
  refresh(id);
  return { success: true, data: null };
}

export async function addTradeInItem(input: {
  submissionId: string;
  catalogItemId?: string;
  description: string;
  condition?: string;
}): Promise<Result<null>> {
  const submission = await loadState(input.submissionId);
  if (!submission) return fail('Trade-in not found');
  if (!['draft', 'submitted', 'received', 'inspecting'].includes(submission.status)) return fail('Items can no longer be added');
  const description = String(input.description || '').trim();
  if (!description && !input.catalogItemId) return fail('Choose a catalogue item or describe the item');
  const response = await keystoneClient(
    `mutation AddTradeInItem($data: TradeInItemCreateInput!) { createTradeInItem(data: $data) { id } }`,
    {
      data: {
        submission: { connect: { id: input.submissionId } },
        customerDescription: description.slice(0, 4000),
        customerCondition: String(input.condition || '').trim().slice(0, 300),
        ...(input.catalogItemId ? { catalogItem: { connect: { id: input.catalogItemId } } } : {}),
      },
    },
  );
  if (!response.success) return fail('Could not add the item');
  refresh(input.submissionId);
  return { success: true, data: null };
}

export async function quoteTradeInItem(input: { submissionId: string; itemId: string; amount: string; currencyCode: string }): Promise<Result<null>> {
  const submission = await loadState(input.submissionId);
  if (!submission) return fail('Trade-in not found');
  if (!QUOTABLE.has(submission.status)) return fail('Quotes can be changed only while received or inspecting');
  if (!(submission.items || []).some((i: any) => i.id === input.itemId)) return fail('Item not found');
  const currency = String(input.currencyCode || '').toUpperCase();
  let amount: number;
  try {
    amount = parseMajorToMinor(String(input.amount || '').trim(), currency);
  } catch {
    return fail('Enter the quote as an exact decimal in the currency');
  }
  const response = await keystoneClient(
    `mutation QuoteTradeInItem($id: ID!, $data: TradeInItemUpdateInput!) { updateTradeInItem(where: { id: $id }, data: $data) { id } }`,
    { id: input.itemId, data: { quotedAmountMinor: amount, currencyCode: currency } },
  );
  if (!response.success) return fail('Update rejected');
  refresh(input.submissionId);
  return { success: true, data: null };
}

export async function setAcceptedAmount(input: { submissionId: string; itemId: string; amount: string; currencyCode: string }): Promise<Result<null>> {
  const submission = await loadState(input.submissionId);
  if (!submission) return fail('Trade-in not found');
  if (submission.status !== 'quoted') return fail('Accepted amounts are set while the quote is open');
  if (!(submission.items || []).some((i: any) => i.id === input.itemId)) return fail('Item not found');
  let amount: number;
  try {
    amount = parseMajorToMinor(String(input.amount || '').trim(), String(input.currencyCode || '').toUpperCase());
  } catch {
    return fail('Enter the amount as an exact decimal in the currency');
  }
  const response = await keystoneClient(
    `mutation AcceptTradeInItem($id: ID!, $amount: Int!) { updateTradeInItem(where: { id: $id }, data: { acceptedAmountMinor: $amount }) { id } }`,
    { id: input.itemId, amount },
  );
  if (!response.success) return fail('Update rejected');
  refresh(input.submissionId);
  return { success: true, data: null };
}

/** Records an operator condition observation on the linked item record and ties it to the trade-in item. */
export async function recordInspection(input: {
  submissionId: string;
  itemId: string;
  specimenId: string;
  label: string;
  score?: string;
  notes?: string;
}): Promise<Result<null>> {
  const submission = await loadState(input.submissionId);
  if (!submission) return fail('Trade-in not found');
  if (!QUOTABLE.has(submission.status)) return fail('Inspections are recorded while received or inspecting');
  const label = String(input.label || '').trim();
  if (!label) return fail('Condition is required');
  if (!input.specimenId) return fail('Link an item record first');
  const observation = await keystoneClient<{ createConditionObservation: { id: string } }>(
    `mutation InspectTradeIn($data: ConditionObservationCreateInput!) { createConditionObservation(data: $data) { id } }`,
    {
      data: {
        specimen: { connect: { id: input.specimenId } },
        sourceType: 'operator',
        status: 'reviewed',
        label: label.slice(0, 300),
        score: String(input.score || '').trim().slice(0, 40),
        notes: String(input.notes || '').trim().slice(0, 4000),
        publiclyVisible: false,
      },
    },
  );
  if (!observation.success) return fail('Could not record the inspection');
  const linked = await keystoneClient(
    `mutation LinkInspection($id: ID!, $obs: ID!) { updateTradeInItem(where: { id: $id }, data: { inspectedConditionObservation: { connect: { id: $obs } } }) { id } }`,
    { id: input.itemId, obs: observation.data.createConditionObservation.id },
  );
  if (!linked.success) return fail('Inspection saved but not linked to the item');
  refresh(input.submissionId);
  return { success: true, data: null };
}

/** Links an existing item record (specimen) to a trade-in item so it can be inspected. */
export async function linkSpecimen(input: { submissionId: string; itemId: string; specimenId: string }): Promise<Result<null>> {
  if (!input.specimenId) return fail('Choose an item record');
  const response = await keystoneClient(
    `mutation LinkTradeInSpecimen($id: ID!, $specimen: ID!) { updateTradeInItem(where: { id: $id }, data: { specimen: { connect: { id: $specimen } } }) { id } }`,
    { id: input.itemId, specimen: input.specimenId },
  );
  if (!response.success) return fail('Update rejected');
  refresh(input.submissionId);
  return { success: true, data: null };
}

export async function getSpecimenOptions() {
  const response = await keystoneClient<{ specimens: any[] }>(
    `query TradeInSpecimens { specimens(take: 200, orderBy: [{ createdAt: desc }]) { id displayName specimenCode } }`,
  );
  return response.success ? response.data.specimens || [] : [];
}
