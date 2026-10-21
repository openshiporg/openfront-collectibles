import { immutableRecordUi, lockedRecordUi } from './lifecycle-ui';
import { list } from '@keystone-6/core';
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';
import { denyAll } from '@keystone-6/core/access';

import { permissions } from '../access';
import { customerOwnerFilter, isHumanOwnerSession, requireHumanOwnerId } from '../security/customer-personalization-owner';
import { trackingFields } from './trackingFields';

const humanCustomer = ({ session }: any) => isHumanOwnerSession(session);
const canManageCustomers = permissions.canManageCollectibleCustomers;
const canManageRisk = permissions.canManageRisk;
const canManageIntegrations = permissions.canManageIntegrations;

export const StoreMembership = list({
  access: { operation: { query: canManageCustomers, create: canManageCustomers, update: canManageCustomers, delete: canManageCustomers } },
  fields: {
    store: relationship({ ref: 'Store' }),
    user: relationship({ ref: 'User' }),
    role: select({ type: 'string', options: ['owner', 'catalog', 'inventory', 'auctioneer', 'consignment', 'fulfillment', 'support', 'finance', 'viewer'], defaultValue: 'viewer' }),
    status: select({ type: 'string', options: ['invited', 'active', 'suspended', 'revoked'], defaultValue: 'invited' }),
    permissions: json({ defaultValue: [] }),
    ...trackingFields,
  },
});

export const CollectorProfile = list({
  access: {
    operation: { query: humanCustomer, create: humanCustomer, update: humanCustomer, delete: canManageCustomers },
    filter: {
      query: ({ session }) => permissions.canManageCollectibleCustomers({ session }) ? true : customerOwnerFilter({ session }),
      update: ({ session }) => permissions.canManageCollectibleCustomers({ session }) ? true : customerOwnerFilter({ session }),
    },
  },
  fields: {
    user: relationship({
      ref: 'User',
      access: { create: denyAll, update: denyAll },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          return operation === 'create'
            ? { connect: { id: requireHumanOwnerId(context.session) } }
            : resolvedData.user;
        },
      },
    }),
    displayName: text({ validation: { isRequired: true } }),
    bio: text({ ui: { displayMode: 'textarea' } }),
    interests: json({ defaultValue: [] }),
    preferences: json({ defaultValue: {} }),
    public: checkbox({ defaultValue: false }),
    ...trackingFields,
  },
});

export const SellerProfile = list({
  access: {
    operation: { query: canManageCustomers, create: canManageCustomers, update: canManageCustomers, delete: canManageCustomers },
  },
  fields: {
    store: relationship({ ref: 'Store' }),
    user: relationship({ ref: 'User' }),
    displayName: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: ['applicant', 'active', 'paused', 'suspended', 'closed'], defaultValue: 'applicant' }),
    publicBio: text({ ui: { displayMode: 'textarea' } }),
    privateContact: json({ access: { read: canManageCustomers, create: canManageCustomers, update: canManageCustomers } }),
    identityEvidenceState: select({ type: 'string', options: ['not_requested', 'pending', 'provider_reported', 'manual_review', 'rejected'], defaultValue: 'not_requested' }),
    payoutConfigurationReference: text({ access: { read: canManageCustomers, create: canManageCustomers, update: canManageCustomers } }),
    ...trackingFields,
  },
});

