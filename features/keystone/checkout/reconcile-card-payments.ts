import { getPaymentStatus } from "../utils/paymentProviderAdapter";
import { isManualPaymentProvider } from "../utils/paymentProviderConfig";
import { completeCheckout } from "../mutations/completeActiveCart";

const EVERY_MS = 60_000;
// The shopper's own return page gets the first chance to finish the order.
const GRACE_MS = 20_000;
const LOOK_BACK_MS = 3 * 86_400_000;

const state = globalThis as { __cardReconcileAt?: number; __cardReconcile?: Promise<number> | null };

/**
 * Places the order for a card payment Stripe took but whose shopper closed the tab before the return page ran.
 * This store has no Stripe webhook endpoint (the shared test account is full), so this asks Stripe directly.
 * No timer: it runs on the requests that read the shop and the dashboard, at most once a minute, never
 * blocking the page. Completion goes through the same checkout and idempotency key as the return page.
 */
export function reconcileOpenCardPayments(sudoContext: any): Promise<number> {
  if (state.__cardReconcile) return state.__cardReconcile;
  if (Date.now() - (state.__cardReconcileAt || 0) < EVERY_MS) return Promise.resolve(0);
  state.__cardReconcileAt = Date.now();
  state.__cardReconcile = run(sudoContext)
    .catch((error) => {
      console.error("Card reconcile failed:", error instanceof Error ? error.message : error);
      return 0;
    })
    .finally(() => {
      state.__cardReconcile = null;
    });
  return state.__cardReconcile;
}

async function run(sudoContext: any): Promise<number> {
  const now = Date.now();
  const sessions = await sudoContext.prisma.paymentSession.findMany({
    where: {
      isSelected: true,
      createdAt: { gte: new Date(now - LOOK_BACK_MS), lte: new Date(now - GRACE_MS) },
      data: { path: ["paymentIntentId"], string_starts_with: "pi_" },
      paymentCollection: { cart: { orderId: null } },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      data: true,
      paymentProvider: true,
      paymentCollection: { select: { cart: { select: { id: true } } } },
    },
  });
  let placed = 0;
  for (const session of sessions) {
    const cartId = session.paymentCollection?.cart?.id;
    const provider = session.paymentProvider;
    const paymentId = (session.data as any)?.paymentIntentId;
    if (!cartId || !provider?.isInstalled || isManualPaymentProvider(provider.code) || !paymentId) continue;
    try {
      const status = String((await getPaymentStatus({ provider, paymentId }))?.status || "").toLowerCase();
      if (!["succeeded", "requires_capture"].includes(status)) continue;
      const order = await completeCheckout(cartId, session.id, sudoContext, undefined);
      if (order?.id) {
        placed += 1;
        console.log(`Card reconcile: placed order ${order.displayId} (${order.id}) for a paid checkout the browser did not finish`);
      }
    } catch (error) {
      console.error(`Card reconcile: cart ${cartId} not finished:`, error instanceof Error ? error.message : error);
    }
  }
  return placed;
}
