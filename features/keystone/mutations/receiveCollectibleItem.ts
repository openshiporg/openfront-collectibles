import type { Context } from '.keystone/types';
import { permissions } from '../access';

type CollectibleItemInput = {
  code: string;
  title: string;
  category: string;
  categoryName?: string;
  catalogNumber?: string;
  maker?: string;
  year?: number;
  condition: string;
  priceMinor?: number;
  variantSku?: string;
  publish?: boolean;
  /** Attach to an existing catalog entry (a card printing) instead of creating one. */
  catalogItemHandle?: string;
  grade?: { company: string; grade: string; label?: string; certificate: string; sample: boolean };
  consignment?: { consignor: string; commissionBasisPoints: number };
};

const GRADING_COMPANIES: Record<string, { name: string; lookup: string }> = {
  PSA: { name: 'PSA', lookup: 'https://www.psacard.com/cert/{cert}' },
  BGS: { name: 'Beckett Grading Services', lookup: '' },
  CGC: { name: 'CGC Cards', lookup: 'https://www.cgccards.com/certlookup/{cert}/' },
};

function parseGrade(value: unknown): CollectibleItemInput['grade'] {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Grade is invalid');
  const grade = value as Record<string, unknown>;
  const company = String(grade.company ?? '').toUpperCase();
  if (!GRADING_COMPANIES[company]) throw new Error('Grading company must be PSA, BGS or CGC');
  if (!text(grade.grade, 20) || !/^(10|[1-9](\.5)?)$/.test(String(grade.grade).trim())) throw new Error('Grade must be 1 to 10 in half steps');
  // PSA has no 9.5; BGS and CGC do.
  if (company === 'PSA' && String(grade.grade).trim() === '9.5') throw new Error('PSA does not grade 9.5');
  if (!text(grade.certificate, 40) || !/^[A-Za-z0-9-]+$/.test(String(grade.certificate).trim())) throw new Error('Certificate number is invalid');
  return {
    company,
    grade: String(grade.grade).trim(),
    label: text(grade.label, 60) ? String(grade.label).trim() : undefined,
    certificate: String(grade.certificate).trim(),
    sample: grade.sample === true,
  };
}

function parseConsignment(value: unknown): CollectibleItemInput['consignment'] {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Consignment is invalid');
  const consignment = value as Record<string, unknown>;
  if (!text(consignment.consignor, 120)) throw new Error('Consignor name is required');
  const rate = Number(consignment.commissionBasisPoints);
  if (!Number.isSafeInteger(rate) || rate < 0 || rate > 10000) throw new Error('Commission must be 0 to 10000 basis points');
  return { consignor: String(consignment.consignor).trim(), commissionBasisPoints: rate };
}

const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

function parseItem(input: unknown): CollectibleItemInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Item details are required');
  const item = input as Record<string, unknown>;
  if (!text(item.code, 128) || !/^[A-Za-z0-9_-]+$/.test(String(item.code).trim())) throw new Error('Item code is invalid');
  if (!text(item.title, 300)) throw new Error('Item title is required');
  if (!text(item.category, 120) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(item.category))) throw new Error('Category handle is invalid');
  if (!text(item.condition, 300)) throw new Error('Condition is required');
  if (item.priceMinor !== undefined && (!Number.isSafeInteger(item.priceMinor) || Number(item.priceMinor) < 0)) throw new Error('Price must be a non-negative whole amount in minor units');
  if (item.year !== undefined && item.year !== null && (!Number.isSafeInteger(item.year) || Number(item.year) < 0 || Number(item.year) > 9999)) throw new Error('Year is invalid');
  return {
    code: String(item.code).trim(),
    title: String(item.title).trim(),
    category: String(item.category),
    categoryName: text(item.categoryName, 120) ? String(item.categoryName).trim() : undefined,
    catalogNumber: typeof item.catalogNumber === 'string' ? item.catalogNumber.slice(0, 120) : '',
    maker: typeof item.maker === 'string' ? item.maker.slice(0, 200) : '',
    year: typeof item.year === 'number' ? item.year : undefined,
    condition: String(item.condition).trim(),
    priceMinor: typeof item.priceMinor === 'number' ? item.priceMinor : undefined,
    variantSku: text(item.variantSku, 128) ? String(item.variantSku).trim() : undefined,
    publish: item.publish !== false,
    catalogItemHandle: text(item.catalogItemHandle, 160) ? String(item.catalogItemHandle).trim() : undefined,
    grade: parseGrade(item.grade),
    consignment: parseConsignment(item.consignment),
  };
}

