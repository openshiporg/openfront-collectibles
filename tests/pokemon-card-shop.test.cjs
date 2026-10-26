// Pokémon card shop: pricing and buylist arithmetic, catalog helpers, rarity marks,
// pre-order limits and onboarding seed integrity. Node's built-in runner; no DB or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(relative, mocks = {}) {
  const cache = new Map();
  function run(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2))
        : specifier.startsWith('.') ? path.resolve(path.dirname(filename), specifier) : null;
      if (base) {
        for (const ext of ['.ts', '.tsx', '']) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) {
          return base.endsWith('.json') || ext === '' && base.endsWith('.json') ? JSON.parse(fs.readFileSync(base + ext, 'utf8')) : run(base + ext);
        }
      }
      return require(specifier);
    };
    new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
    return module.exports;
  }
  return run(path.join(root, relative));
}

const pricing = load('features/keystone/lib/pokemon/pricing.ts');
const enums = load('features/keystone/lib/pokemon/card-enums.ts');

test('prices round up to the store ending and never below the computed amount', () => {
  assert.equal(pricing.roundPrice(29442, 'ninety_nine'), 29499);
  assert.equal(pricing.roundPrice(29499, 'ninety_nine'), 29499);
  assert.equal(pricing.roundPrice(29500, 'ninety_nine'), 29599);
  assert.equal(pricing.roundPrice(1001, 'quarter'), 1025);
  assert.equal(pricing.roundPrice(1001, 'whole'), 1100);
  assert.equal(pricing.roundPrice(1000.2, 'none'), 1001);
});

test('a condition rule beats an every-condition rule, then priority; inactive rules never apply', () => {
  const rules = [
    { id: 'any', appliesTo: 'raw', basis: 'market', percentBasisPoints: 10000, rounding: 'none', priority: 50 },
    { id: 'lp', appliesTo: 'raw', condition: 'LP', basis: 'market', percentBasisPoints: 8500, rounding: 'none', priority: 0 },
    { id: 'off', appliesTo: 'raw', condition: 'LP', basis: 'market', percentBasisPoints: 1, rounding: 'none', priority: 99, active: false },
    { id: 'sealed', appliesTo: 'sealed', basis: 'market', percentBasisPoints: 10000, rounding: 'none' },
  ];
  assert.equal(pricing.chooseRule(rules, 'raw', 'LP').id, 'lp');
  assert.equal(pricing.chooseRule(rules, 'raw', 'NM').id, 'any');
  assert.equal(pricing.chooseRule(rules, 'graded', 'NM'), null);
});

test('suggested prices follow the basis, floor and swing guard', () => {
  const rule = { appliesTo: 'raw', condition: 'LP', basis: 'market', percentBasisPoints: 8500, minimumMinor: 25, maximumChangeBasisPoints: 3000, rounding: 'ninety_nine' };
  const priced = pricing.suggestPrice(rule, { marketMinor: 10000 }, 8299);
  assert.equal(priced.status, 'priced');
  assert.equal(priced.suggestedMinor, 8599);
  const swing = pricing.suggestPrice(rule, { marketMinor: 20000 }, 8299);
  assert.equal(swing.status, 'review');
  assert.equal(pricing.suggestPrice(rule, { marketMinor: 10 }, null).suggestedMinor, 99);
  assert.deepEqual(pricing.suggestPrice(rule, null, 100), { status: 'skipped', reason: 'no_market' });
  assert.deepEqual(pricing.suggestPrice(null, { marketMinor: 1 }, 100), { status: 'skipped', reason: 'no_rule' });
  // Market falls back to mid, then low.
  assert.equal(pricing.basisAmount({ marketMinor: null, midMinor: 500, lowMinor: 400 }, 'market'), 500);
  assert.equal(pricing.basisAmount({ marketMinor: 600, lowMinor: null }, 'low'), 600);
});

test('buylist offers: cash and credit shares of market, scaled by condition, floored at the minimum', () => {
  const terms = { cashPercentBasisPoints: 6000, creditPercentBasisPoints: 8000, minimumOfferMinor: 25, conditionBasisPoints: { LP: 8500, MP: 7000 } };
  assert.deepEqual(pricing.buylistOffersFromMarket(29442, terms), { cashMinor: 17665, creditMinor: 23553 });
  assert.deepEqual(pricing.buylistOffersFromMarket(20, terms), { cashMinor: 25, creditMinor: 25 });
  assert.equal(pricing.offerForCondition(17665, terms, 'NM'), 17665);
  assert.equal(pricing.offerForCondition(17665, terms, 'LP'), 15015);
  assert.equal(pricing.offerForCondition(17665, terms, 'HP', 'MP'), 0, 'below the minimum condition the shop buys');
  assert.equal(pricing.offerForCondition(17665, terms, 'DMG'), 5299, 'default share applies where the table is silent');
});

test('card numbers sort as printed, secret and gallery numbers after the main run', () => {
  const order = ['GG69', '160', '009', '1', '199', 'TG05', 'GG01'].sort((a, b) => enums.numberSortKey(a) - enums.numberSortKey(b));
  assert.deepEqual(order, ['1', '009', '160', '199', 'GG01', 'GG69', 'TG05']);
  assert.equal(enums.largeCardImage('https://images.pokemontcg.io/sv3pt5/199.png'), 'https://images.pokemontcg.io/sv3pt5/199_hires.png');
  assert.equal(enums.largeCardImage('https://images.scrydex.com/pokemon/me5-1/small'), 'https://images.scrydex.com/pokemon/me5-1/large');
  assert.equal(enums.labelOf(enums.CARD_CONDITIONS, 'MP'), 'Moderately Played');
});

