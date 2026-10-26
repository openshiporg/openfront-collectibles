import { lockedRecordUi } from './lifecycle-ui';
import { list } from '@keystone-6/core';
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';
import { denyAll } from '@keystone-6/core/access';

import { permissions } from '../access';
import { trackingFields } from './trackingFields';
import { CARD_CONDITIONS, CARD_FINISHES, options } from '../lib/pokemon/card-enums';

const canRead = ({ session }: any) => permissions.canReadCollectibles({ session }) || permissions.canManageConsignments({ session });
const canManage = permissions.canManageConsignments;
const managedAccess = { operation: { query: canRead, create: canManage, update: canManage, delete: canManage } };
const lockedAccess = { operation: { query: canRead, create: () => false, update: () => false, delete: () => false } };

export const ConsignmentIntake = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    consignor: relationship({ ref: 'SellerProfile' }),
    reference: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({ type: 'string', options: ['submitted', 'received', 'inspecting', 'offered', 'accepted', 'declined', 'returned'], defaultValue: 'submitted' }),
    submittedDescription: text({ ui: { displayMode: 'textarea' } }),
    intakeObservations: json({ defaultValue: {} }),
    receivedAt: timestamp(),
    items: relationship({ ref: 'ConsignmentItem.intake', many: true }),
    agreement: relationship({ ref: 'ConsignmentAgreement.intake' }),
    custodyEvidence: json({ defaultValue: [] }),
    ...trackingFields,
  },
});