/**
 * Receives one individual collectible into inventory: catalog entry, item,
 * reported condition, inventory unit and receipt movement, and (optionally) a
 * published fixed-price listing tied to the item's product variant.
 * Used by onboarding and by merchants receiving new stock.
 */
export default async function receiveCollectibleItem(
  _root: unknown,
  { input }: { input: unknown },
  context: Context,
) {
  const item = parseItem(input);
  const session = context.session;
  if (
    !session?.itemId ||
    !permissions.canManageCatalog({ session }) ||
    !permissions.canManageInventory({ session }) ||
    (item.publish && !permissions.canManageListings({ session }))
  ) {
    throw new Error('Not authorized');
  }
  const actorId = session.itemId as string;
  const variantSku = item.variantSku || item.code;

  return context.prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`collectible-intake:${item.code}`}))::text AS locked`;
    const stores = await tx.store.findMany({ take: 2, select: { id: true, defaultCurrencyCode: true } });
    if (stores.length !== 1) throw new Error('Set up the store before receiving items');
    const store = stores[0];
    const currencyCode = store.defaultCurrencyCode.toUpperCase();

    const existing = await tx.specimen.findUnique({ where: { specimenCode: item.code }, include: { inventoryUnits: true } });
    if (existing) {
      if (existing.inventoryUnits.length !== 1) throw new Error(`Item ${item.code} already exists and needs review`);
      return { code: item.code, title: item.title, created: false };
    }

    const variants = await tx.productVariant.findMany({
      where: { sku: variantSku },
      take: 2,
      include: { product: true, collectibleInventoryUnit: true, prices: { include: { currency: true } } },
    });
    if (variants.length !== 1) throw new Error(`Create the product variant with SKU ${variantSku} first`);
    const variant = variants[0];
    if (variant.collectibleInventoryUnit) throw new Error(`Product variant ${variantSku} already has an item`);
    if (item.publish && variant.product?.status !== 'published') throw new Error(`Publish the product for ${variantSku} before listing it`);

    const variantPrice = variant.prices.find(price => price.currency?.code?.toUpperCase() === currencyCode && !price.priceListId);
    const priceMinor = item.priceMinor ?? variantPrice?.amount;
    if (item.publish && priceMinor === undefined) throw new Error(`Add a ${currencyCode} price to ${variantSku} before listing it`);
    if (variantPrice && priceMinor !== undefined && priceMinor !== variantPrice.amount) {
      throw new Error(`Listing price must match the ${currencyCode} price of ${variantSku}`);
    }

    const location = await tx.inventoryLocation.upsert({
      where: { code: 'MAIN' },
      create: { storeId: store.id, code: 'MAIN', name: 'Main storage', type: 'shop', publicLabel: 'Store', status: 'active' },
      update: {},
    });
    const category = await tx.collectibleCategory.upsert({
      where: { handle: item.category },
      create: { storeId: store.id, handle: item.category, name: item.categoryName || item.category, status: 'active' },
      update: {},
    });
    const handle = variant.product?.handle || item.code.toLowerCase();
    const linked = item.catalogItemHandle
      ? await tx.catalogItem.findUnique({ where: { handle: item.catalogItemHandle } })
      : null;
    if (item.catalogItemHandle && !linked) throw new Error(`Import catalog entry ${item.catalogItemHandle} first`);
    const catalog = linked ?? await tx.catalogItem.create({
      data: { storeId: store.id, title: item.title, handle, catalogNumber: item.catalogNumber, maker: item.maker, year: item.year, status: 'active', categoryId: category.id },
    });
    if (linked && variant.product && !variant.product.catalogItemId) {
      await tx.product.update({ where: { id: variant.product.id }, data: { catalogItemId: linked.id } });
    }
    const specimen = await tx.specimen.create({
      data: { storeId: store.id, catalogItemId: catalog.id, specimenCode: item.code, displayName: item.title, lifecycleStatus: 'available' },
    });
    await tx.conditionObservation.create({
      data: { specimenId: specimen.id, observerId: actorId, sourceType: 'operator', label: item.condition, status: 'reported', publiclyVisible: true },
    });
    if (item.grade) {
      const company = GRADING_COMPANIES[item.grade.company];
      const grader = await tx.gradingCompany.upsert({
        where: { code: item.grade.company },
        create: { code: item.grade.company, name: company.name, certificateLookupTemplate: company.lookup, active: true },
        update: {},
      });
      await tx.specimenIdentifier.create({
        data: { specimenId: specimen.id, type: 'certificate', issuer: item.grade.company, value: item.grade.certificate, evidence: item.grade.sample ? { sample: true } : {} },
      });
      await tx.gradeObservation.create({
        data: {
          specimenId: specimen.id,
          gradingCompanyId: grader.id,
          reportedGrade: item.grade.grade,
          reportedLabel: item.grade.label ?? '',
          certificateReference: item.grade.certificate,
          // Sample certificates are demo data: never linked to a live lookup.
          certificateLookupUrl: item.grade.sample || !company.lookup ? '' : company.lookup.replace('{cert}', encodeURIComponent(item.grade.certificate)),
          verificationState: 'not_checked',
          publiclyVisible: true,
          reviewedById: actorId,
        },
      });
    }
    const ownershipBasis = item.consignment ? 'consigned' : 'owned';
    const unit = await tx.inventoryUnit.create({
      data: { storeId: store.id, specimenId: specimen.id, commerceVariantId: variant.id, sku: item.code, ownershipBasis, status: 'available', quantity: 1, version: 1, locationId: location.id, currencyCode },
    });
    if (item.consignment) {
      const consignor = (await tx.sellerProfile.findFirst({ where: { displayName: item.consignment.consignor } }))
        ?? await tx.sellerProfile.create({ data: { storeId: store.id, displayName: item.consignment.consignor, status: 'active' } });
      const intake = await tx.consignmentIntake.create({
        data: {
          storeId: store.id, consignorId: consignor.id, reference: `CN-${item.code}`, status: 'accepted', receivedAt: new Date(),
          submittedDescription: item.title,
        },
      });
      await tx.consignmentAgreement.create({
        data: {
          intakeId: intake.id, consignorId: consignor.id, version: 1, status: 'accepted', commissionBasisPoints: item.consignment.commissionBasisPoints,
          currencyCode, pricingAuthority: 'mutual', startsAt: new Date(), acceptedAt: new Date(),
          termsSnapshot: { commissionBasisPoints: item.consignment.commissionBasisPoints, askingPriceMinor: priceMinor ?? null },
        },
      });
      await tx.consignmentItem.create({
        data: { intakeId: intake.id, specimenId: specimen.id, inventoryUnitId: unit.id, status: item.publish ? 'listed' : 'accepted', agreedPriceMinor: priceMinor ?? null, currencyCode },
      });
    }
    await tx.inventoryMovement.create({
      data: { inventoryUnitId: unit.id, type: 'receive', toStatus: 'available', toLocationId: location.id, reason: 'Received into inventory', actorId, idempotencyKey: `intake:${item.code}`, evidence: { source: 'intake', code: item.code } },
    });
    if (item.publish) {
      await tx.listing.create({
        data: {
          storeId: store.id,
          inventoryUnitId: unit.id,
          title: item.title,
          slug: handle,
          format: 'fixed_price',
          status: 'published',
          priceMinor,
          currencyCode,
          offersEnabled: false,
          publicSummary: item.condition,
          publishedAt: new Date(),
          publicationSnapshot: { code: item.code, condition: item.condition, askingPriceMinor: priceMinor },
        },
      });
    }
    return { code: item.code, title: item.title, created: true };
  }, { isolationLevel: 'Serializable', timeout: 20_000 });
}