test('rarity marks read as the card prints them', () => {
  const { rarityMarkSpec } = load('features/storefront/components/cards/rarity-mark.tsx', { react: {}, 'react/jsx-runtime': { jsx: () => null, jsxs: () => null, Fragment: 'f' } });
  assert.deepEqual(rarityMarkSpec('Common'), { shape: 'circle' });
  assert.deepEqual(rarityMarkSpec('Uncommon'), { shape: 'diamond' });
  assert.equal(rarityMarkSpec('Special Illustration Rare').count, 2);
  assert.equal(rarityMarkSpec('Special Illustration Rare').tone, 'gold');
  assert.equal(rarityMarkSpec('Illustration Rare').count, 1);
  assert.equal(rarityMarkSpec('Hyper Rare').count, 3);
  assert.equal(rarityMarkSpec('Double Rare').tone, 'ink');
  assert.equal(rarityMarkSpec('ACE SPEC Rare').text, 'ACE');
});

test('pre-order limits hold across the cart and earlier uncancelled orders', async () => {
  const { assertPreorderLimit } = load('features/keystone/lib/pokemon/preorder-limit.ts');
  const prisma = (held, limit = 2, preorder = true) => ({
    productVariant: { findUnique: async () => ({ preorder, preorderLimitPerCustomer: limit, title: 'Sealed', product: { title: 'Delta Reign Booster Box (Pre-order)' } }) },
    cart: { findUnique: async () => ({ userId: 'u1' }) },
    orderLineItem: { aggregate: async ({ where }) => {
      assert.deepEqual(where.order.status, { not: 'canceled' });
      return { _sum: { quantity: held } };
    } },
  });
  await assertPreorderLimit(prisma(0), { cartId: 'c', variantId: 'v', quantity: 2 });
  await assert.rejects(assertPreorderLimit(prisma(1), { cartId: 'c', variantId: 'v', quantity: 2, adding: 2 }), /you can add 1 more/);
  await assert.rejects(assertPreorderLimit(prisma(2), { cartId: 'c', variantId: 'v', quantity: 1, adding: 1 }), /already have 2/);
  // Two already in the cart, adding a third: nothing left to add.
  await assert.rejects(assertPreorderLimit(prisma(0), { cartId: 'c', variantId: 'v', quantity: 3, adding: 1 }), /already have 2/);
  await assert.rejects(assertPreorderLimit(prisma(0), { cartId: 'c', variantId: 'v', quantity: 3 }), /limited to 2 per customer$/);
  await assertPreorderLimit(prisma(5, 2, false), { cartId: 'c', variantId: 'v', quantity: 9 });
});

test('the onboarding seed is a coherent Pokémon card shop', () => {
  const seed = JSON.parse(fs.readFileSync(path.join(root, 'features/platform/onboarding/lib/seed.json'), 'utf8'));
  const dir = path.join(root, 'features/keystone/lib/pokemon/checklists');
  const handles = new Set();
  for (const set of seed.cardSets.sets) {
    const file = path.join(dir, `${set.id}.json`);
    assert.ok(fs.existsSync(file), `bundled checklist for ${set.id}`);
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(list.name, set.name);
    for (const card of list.cards) {
      handles.add(`${set.id}-${card.n}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      assert.match(card.img, /^https:\/\/images\.(pokemontcg\.io|scrydex\.com)\//, 'card art from the Pokémon TCG API hosts');
    }
  }
  for (const sealed of seed.cardSets.sealed) handles.add(sealed.handle);
  const categories = new Set(seed.categories.map((c) => c.handle));
  const kinds = { single: 0, graded: 0, sealed: 0 };
  const skus = new Set();
  for (const product of seed.products) {
    kinds[product.metadata.kind] += 1;
    assert.ok(handles.has(product.catalogItem.connect.handle), `${product.handle} links to a catalog card`);
    for (const c of product.productCategories.connect) assert.ok(categories.has(c.handle));
    for (const v of product.variants) {
      assert.ok(!skus.has(v.sku), `unique SKU ${v.sku}`);
      skus.add(v.sku);
      assert.ok(v.prices.every((p) => Number.isInteger(p.amount) && p.amount > 0));
      if (v.stockKind === 'raw') assert.ok(['NM', 'LP', 'MP', 'HP', 'DMG'].includes(v.cardCondition));
      if (v.preorder) assert.ok(v.preorderReleaseDate && v.preorderLimitPerCustomer > 0);
    }
    if (product.image) assert.match(product.image.url, /^https:\/\/images\.(pokemontcg\.io|scrydex\.com)\//);
  }
  assert.ok(kinds.single >= 30 && kinds.graded >= 5 && kinds.sealed >= 10, JSON.stringify(kinds));
  for (const slab of seed.collectibles) {
    assert.ok(skus.has(slab.code), `slab ${slab.code} has its product variant`);
    assert.ok(handles.has(slab.catalogItemHandle));
    assert.match(slab.grade.certificate, /^SAMPLE-/, 'demo certificates are labelled samples');
    assert.equal(slab.grade.sample, true);
  }
  for (const entry of seed.pricing.buylist.entries) assert.ok(handles.has(entry.catalogItemHandle));
  assert.ok(seed.pricing.rules.some((r) => r.appliesTo === 'raw' && r.condition === 'NM'));
  assert.equal(seed.cardSets.upcoming.releaseDate > '2026-10-25', true, 'the pre-order set is not yet released');
});
