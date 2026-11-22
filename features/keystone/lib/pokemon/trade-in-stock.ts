// Paying a trade-in is when the shop owns the cards: each accepted single goes into stock as a
// raw-card variant (condition, finish), with the payout as its cost basis (BinderPOS stocks a
// buylist on payout the same way). Runs inside the payout transaction, so it happens once.
import { CARD_CONDITIONS, CARD_FINISHES, labelOf } from './card-enums';
import { chooseRule, suggestPrice, type Rule } from './pricing';

const CONDITION_CODES = new Map<string, string>(
  CARD_CONDITIONS.flatMap((c) => [[c.value.toUpperCase(), c.value], [c.label.toUpperCase(), c.value]] as [string, string][])
);

/** "Near Mint", "nm" or "NM" → "NM"; anything else → null. */
export function conditionCode(value: string | null | undefined): string | null {
  const key = String(value || '').trim().toUpperCase();
  return key ? CONDITION_CODES.get(key) ?? null : null;
}

const FINISH_SKU: Record<string, string> = {
  normal: 'NOR', holofoil: 'HOL', reverse_holofoil: 'REV', first_edition_holofoil: '1EH',
  first_edition_normal: '1ED', unlimited_holofoil: 'UNL', unlimited_normal: 'UNN',
};

export type StockedLine = { itemId: string; title: string; sku: string; quantity: number; unitCostMinor: number; created: boolean };
export type SkippedLine = { itemId: string; description: string; reason: string };

