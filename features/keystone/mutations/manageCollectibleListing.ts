import type { Context } from '.keystone/types';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { permissions } from '../access';
import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import { currencyExponent } from '../../lib/minor-units';
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
export const listingCommandInput = z.object({
  action: z.enum(['create', 'update_draft', 'publish', 'withdraw']), key: id,
  unitId: id.optional(), listingId: id.optional(), expectedVersion: z.number().int().nonnegative().max(2147483646),
  title: z.string().trim().min(1).max(300).optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).optional(),
  publicSummary: z.string().trim().min(1).max(2000).optional(), priceMinor: z.number().int().min(1).max(2147483647).optional(),
}).strict();
const authorized = (session: Context['session']) => ['canManageListings', 'canManageInventory'].every(key => permissions[key]({ session }));
/** Adapts existing sample intake's physical version fence and existing
 * IdempotencyKey receipts. Publication is an attributed operator declaration. */
export default async function manageCollectibleListing(_root: unknown, { input }: { input: unknown }, context: Context) {
  const actorId = requireHumanOwnerId(context.session);
  if (!authorized(context.session)) throw new Error('Listing and inventory capability required');
  const command = listingCommandInput.parse(input);
  const visible = command.action === 'create'
    ? (command.unitId ? await context.query.InventoryUnit.findOne({ where: { id: command.unitId }, query: 'id store { id }' }) : null)
    : (command.listingId ? await context.query.Listing.findOne({ where: { id: command.listingId }, query: 'id store { id } inventoryUnit { id }' }) : null);
  if (!visible?.store?.id) throw new Error('Record not found');
  const storeId: string = visible.store.id;
  const unitId: string | undefined = command.action === 'create' ? command.unitId : visible.inventoryUnit?.id;
  if (!unitId) throw new Error('Physical unit required');
  const receiptKey = `operator-listing:${storeId}:${command.key}`;
  const hash = createHash('sha256').update(JSON.stringify({ actorId, storeId, unitId, command })).digest('hex');
  return context.prisma.$transaction(async tx => {
    // Role/identity locks preserve current-at-commit authority, including replay.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR SHARE`;
    const identity = await tx.user.findUnique({ where: { id: actorId }, select: { roleId: true } });
    if (!identity?.roleId) throw new Error('Not authorized');
    await tx.$queryRaw`SELECT id FROM "Role" WHERE id = ${identity.roleId} FOR SHARE`;
    const role = await tx.role.findUnique({ where: { id: identity.roleId } });
    if (!authorized({ itemId: actorId, data: { role } })) throw new Error('Not authorized');
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${receiptKey}))::text AS locked`;
    const previous = await tx.idempotencyKey.findUnique({ where: { idempotencyKey: receiptKey } });
    if (previous) {
      const params = previous.requestParams;
      if (!params || typeof params !== 'object' || Array.isArray(params) || params.hash !== hash || !previous.responseBody || previous.recoveryPoint !== 'completed') throw new Error('Command identity conflict');
      return previous.responseBody;
    }
    await tx.$queryRaw`SELECT id FROM "InventoryUnit" WHERE id = ${unitId} FOR UPDATE`;
    const unit = await tx.inventoryUnit.findUnique({ where: { id: unitId }, include: { specimen: true } });
    if (!unit || unit.storeId !== storeId || !unit.specimen || unit.specimen.storeId !== storeId || unit.quantity !== 1 || unit.version === null) throw new Error('Unit scope conflict');
    if (unit.version !== command.expectedVersion) throw new Error('Record changed; reload before retrying');
    if (unit.status !== 'available' || unit.specimen.lifecycleStatus !== 'available' || unit.ownershipBasis !== 'owned') throw new Error('Claimed or unavailable stock cannot be edited');
    if (![0, 2].includes(currencyExponent(unit.currencyCode))) throw new Error('Unsupported stock currency precision');
    const live = { inventoryUnitId: unitId, status: { in: ['draft', 'scheduled', 'published', 'paused'] } };
    const now = new Date(), at = now.toISOString();
    let listing;
    if (command.action === 'create') {
      if (!command.title || !command.slug || !command.publicSummary || command.priceMinor === undefined) throw new Error('Complete listing fields required');
      if (await tx.listing.count({ where: live })) throw new Error('Withdraw the existing listing first');
      listing = await tx.listing.create({ data: { storeId, inventoryUnitId: unitId, title: command.title, slug: command.slug, priceMinor: command.priceMinor, currencyCode: unit.currencyCode, publicSummary: command.publicSummary, format: 'fixed_price', status: 'draft', offersEnabled: false } });
    } else {
      listing = await tx.listing.findUnique({ where: { id: command.listingId! } });
      if (!listing || listing.inventoryUnitId !== unitId || listing.storeId !== storeId || listing.format !== 'fixed_price' || listing.currencyCode !== unit.currencyCode || !listing.status || ['sold', 'ended'].includes(listing.status)) throw new Error('Listing scope or lifecycle conflict');
      if (command.action === 'update_draft') {
        if (listing.status !== 'draft' || !command.title || !command.publicSummary || command.priceMinor === undefined) throw new Error('Complete draft fields required');
        listing = await tx.listing.update({ where: { id: listing.id }, data: { title: command.title, publicSummary: command.publicSummary, priceMinor: command.priceMinor, updatedAt: now } });
      } else if (command.action === 'publish') {
        if (!['draft', 'withdrawn'].includes(listing.status) || !listing.priceMinor || !listing.publicSummary) throw new Error('Complete unpublished listing required');
        if (await tx.listing.count({ where: { ...live, id: { not: listing.id } } })) throw new Error('Another live listing exists');
        listing = await tx.listing.update({ where: { id: listing.id }, data: { status: 'published', publishedAt: now, updatedAt: now, publicationSnapshot: { source: 'operator_declaration', authority: 'none', specimenCode: unit.specimen.specimenCode, title: listing.title, condition: listing.publicSummary, askingPriceMinor: listing.priceMinor, currencyCode: listing.currencyCode, actorId, at } } });
      } else {
        if (!['draft', 'scheduled', 'published', 'paused'].includes(listing.status)) throw new Error('Listing cannot be withdrawn');
        listing = await tx.listing.update({ where: { id: listing.id }, data: { status: 'withdrawn', updatedAt: now } });
      }
    }
    await tx.inventoryUnit.update({ where: { id: unit.id }, data: { version: { increment: 1 }, updatedAt: now } });
    const result = { id: listing.id, title: listing.title, slug: listing.slug, status: listing.status, priceMinor: listing.priceMinor, currencyCode: listing.currencyCode, publicSummary: listing.publicSummary, version: unit.version + 1 };
    await tx.idempotencyKey.create({ data: { idempotencyKey: receiptKey, requestMethod: 'OPERATOR', requestPath: 'collectibles/listing', requestParams: { hash, actorId, storeId, unitId, command }, responseCode: 200, responseBody: result, recoveryPoint: 'completed' } });
    return result;
  }, { isolationLevel: 'Serializable', timeout: 15_000 });
}
