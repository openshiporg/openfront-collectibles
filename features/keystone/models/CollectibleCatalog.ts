import { list } from '@keystone-6/core';
import { denyAll } from '@keystone-6/core/access';
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';

import { permissions } from '../access';
import { trackingFields } from './trackingFields';

const canRead = ({ session }: any) =>
  permissions.canReadCollectibles({ session }) || permissions.canManageCatalog({ session });
const canManage = permissions.canManageCatalog;
const managedAccess = {
  operation: { query: canRead, create: canManage, update: canManage, delete: canManage },
};

export const CollectibleCategory = list({
  access: managedAccess,
  ui: { labelField: 'name', listView: { initialColumns: ['name', 'parent', 'status', 'sortOrder'] } },
  fields: {
    store: relationship({ ref: 'Store' }),
    name: text({ validation: { isRequired: true } }),
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    description: text({ ui: { displayMode: 'textarea' } }),
    parent: relationship({ ref: 'CollectibleCategory.children' }),
    children: relationship({ ref: 'CollectibleCategory.parent', many: true }),
    attributeDefinitions: relationship({ ref: 'AttributeDefinition.category', many: true }),
    status: select({ type: 'string', options: ['draft', 'active', 'archived'], defaultValue: 'draft' }),
    sortOrder: integer({ defaultValue: 0 }),
    publicMetadata: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const AttributeDefinition = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    category: relationship({ ref: 'CollectibleCategory.attributeDefinitions' }),
    name: text({ validation: { isRequired: true } }),
    key: text({ validation: { isRequired: true }, isIndexed: true }),
    valueType: select({ type: 'string', options: ['text', 'integer', 'decimal', 'boolean', 'date', 'select', 'multiselect'], defaultValue: 'text' }),
    required: checkbox({ defaultValue: false }),
    filterable: checkbox({ defaultValue: true }),
    public: checkbox({ defaultValue: true }),
    options: json({ defaultValue: [] }),
    validationRules: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const Franchise = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    name: text({ validation: { isRequired: true } }),
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    description: text({ ui: { displayMode: 'textarea' } }),
    externalReferences: json({ defaultValue: [] }),
    ...trackingFields,
  },
});

export const CollectibleSet = list({
  access: managedAccess,
  ui: { labelField: 'name' },
  fields: {
    store: relationship({ ref: 'Store' }),
    franchise: relationship({ ref: 'Franchise' }),
    category: relationship({ ref: 'CollectibleCategory' }),
    name: text({ validation: { isRequired: true } }),
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    manufacturer: text(),
    startYear: integer(),
    endYear: integer(),
    metadata: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const CollectibleRelease = list({
  access: managedAccess,
  ui: { labelField: 'name' },
  fields: {
    store: relationship({ ref: 'Store' }),
    collectibleSet: relationship({ ref: 'CollectibleSet' }),
    name: text({ validation: { isRequired: true } }),
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    releaseDate: timestamp(),
    edition: text(),
    printRunReported: integer({ validation: { min: 0 } }),
    printRunSource: text(),
    publicNotes: text({ ui: { displayMode: 'textarea' } }),
    ...trackingFields,
  },
});

export const CatalogItem = list({
  access: managedAccess,
  ui: { labelField: 'title', listView: { initialColumns: ['title', 'category', 'release', 'catalogNumber', 'status'] } },
  fields: {
    store: relationship({ ref: 'Store' }),
    category: relationship({ ref: 'CollectibleCategory' }),
    franchise: relationship({ ref: 'Franchise' }),
    collectibleSet: relationship({ ref: 'CollectibleSet' }),
    release: relationship({ ref: 'CollectibleRelease' }),
    title: text({ validation: { isRequired: true } }),
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    catalogNumber: text(),
    maker: text(),
    year: integer(),
    description: text({ ui: { displayMode: 'textarea' } }),
    attributeValues: json({ defaultValue: {} }),
    status: select({ type: 'string', options: ['draft', 'active', 'archived'], defaultValue: 'draft' }),
    specimens: relationship({ ref: 'Specimen.catalogItem', many: true }),
    media: relationship({ ref: 'CollectibleMedia.catalogItem', many: true }),
    ...trackingFields,
  },
});

export const Specimen = list({
  graphql: { plural: 'Specimens' },
  // Mutable catalog descriptions are not physical claim/tenant/lifecycle authority.
  access: { operation: { query: canRead, create: canManage, update: canManage, delete: denyAll } },
  // pluralize() keeps "Specimen" unchanged, so the default UI plural would equal the
  // list key and the dashboard's GraphQL-name derivation throws for the whole admin meta.
  ui: {
    label: 'Specimens',
    singular: 'Specimen',
    plural: 'Specimens',
    path: 'specimens',
    labelField: 'displayName',
    listView: { initialColumns: ['displayName', 'catalogItem', 'lifecycleStatus', 'updatedAt'] },
  },
  fields: {
    store: relationship({ ref: 'Store', access: { create: canManage, update: denyAll } }),
    catalogItem: relationship({ ref: 'CatalogItem.specimens' }),
    displayName: text({ validation: { isRequired: true } }),
    specimenCode: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    lifecycleStatus: select({ type: 'string', options: ['intake', 'review', 'available', 'reserved', 'sold', 'returned', 'withdrawn'], defaultValue: 'intake', access: { create: denyAll, update: denyAll } }),
    attributeValues: json({ defaultValue: {} }),
    identifiers: relationship({ ref: 'SpecimenIdentifier.specimen', many: true }),
    media: relationship({ ref: 'CollectibleMedia.specimen', many: true }),
    conditionObservations: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'ConditionObservation.specimen', many: true }),
    gradeObservations: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'GradeObservation.specimen', many: true }),
    provenanceEvents: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'ProvenanceEvent.specimen', many: true }),
    custodyEvents: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'CustodyEvent.specimen', many: true }),
    valuationObservations: relationship({
      access: { create: denyAll, update: denyAll },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } }, ref: 'ValuationObservation.specimen', many: true }),
    inventoryUnits: relationship({ ref: 'InventoryUnit.specimen', many: true, access: { create: denyAll, update: denyAll } }),
    ...trackingFields,
  },
});

export const SpecimenIdentifier = list({
  access: managedAccess,
  fields: {
    specimen: relationship({ ref: 'Specimen.identifiers' }),
    type: select({ type: 'string', options: ['operator', 'serial', 'edition', 'manufacturer', 'registry', 'certificate', 'other'], defaultValue: 'operator' }),
    issuer: text(),
    value: text({ validation: { isRequired: true }, isIndexed: true }),
    observedAt: timestamp({ defaultValue: { kind: 'now' } }),
    evidence: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const CollectibleMedia = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    catalogItem: relationship({ ref: 'CatalogItem.media' }),
    specimen: relationship({ ref: 'Specimen.media' }),
    kind: select({ type: 'string', options: ['image', 'video', 'document', 'scan'], defaultValue: 'image' }),
    url: text({ validation: { isRequired: true } }),
    altText: text(),
    visibility: select({ type: 'string', options: ['public', 'restricted', 'private'], defaultValue: 'restricted' }),
    source: text(),
    capturedAt: timestamp(),
    checksum: text(),
    metadata: json({ defaultValue: {} }),
    ...trackingFields,
  },
});
