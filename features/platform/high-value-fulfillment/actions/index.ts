'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '../../../dashboard/lib/keystoneClient';
import { parseMajorToMinor } from '../../../lib/minor-units';
import { EVIDENCE_TYPES, OPEN_ORDER_STATUSES, type QueueKey } from '../lib/constants';

const ORDER_ROW = `id displayId status email total rawTotal createdAt currency { code } user { id name email } lineItemsCount fulfillmentsCount`;

/** Order ids that already have at least one requirement (requirements are few per order). */
async function ordersWithRequirements(): Promise<string[]> {
  const response = await keystoneClient(`query RequirementOrders { fulfillmentRequirements(take: 1000, orderBy: [{ createdAt: desc }]) { order { id } } }`);
  if (!response.success) return [];
  return [...new Set<string>((response.data.fulfillmentRequirements ?? []).map((r: any) => r.order?.id).filter(Boolean))];
}

export async function getFulfillmentQueue(queue: QueueKey, take = 25, skip = 0) {
  const withRequirements = await ordersWithRequirements();
  const open = { status: { in: OPEN_ORDER_STATUSES } };
  const where =
    queue === 'needs' ? { AND: [open, { id: { notIn: withRequirements } }] }
    : queue === 'set' ? { AND: [open, { id: { in: withRequirements } }] }
    : open;
  const response = await keystoneClient(
    `query FulfillmentQueue($where: OrderWhereInput!, $take: Int!, $skip: Int!, $needs: OrderWhereInput!, $set: OrderWhereInput!, $all: OrderWhereInput!) {
      items: orders(where: $where, take: $take, skip: $skip, orderBy: [{ createdAt: desc }]) { ${ORDER_ROW} }
      count: ordersCount(where: $where)
      needs: ordersCount(where: $needs)
      set: ordersCount(where: $set)
      all: ordersCount(where: $all)
    }`,
    {
      where, take, skip,
      needs: { AND: [open, { id: { notIn: withRequirements } }] },
      set: { AND: [open, { id: { in: withRequirements } }] },
      all: open,
    }
  );
  if (!response.success) return { success: false as const, error: response.error };
  const ids = new Set(withRequirements);
  return {
    success: true as const,
    data: {
      items: (response.data.items ?? []).map((o: any) => ({ ...o, hasRequirement: ids.has(o.id) })),
      count: response.data.count ?? 0,
      counts: { needs: response.data.needs ?? 0, set: response.data.set ?? 0, all: response.data.all ?? 0 },
    },
  };
}

export async function getOrderFulfillment(orderId: string) {
  const response = await keystoneClient(
    `query OrderFulfillment($id: ID!, $req: FulfillmentRequirementWhereInput!) {
      order(where: { id: $id }) {
        id displayId status email total createdAt currency { code }
        user { id name email }
        shippingAddress { firstName lastName address1 address2 city province postalCode country { iso2 name } }
        lineItems { id title quantity sku variantTitle formattedTotal }
        fulfillments(orderBy: [{ createdAt: desc }]) { id shippedAt canceledAt createdAt shippingLabels { id carrier trackingNumber status } }
      }
      requirements: fulfillmentRequirements(where: $req, orderBy: [{ createdAt: desc }]) {
        id declaredValueMinor currencyCode signatureRequired insuranceRequested insuranceProviderReference packagingInstructions createdAt
        orderLineItem { id title }
      }
    }`,
    { id: orderId, req: { order: { id: { equals: orderId } } } }
  );
  if (!response.success) return { success: false as const, error: response.error };
  if (!response.data.order) return { success: true as const, data: null };
  const requirements: any[] = response.data.requirements ?? [];
  let evidence: any[] = [];
  if (requirements.length) {
    const ev = await keystoneClient(
      `query ShipmentEvidence($where: ShipmentEvidenceWhereInput!) {
        shipmentEvidences(where: $where, orderBy: [{ observedAt: desc }], take: 200) {
          id type provider providerReference observedAt status publicSummary disclaimer requirement { id } fulfillment { id }
        }
      }`,
      { where: { requirement: { id: { in: requirements.map((r) => r.id) } } } }
    );
    evidence = ev.success ? ev.data.shipmentEvidences ?? [] : [];
  }
  return { success: true as const, data: { order: response.data.order, requirements, evidence } };
}

