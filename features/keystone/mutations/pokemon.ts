import { z } from 'zod';
import { permissions } from '../access';
import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import { CHECKLISTS } from '../lib/pokemon/checklists';
import { CONDITION_ORDER, largeCardImage, numberSortKey } from '../lib/pokemon/card-enums';
import { buylistOffersFromMarket, chooseRule, suggestPrice, type Rule } from '../lib/pokemon/pricing';

// Pokémon card shop commands: catalog import, market readings, repricing, and the
// collector-facing projections (set checklists, card market, binder, want list).
// Public projections read through the sudo client and return only published facts.

const key = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const currency = z.string().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase());

function requireStaff(context: any, check: (args: { session: any }) => boolean) {
  if (!context.session?.itemId || !check({ session: context.session })) throw new Error('Not authorized');
}

async function singleStore(prisma: any) {
  const stores = await prisma.store.findMany({ take: 2, select: { id: true, defaultCurrencyCode: true } });
  if (stores.length !== 1) throw new Error('Set up the store first');
  return stores[0];
}

// ---------------------------------------------------------------------------
// Catalog import (staff): one set per call so onboarding can report progress.

const importInput = z.object({
  set: key.optional(),
  upcoming: z.object({
    handle: key,
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().max(12).optional(),
    series: z.string().trim().max(120).optional(),
    releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tcgplayerGroupId: z.number().int().positive().optional(),
    logoUrl: z.string().url().optional(),
  }).strict().optional(),
  sealed: z.array(z.object({
    handle: key,
    set: key,
    title: z.string().trim().min(1).max(200),
    sealedFormat: z.string().trim().max(40),
    tcgplayerProductId: z.number().int().positive().optional(),
    market: z.object({ low: z.number().int().nonnegative().nullable(), mid: z.number().int().nonnegative().nullable(), high: z.number().int().nonnegative().nullable(), market: z.number().int().nonnegative().nullable() }).strict().optional(),
    observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).strict()).max(200).optional(),
}).strict();

const cardHandle = (setId: string, number: string) => `${setId}-${number}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

export async function importCardCatalog(_root: unknown, { input }: { input: unknown }, context: any) {
  requireStaff(context, permissions.canManageCatalog);
  const command = importInput.parse(input);
  const prisma = context.sudo().prisma;
  const store = await singleStore(prisma);
  const result = { sets: 0, cards: 0, readings: 0, sealed: 0 };

  if (command.set) {
    const list = CHECKLISTS[command.set];
    if (!list) throw new Error(`No bundled checklist for ${command.set}`);
    const set = await prisma.collectibleSet.upsert({
      where: { handle: list.id },
      create: {
        storeId: store.id, handle: list.id, name: list.name, code: list.code, series: list.series,
        printedTotal: list.printedTotal, totalCards: list.total, releaseDate: new Date(`${list.releaseDate}T00:00:00Z`),
        releaseStatus: 'released', logoUrl: list.logo, symbolUrl: list.symbol, tcgplayerGroupId: list.tcgplayerGroupId,
        manufacturer: 'The Pokémon Company', startYear: Number(list.releaseDate.slice(0, 4)),
      },
      update: { printedTotal: list.printedTotal, totalCards: list.total, logoUrl: list.logo, symbolUrl: list.symbol, tcgplayerGroupId: list.tcgplayerGroupId },
    });
    result.sets = 1;
    const created = await prisma.catalogItem.createMany({
      skipDuplicates: true,
      data: list.cards.map((card) => ({
        storeId: store.id,
        collectibleSetId: set.id,
        kind: 'single',
        title: card.name,
        handle: cardHandle(list.id, card.n),
        catalogNumber: card.num,
        cardNumber: card.num,
        numberSort: numberSortKey(card.n),
        rarity: card.r,
        supertype: card.st,
        subtypes: card.sub,
        energyTypes: card.t,
        hp: card.hp,
        artist: card.a,
        maker: 'The Pokémon Company',
        year: Number(list.releaseDate.slice(0, 4)),
        imageUrl: card.img,
        imageLargeUrl: largeCardImage(card.img),
        tcgplayerProductId: Object.values(card.tp)[0]?.[0] ?? null,
        status: 'active',
      })),
    });
    result.cards = created.count;
    const items: Array<{ id: string; handle: string }> = await prisma.catalogItem.findMany({
      where: { collectibleSetId: set.id }, select: { id: true, handle: true },
    });
    const idByHandle = new Map(items.map((item) => [item.handle, item.id]));
    const observedAt = new Date(`${list.pricesObservedOn}T12:00:00Z`);
    const already = await prisma.marketPrice.count({ where: { catalogItem: { collectibleSetId: set.id }, source: 'tcgplayer', observedAt } });
    if (!already) {
      const readings = list.cards.flatMap((card) => Object.entries(card.tp).map(([finish, [productId, low, mid, high, market]]) => ({
        catalogItemId: idByHandle.get(cardHandle(list.id, card.n)) ?? null,
        finish, source: 'tcgplayer', sourceReference: `tcgplayer:${productId}`, currencyCode: 'USD',
        lowMinor: low, midMinor: mid, highMinor: high, marketMinor: market, observedAt,
      }))).filter((row) => row.catalogItemId);
      result.readings = (await prisma.marketPrice.createMany({ data: readings })).count;
    }
  }

  if (command.upcoming) {
    const upcoming = command.upcoming;
    await prisma.collectibleSet.upsert({
      where: { handle: upcoming.handle },
      create: {
        storeId: store.id, handle: upcoming.handle, name: upcoming.name, code: upcoming.code ?? '', series: upcoming.series ?? '',
        releaseDate: new Date(`${upcoming.releaseDate}T00:00:00Z`), releaseStatus: 'preorder', logoUrl: upcoming.logoUrl ?? '',
        tcgplayerGroupId: upcoming.tcgplayerGroupId ?? null, manufacturer: 'The Pokémon Company', startYear: Number(upcoming.releaseDate.slice(0, 4)),
      },
      update: { releaseDate: new Date(`${upcoming.releaseDate}T00:00:00Z`) },
    });
    result.sets += 1;
  }

  for (const sealed of command.sealed ?? []) {
    const set = await prisma.collectibleSet.findUnique({ where: { handle: sealed.set }, select: { id: true, releaseDate: true } });
    if (!set) throw new Error(`Import set ${sealed.set} before its sealed product`);
    const item = await prisma.catalogItem.upsert({
      where: { handle: sealed.handle },
      create: {
        storeId: store.id, collectibleSetId: set.id, kind: 'sealed', sealedFormat: sealed.sealedFormat, title: sealed.title,
        handle: sealed.handle, maker: 'The Pokémon Company', year: set.releaseDate?.getUTCFullYear() ?? null,
        tcgplayerProductId: sealed.tcgplayerProductId ?? null, status: 'active',
      },
      update: {},
    });
    if (sealed.market && sealed.observedOn) {
      const observedAt = new Date(`${sealed.observedOn}T12:00:00Z`);
      const exists = await prisma.marketPrice.count({ where: { catalogItemId: item.id, source: 'tcgplayer', observedAt } });
      if (!exists) {
        await prisma.marketPrice.create({
          data: {
            catalogItemId: item.id, finish: 'normal', source: 'tcgplayer', currencyCode: 'USD', observedAt,
            sourceReference: sealed.tcgplayerProductId ? `tcgplayer:${sealed.tcgplayerProductId}` : '',
            lowMinor: sealed.market.low, midMinor: sealed.market.mid, highMinor: sealed.market.high, marketMinor: sealed.market.market,
          },
        });
        result.readings += 1;
      }
    }
    result.sealed += 1;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Market refresh (staff): today's TCGplayer prices from the public tcgcsv.com mirror.

const FINISH_BY_SUBTYPE: Record<string, string> = {
  Normal: 'normal', Holofoil: 'holofoil', 'Reverse Holofoil': 'reverse_holofoil',
  '1st Edition Holofoil': 'first_edition_holofoil', '1st Edition Normal': 'first_edition_normal',
  'Unlimited Holofoil': 'unlimited_holofoil', Unlimited: 'unlimited_normal',
};
const cents = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : null);

export async function refreshMarketPrices(_root: unknown, { input }: { input?: unknown }, context: any) {
  requireStaff(context, permissions.canManageCatalog);
  const { sets: only } = z.object({ sets: z.array(key).max(50).optional() }).strict().parse(input ?? {});
  const prisma = context.sudo().prisma;
  const sets = await prisma.collectibleSet.findMany({
    where: { tcgplayerGroupId: { not: null }, ...(only?.length ? { handle: { in: only } } : {}) },
    select: { id: true, handle: true, tcgplayerGroupId: true },
  });
  const observedAt = new Date();
  const report: Array<{ set: string; readings: number; error?: string }> = [];
  for (const set of sets) {
    try {
      // TCGCSV refuses anonymous clients; identify the app honestly.
      const response = await fetch(`https://tcgcsv.com/tcgplayer/3/${set.tcgplayerGroupId}/prices`, {
        headers: { 'user-agent': 'Openfront-Collectibles/1.0 (market price refresh)' },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`Price source answered ${response.status}`);
      const body = await response.json() as { results?: Array<Record<string, unknown>> };
      const items: Array<{ id: string; tcgplayerProductId: number | null }> = await prisma.catalogItem.findMany({
        where: { collectibleSetId: set.id, tcgplayerProductId: { not: null } }, select: { id: true, tcgplayerProductId: true },
      });
      const byProduct = new Map(items.map((item) => [item.tcgplayerProductId, item.id]));
      const rows = (body.results ?? []).flatMap((row) => {
        const catalogItemId = byProduct.get(Number(row.productId));
        const finish = FINISH_BY_SUBTYPE[String(row.subTypeName)];
        if (!catalogItemId || !finish || (row.marketPrice == null && row.midPrice == null)) return [];
        return [{
          catalogItemId, finish, source: 'tcgplayer', sourceReference: `tcgplayer:${row.productId}`, currencyCode: 'USD', observedAt,
          lowMinor: cents(row.lowPrice), midMinor: cents(row.midPrice), highMinor: cents(row.highPrice), marketMinor: cents(row.marketPrice),
        }];
      });
      const created = rows.length ? await prisma.marketPrice.createMany({ data: rows }) : { count: 0 };
      report.push({ set: set.handle, readings: created.count });
    } catch (error) {
      report.push({ set: set.handle, readings: 0, error: error instanceof Error ? error.message : 'Refresh failed' });
    }
  }
  const buylistEntries = await refreshBuylistOffers(prisma);
  return { observedAt: observedAt.toISOString(), sets: report, buylistEntries };
}

