'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '../../../dashboard/lib/keystoneClient';
import { canMoveSeller, IDENTITY_STATES, SELLER_STATUSES } from '../lib/lifecycle';

export async function getSellers(where: Record<string, unknown> = {}, take = 25, skip = 0, orderBy: unknown = [{ createdAt: 'desc' }]) {
  const response = await keystoneClient(
    `query Sellers($where: SellerProfileWhereInput!, $take: Int!, $skip: Int!, $orderBy: [SellerProfileOrderByInput!]!) {
      items: sellerProfiles(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        id displayName status identityEvidenceState createdAt user { id name email }
      }
      count: sellerProfilesCount(where: $where)
    }`,
    { where, take, skip, orderBy }
  );
  if (!response.success) return { success: false as const, error: response.error };
  const items: any[] = response.data.items ?? [];
  // SellerProfile has no back-relation to intakes, so count them per seller.
  if (items.length) {
    const fields = items.map((s, i) => `c${i}: consignmentIntakesCount(where: { consignor: { id: { equals: "${s.id}" } } })`).join('\n');
    const counts = await keystoneClient(`query SellerIntakeCounts { ${fields} }`);
    items.forEach((s, i) => { s.intakeCount = counts.success ? Number(counts.data[`c${i}`]) || 0 : null; });
  }
  return { success: true as const, data: { items, count: response.data.count ?? 0 } };
}

export async function getSellerCounts() {
  const fields = SELLER_STATUSES.map((s, i) => `s${i}: sellerProfilesCount(where: { status: { equals: "${s.value}" } })`).join('\n');
  const response = await keystoneClient(`query SellerCounts { all: sellerProfilesCount ${fields} }`);
  if (!response.success) return { all: 0, statuses: {} as Record<string, number> };
  const statuses: Record<string, number> = {};
  SELLER_STATUSES.forEach((s, i) => { statuses[s.value] = Number(response.data[`s${i}`]) || 0; });
  return { all: Number(response.data.all) || 0, statuses };
}

export async function getSeller(id: string) {
  const response = await keystoneClient(
    `query Seller($id: ID!, $where: ConsignmentIntakeWhereInput!, $settlements: ConsignmentSettlementWhereInput!) {
      sellerProfile(where: { id: $id }) {
        id displayName status publicBio identityEvidenceState createdAt updatedAt user { id name email }
      }
      intakes: consignmentIntakes(where: $where, take: 50, orderBy: [{ createdAt: desc }]) {
        id reference status receivedAt createdAt itemsCount agreement { id status commissionBasisPoints }
      }
      settlements: consignmentSettlements(where: $settlements, take: 50, orderBy: [{ createdAt: desc }]) {
        id reference status currencyCode grossAmountMinor feeAmountMinor payableAmountMinor createdAt
      }
    }`,
    { id, where: { consignor: { id: { equals: id } } }, settlements: { consignor: { id: { equals: id } } } }
  );
  if (!response.success) return { success: false as const, error: response.error };
  return {
    success: true as const,
    data: response.data.sellerProfile ? { ...response.data.sellerProfile, intakes: response.data.intakes ?? [], settlements: response.data.settlements ?? [] } : null,
  };
}

function refresh(id?: string) {
  revalidatePath('/dashboard/platform/sellers');
  if (id) revalidatePath(`/dashboard/platform/sellers/${id}`);
}

export async function createSeller(input: { displayName: string; userEmail?: string; publicBio?: string }) {
  const displayName = String(input.displayName || '').trim();
  if (!displayName || displayName.length > 200) return { success: false as const, error: 'Display name is required' };
  let userId: string | null = null;
  const email = String(input.userEmail || '').trim().toLowerCase();
  if (email) {
    const users = await keystoneClient(`query SellerUser($email: String!) { users(where: { email: { equals: $email } }, take: 1) { id } }`, { email });
    userId = users.success ? users.data.users?.[0]?.id ?? null : null;
    if (!userId) return { success: false as const, error: 'No account with that email' };
  }
  const response = await keystoneClient(
    `mutation CreateSeller($data: SellerProfileCreateInput!) { createSellerProfile(data: $data) { id } }`,
    {
      data: {
        displayName,
        status: 'applicant',
        publicBio: String(input.publicBio || '').trim().slice(0, 4000) || null,
        ...(userId ? { user: { connect: { id: userId } } } : {}),
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Seller could not be created' };
  refresh();
  return { success: true as const, id: response.data.createSellerProfile.id as string };
}

async function updateSeller(id: string, data: Record<string, unknown>, failure: string) {
  const response = await keystoneClient(
    `mutation UpdateSeller($id: ID!, $data: SellerProfileUpdateInput!) { updateSellerProfile(where: { id: $id }, data: $data) { id } }`,
    { id, data }
  );
  if (!response.success) return { success: false as const, error: failure };
  refresh(id);
  return { success: true as const };
}

export async function moveSeller(id: string, to: string) {
  const current = await keystoneClient(`query SellerState($id: ID!) { sellerProfile(where: { id: $id }) { id status } }`, { id });
  if (!current.success || !current.data.sellerProfile) return { success: false as const, error: 'Seller not found' };
  if (!canMoveSeller(current.data.sellerProfile.status, to)) return { success: false as const, error: 'That status change is not allowed' };
  return updateSeller(id, { status: to }, 'Status could not be changed');
}

export async function setSellerIdentityState(id: string, state: string) {
  if (!IDENTITY_STATES.some((s) => s.value === state)) return { success: false as const, error: 'Identity state is invalid' };
  return updateSeller(id, { identityEvidenceState: state }, 'Identity state could not be changed');
}

export async function setSellerBio(id: string, publicBio: string) {
  return updateSeller(id, { publicBio: String(publicBio || '').trim().slice(0, 4000) || null }, 'Bio could not be saved');
}