function refresh(orderId: string) {
  revalidatePath('/dashboard/platform/high-value-fulfillment');
  revalidatePath(`/dashboard/platform/high-value-fulfillment/${orderId}`);
}

export async function createRequirement(orderId: string, input: {
  declaredValue: string;
  signatureRequired: boolean;
  insuranceRequested: boolean;
  insuranceProviderReference?: string;
  packagingInstructions?: string;
  orderLineItemId?: string;
}) {
  const order = await keystoneClient(`query ReqOrder($id: ID!) { order(where: { id: $id }) { id currency { code } } }`, { id: orderId });
  const currency = String(order.success ? order.data.order?.currency?.code || '' : '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { success: false as const, error: 'Order currency is unavailable' };
  let declaredValueMinor: number;
  try {
    declaredValueMinor = parseMajorToMinor(String(input.declaredValue || '').trim(), currency);
  } catch {
    return { success: false as const, error: `Enter the declared value in ${currency}` };
  }
  const reference = String(input.insuranceProviderReference || '').trim().slice(0, 200);
  if (input.insuranceRequested && !reference) return { success: false as const, error: 'Insurance provider reference is required when insurance is requested' };
  const response = await keystoneClient(
    `mutation CreateRequirement($data: FulfillmentRequirementCreateInput!) { createFulfillmentRequirement(data: $data) { id } }`,
    {
      data: {
        order: { connect: { id: orderId } },
        ...(input.orderLineItemId ? { orderLineItem: { connect: { id: input.orderLineItemId } } } : {}),
        declaredValueMinor,
        currencyCode: currency,
        signatureRequired: !!input.signatureRequired,
        insuranceRequested: !!input.insuranceRequested,
        insuranceProviderReference: reference || null,
        packagingInstructions: String(input.packagingInstructions || '').trim().slice(0, 4000) || null,
        policySnapshot: { recordedFrom: 'high-value-fulfillment', recordedAt: new Date().toISOString() },
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Requirements could not be saved' };
  refresh(orderId);
  return { success: true as const };
}

export async function recordShipmentEvidence(orderId: string, input: {
  requirementId: string;
  type: string;
  provider: string;
  providerReference?: string;
  status?: string;
  publicSummary?: string;
  fulfillmentId?: string;
}) {
  if (!input.requirementId) return { success: false as const, error: 'Set requirements first' };
  if (!EVIDENCE_TYPES.some((t) => t.value === input.type)) return { success: false as const, error: 'Evidence type is invalid' };
  const provider = String(input.provider || '').trim();
  if (!provider || provider.length > 120) return { success: false as const, error: 'Provider is required' };
  // The requirement must belong to this order.
  const check = await keystoneClient(`query ReqCheck($id: ID!) { fulfillmentRequirement(where: { id: $id }) { id order { id } } }`, { id: input.requirementId });
  if (!check.success || check.data.fulfillmentRequirement?.order?.id !== orderId) return { success: false as const, error: 'Requirement does not belong to this order' };
  const response = await keystoneClient(
    `mutation RecordEvidence($data: ShipmentEvidenceCreateInput!) { createShipmentEvidence(data: $data) { id } }`,
    {
      data: {
        requirement: { connect: { id: input.requirementId } },
        ...(input.fulfillmentId ? { fulfillment: { connect: { id: input.fulfillmentId } } } : {}),
        type: input.type,
        provider,
        providerReference: String(input.providerReference || '').trim().slice(0, 200) || null,
        status: String(input.status || '').trim().slice(0, 120) || null,
        publicSummary: String(input.publicSummary || '').trim().slice(0, 1000) || null,
      },
    }
  );
  if (!response.success) return { success: false as const, error: 'Evidence could not be recorded' };
  refresh(orderId);
  return { success: true as const };
}
