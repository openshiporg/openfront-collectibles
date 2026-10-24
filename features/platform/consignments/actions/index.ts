'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { parseMajorToMinor } from '@/features/lib/minor-units';
import { AGREEMENT_TRANSITIONS, INTAKE_STATUSES, INTAKE_TRANSITIONS, ITEM_TRANSITIONS, canMove } from '../lib/transitions';

type Result<T = unknown> = { success: true; data: T } | { success: false; error: string };

const LIST_SELECTION = `
  id reference status receivedAt createdAt
  consignor { id displayName }
  itemsCount
  agreement { id status }
`;

const DETAIL_SELECTION = `
  id reference status submittedDescription receivedAt createdAt updatedAt
  consignor { id displayName status }
  items {
    id status reserveAmountMinor agreedPriceMinor currencyCode notes createdAt
    specimen { id displayName specimenCode }
    inventoryUnit { id sku status }
  }
  agreement {
    id version status commissionBasisPoints fixedFeeMinor currencyCode pricingAuthority
    startsAt endsAt acceptedAt createdAt
  }
`;

function fail(error: string): Result<never> {
  return { success: false, error };
}

function refresh(id?: string) {
  revalidatePath('/dashboard/platform/consignments');
  if (id) revalidatePath(`/dashboard/platform/consignments/${id}`);
}

export async function getIntakes(where: Record<string, unknown>, take: number, skip: number, orderBy: unknown) {
  const response = await keystoneClient<{ items: any[]; count: number }>(
    `query ConsignmentIntakes($where: ConsignmentIntakeWhereInput!, $take: Int!, $skip: Int!, $orderBy: [ConsignmentIntakeOrderByInput!]!) {
      items: consignmentIntakes(where: $where, take: $take, skip: $skip, orderBy: $orderBy) { ${LIST_SELECTION} }
      count: consignmentIntakesCount(where: $where)
    }`,
    { where, take, skip, orderBy: Array.isArray(orderBy) && orderBy.length ? orderBy : [{ createdAt: 'desc' }] },
  );
  return response.success ? { success: true as const, data: response.data } : fail('Consignments unavailable');
}

export async function getIntakeStatusCounts(): Promise<Result<Record<string, number>>> {
  const fields = INTAKE_STATUSES.map((status, i) => `s${i}: consignmentIntakesCount(where: { status: { equals: "${status}" } })`).join('\n');
  const response = await keystoneClient<Record<string, number>>(`query IntakeCounts { all: consignmentIntakesCount\n${fields} }`);
  if (!response.success) return fail('Counts unavailable');
  const counts: Record<string, number> = { all: response.data.all ?? 0 };
  INTAKE_STATUSES.forEach((status, i) => { counts[status] = response.data[`s${i}`] ?? 0; });
  return { success: true, data: counts };
}

export async function getIntake(id: string) {
  const response = await keystoneClient<{ intake: any }>(
    `query ConsignmentIntake($id: ID!) { intake: consignmentIntake(where: { id: $id }) { ${DETAIL_SELECTION} } }`,
    { id },
  );
  if (!response.success) return fail('Consignment unavailable');
  const intake = response.data.intake;
  if (!intake) return { success: true as const, data: null };

  let settlements: any[] = [];
  if (intake.consignor?.id) {
    const settled = await keystoneClient<{ settlements: any[] }>(
      `query ConsignorSettlements($id: ID!) {
        settlements: consignmentSettlements(where: { consignor: { id: { equals: $id } } }, take: 20, orderBy: [{ createdAt: desc }]) {
          id reference status currencyCode grossAmountMinor feeAmountMinor refundHoldbackMinor payableAmountMinor createdAt
        }
      }`,
      { id: intake.consignor.id },
    );
    if (settled.success) settlements = settled.data.settlements || [];
  }
  return { success: true as const, data: { intake, settlements } };
}

/** Consignors and specimens for the create forms. */
export async function getConsignmentOptions() {
  const response = await keystoneClient<{ consignors: any[]; specimens: any[]; stores: any[] }>(
    `query ConsignmentOptions {
      consignors: sellerProfiles(where: { status: { in: ["applicant", "active", "paused"] } }, take: 200, orderBy: [{ displayName: asc }]) { id displayName status }
      specimens: specimens(take: 200, orderBy: [{ createdAt: desc }]) { id displayName specimenCode }
      stores(take: 1) { id defaultCurrencyCode }
    }`,
  );
  if (!response.success) return fail('Options unavailable');
  return {
    success: true as const,
    data: {
      consignors: response.data.consignors || [],
      specimens: response.data.specimens || [],
      storeId: response.data.stores?.[0]?.id as string | undefined,
      currencyCode: String(response.data.stores?.[0]?.defaultCurrencyCode || 'USD').toUpperCase(),
    },
  };
}

