'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '../../../dashboard/lib/keystoneClient';
import { canTransition, DISPUTE_STATUSES, DISPUTE_TYPES } from '../lib/lifecycle';

const LIST_SELECTION = `
  id type status summary createdAt updatedAt
  order { id displayId email total }
  assignedTo { id name email }
  openedBy { id name }
  evidenceCount
`;

export async function getDisputes(where: Record<string, unknown> = {}, take = 50, skip = 0, orderBy: unknown = [{ createdAt: 'desc' }]) {
  const response = await keystoneClient(
    `query Disputes($where: DisputeCaseWhereInput!, $take: Int!, $skip: Int!, $orderBy: [DisputeCaseOrderByInput!]!) {
      items: disputeCases(where: $where, take: $take, skip: $skip, orderBy: $orderBy) { ${LIST_SELECTION} }
      count: disputeCasesCount(where: $where)
    }`,
    { where, take, skip, orderBy }
  );
  if (!response.success) return { success: false as const, error: response.error };
  return { success: true as const, data: { items: response.data.items ?? [], count: response.data.count ?? 0 } };
}

export async function getDisputeCounts() {
  const fields = DISPUTE_STATUSES.map((s, i) => `s${i}: disputeCasesCount(where: { status: { equals: "${s.value}" } })`).join('\n');
  const response = await keystoneClient(`query DisputeCounts { all: disputeCasesCount ${fields} }`);
  if (!response.success) return { all: 0, statuses: {} as Record<string, number> };
  const statuses: Record<string, number> = {};
  DISPUTE_STATUSES.forEach((s, i) => { statuses[s.value] = Number(response.data[`s${i}`]) || 0; });
  return { all: Number(response.data.all) || 0, statuses };
}

export async function getDispute(id: string) {
  const response = await keystoneClient(
    `query Dispute($id: ID!) {
      disputeCase(where: { id: $id }) {
        id type status summary resolution createdAt updatedAt
        openedBy { id name email }
        assignedTo { id name email }
        order {
          id displayId status email total subtotal shipping createdAt
          user { id name email }
          lineItems { id title quantity sku variantTitle formattedTotal }
        }
        return { id status }
        evidence(orderBy: [{ createdAt: desc }]) { id url type createdAt uploadedBy { id name } }
      }
    }`,
    { id }
  );
  if (!response.success) return { success: false as const, error: response.error };
  return { success: true as const, data: response.data.disputeCase };
}

/** Recent orders and staff users for the open-case and assign controls. */
export async function getDisputeFormOptions() {
  const response = await keystoneClient(
    `query DisputeOptions {
      orders(take: 50, orderBy: [{ createdAt: desc }]) { id displayId email total }
      users(where: { role: { canAccessDashboard: { equals: true } } }, take: 100, orderBy: [{ name: asc }]) { id name email }
    }`
  );
  if (!response.success) return { orders: [], staff: [] };
  return { orders: response.data.orders ?? [], staff: response.data.users ?? [] };
}

async function currentUserId(): Promise<string | null> {
  const response = await keystoneClient(`query Me { authenticatedItem { ... on User { id } } }`);
  return response.success ? response.data?.authenticatedItem?.id ?? null : null;
}

function refresh(id?: string) {
  revalidatePath('/dashboard/platform/disputes');
  if (id) revalidatePath(`/dashboard/platform/disputes/${id}`);
}

export async function openDispute(input: { orderId: string; type: string; summary: string }) {
  const summary = String(input.summary || '').trim();
  if (!input.orderId) return { success: false as const, error: 'Order is required' };
  if (!DISPUTE_TYPES.some((t) => t.value === input.type)) return { success: false as const, error: 'Type is invalid' };
  if (!summary || summary.length > 4000) return { success: false as const, error: 'Summary is required' };
  const me = await currentUserId();
  const response = await keystoneClient(
    `mutation OpenDispute($data: DisputeCaseCreateInput!) { createDisputeCase(data: $data) { id } }`,
    {
      data: {
        order: { connect: { id: input.orderId } },
        type: input.type,
        status: 'open',
        summary,
        ...(me ? { openedBy: { connect: { id: me } } } : {}),
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Case could not be opened' };
  refresh();
  return { success: true as const, id: response.data.createDisputeCase.id as string };
}

export async function transitionDispute(id: string, to: string, resolution?: string) {
  const current = await keystoneClient(`query DisputeState($id: ID!) { disputeCase(where: { id: $id }) { id status resolution } }`, { id });
  if (!current.success || !current.data.disputeCase) return { success: false as const, error: 'Case not found' };
  const from = current.data.disputeCase.status;
  if (!canTransition(from, to)) return { success: false as const, error: 'That status change is not allowed' };
  const text = String(resolution ?? current.data.disputeCase.resolution ?? '').trim();
  if (to === 'resolved' && !text) return { success: false as const, error: 'Resolution is required to resolve' };
  const response = await keystoneClient(
    `mutation MoveDispute($id: ID!, $data: DisputeCaseUpdateInput!) { updateDisputeCase(where: { id: $id }, data: $data) { id status } }`,
    { id, data: { status: to, ...(to === 'resolved' ? { resolution: text.slice(0, 4000) } : {}) } }
  );
  if (!response.success) return { success: false as const, error: 'Status could not be changed' };
  refresh(id);
  return { success: true as const };
}

export async function assignDispute(id: string, userId: string | null) {
  const response = await keystoneClient(
    `mutation AssignDispute($id: ID!, $data: DisputeCaseUpdateInput!) { updateDisputeCase(where: { id: $id }, data: $data) { id } }`,
    { id, data: { assignedTo: userId ? { connect: { id: userId } } : { disconnect: true } } }
  );
  if (!response.success) return { success: false as const, error: 'Assignee could not be changed' };
  refresh(id);
  return { success: true as const };
}

export async function addDisputeEvidence(id: string, input: { url: string; type: string }) {
  const url = String(input.url || '').trim();
  if (!/^https?:\/\/\S+$/i.test(url) || url.length > 2000) return { success: false as const, error: 'Enter a full http(s) link' };
  const me = await currentUserId();
  const response = await keystoneClient(
    `mutation AddEvidence($data: EvidenceAttachmentCreateInput!) { createEvidenceAttachment(data: $data) { id } }`,
    {
      data: {
        dispute: { connect: { id } },
        url,
        type: String(input.type || '').trim().slice(0, 120) || null,
        ...(me ? { uploadedBy: { connect: { id: me } } } : {}),
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Evidence could not be added' };
  refresh(id);
  return { success: true as const };
}
