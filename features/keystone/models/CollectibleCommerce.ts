import { lockedRecordUi } from './lifecycle-ui';
import { graphql, list } from '@keystone-6/core';
import { checkbox, integer, json, relationship, select, text, timestamp, virtual } from '@keystone-6/core/fields';
import { formatMinorToMajor } from '../../lib/minor-units';
import { denyAll } from '@keystone-6/core/access';

import { permissions } from '../access';
import { customerOwnerFilter, isHumanOwnerSession, requireHumanOwnerId } from '../security/customer-personalization-owner';
import { trackingFields } from './trackingFields';

const humanCustomer = ({ session }: any) => isHumanOwnerSession(session);
const canRead = ({ session }: any) =>
  permissions.canReadCollectibles({ session }) || permissions.canManageListings({ session }) || permissions.canManageAuctions({ session });
const canReadPrivateOffers = permissions.canManageListings;
const canReadPrivateAuctions = permissions.canManageAuctions;
const canManageAuctions = permissions.canManageAuctions;

export const Listing = list({
  access: { operation: { query: canRead, create: () => false, update: () => false, delete: () => false } },
  ui: { ...{ labelField: 'title', listView: { initialColumns: ['title', 'format', 'status', 'priceMinor', 'currencyCode'] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    store: relationship({ ref: 'Store' }),
    inventoryUnit: relationship({ ref: 'InventoryUnit' }),
    seller: relationship({ ref: 'SellerProfile' }),
    title: text({ validation: { isRequired: true } }),
    slug: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    format: select({ type: 'string', options: ['fixed_price', 'auction'], defaultValue: 'fixed_price' }),
    status: select({ type: 'string', options: ['draft', 'scheduled', 'published', 'paused', 'sold', 'ended', 'withdrawn'], defaultValue: 'draft' }),
    priceMinor: integer({
      validation: { min: 0 },
      label: 'Price (minor units)',
      ui: { description: 'Integer minor units of the currency: 475000 USD is USD 4,750.00' },
    }),
    // Read-only display of priceMinor in major units on item pages. It is not a list
    // column, because the shared dashboard virtual cell does not render row values.
    price: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve(item: any) {
          if (item.priceMinor == null || typeof item.currencyCode !== 'string') return null;
          try {
            const [whole, fraction] = formatMinorToMajor(item.priceMinor, item.currencyCode).split('.');
            const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${item.currencyCode} ${fraction ? `${grouped}.${fraction}` : grouped}`;
          } catch {
            return null;
          }
        },
      }),
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
    }),
    compareAtMinor: integer({ validation: { min: 0 }, label: 'Compare-at price (minor units)' }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } }, defaultValue: 'USD' }),
    publishedAt: timestamp(),
    endsAt: timestamp(),
    publicationSnapshot: json({ defaultValue: {} }),
    publicSummary: text({ ui: { displayMode: 'textarea' } }),
    offersEnabled: checkbox({ defaultValue: true }),
    minimumOfferMinor: integer({ validation: { min: 0 }, label: 'Minimum offer (minor units)' }),
    auction: relationship({ ref: 'Auction.listing' }),
    offers: relationship({ ref: 'Offer.listing', many: true }),
    ...trackingFields,
  },
});

export const Offer = list({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateOffers, create: () => false, update: () => false, delete: () => false } },
  fields: {
    listing: relationship({ ref: 'Listing.offers' }),
    buyer: relationship({ ref: 'User' }),
    seller: relationship({ ref: 'SellerProfile' }),
    status: select({ type: 'string', options: ['open', 'countered', 'accepted', 'declined', 'withdrawn', 'expired', 'converted'], defaultValue: 'open' }),
    currentAmountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    expiresAt: timestamp(),
    currentRevision: integer({ defaultValue: 1, validation: { min: 1 } }),
    revisions: relationship({ ref: 'OfferRevision.offer', many: true }),
    reservation: relationship({ ref: 'Reservation' }),
    idempotencyKey: text({ isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    ...trackingFields,
  },
});

export const OfferRevision = list({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateOffers, create: () => false, update: () => false, delete: () => false } },
  fields: {
    offer: relationship({ ref: 'Offer.revisions' }),
    sequence: integer({ validation: { isRequired: true, min: 1 } }),
    actorType: select({ type: 'string', options: ['buyer', 'seller', 'operator'], defaultValue: 'buyer' }),
    actor: relationship({ ref: 'User' }),
    action: select({ type: 'string', options: ['created', 'countered', 'accepted', 'declined', 'withdrawn', 'expired'], defaultValue: 'created' }),
    amountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    message: text({ ui: { displayMode: 'textarea' } }),
    occurredAt: timestamp({ defaultValue: { kind: 'now' } }),
    idempotencyKey: text({ isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    ...trackingFields,
  },
});

export const Auction = list({
  access: { operation: { query: canReadPrivateAuctions, create: () => false, update: () => false, delete: () => false } },
  ui: { ...{ listView: { initialColumns: ['listing', 'status', 'startAt', 'endAt', 'currentAmountMinor', 'bidCount'] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    listing: relationship({ ref: 'Listing.auction' }),
    status: select({ type: 'string', options: ['draft', 'scheduled', 'active', 'ended', 'cancelled', 'settled'], defaultValue: 'draft' }),
    startAt: timestamp({ validation: { isRequired: true } }),
    endAt: timestamp({ validation: { isRequired: true } }),
    openingAmountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currentAmountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    reserveAmountMinor: integer({ validation: { min: 0 }, access: { read: canManageAuctions, create: canManageAuctions, update: denyAll } }),
    reserveMet: checkbox({ defaultValue: false }),
    minimumIncrementMinor: integer({ validation: { isRequired: true, min: 1 }, defaultValue: 100 }),
    extensionWindowSeconds: integer({ validation: { min: 0 }, defaultValue: 120 }),
    extensionSeconds: integer({ validation: { min: 0 }, defaultValue: 120 }),
    maximumExtensions: integer({ validation: { min: 0 }, defaultValue: 5 }),
    extensionCount: integer({ validation: { min: 0 }, defaultValue: 0 }),
    leadingBidder: relationship({ ref: 'User' }),
    bidCount: integer({ validation: { min: 0 }, defaultValue: 0 }),
    bids: relationship({ ref: 'Bid.auction', many: true }),
    reservation: relationship({ ref: 'Reservation' }),
    settlementSnapshot: json({ defaultValue: null }),
    ...trackingFields,
  },
});

export const Bid = list({
  ui: lockedRecordUi,
  access: { operation: { query: canReadPrivateAuctions, create: () => false, update: () => false, delete: () => false } },
  fields: {
    auction: relationship({ ref: 'Auction.bids' }),
    bidder: relationship({ ref: 'User' }),
    amountMinor: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true, match: { regex: /^[A-Z]{3}$/ } } }),
    status: select({ type: 'string', options: ['accepted', 'rejected', 'superseded', 'winning'], defaultValue: 'accepted' }),
    rejectionReason: text(),
    acceptedAt: timestamp({ defaultValue: { kind: 'now' } }),
    resultingEndAt: timestamp(),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    requestMetadata: json({ defaultValue: {}, access: { read: canManageAuctions, create: () => false, update: () => false } }),
    ...trackingFields,
  },
});

export const WishlistItem = list({
  access: {
    operation: { query: humanCustomer, create: humanCustomer, update: humanCustomer, delete: humanCustomer },
    filter: { query: customerOwnerFilter, update: customerOwnerFilter, delete: customerOwnerFilter },
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
    catalogItem: relationship({ ref: 'CatalogItem' }),
    listing: relationship({ ref: 'Listing' }),
    notes: text(),
    ...trackingFields,
  },
});

export const SavedSearch = list({
  access: {
    operation: { query: humanCustomer, create: humanCustomer, update: humanCustomer, delete: humanCustomer },
    filter: { query: customerOwnerFilter, update: customerOwnerFilter, delete: customerOwnerFilter },
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
    name: text({ validation: { isRequired: true } }),
    query: text(),
    filters: json({ defaultValue: {} }),
    notificationFrequency: select({ type: 'string', options: ['none', 'instant', 'daily', 'weekly'], defaultValue: 'none' }),
    lastNotifiedAt: timestamp(),
    ...trackingFields,
  },
});