const REFERENCE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/;

export async function createIntake(input: { consignorId: string; reference: string; description?: string }): Promise<Result<{ id: string }>> {
  const reference = String(input.reference || '').trim();
  if (!REFERENCE.test(reference)) return fail('Reference must be 2–64 letters, numbers, dashes or underscores');
  if (!input.consignorId) return fail('Consignor is required');
  const options = await getConsignmentOptions();
  const storeId = options.success ? options.data.storeId : undefined;
  const response = await keystoneClient<{ createConsignmentIntake: { id: string } }>(
    `mutation CreateIntake($data: ConsignmentIntakeCreateInput!) { createConsignmentIntake(data: $data) { id } }`,
    {
      data: {
        reference,
        status: 'submitted',
        submittedDescription: String(input.description || '').slice(0, 4000),
        consignor: { connect: { id: input.consignorId } },
        ...(storeId ? { store: { connect: { id: storeId } } } : {}),
      },
    },
  );
  if (!response.success) return fail('Could not create the consignment. Check the reference is unique.');
  refresh();
  return { success: true, data: { id: response.data.createConsignmentIntake.id } };
}

async function currentStatus(query: string, id: string): Promise<string | null> {
  const response = await keystoneClient<{ record: { status: string } | null }>(query, { id });
  return response.success ? response.data.record?.status ?? null : null;
}

export async function transitionIntake(id: string, to: string): Promise<Result<null>> {
  const from = await currentStatus(`query IntakeStatus($id: ID!) { record: consignmentIntake(where: { id: $id }) { status } }`, id);
  if (!canMove(INTAKE_TRANSITIONS, from, to)) return fail(`Cannot move from ${from ?? 'unknown'} to ${to}`);
  const data: Record<string, unknown> = { status: to };
  if (to === 'received') data.receivedAt = new Date().toISOString();
  const response = await keystoneClient(
    `mutation MoveIntake($id: ID!, $data: ConsignmentIntakeUpdateInput!) { updateConsignmentIntake(where: { id: $id }, data: $data) { id } }`,
    { id, data },
  );
  if (!response.success) return fail('Update rejected');
  refresh(id);
  return { success: true, data: null };
}

function optionalMinor(value: unknown, currency: string): number | undefined {
  const text = String(value ?? '').trim();
  return text ? parseMajorToMinor(text, currency) : undefined;
}