async function latestReadings(prisma: any, catalogItemIds: string[]) {
  if (!catalogItemIds.length) return new Map<string, any>();
  const rows = await prisma.marketPrice.findMany({
    where: { catalogItemId: { in: catalogItemIds }, grade: '', condition: null },
    orderBy: { observedAt: 'desc' },
    distinct: ['catalogItemId', 'finish'],
    select: { catalogItemId: true, finish: true, lowMinor: true, midMinor: true, highMinor: true, marketMinor: true, observedAt: true, source: true },
  });
  const map = new Map<string, any>();
  for (const row of rows) map.set(`${row.catalogItemId}:${row.finish ?? ''}`, row);
  return map;
}

function readingFor(readings: Map<string, any>, catalogItemId: string, finish: string | null | undefined) {
  if (finish) return readings.get(`${catalogItemId}:${finish}`) ?? null;
  for (const [mapKey, value] of readings) if (mapKey.startsWith(`${catalogItemId}:`)) return value;
  return null;
}

async function refreshBuylistOffers(prisma: any) {
  const entries = await prisma.buylistEntry.findMany({
    where: { pricingMode: 'market', active: 'active', catalogItemId: { not: null } },
    include: { buylist: true },
  });
  const readings = await latestReadings(prisma, [...new Set(entries.map((entry: any) => entry.catalogItemId))] as string[]);
  let updated = 0;
  for (const entry of entries) {
    const reading = readingFor(readings, entry.catalogItemId, entry.cardFinish);
    const market = reading?.marketMinor ?? reading?.midMinor;
    if (!market) continue;
    const offers = buylistOffersFromMarket(market, entry.buylist);
    if (offers.cashMinor === entry.offerAmountMinor && offers.creditMinor === entry.creditOfferMinor) continue;
    await prisma.buylistEntry.update({ where: { id: entry.id }, data: { offerAmountMinor: offers.cashMinor, creditOfferMinor: offers.creditMinor } });
    updated += 1;
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Repricing (staff): preview or apply rule prices to market-priced variants.

export async function repriceInventory(_root: unknown, { input }: { input?: unknown }, context: any) {
  requireStaff(context, permissions.canManageProducts);
  const { apply } = z.object({ apply: z.boolean().default(false) }).strict().parse(input ?? {});
  const prisma = context.sudo().prisma;
  const store = await singleStore(prisma);
  const base = String(store.defaultCurrencyCode || 'usd').toLowerCase();
  const rules: Rule[] = await prisma.pricingRule.findMany({ where: { active: true } });
  const variants = await prisma.productVariant.findMany({
    where: { pricingMode: 'market', product: { catalogItemId: { not: null } } },
    select: {
      id: true, title: true, stockKind: true, cardCondition: true, cardFinish: true,
      product: { select: { title: true, handle: true, catalogItemId: true } },
      prices: { where: { priceListId: null }, select: { id: true, amount: true, currency: { select: { code: true } } } },
    },
  });
  const readings = await latestReadings(prisma, [...new Set(variants.map((variant: any) => variant.product.catalogItemId))] as string[]);
  const rows = [];
  const now = new Date();
  for (const variant of variants) {
    const basePrice = variant.prices.find((price: any) => price.currency?.code?.toLowerCase() === base);
    const reading = readingFor(readings, variant.product.catalogItemId, variant.stockKind === 'sealed' ? 'normal' : variant.cardFinish);
    const condition = variant.stockKind === 'raw' ? variant.cardCondition || 'NM' : null;
    const suggestion = suggestPrice(chooseRule(rules, variant.stockKind, condition), reading, basePrice?.amount ?? null);
    const row = {
      variantId: variant.id, product: variant.product.title, handle: variant.product.handle, variant: variant.title,
      stockKind: variant.stockKind, condition, finish: variant.cardFinish, currentMinor: basePrice?.amount ?? null,
      marketMinor: reading?.marketMinor ?? null, observedAt: reading?.observedAt?.toISOString() ?? null, ...suggestion,
      applied: false,
    };
    if (apply && suggestion.status === 'priced' && basePrice && suggestion.suggestedMinor !== basePrice.amount) {
      await prisma.$transaction(async (tx: any) => {
        for (const price of variant.prices) {
          const amount = price.id === basePrice.id
            ? suggestion.suggestedMinor
            : Math.max(1, Math.round((price.amount * suggestion.suggestedMinor) / basePrice.amount));
          await tx.moneyAmount.update({ where: { id: price.id }, data: { amount } });
        }
        await tx.productVariant.update({ where: { id: variant.id }, data: { lastRepricedAt: now } });
      });
      row.applied = true;
    }
    rows.push(row);
  }
  return {
    apply,
    priced: rows.filter((row) => row.status === 'priced').length,
    review: rows.filter((row) => row.status === 'review').length,
    skipped: rows.filter((row) => row.status === 'skipped').length,
    applied: rows.filter((row) => row.applied).length,
    rows,
  };
}

// ---------------------------------------------------------------------------
// Public projections for the storefront.

async function publishedStock(prisma: any, currencyCode: string, where: Record<string, unknown>) {
  const products = await prisma.product.findMany({
    where: { status: 'published', catalogItemId: { not: null }, ...where },
    select: {
      id: true, title: true, handle: true, catalogItemId: true,
      productVariants: {
        orderBy: { variantRank: 'asc' },
        select: {
          id: true, title: true, stockKind: true, cardCondition: true, cardFinish: true, cardLanguage: true,
          inventoryQuantity: true, manageInventory: true, allowBackorder: true, preorder: true, preorderReleaseDate: true,
          preorderLimitPerCustomer: true,
          prices: { where: { priceListId: null, currency: { is: { code: { equals: currencyCode, mode: 'insensitive' } } } }, select: { amount: true } },
        },
      },
    },
  });
  const byCatalog = new Map<string, any[]>();
  for (const product of products) {
    const entry = {
      title: product.title,
      handle: product.handle,
      variants: product.productVariants.map((variant: any) => ({
        id: variant.id, title: variant.title, stockKind: variant.stockKind, condition: variant.cardCondition, finish: variant.cardFinish,
        language: variant.cardLanguage, quantity: variant.manageInventory ? Math.max(0, variant.inventoryQuantity) : null,
        available: !variant.manageInventory || variant.allowBackorder || variant.inventoryQuantity > 0,
        preorder: variant.preorder, preorderReleaseDate: variant.preorderReleaseDate?.toISOString() ?? null,
        preorderLimitPerCustomer: variant.preorderLimitPerCustomer ?? null,
        priceMinor: variant.prices[0]?.amount ?? null,
      })),
    };
    byCatalog.set(product.catalogItemId, [...(byCatalog.get(product.catalogItemId) ?? []), entry]);
  }
  return byCatalog;
}

function setProjection(set: any) {
  return {
    handle: set.handle, name: set.name, code: set.code || null, series: set.series || null,
    printedTotal: set.printedTotal ?? null, totalCards: set.totalCards ?? null,
    releaseDate: set.releaseDate?.toISOString() ?? null, releaseStatus: set.releaseStatus,
    logoUrl: set.logoUrl || null, symbolUrl: set.symbolUrl || null,
  };
}

function cardProjection(item: any) {
  return {
    id: item.id, handle: item.handle, kind: item.kind, name: item.title, number: item.cardNumber || null, rarity: item.rarity || null,
    supertype: item.supertype || null, energyTypes: Array.isArray(item.energyTypes) ? item.energyTypes : [], hp: item.hp || null,
    artist: item.artist || null, imageUrl: item.imageUrl || null, imageLargeUrl: item.imageLargeUrl || null,
    sealedFormat: item.sealedFormat || null,
  };
}

function marketProjection(readings: Map<string, any>, catalogItemId: string) {
  const finishes: Record<string, { lowMinor: number | null; midMinor: number | null; highMinor: number | null; marketMinor: number | null; observedAt: string }> = {};
  for (const [mapKey, row] of readings) {
    if (!mapKey.startsWith(`${catalogItemId}:`)) continue;
    finishes[row.finish ?? 'normal'] = { lowMinor: row.lowMinor, midMinor: row.midMinor, highMinor: row.highMinor, marketMinor: row.marketMinor, observedAt: row.observedAt.toISOString() };
  }
  return finishes;
}

/** Every card set with how much of it the shop stocks, newest first. */
export async function publicCardSets(_root: unknown, { currencyCode }: { currencyCode?: string }, context: any) {
  const code = currency.parse(currencyCode || 'usd');
  const prisma = context.sudo().prisma;
  const sets = await prisma.collectibleSet.findMany({ orderBy: [{ releaseDate: 'desc' }, { name: 'asc' }] });
  const stock = await publishedStock(prisma, code, {});
  const catalog = stock.size
    ? await prisma.catalogItem.findMany({ where: { id: { in: [...stock.keys()] } }, select: { id: true, collectibleSetId: true, kind: true } })
    : [];
  return sets.map((set: any) => {
    const mine = catalog.filter((item: any) => item.collectibleSetId === set.id);
    const inStock = mine.filter((item: any) => (stock.get(item.id) ?? []).some((product) => product.variants.some((variant: any) => variant.available)));
    return {
      ...setProjection(set),
      cardsStocked: inStock.filter((item: any) => item.kind === 'single').length,
      sealedStocked: inStock.filter((item: any) => item.kind === 'sealed').length,
    };
  });
}

/** One set's full printed checklist: each card with its market reading and the shop's stock. */
export async function publicSetChecklist(_root: unknown, { handle, currencyCode }: { handle: string; currencyCode?: string }, context: any) {
  const setHandle = key.parse(handle);
  const code = currency.parse(currencyCode || 'usd');
  const prisma = context.sudo().prisma;
  const set = await prisma.collectibleSet.findUnique({ where: { handle: setHandle } });
  if (!set) return null;
  const items = await prisma.catalogItem.findMany({
    where: { collectibleSetId: set.id, status: 'active' },
    orderBy: [{ kind: 'desc' }, { numberSort: 'asc' }, { title: 'asc' }],
  });
  const ids = items.map((item: any) => item.id);
  const [readings, stock] = await Promise.all([
    latestReadings(prisma, ids),
    publishedStock(prisma, code, { catalogItemId: { in: ids } }),
  ]);
  return {
    set: setProjection(set),
    currencyCode: code,
    cards: items.map((item: any) => ({ ...cardProjection(item), market: marketProjection(readings, item.id), stock: stock.get(item.id) ?? [] })),
  };
}

/** One card's market readings over time, per printing, oldest first. */
export async function publicCardMarket(_root: unknown, { catalogItemId }: { catalogItemId: string }, context: any) {
  const id = key.parse(catalogItemId);
  const prisma = context.sudo().prisma;
  const item = await prisma.catalogItem.findFirst({ where: { id, status: 'active' }, include: { collectibleSet: true } });
  if (!item) return null;
  const since = new Date(Date.now() - 400 * 86_400_000);
  const rows = await prisma.marketPrice.findMany({
    where: { catalogItemId: id, observedAt: { gte: since } },
    orderBy: { observedAt: 'asc' },
    take: 2000,
    select: { finish: true, condition: true, grade: true, source: true, lowMinor: true, midMinor: true, highMinor: true, marketMinor: true, observedAt: true, currencyCode: true },
  });
  return {
    card: cardProjection(item),
    set: item.collectibleSet ? setProjection(item.collectibleSet) : null,
    readings: rows.map((row: any) => ({ ...row, observedAt: row.observedAt.toISOString() })),
  };
}

// ---------------------------------------------------------------------------
// Binder and want list (signed-in collectors).

const binderInput = z.object({
  catalogItemId: key,
  finish: z.string().max(40).nullable().optional(),
  condition: z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']).default('NM'),
  quantity: z.number().int().min(1).max(999).default(1),
  costBasisMinor: z.number().int().nonnegative().nullable().optional(),
  grade: z.string().trim().max(40).nullable().optional(),
}).strict();

export async function addToBinder(_root: unknown, { input }: { input: unknown }, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const command = binderInput.parse(input);
  const prisma = context.sudo().prisma;
  return prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`binder:${userId}`}))::text AS locked`;
    const item = await tx.catalogItem.findFirst({ where: { id: command.catalogItemId, status: 'active' }, select: { id: true } });
    if (!item) throw new Error('That card is not in the catalog');
    const binder = (await tx.binder.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } }))
      ?? await tx.binder.create({ data: { userId, name: 'My binder' } });
    const same = await tx.binderCard.findFirst({
      where: { binderId: binder.id, catalogItemId: item.id, cardFinish: command.finish ?? null, cardCondition: command.condition, grade: command.grade || '' },
    });
    if (same) {
      const updated = await tx.binderCard.update({ where: { id: same.id }, data: { quantity: same.quantity + command.quantity } });
      return { id: updated.id, quantity: updated.quantity };
    }
    const created = await tx.binderCard.create({
      data: {
        binderId: binder.id, catalogItemId: item.id, cardFinish: command.finish ?? null, cardCondition: command.condition,
        quantity: command.quantity, costBasisMinor: command.costBasisMinor ?? null, grade: command.grade || '', acquiredAt: new Date(),
      },
    });
    return { id: created.id, quantity: created.quantity };
  }, { isolationLevel: 'Serializable', timeout: 10_000 });
}

export async function removeFromBinder(_root: unknown, { binderCardId }: { binderCardId: string }, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const id = key.parse(binderCardId);
  const removed = await context.sudo().prisma.binderCard.deleteMany({ where: { id, binder: { userId } } });
  if (!removed.count) throw new Error('Card not found in your binder');
  return { id, removed: true };
}

/** The caller's binder: cards with market value and set completion. */
export async function activeBinder(_root: unknown, _args: unknown, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const prisma = context.sudo().prisma;
  const binder = await prisma.binder.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
  if (!binder) return { id: null, name: 'My binder', cards: [], sets: [] };
  const cards = await prisma.binderCard.findMany({
    where: { binderId: binder.id },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    include: { catalogItem: { include: { collectibleSet: true } } },
  });
  const readings = await latestReadings(prisma, [...new Set(cards.map((card: any) => card.catalogItemId).filter(Boolean))] as string[]);
  const sets = new Map<string, { set: any; owned: Set<string> }>();
  const rows = cards.filter((card: any) => card.catalogItem).map((card: any) => {
    const reading = readingFor(readings, card.catalogItemId, card.cardFinish);
    const set = card.catalogItem.collectibleSet;
    if (set && card.catalogItem.kind === 'single') {
      const bucket = sets.get(set.id) ?? { set, owned: new Set<string>() };
      bucket.owned.add(card.catalogItemId);
      sets.set(set.id, bucket);
    }
    return {
      id: card.id, card: cardProjection(card.catalogItem), set: set ? setProjection(set) : null,
      finish: card.cardFinish, condition: card.cardCondition, language: card.cardLanguage, grade: card.grade || null,
      quantity: card.quantity, costBasisMinor: card.costBasisMinor, acquiredAt: card.acquiredAt?.toISOString() ?? null,
      marketMinor: reading?.marketMinor ?? null, observedAt: reading?.observedAt?.toISOString() ?? null,
    };
  });
  return {
    id: binder.id,
    name: binder.name,
    cards: rows,
    sets: [...sets.values()].map(({ set, owned }) => ({ ...setProjection(set), owned: owned.size })),
  };
}

const wantInput = z.object({
  catalogItemId: key,
  finish: z.string().max(40).nullable().optional(),
  minimumCondition: z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']).nullable().optional(),
  maxPriceMinor: z.number().int().nonnegative().nullable().optional(),
}).strict();

/** Adds a card to the caller's want list, or removes it when it is already there. */
export async function toggleWantList(_root: unknown, { input }: { input: unknown }, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const command = wantInput.parse(input);
  const prisma = context.sudo().prisma;
  return prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`want:${userId}:${command.catalogItemId}`}))::text AS locked`;
    const existing = await tx.wishlistItem.findMany({ where: { userId, catalogItemId: command.catalogItemId, listingId: null }, select: { id: true } });
    if (existing.length) {
      await tx.wishlistItem.deleteMany({ where: { id: { in: existing.map((row: any) => row.id) } } });
      return { catalogItemId: command.catalogItemId, wanted: false };
    }
    const item = await tx.catalogItem.findFirst({ where: { id: command.catalogItemId, status: 'active' }, select: { id: true } });
    if (!item) throw new Error('That card is not in the catalog');
    await tx.wishlistItem.create({
      data: {
        userId, catalogItemId: item.id, cardFinish: command.finish ?? null, minimumCondition: command.minimumCondition ?? null,
        maxPriceMinor: command.maxPriceMinor ?? null, quantity: 1, notifyWhenInStock: true, notes: '',
      },
    });
    return { catalogItemId: command.catalogItemId, wanted: true };
  }, { isolationLevel: 'Serializable', timeout: 10_000 });
}