export const FulfillmentRequirement = list({
  ui: immutableRecordUi,
  access: { operation: { query: ({ session }: any) => permissions.canReadFulfillments({ session }) || permissions.canManageFulfillments({ session }), create: permissions.canManageFulfillments, update: () => false, delete: () => false } },
  fields: {
    order: relationship({ ref: 'Order' }),
    orderLineItem: relationship({ ref: 'OrderLineItem' }),
    declaredValueMinor: integer({ validation: { min: 0 } }),
    currencyCode: text({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    signatureRequired: checkbox({ defaultValue: false }),
    insuranceRequested: checkbox({ defaultValue: false }),
    insuranceProviderReference: text(),
    packagingInstructions: text({ ui: { displayMode: 'textarea' } }),
    policySnapshot: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const ShipmentEvidence = list({
  ui: immutableRecordUi,
  access: { operation: { query: permissions.canReadFulfillments, create: permissions.canManageFulfillments, update: () => false, delete: () => false } },
  fields: {
    fulfillment: relationship({ ref: 'Fulfillment' }),
    requirement: relationship({ ref: 'FulfillmentRequirement' }),
    type: select({ type: 'string', options: ['label', 'acceptance_scan', 'tracking', 'exception', 'delivery', 'signature', 'insurance_response', 'packaging'], defaultValue: 'tracking' }),
    provider: text({ validation: { isRequired: true } }),
    providerReference: text(),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    status: text(),
    publicSummary: text(),
    restrictedPayload: json({ access: { read: permissions.canManageFulfillments, create: permissions.canManageFulfillments, update: permissions.canManageFulfillments } }),
    disclaimer: text({ defaultValue: 'Provider-attributed fulfillment evidence; not an independent guarantee of delivery or coverage.' }),
    ...trackingFields,
  },
});

export const DisputeCase = list({
  access: { operation: { query: canManageRisk, create: canManageRisk, update: canManageRisk, delete: canManageRisk } },
  fields: {
    store: relationship({ ref: 'Store' }),
    order: relationship({ ref: 'Order' }),
    return: relationship({ ref: 'Return' }),
    openedBy: relationship({ ref: 'User' }),
    assignedTo: relationship({ ref: 'User' }),
    type: select({ type: 'string', options: ['condition', 'not_as_described', 'authenticity_concern', 'shipping', 'payment', 'return', 'other'], defaultValue: 'other' }),
    status: select({ type: 'string', options: ['open', 'evidence_requested', 'review', 'resolved', 'closed'], defaultValue: 'open' }),
    summary: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
    resolution: text({ ui: { displayMode: 'textarea' } }),
    evidence: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'EvidenceAttachment.dispute', many: true }),
    ...trackingFields,
  },
});

export const RiskAssessment = list({
  ui: lockedRecordUi,
  access: { operation: { query: canManageRisk, create: () => false, update: () => false, delete: () => false } },
  fields: {
    store: relationship({ ref: 'Store' }),
    subjectType: select({ type: 'string', options: ['user', 'seller', 'listing', 'bid', 'offer', 'order', 'payment', 'shipment'], defaultValue: 'order' }),
    subjectId: text({ validation: { isRequired: true } }),
    provider: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: ['provider_reported', 'manual_review', 'cleared', 'restricted', 'unavailable'], defaultValue: 'provider_reported' }),
    score: integer(),
    reasonCodes: json({ defaultValue: [] }),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    signals: relationship({ ref: 'RiskSignal.assessment', many: true }),
    restrictedPayload: json({ access: { read: canManageRisk, create: () => false, update: () => false } }),
    disclaimer: text({ defaultValue: 'Risk evidence is provider/operator attributed and is not proof of fraud or identity.' }),
    ...trackingFields,
  },
});

export const RiskSignal = list({
  ui: lockedRecordUi,
  access: { operation: { query: canManageRisk, create: () => false, update: () => false, delete: () => false } },
  fields: {
    assessment: relationship({ ref: 'RiskAssessment.signals' }),
    code: text({ validation: { isRequired: true } }),
    severity: select({ type: 'string', options: ['info', 'low', 'medium', 'high'], defaultValue: 'info' }),
    summary: text({ validation: { isRequired: true } }),
    evidence: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const EvidenceAttachment = list({
  ui: immutableRecordUi,
  access: { operation: { query: canManageRisk, create: canManageRisk, update: () => false, delete: () => false } },
  fields: {
    dispute: relationship({ ref: 'DisputeCase.evidence' }),
    url: text({ validation: { isRequired: true } }),
    type: text(),
    checksum: text(),
    uploadedBy: relationship({ ref: 'User' }),
    metadata: json({ defaultValue: {}, access: { read: canManageRisk, create: canManageRisk, update: canManageRisk } }),
    ...trackingFields,
  },
});

export const ProviderConnection = list({
  access: { operation: { query: canManageIntegrations, create: canManageIntegrations, update: canManageIntegrations, delete: canManageIntegrations } },
  fields: {
    store: relationship({ ref: 'Store' }),
    kind: select({ type: 'string', options: ['payment', 'tax', 'shipping', 'grading', 'valuation', 'identity', 'risk', 'notification'], defaultValue: 'notification' }),
    provider: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: ['draft', 'configured', 'active', 'degraded', 'disabled'], defaultValue: 'draft' }),
    adapterKey: text({ validation: { isRequired: true } }),
    configuration: json({ defaultValue: {} }),
    secretReference: text({ access: { read: denyAll, create: canManageIntegrations, update: canManageIntegrations } }),
    lastObservedAt: timestamp(),
    lastObservation: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const NotificationIntent = list({
  ui: lockedRecordUi,
  access: { operation: { query: canManageIntegrations, create: () => false, update: () => false, delete: () => false } },
  fields: {
    user: relationship({ ref: 'User' }),
    channel: select({ type: 'string', options: ['email', 'sms', 'push', 'webhook'], defaultValue: 'email' }),
    template: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: ['queued', 'sending', 'delivered', 'failed', 'cancelled'], defaultValue: 'queued' }),
    payload: json({ defaultValue: {} }),
    provider: text(),
    providerReference: text(),
    idempotencyKey: text({ isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    attemptedAt: timestamp(),
    ...trackingFields,
  },
});