export async function stockTradeInItems(
  tx: any,
  submission: { id: string; reference: string; items: any[] }
): Promise<{ stocked: StockedLine[]; skipped: SkippedLine[] }> {
  const stocked: StockedLine[] = [];
  const skipped: SkippedLine[] = [];
  const items = submission.items.filter((item) => (item.acceptedAmountMinor ?? 0) > 0);
  if (!items.length) return { stocked, skipped };

  const store = (await tx.store.findMany({ take: 1, select: { defaultCurrencyCode: true } }))[0];
  const baseCurrency = String(store?.defaultCurrencyCode || 'usd').toLowerCase();
  const regions = await tx.region.findMany({ select: { id: true, currency: { select: { id: true, code: true } } } });
  const rules: Rule[] = await tx.pricingRule.findMany({ where: { active: true } });
  const singles = await tx.productCategory.findFirst({ where: { handle: 'singles' }, select: { id: true } });

  for (const item of items) {
    const description = item.customerDescription || 'Card';
    if (!item.catalogItemId) {
      skipped.push({ itemId: item.id, description, reason: 'Not matched to a catalogue card' });
      continue;
    }
    if (item.specimenId) {
      const graded = await tx.gradeObservation.findFirst({ where: { specimenId: item.specimenId }, select: { id: true } });
      if (graded) {
        skipped.push({ itemId: item.id, description, reason: 'Graded slab: receive it as an item' });
        continue;
      }
    }
    const observation = item.inspectedConditionObservationId
      ? await tx.conditionObservation.findUnique({ where: { id: item.inspectedConditionObservationId }, select: { label: true } })
      : null;
    const condition = conditionCode(observation?.label) || conditionCode(item.cardCondition) || conditionCode(item.customerCondition) || 'NM';
    const quantity = Math.max(1, item.quantity ?? 1);
    const unitCostMinor = Math.round(item.acceptedAmountMinor / quantity);
    const card = await tx.catalogItem.findUnique({
      where: { id: item.catalogItemId },
      select: { id: true, title: true, handle: true, cardNumber: true, rarity: true, imageUrl: true, imageLargeUrl: true, collectibleSet: { select: { name: true } } },
    });
    if (!card) {
      skipped.push({ itemId: item.id, description, reason: 'Catalogue card not found' });
      continue;
    }
    const finish = item.cardFinish || (await tx.marketPrice.findFirst({ where: { catalogItemId: card.id }, select: { finish: true } }))?.finish || 'normal';

    // The card's product: the raw-single product for this printing, created on first stock.
    let product = await tx.product.findFirst({
      where: { catalogItemId: card.id, productVariants: { some: { stockKind: 'raw' } } },
      select: { id: true, handle: true, productOptions: { select: { id: true, title: true } } },
    });
    if (!product) {
      product = await tx.product.findFirst({
        where: { catalogItemId: card.id, productVariants: { none: {} } },
        select: { id: true, handle: true, productOptions: { select: { id: true, title: true } } },
      });
    }
    if (!product) {
      const title = card.cardNumber ? `${card.title} ${card.cardNumber}` : card.title;
      let handle = `${card.title}-${card.handle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (await tx.product.findUnique({ where: { handle }, select: { id: true } })) handle = `${handle}-single`;
      const image = card.imageLargeUrl || card.imageUrl;
      product = await tx.product.create({
        data: {
          title,
          handle,
          subtitle: [card.collectibleSet?.name, card.rarity].filter(Boolean).join(' · '),
          status: 'published',
          metadata: { kind: 'single', vertical: 'collectibles' },
          catalogItem: { connect: { id: card.id } },
          ...(singles ? { productCategories: { connect: [{ id: singles.id }] } } : {}),
          ...(image ? { productImages: { create: [{ imagePath: image, altText: title }] } } : {}),
          productOptions: { create: [{ title: 'Condition' }] },
        },
        select: { id: true, handle: true, productOptions: { select: { id: true, title: true } } },
      });
    }

    const existing = await tx.productVariant.findFirst({
      where: { productId: product.id, stockKind: 'raw', cardCondition: condition, cardFinish: finish },
      select: { id: true, sku: true, title: true, inventoryQuantity: true, metadata: true },
    });
    const note = `${submission.reference}: ${quantity} at ${(unitCostMinor / 100).toFixed(2)} each`;
    if (existing) {
      // Weighted average cost across what is on hand and what was just bought.
      const meta = (existing.metadata || {}) as Record<string, any>;
      const onHand = Math.max(0, existing.inventoryQuantity);
      const priorCost = typeof meta.costBasisMinor === 'number' ? meta.costBasisMinor : null;
      const averaged = priorCost == null || onHand === 0 ? unitCostMinor : Math.round((priorCost * onHand + unitCostMinor * quantity) / (onHand + quantity));
      await tx.productVariant.update({
        where: { id: existing.id },
        data: {
          inventoryQuantity: { increment: quantity },
          metadata: { ...meta, costBasisMinor: averaged, costCurrency: baseCurrency.toUpperCase(), lastTradeIn: submission.reference },
        },
      });
      await tx.stockMovement.create({ data: { type: 'RECEIVE', quantity, reason: 'Trade-in paid', note, variantId: existing.id } });
      stocked.push({ itemId: item.id, title: `${card.title} · ${existing.title}`, sku: existing.sku, quantity, unitCostMinor, created: false });
      continue;
    }

    // A new condition or finish for this card: price it from the shop's rule and the market.
    const reading = await tx.marketPrice.findFirst({
      where: { catalogItemId: card.id, finish, grade: '', condition: null },
      orderBy: { observedAt: 'desc' },
      select: { lowMinor: true, midMinor: true, marketMinor: true },
    });
    const suggestion = suggestPrice(chooseRule(rules, 'raw', condition), reading, null);
    // No rule or no market reading: list at twice the cost so it is never sold below what was paid.
    const priceMinor = suggestion.status === 'skipped' ? Math.max(99, unitCostMinor * 2) : suggestion.suggestedMinor;
    const variantTitle = `${labelOf(CARD_CONDITIONS, condition)} · ${labelOf(CARD_FINISHES, finish)}`;
    let sku = `${card.handle}-${condition}-${FINISH_SKU[finish] || 'NOR'}`.toUpperCase();
    if (await tx.productVariant.findFirst({ where: { sku }, select: { id: true } })) sku = `${sku}-${submission.reference.slice(-4)}`;
    let option = product.productOptions.find((o: any) => o.title === 'Condition');
    if (!option) option = await tx.productOption.create({ data: { title: 'Condition', product: { connect: { id: product.id } } }, select: { id: true, title: true } });
    const optionValue = await tx.productOptionValue.create({ data: { value: variantTitle, productOption: { connect: { id: option.id } } }, select: { id: true } });
    // Priced in the store's own currency; repricing keeps it on the market from here.
    const prices = regions
      .filter((region: any) => region.currency?.id && String(region.currency.code).toLowerCase() === baseCurrency)
      .map((region: any) => ({
        amount: priceMinor,
        currency: { connect: { id: region.currency.id } },
        region: { connect: { id: region.id } },
      }));
    const variant = await tx.productVariant.create({
      data: {
        title: variantTitle,
        sku,
        stockKind: 'raw',
        cardCondition: condition,
        cardFinish: finish,
        cardLanguage: 'EN',
        pricingMode: 'market',
        inventoryQuantity: quantity,
        manageInventory: true,
        metadata: { costBasisMinor: unitCostMinor, costCurrency: baseCurrency.toUpperCase(), lastTradeIn: submission.reference },
        product: { connect: { id: product.id } },
        productOptionValues: { connect: [{ id: optionValue.id }] },
        prices: { create: prices },
      },
      select: { id: true },
    });
    await tx.stockMovement.create({ data: { type: 'RECEIVE', quantity, reason: 'Trade-in paid', note, variantId: variant.id } });
    stocked.push({ itemId: item.id, title: `${card.title} · ${variantTitle}`, sku, quantity, unitCostMinor, created: true });
  }
  return { stocked, skipped };
}