/** The caller's want list with whether the shop has a copy that meets it right now. */
export async function activeWantList(_root: unknown, { currencyCode }: { currencyCode?: string }, context: any) {
  const userId = requireHumanOwnerId(context.session);
  const code = currency.parse(currencyCode || 'usd');
  const prisma = context.sudo().prisma;
  const rows = await prisma.wishlistItem.findMany({
    where: { userId, listingId: null, catalogItemId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { catalogItem: { include: { collectibleSet: true } } },
  });
  const ids = rows.map((row: any) => row.catalogItemId);
  const [readings, stock] = await Promise.all([latestReadings(prisma, ids), publishedStock(prisma, code, { catalogItemId: { in: ids } })]);
  return rows.filter((row: any) => row.catalogItem?.status === 'active').map((row: any) => {
    const worst = row.minimumCondition ? CONDITION_ORDER.indexOf(row.minimumCondition) : CONDITION_ORDER.length;
    const matches = (stock.get(row.catalogItemId) ?? []).flatMap((product) => product.variants
      .filter((variant: any) => variant.available
        && (!row.cardFinish || variant.finish === row.cardFinish)
        && (variant.condition == null || CONDITION_ORDER.indexOf(variant.condition) <= worst)
        && (row.maxPriceMinor == null || (variant.priceMinor ?? Infinity) <= row.maxPriceMinor))
      .map((variant: any) => ({ handle: product.handle, variantId: variant.id, condition: variant.condition, finish: variant.finish, priceMinor: variant.priceMinor })));
    const reading = readingFor(readings, row.catalogItemId, row.cardFinish);
    return {
      id: row.id, savedAt: row.createdAt.toISOString(), card: cardProjection(row.catalogItem),
      set: row.catalogItem.collectibleSet ? setProjection(row.catalogItem.collectibleSet) : null,
      finish: row.cardFinish, minimumCondition: row.minimumCondition, maxPriceMinor: row.maxPriceMinor,
      marketMinor: reading?.marketMinor ?? null, inStock: matches,
    };
  });
}
