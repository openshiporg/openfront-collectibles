import { immutableRecordUi } from './lifecycle-ui';
import { list } from '@keystone-6/core';
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';
import { denyAll } from '@keystone-6/core/access';

import { permissions } from '../access';
import { trackingFields } from './trackingFields';

const canRead = ({ session }: any) =>
  permissions.canReadCollectibles({ session }) || permissions.canManageEvidence({ session });
const canManage = permissions.canManageEvidence;
const managedAccess = { operation: { query: canRead, create: canManage, update: canManage, delete: canManage } };
const appendOnlyEvidenceAccess = { operation: { query: canRead, create: canManage, update: () => false, delete: () => false } };

export const ConditionObservation = list({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.conditionObservations' }),
    observer: relationship({ ref: 'User' }),
    sourceType: select({ type: 'string', options: ['operator', 'seller', 'buyer', 'provider', 'import'], defaultValue: 'operator' }),
    scale: text(),
    label: text({ validation: { isRequired: true } }),
    score: text(),
    notes: text({ ui: { displayMode: 'textarea' } }),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    status: select({ type: 'string', options: ['reported', 'reviewed', 'superseded', 'disputed'], defaultValue: 'reported' }),
    publiclyVisible: checkbox({ defaultValue: false }),
    mediaReferences: json({ defaultValue: [] }),    evidence: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const GradingCompany = list({
  access: managedAccess,
  fields: {
    name: text({ validation: { isRequired: true } }),
    code: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    website: text(),
    certificateLookupTemplate: text(),
    active: checkbox({ defaultValue: true }),
    disclaimer: text({ defaultValue: 'Provider-reported grading evidence; not an Openfront authenticity determination.' }),
    ...trackingFields,
  },
});

export const GradeObservation = list({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.gradeObservations' }),
    gradingCompany: relationship({ ref: 'GradingCompany' }),
    reportedGrade: text({ validation: { isRequired: true } }),
    reportedLabel: text(),
    certificateReference: text({ isIndexed: true }),
    certificateLookupUrl: text(),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    verificationState: select({ type: 'string', options: ['not_checked', 'provider_reported', 'matched', 'mismatch', 'unavailable', 'manual_review'], defaultValue: 'not_checked' }),
    publiclyVisible: checkbox({ defaultValue: false }),
    providerResponseHash: text(),    providerResponse: json({ defaultValue: null, access: { read: canManage, create: canManage, update: canManage } }),
    reviewedBy: relationship({ ref: 'User' }),
    reviewedAt: timestamp(),
    disclaimer: text({ defaultValue: 'This records an attributed grading/certificate observation and does not establish authenticity.' }),
    ...trackingFields,
  },
});

export const ProvenanceEvent = list({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.provenanceEvents' }),
    eventType: select({ type: 'string', options: ['claimed_origin', 'ownership', 'sale', 'exhibition', 'publication', 'restoration', 'loss', 'recovery', 'other'], defaultValue: 'other' }),
    occurredAt: timestamp(),
    recordedAt: timestamp({ defaultValue: { kind: 'now' } }),
    summary: text({ validation: { isRequired: true } }),
    source: text(),
    confidence: select({ type: 'string', options: ['unreviewed', 'low', 'medium', 'high', 'provider_reported'], defaultValue: 'unreviewed' }),
    reviewState: select({ type: 'string', options: ['reported', 'reviewed', 'disputed', 'rejected'], defaultValue: 'reported' }),
    publiclyVisible: checkbox({ defaultValue: false }),
    publicEvidence: json({ defaultValue: [] }),    restrictedParties: json({ defaultValue: null, access: { read: canManage, create: canManage, update: canManage } }),
    reviewedBy: relationship({ ref: 'User' }),
    ...trackingFields,
  },
});

export const CustodyEvent = list({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.custodyEvents' }),
    type: select({ type: 'string', options: ['intake', 'received', 'stored', 'moved', 'released', 'shipped', 'delivered', 'returned', 'inspection'], defaultValue: 'intake' }),
    occurredAt: timestamp({ defaultValue: { kind: 'now' } }),
    fromLocation: relationship({ ref: 'InventoryLocation' }),
    toLocation: relationship({ ref: 'InventoryLocation' }),
    actor: relationship({ ref: 'User' }),
    counterpartyReference: text({ access: { read: canManage, create: canManage, update: canManage } }),
    evidence: json({ defaultValue: {} }),
    idempotencyKey: text({ isIndexed: 'unique', access: { read: denyAll, create: canManage, update: denyAll } }),
    ...trackingFields,
  },
});

export const ValuationObservation = list({
  ui: immutableRecordUi,
  access: appendOnlyEvidenceAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.valuationObservations' }),
    amountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    sourceType: select({ type: 'string', options: ['operator', 'comparable_sale', 'price_guide', 'auction_result', 'provider', 'seller', 'other'], defaultValue: 'operator' }),
    sourceName: text({ validation: { isRequired: true } }),
    sourceReference: text(),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    confidence: select({ type: 'string', options: ['unreviewed', 'low', 'medium', 'high', 'provider_reported'], defaultValue: 'unreviewed' }),
    publiclyVisible: checkbox({ defaultValue: false }),
    notes: text({ ui: { displayMode: 'textarea' } }),    disclaimer: text({ defaultValue: 'Attributed valuation evidence; not an appraisal or guarantee of sale value.' }),
    ...trackingFields,
  },
});
