import { permissions } from "../access";
import { CARD_FINISHES } from "../lib/pokemon/card-enums";
import { conditionCode, loadShop, stockSingle } from "../lib/pokemon/trade-in-stock";

/**
 * Staff put raw copies of a catalogue card into stock from the set checklist: card, condition,
 * finish, quantity, cost and (optionally) a fixed price. Creates the product on first stock.
 */
export default async function stockCardSingle(
  _root: unknown,
  { input }: { input: { catalogItemId: string; condition: string; finish?: string | null; quantity: number; unitCostMinor?: number | null; priceMinor?: number | null } },
  context: any,
) {
  const session = context.session;
  if (!session?.itemId || !permissions.canManageInventory({ session }) || !permissions.canManageCatalog({ session })) throw new Error("Not authorized");
  const condition = conditionCode(input.condition);
  if (!condition) throw new Error("Condition must be NM, LP, MP, HP or DMG");
  if (input.finish && !CARD_FINISHES.some((f) => f.value === input.finish)) throw new Error("Finish is invalid");
  const quantity = Number(input.quantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999) throw new Error("Quantity must be 1 to 9999");
  const cost = input.unitCostMinor == null ? 0 : Number(input.unitCostMinor);
  if (!Number.isSafeInteger(cost) || cost < 0) throw new Error("Cost is invalid");
  const price = input.priceMinor == null ? null : Number(input.priceMinor);
  if (price != null && (!Number.isSafeInteger(price) || price < 1)) throw new Error("Price is invalid");

  const result = await context.sudo().prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`stock-single:${input.catalogItemId}`}))::text AS locked`;
    const shop = await loadShop(tx);
    return stockSingle(tx, shop, {
      catalogItemId: input.catalogItemId,
      condition,
      finish: input.finish || null,
      quantity,
      unitCostMinor: cost,
      priceMinor: price,
      reason: "Received",
      note: `Stocked from the set checklist by ${session.data?.name || session.itemId}`,
      source: "checklist",
    });
  }, { maxWait: 10_000, timeout: 30_000 });
  if ("reason" in result) throw new Error(result.reason);
  return result;
}
