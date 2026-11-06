import { RateLimiterMemory } from "rate-limiter-flexible";
import { shopperError } from "../lib/shopperError";
import { assertCartAccess } from "../security/cart-access";

// Gift-card and store-credit codes are bearer value: throttle guesses per cart and per client.
const guessLimiter = new RateLimiterMemory({ points: 10, duration: 900, blockDuration: 900 });

export function normalizeGiftCardCode(code: unknown): string {
  const normalized = String(code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized || normalized.length > 64 || !/^[A-Z0-9-]+$/.test(normalized)) {
    throw shopperError("Enter a valid gift card code", "INVALID_GIFT_CARD_CODE");
  }
  return normalized;
}

export async function addGiftCardToActiveCart(
  _root: unknown,
  { cartId, code }: { cartId: string; code: string },
  context: any
) {
  await assertCartAccess(context, cartId);
  const normalized = normalizeGiftCardCode(code);
  const client = context.req?.socket?.remoteAddress || "unknown-client";
  try {
    await guessLimiter.consume(`${cartId}:${client}`);
  } catch {
    throw shopperError("Too many gift card attempts. Try again in 15 minutes.", "GIFT_CARD_RATE_LIMITED");
  }

  const sudo = context.sudo();
  const cart = await sudo.query.Cart.findOne({
    where: { id: cartId },
    query: "id region { id } lineItems { id } giftCards { id code }",
  });
  if (!cart) throw new Error("Cart not found");
  if (!cart.lineItems?.length) throw shopperError("Add an item before applying a gift card", "CART_EMPTY");

  const card = await sudo.prisma.giftCard.findUnique({
    where: { code: normalized },
    select: { id: true, code: true, balance: true, isDisabled: true, endsAt: true, regionId: true },
  });
  // One message for unknown, disabled and empty cards so codes can't be enumerated.
  const unusable = "That gift card can't be used";
  if (!card || card.isDisabled || card.balance <= 0) throw shopperError(unusable, "GIFT_CARD_UNAVAILABLE");
  if (card.endsAt && card.endsAt.getTime() <= Date.now()) throw shopperError("That gift card has expired", "GIFT_CARD_EXPIRED");
  if (card.regionId && cart.region?.id && card.regionId !== cart.region.id) {
    throw shopperError("That gift card is for a different region", "GIFT_CARD_REGION");
  }
  if (cart.giftCards?.some((applied: any) => applied.id === card.id)) {
    throw shopperError("That gift card is already applied", "GIFT_CARD_ALREADY_APPLIED");
  }

  // Changing what's owed invalidates any payment session sized to the old total.
  return sudo.db.Cart.updateOne({
    where: { id: cartId },
    data: { giftCards: { connect: [{ id: card.id }] }, paymentCollection: { disconnect: true } },
  });
}

export async function removeGiftCardFromActiveCart(
  _root: unknown,
  { cartId, code }: { cartId: string; code: string },
  context: any
) {
  await assertCartAccess(context, cartId);
  const normalized = normalizeGiftCardCode(code);
  const sudo = context.sudo();
  const cart = await sudo.query.Cart.findOne({ where: { id: cartId }, query: "id giftCards { id code }" });
  if (!cart) throw new Error("Cart not found");
  const applied = cart.giftCards?.find((card: any) => card.code === normalized);
  if (!applied) return sudo.db.Cart.findOne({ where: { id: cartId } });
  return sudo.db.Cart.updateOne({
    where: { id: cartId },
    data: { giftCards: { disconnect: [{ id: applied.id }] }, paymentCollection: { disconnect: true } },
  });
}
