import { list } from '@keystone-6/core';
import { denyAll } from '@keystone-6/core/access';
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';

import { permissions } from '../access';
import { trackingFields } from './trackingFields';
import {
  CARD_CONDITIONS,
  CARD_FINISHES,
  CATALOG_KINDS,
  MARKET_SOURCES,
  PRICE_BASES,
  ROUNDING_MODES,
  SEALED_FORMATS,
  SET_STATUSES,
  STOCK_KINDS,
  options,
} from '../lib/pokemon/card-enums';

const canRead = ({ session }: any) =>
  permissions.canReadCollectibles({ session }) || permissions.canManageCatalog({ session });
const canManage = permissions.canManageCatalog;
const managedAccess = {
  operation: { query: canRead, create: canManage, update: canManage, delete: canManage },
};
// Card sets, card printings and market readings are public reference data: the storefront
// reads them to draw checklists, card pages and binders. Drafts stay staff-only.
const publicCatalogAccess = {
  operation: { query: () => true, create: canManage, update: canManage, delete: canManage },
  filter: {
    query: ({ session }: any) => (canRead({ session }) ? true : { status: { equals: 'active' } }),
  },
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
  access: {
    operation: { query: () => true, create: canManage, update: canManage, delete: canManage },
  },
  ui: {
    label: 'Card sets',
    singular: 'Card set',
    plural: 'Card sets',
    labelField: 'name',
    listView: { initialColumns: ['name', 'code', 'series', 'releaseDate', 'releaseStatus'] },
  },
  fields: {
    store: relationship({ ref: 'Store' }),
    franchise: relationship({ ref: 'Franchise' }),
    category: relationship({ ref: 'CollectibleCategory' }),
    name: text({ validation: { isRequired: true } }),
    // The Pokémon TCG API set id (sv3pt5, base1, me2), stable across imports.
    handle: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    code: text({ ui: { description: 'Printed set code, e.g. MEW, OBF, PFL' } }),
    series: text(),
    printedTotal: integer({ validation: { min: 0 }, ui: { description: 'The number printed after the slash' } }),
    totalCards: integer({ validation: { min: 0 }, ui: { description: 'Every card, secret rares included' } }),
    releaseDate: timestamp(),
    releaseStatus: select({ type: 'string', options: options(SET_STATUSES), defaultValue: 'released' }),
    logoUrl: text(),
    symbolUrl: text(),
    tcgplayerGroupId: integer({ ui: { description: 'TCGplayer group id, used to refresh market prices' } }),
    manufacturer: text(),
    startYear: integer(),
    endYear: integer(),
    cards: relationship({ ref: 'CatalogItem.collectibleSet', many: true, ui: { displayMode: 'count' } }),
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
  access: publicCatalogAccess,
  ui: {
    label: 'Card catalog',
    singular: 'Catalog card',
    plural: 'Catalog cards',
    labelField: 'title',
    listView: { initialColumns: ['title', 'collectibleSet', 'cardNumber', 'rarity', 'kind', 'status'] },
  },
  fields: {
    store: relationship({ ref: 'Store' }),
    category: relationship({ ref: 'CollectibleCategory' }),
    franchise: relationship({ ref: 'Franchise' }),
    collectibleSet: relationship({ ref: 'CollectibleSet.cards' }),
    kind: select({ type: 'string', options: options(CATALOG_KINDS), defaultValue: 'single' }),
    cardNumber: text({ ui: { description: 'As printed: 199/165, GG69/GG70' } }),
    numberSort: integer({ defaultValue: 0, ui: { itemView: { fieldMode: 'read' } } }),
    rarity: text(),
    supertype: text({ ui: { description: 'Pokémon, Trainer or Energy' } }),
    subtypes: json({ defaultValue: [] }),
    energyTypes: json({ defaultValue: [] }),
    hp: text(),
    artist: text(),
    imageUrl: text(),
    imageLargeUrl: text(),
    sealedFormat: select({ type: 'string', options: options(SEALED_FORMATS) }),
    tcgplayerProductId: integer({ isIndexed: true }),
    products: relationship({ ref: 'Product.catalogItem', many: true }),
    marketPrices: relationship({ ref: 'MarketPrice.catalogItem', many: true }),
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

export const MarketPrice = list({
  // Append-only readings: a correction is a newer reading, never an edit.
  access: {
    operation: { query: () => true, create: canManage, update: () => false, delete: canManage },
  },
  ui: {
    label: 'Market prices',
    singular: 'Market price',
    plural: 'Market prices',
    listView: { initialColumns: ['catalogItem', 'finish', 'marketMinor', 'lowMinor', 'source', 'observedAt'] },
  },
  fields: {
    catalogItem: relationship({ ref: 'CatalogItem.marketPrices' }),
    finish: select({ type: 'string', options: options(CARD_FINISHES) }),
    // Readings are Near Mint unless a condition or grade says otherwise.
    condition: select({ type: 'string', options: options(CARD_CONDITIONS) }),
    grade: text({ ui: { description: 'For graded comparables, e.g. PSA 10' } }),
    source: select({ type: 'string', options: options(MARKET_SOURCES), defaultValue: 'tcgplayer' }),
    sourceReference: text(),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } }, defaultValue: 'USD' }),
    lowMinor: integer({ validation: { min: 0 } }),
    midMinor: integer({ validation: { min: 0 } }),
    highMinor: integer({ validation: { min: 0 } }),
    marketMinor: integer({ validation: { min: 0 } }),
    observedAt: timestamp({ defaultValue: { kind: 'now' }, isIndexed: true }),
    ...trackingFields,
  },
});

export const PricingRule = list({
  access: managedAccess,
  ui: {
    label: 'Pricing rules',
    singular: 'Pricing rule',
    plural: 'Pricing rules',
    listView: { initialColumns: ['name', 'appliesTo', 'condition', 'basis', 'percentBasisPoints', 'active'] },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    active: checkbox({ defaultValue: true }),
    appliesTo: select({ type: 'string', options: options(STOCK_KINDS), defaultValue: 'raw' }),
    condition: select({ type: 'string', options: options(CARD_CONDITIONS), ui: { description: 'Leave empty for every condition' } }),
    basis: select({ type: 'string', options: options(PRICE_BASES), defaultValue: 'market' }),
    percentBasisPoints: integer({ validation: { isRequired: true, min: 0, max: 100000 }, defaultValue: 10000, ui: { description: '10000 is 100% of the basis price' } }),
    minimumMinor: integer({ validation: { min: 0 }, defaultValue: 25, ui: { description: 'Price floor in minor units' } }),
    // Swings beyond this are left for review instead of applied.
    maximumChangeBasisPoints: integer({ validation: { min: 0 }, defaultValue: 3000 }),
    rounding: select({ type: 'string', options: options(ROUNDING_MODES), defaultValue: 'ninety_nine' }),
    priority: integer({ defaultValue: 0 }),
    ...trackingFields,
  },
});
