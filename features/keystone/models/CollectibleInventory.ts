import { lockedRecordUi } from './lifecycle-ui';
import { list } from '@keystone-6/core';
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields';
import { denyAll } from '@keystone-6/core/access';

import { permissions } from '../access';
import { trackingFields } from './trackingFields';

const canRead = ({ session }: any) =>
  permissions.canReadCollectibles({ session }) || permissions.canManageInventory({ session });
const canManage = permissions.canManageInventory;
const managedAccess = { operation: { query: canRead, create: canManage, update: canManage, delete: canManage } };
const readOnlyUntilLifecycleCommands = { operation: { query: canRead, create: () => false, update: () => false, delete: () => false } };

export const InventoryLocation = list({
  access: managedAccess,
  fields: {
    store: relationship({ ref: 'Store' }),
    name: text({ validation: { isRequired: true } }),
    code: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    type: select({ type: 'string', options: ['shop', 'warehouse', 'vault', 'show', 'transit', 'virtual'], defaultValue: 'shop' }),
    publicLabel: text(),
    restrictedLocation: json({ access: { read: canManage, create: canManage, update: canManage } }),
    status: select({ type: 'string', options: ['active', 'inactive'], defaultValue: 'active' }),
    ...trackingFields,
  },
});

export const InventoryUnit = list({
  access: readOnlyUntilLifecycleCommands,
  ui: { ...{ labelField: 'sku', listView: { initialColumns: ['sku', 'specimen', 'ownershipBasis', 'status', 'location'] } }, ...lockedRecordUi, itemView: { ...{}, ...lockedRecordUi.itemView } },
  fields: {
    store: relationship({ ref: 'Store' }),
    specimen: relationship({ ref: 'Specimen.inventoryUnits' }),
    commerceVariant: relationship({ ref: 'ProductVariant.collectibleInventoryUnit' }),
    sku: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    ownershipBasis: select({ type: 'string', options: ['owned', 'consigned', 'trade_in', 'third_party'], defaultValue: 'owned' }),
    status: select({ type: 'string', options: ['intake', 'available', 'reserved', 'sold', 'return_hold', 'withdrawn', 'lost'], defaultValue: 'intake' }),
    location: relationship({ ref: 'InventoryLocation' }),
    quantity: integer({ defaultValue: 1, validation: { min: 0, max: 1 } }),
    version: integer({ defaultValue: 1, validation: { min: 1 } }),
    acquiredAmountMinor: integer({ validation: { min: 0 } }),
    currencyCode: text({ validation: { match: { regex: /^[A-Z]{3}$/ } } }),
    movements: relationship({ ref: 'InventoryMovement.inventoryUnit', many: true }),
    reservations: relationship({ ref: 'Reservation.inventoryUnit', many: true }),
    ...trackingFields,
  },
});

export const InventoryMovement = list({
  ui: lockedRecordUi,
  access: readOnlyUntilLifecycleCommands,
  fields: {
    inventoryUnit: relationship({ ref: 'InventoryUnit.movements' }),
    type: select({ type: 'string', options: ['receive', 'move', 'reserve', 'release', 'sell', 'return', 'adjust', 'withdraw'], defaultValue: 'adjust' }),
    fromStatus: text(),
    toStatus: text({ validation: { isRequired: true } }),
    fromLocation: relationship({ ref: 'InventoryLocation' }),
    toLocation: relationship({ ref: 'InventoryLocation' }),
    reason: text({ validation: { isRequired: true } }),
    actor: relationship({ ref: 'User' }),
    occurredAt: timestamp({ defaultValue: { kind: 'now' } }),
    evidence: json({ defaultValue: {} }),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: 'unique', access: { read: denyAll, create: canManage, update: denyAll } }),
    ...trackingFields,
  },
});

export const Reservation = list({
  ui: lockedRecordUi,
  access: {
    operation: { query: canRead, create: () => false, update: () => false, delete: () => false },
  },
  fields: {
    inventoryUnit: relationship({ ref: 'InventoryUnit.reservations' }),
    listing: relationship({ ref: 'Listing' }),
    cart: relationship({ ref: 'Cart' }),
    offer: relationship({ ref: 'Offer' }),
    auction: relationship({ ref: 'Auction' }),
    purpose: select({ type: 'string', options: ['cart', 'offer', 'auction', 'operator_hold', 'return'], defaultValue: 'cart' }),
    status: select({ type: 'string', options: ['active', 'released', 'converted', 'expired', 'cancelled'], defaultValue: 'active' }),
    expiresAt: timestamp(),
    ownerUser: relationship({ ref: 'User' }),
    guestProofHash: text({ access: { read: denyAll, create: () => false, update: () => false } }),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: 'unique', access: { read: denyAll, create: () => false, update: () => false } }),
    releasedAt: timestamp(),
    releaseReason: text(),
    ...trackingFields,
  },
});