export const ConsignmentAgreement = list({
  access: managedAccess,
  fields: {
    intake: relationship({ ref: 'ConsignmentIntake.agreement' }),
    consignor: relationship({ ref: 'SellerProfile' }),
    version: integer({ validation: { isRequired: true, min: 1 } }),
    status: select({ type: 'string', options: ['draft', 'sent', 'accepted', 'expired', 'terminated'], defaultValue: 'draft' }),
    commissionBasisPoints: integer({ validation: { isRequired: true, min: 0, max: 10000 } }),
    fixedFeeMinor: integer({ validation: { min: 0 }, defaultValue: 0 }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    pricingAuthority: select({ type: 'string', options: ['operator', 'consignor', 'mutual'], defaultValue: 'mutual' }),
    startsAt: timestamp(),
    endsAt: timestamp(),
    termsSnapshot: json({ defaultValue: {} }),
    acceptedAt: timestamp(),
    acceptanceEvidence: json({ access: { read: canManage, create: canManage, update: canManage } }),
    ...trackingFields,
  },
});

export const ConsignmentItem = list({
  access: managedAccess,
  fields: {
    intake: relationship({ ref: 'ConsignmentIntake.items' }),
    specimen: relationship({ ref: 'Specimen' }),
    inventoryUnit: relationship({ ref: 'InventoryUnit' }),
    status: select({ type: 'string', options: ['pending', 'accepted', 'listed', 'sold', 'return_requested', 'returned', 'settled'], defaultValue: 'pending' }),
    reserveAmountMinor: integer({ validation: { min: 0 } }),
    agreedPriceMinor: integer({ validation: { min: 0 } }),
    currencyCode: text({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    notes: text({ ui: { displayMode: 'textarea' } }),
    ...trackingFields,
  },
});

export const ConsignmentSettlement = list({
  ui: lockedRecordUi,
  access: lockedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    consignor: relationship({ ref: 'SellerProfile' }),
    reference: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({ type: 'string', options: ['pending', 'on_hold', 'approved', 'paid', 'failed', 'reversed'], defaultValue: 'pending' }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    grossAmountMinor: integer({ validation: { isRequired: true } }),
    feeAmountMinor: integer({ validation: { isRequired: true } }),
    refundHoldbackMinor: integer({ validation: { isRequired: true }, defaultValue: 0 }),
    payableAmountMinor: integer({ validation: { isRequired: true } }),
    calculationSnapshot: json({ defaultValue: {} }),
    lines: relationship({ ref: 'SettlementLine.settlement', many: true }),
    payoutEvidence: json({ access: { read: canManage, create: () => false, update: () => false } }),
    idempotencyKey: text({ isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    ...trackingFields,
  },
});

export const SettlementLine = list({
  ui: lockedRecordUi,
  access: lockedAccess,
  fields: {
    settlement: relationship({ ref: 'ConsignmentSettlement.lines' }),
    consignmentItem: relationship({ ref: 'ConsignmentItem' }),
    orderLineItem: relationship({ ref: 'OrderLineItem' }),
    grossAmountMinor: integer({ validation: { isRequired: true } }),
    commissionAmountMinor: integer({ validation: { isRequired: true } }),
    feeAmountMinor: integer({ validation: { isRequired: true } }),
    refundAmountMinor: integer({ validation: { isRequired: true }, defaultValue: 0 }),
    payableAmountMinor: integer({ validation: { isRequired: true } }),
    snapshot: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const Buylist = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    name: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: ['draft', 'active', 'paused', 'archived'], defaultValue: 'draft' }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    // Offers on market-priced entries: cash and store credit as a share of the Near Mint market price.
    cashPercentBasisPoints: integer({ validation: { min: 0, max: 10000 }, defaultValue: 6000 }),
    creditPercentBasisPoints: integer({ validation: { min: 0, max: 15000 }, defaultValue: 8000 }),
    // Share of the Near Mint offer paid for each lower condition, e.g. { "LP": 8500, "MP": 7000 }.
    conditionBasisPoints: json({ defaultValue: { NM: 10000, LP: 8500, MP: 7000, HP: 5000, DMG: 3000 } }),
    minimumOfferMinor: integer({ validation: { min: 0 }, defaultValue: 25 }),
    publicNotes: text({ ui: { displayMode: 'textarea' } }),
    entries: relationship({ ref: 'BuylistEntry.buylist', many: true }),
    ...trackingFields,
  },
});

export const BuylistEntry = list({
  access: managedAccess,
  fields: {
    buylist: relationship({ ref: 'Buylist.entries' }),
    catalogItem: relationship({ ref: 'CatalogItem' }),
    cardFinish: select({ type: 'string', options: options(CARD_FINISHES) }),
    minimumCondition: select({ type: 'string', options: options(CARD_CONDITIONS), defaultValue: 'MP' }),
    pricingMode: select({ type: 'string', options: [{ value: 'market', label: 'Share of market' }, { value: 'fixed', label: 'Fixed offer' }], defaultValue: 'market' }),
    criteria: json({ defaultValue: {} }),
    // The Near Mint cash offer; market entries refresh it when prices are refreshed.
    offerAmountMinor: integer({ validation: { isRequired: true, min: 0 }, label: 'Cash offer, Near Mint (minor units)' }),
    creditOfferMinor: integer({ validation: { min: 0 }, label: 'Store credit offer, Near Mint (minor units)' }),
    hotlist: checkbox({ defaultValue: false }),
    maximumQuantity: integer({ validation: { min: 0 } }),
    quantityBought: integer({ validation: { min: 0 }, defaultValue: 0 }),
    active: select({ type: 'string', options: ['active', 'paused'], defaultValue: 'active' }),
    ...trackingFields,
  },
});

export const TradeInSubmission = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    customer: relationship({ ref: 'User' }),
    reference: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({ type: 'string', options: ['draft', 'submitted', 'received', 'inspecting', 'quoted', 'accepted', 'declined', 'paid', 'returned'], defaultValue: 'submitted' }),
    disposition: select({ type: 'string', options: ['cash', 'store_credit', 'trade'], defaultValue: 'cash' }),
    items: relationship({ ref: 'TradeInItem.submission', many: true }),
    shippingEvidence: json({ defaultValue: {} }),
    ...trackingFields,
  },
});

export const TradeInItem = list({
  access: managedAccess,
  fields: {
    submission: relationship({ ref: 'TradeInSubmission.items' }),
    catalogItem: relationship({ ref: 'CatalogItem' }),
    buylistEntry: relationship({ ref: 'BuylistEntry' }),
    specimen: relationship({ ref: 'Specimen' }),
    customerDescription: text({ ui: { displayMode: 'textarea' } }),
    customerCondition: text(),
    cardCondition: select({ type: 'string', options: options(CARD_CONDITIONS) }),
    cardFinish: select({ type: 'string', options: options(CARD_FINISHES) }),
    quantity: integer({ validation: { min: 1 }, defaultValue: 1 }),
    quotedCreditMinor: integer({ validation: { min: 0 } }),
    inspectedConditionObservation: relationship({ ref: 'ConditionObservation' }),
    quotedAmountMinor: integer({ validation: { min: 0 } }),
    acceptedAmountMinor: integer({ validation: { min: 0 } }),
    currencyCode: text({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    decisionEvidence: json({ defaultValue: {} }),
    ...trackingFields,
  },
});