export async function addConsignmentItem(input: {
  intakeId: string;
  specimenId?: string;
  reserve?: string;
  agreedPrice?: string;
  currencyCode: string;
  notes?: string;
}): Promise<Result<null>> {
  const currency = String(input.currencyCode || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return fail('Currency is invalid');
  let reserveAmountMinor: number | undefined;
  let agreedPriceMinor: number | undefined;
  try {
    reserveAmountMinor = optionalMinor(input.reserve, currency);
    agreedPriceMinor = optionalMinor(input.agreedPrice, currency);
  } catch {
    return fail('Enter amounts as exact decimals in the currency');
  }
  const response = await keystoneClient(
    `mutation AddConsignmentItem($data: ConsignmentItemCreateInput!) { createConsignmentItem(data: $data) { id } }`,
    {
      data: {
        intake: { connect: { id: input.intakeId } },
        status: 'pending',
        currencyCode: currency,
        notes: String(input.notes || '').slice(0, 4000),
        ...(reserveAmountMinor !== undefined ? { reserveAmountMinor } : {}),
        ...(agreedPriceMinor !== undefined ? { agreedPriceMinor } : {}),
        ...(input.specimenId ? { specimen: { connect: { id: input.specimenId } } } : {}),
      },
    },
  );
  if (!response.success) return fail('Could not add the item');
  refresh(input.intakeId);
  return { success: true, data: null };
}

export async function transitionConsignmentItem(intakeId: string, itemId: string, to: string): Promise<Result<null>> {
  const from = await currentStatus(`query ConsignmentItemStatus($id: ID!) { record: consignmentItem(where: { id: $id }) { status } }`, itemId);
  if (!canMove(ITEM_TRANSITIONS, from, to)) return fail(`Cannot move from ${from ?? 'unknown'} to ${to}`);
  const response = await keystoneClient(
    `mutation MoveConsignmentItem($id: ID!, $status: String!) { updateConsignmentItem(where: { id: $id }, data: { status: $status }) { id } }`,
    { id: itemId, status: to },
  );
  if (!response.success) return fail('Update rejected');
  refresh(intakeId);
  return { success: true, data: null };
}

export async function createAgreement(input: {
  intakeId: string;
  commissionPercent: string;
  fixedFee?: string;
  currencyCode: string;
  pricingAuthority: string;
  startsAt?: string;
  endsAt?: string;
}): Promise<Result<null>> {
  const currency = String(input.currencyCode || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return fail('Currency is invalid');
  // Percent with up to two decimals → integer basis points, without floating point.
  const percent = String(input.commissionPercent || '').trim();
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(percent);
  if (!match) return fail('Commission must be a percentage with up to two decimals');
  const basisPoints = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (basisPoints > 10000) return fail('Commission cannot exceed 100%');
  if (!['operator', 'consignor', 'mutual'].includes(input.pricingAuthority)) return fail('Pricing authority is invalid');
  let fixedFeeMinor = 0;
  try {
    fixedFeeMinor = optionalMinor(input.fixedFee, currency) ?? 0;
  } catch {
    return fail('Enter the fixed fee as an exact decimal');
  }
  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if ((startsAt && !Number.isFinite(startsAt.getTime())) || (endsAt && !Number.isFinite(endsAt.getTime()))) return fail('Dates are invalid');
  if (startsAt && endsAt && endsAt <= startsAt) return fail('End date must be after the start date');

  const current = await keystoneClient<{ intake: any }>(
    `query IntakeAgreement($id: ID!) { intake: consignmentIntake(where: { id: $id }) { id consignor { id } agreement { id version status } } }`,
    { id: input.intakeId },
  );
  if (!current.success || !current.data.intake) return fail('Consignment not found');
  const existing = current.data.intake.agreement;
  if (existing && !['expired', 'terminated'].includes(existing.status)) return fail('This consignment already has an open agreement');

  const response = await keystoneClient(
    `mutation CreateAgreement($data: ConsignmentAgreementCreateInput!) { createConsignmentAgreement(data: $data) { id } }`,
    {
      data: {
        intake: { connect: { id: input.intakeId } },
        ...(current.data.intake.consignor?.id ? { consignor: { connect: { id: current.data.intake.consignor.id } } } : {}),
        version: (existing?.version ?? 0) + 1,
        status: 'draft',
        commissionBasisPoints: basisPoints,
        fixedFeeMinor,
        currencyCode: currency,
        pricingAuthority: input.pricingAuthority,
        ...(startsAt ? { startsAt: startsAt.toISOString() } : {}),
        ...(endsAt ? { endsAt: endsAt.toISOString() } : {}),
        termsSnapshot: { commissionBasisPoints: basisPoints, fixedFeeMinor, currencyCode: currency, pricingAuthority: input.pricingAuthority },
      },
    },
  );
  if (!response.success) return fail('Could not create the agreement');
  refresh(input.intakeId);
  return { success: true, data: null };
}

export async function transitionAgreement(intakeId: string, agreementId: string, to: string): Promise<Result<null>> {
  const from = await currentStatus(`query AgreementStatus($id: ID!) { record: consignmentAgreement(where: { id: $id }) { status } }`, agreementId);
  if (!canMove(AGREEMENT_TRANSITIONS, from, to)) return fail(`Cannot move from ${from ?? 'unknown'} to ${to}`);
  const data: Record<string, unknown> = { status: to };
  if (to === 'accepted') data.acceptedAt = new Date().toISOString();
  const response = await keystoneClient(
    `mutation MoveAgreement($id: ID!, $data: ConsignmentAgreementUpdateInput!) { updateConsignmentAgreement(where: { id: $id }, data: $data) { id } }`,
    { id: agreementId, data },
  );
  if (!response.success) return fail('Update rejected');
  refresh(intakeId);
  return { success: true, data: null };
}
