import crypto from "node:crypto";
import {
  enqueueWebhookOutbox,
  subscribedWebhookEndpointIds,
} from "../../webhooks/outbox";
import { deliverWebhookEventsById } from "../../webhooks/webhook-plugin";
import { convertCheckoutReservation } from "./reservation-conversion";
import { assertCheckoutCommitAttemptFence, requireExactlyOne } from "./reservation-fencing";

// Checkout writes the order through Prisma, so Keystone hooks (and the Order webhook
// enricher) never run for it: order.created is built here and must carry everything
// receivers such as Openship read, including the full shipping address.
const WEBHOOK_ADDRESS_SELECT = {
  id: true, firstName: true, lastName: true, company: true, address1: true, address2: true,
  city: true, province: true, postalCode: true, phone: true,
  country: { select: { id: true, iso2: true } },
};

export async function createOrderFromCartAtomically(cart: any, sudo: any, checkoutAttemptId: string) {
  const prepared: Array<{ line: any; price: any; thumbnail: any; collectibleSnapshot?: any }> = [];
  for (const line of cart.lineItems) {
    const prices = await sudo.query.MoneyAmount.findMany({
      where: {
        productVariant: { id: { equals: line.productVariant.id } },
        region: { id: { equals: cart.region.id } },
        currency: { code: { equals: cart.region.currency.code } },
      },
      take: 1,
      query: "id calculatedPrice { calculatedAmount originalAmount currencyCode }",
    });
    const price = prices[0]?.calculatedPrice;
    if (!price) throw new Error(`No valid price for variant ${line.productVariant.id}`);
    const thumbnail = line.productVariant.primaryImage
      ? line.productVariant.primaryImage.image?.url || line.productVariant.primaryImage.imagePath
      : line.productVariant.product.thumbnail;
    let collectibleSnapshot: any;
    const collectibleUnitId = line.productVariant.collectibleInventoryUnit?.id;
    if (collectibleUnitId) {
      const [unit, listings] = await Promise.all([
        sudo.query.InventoryUnit.findOne({ where: { id: collectibleUnitId }, query: `
          id sku ownershipBasis status
          specimen {
            id displayName specimenCode attributeValues
            catalogItem { id title handle catalogNumber maker year attributeValues category { id name handle } franchise { id name handle } collectibleSet { id name handle } release { id name handle edition releaseDate } }
            media(where: { visibility: { equals: "public" } }, take: 8) { id kind url altText source capturedAt checksum }
            conditionObservations(where: { status: { in: ["reported", "reviewed"] } }, orderBy: { observedAt: desc }, take: 3) { id sourceType scale label score notes observedAt status evidence }
            gradeObservations(orderBy: { observedAt: desc }, take: 3) { id reportedGrade reportedLabel certificateReference certificateLookupUrl observedAt verificationState providerResponseHash disclaimer gradingCompany { id name code } }
            provenanceEvents(where: { reviewState: { in: ["reported", "reviewed"] } }, orderBy: { occurredAt: desc }, take: 6) { id eventType occurredAt recordedAt summary source confidence reviewState publicEvidence }
            valuationObservations(orderBy: { observedAt: desc }, take: 5) { id amountMinor currencyCode sourceType sourceName sourceReference observedAt confidence disclaimer }
          }
        ` }),
        sudo.query.Listing.findMany({ where: { inventoryUnit: { id: { equals: collectibleUnitId } }, status: { equals: 'published' }, format: { equals: 'fixed_price' } }, take: 2, query: 'id title slug format status priceMinor currencyCode publicationSnapshot publicSummary seller { id displayName } inventoryUnit { id }' }),
      ]);
      if (!unit || unit.status !== 'reserved') throw new Error(`Serialized specimen ${unit?.sku || collectibleUnitId} is not reserved for checkout`);
      const listing = requireExactlyOne<any>(listings, "published fixed-price listing for the serialized unit");
      if (listing.inventoryUnit?.id !== collectibleUnitId) {
        throw new Error("Fixed-price listing does not own the checkout unit");
      }
      collectibleSnapshot = {
        inventoryUnit: { id: unit.id, sku: unit.sku, ownershipBasis: unit.ownershipBasis },
        specimen: unit.specimen,
        listing,
        disclosure: 'Condition, grading, provenance, and valuation fields are attributed checkout-time observations, not Openfront guarantees.',
        capturedAt: new Date().toISOString(),
      };
    }
    prepared.push({ line, price, thumbnail, collectibleSnapshot });
  }

  const userId = cart.user?.id || cart.shippingAddress?.user?.id;
  const orderWebhookEndpointIds = await subscribedWebhookEndpointIds(
    sudo,
    'order.created',
    userId
  );
  const secretKey = userId ? "" : crypto.randomBytes(32).toString("hex");
  const commercialSnapshot = {
    version: 1,
    discounts: (cart.discounts || []).map((discount: { discountRule?: { type: string; value: number; allocation?: string } | null }) => {
      if (!discount.discountRule) throw new Error('Accepted discount policy is unavailable');
      return { discountRule: { type: discount.discountRule.type, value: discount.discountRule.value, allocation: discount.discountRule.allocation ?? null } };
    }),
    currency: cart.region.currency.code,
    tax: {
      rate: cart.region.taxRate || 0,
      regionId: cart.region.id,
      destinationCountry: cart.shippingAddress?.country?.iso2 || null,
    },
    acceptedAt: new Date().toISOString(),
  };

  // Formatted totals as the Order shows them; never worth failing checkout over.
  const webhookTotals = orderWebhookEndpointIds.length
    ? await sudo.query.Cart.findOne({ where: { id: cart.id }, query: "subtotal shipping discount tax total" }).catch(() => null)
    : null;

  const commit = await sudo.prisma.$transaction(async (tx: any) => {
    const existing = await tx.order.findFirst({ where: { cart: { id: cart.id } }, select: { id: true } });
    if (existing) return { orderId: existing.id, webhookEventIds: [] as string[] };

    const checkoutKey = `checkout:${cart.id}`;
    const checkoutAttempt = await tx.idempotencyKey.findUnique({
      where: { id: checkoutAttemptId },
      select: { id: true, idempotencyKey: true, requestPath: true, requestParams: true, recoveryPoint: true },
    });
    assertCheckoutCommitAttemptFence(checkoutAttempt, {
      attemptId: checkoutAttemptId,
      idempotencyKey: checkoutKey,
      cartId: cart.id,
    });
    const committedAt = new Date();
    const lineItemIds = [];
    const webhookLineItems: any[] = [];
    for (const { line, price, thumbnail, collectibleSnapshot } of prepared) {
      const money = await tx.orderMoneyAmount.create({
        data: {
          amount: price.calculatedAmount,
          originalAmount: price.originalAmount,
          currencyId: cart.region.currency.id,
          regionId: cart.region.id,
          priceData: {
            prices: line.productVariant.prices,
            currencyCode: cart.region.currency.code,
            regionId: cart.region.id,
            taxRate: cart.region.taxRate,
          },
          metadata: line.metadata,
        },
      });
      const item = await tx.orderLineItem.create({
        data: {
          quantity: line.quantity,
          title: line.productVariant.product.title,
          sku: line.productVariant.sku,
          metadata: line.metadata,
          productData: {
            id: line.productVariant.product.id,
            title: line.productVariant.product.title,
            thumbnail,
            description: line.productVariant.product.description,
            metadata: line.productVariant.product.metadata,
            ...(collectibleSnapshot ? { collectible: collectibleSnapshot } : {}),
          },
          variantData: {
            id: line.productVariant.id,
            sku: line.productVariant.sku,
            title: line.productVariant.title,
            measurements: line.productVariant.measurements || [],
          },
          variantTitle: line.productVariant.title,
          formattedUnitPrice: line.unitPrice,
          formattedTotal: line.total,
          productVariantId: line.productVariant.id,
          originalLineItemId: line.id,
          moneyAmountId: money.id,
        },
      });
      if (collectibleSnapshot) {
        const unitId = collectibleSnapshot.inventoryUnit.id;
        const listingId = collectibleSnapshot.listing?.id;
        if (!listingId || line.quantity !== 1) {
          throw new Error("Serialized order line is missing its exact unit listing or quantity");
        }
        await convertCheckoutReservation(tx, {
          cartId: cart.id,
          idempotencyKey: checkoutKey,
          unitId,
          variantId: line.productVariant.id,
          listingId,
          now: committedAt,
        });
        await tx.inventoryMovement.create({ data: { inventoryUnitId: unitId, type: 'sell', fromStatus: 'reserved', toStatus: 'sold', reason: 'checkout_order_created', occurredAt: committedAt, idempotencyKey: `order:${cart.id}:${unitId}` } });
      }
      lineItemIds.push(item.id);
      webhookLineItems.push({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        sku: item.sku,
        thumbnail,
        moneyAmount: {
          amount: price.calculatedAmount,
          originalAmount: price.originalAmount,
        },
        productVariant: {
          id: line.productVariant.id,
          title: line.productVariant.title,
          sku: line.productVariant.sku,
          product: {
            id: line.productVariant.product.id,
            title: line.productVariant.product.title,
            thumbnail,
          },
        },
      });
    }

    const order = await tx.order.create({
      data: {
        cart: { connect: { id: cart.id } },
        email: cart.email,
        userId,
        regionId: cart.region.id,
        currencyId: cart.region.currency.id,
        billingAddressId: cart.billingAddress.id,
        shippingAddressId: cart.shippingAddress.id,
        discounts: { connect: (cart.discounts || []).map((item: any) => ({ id: item.id })) },
        shippingMethods: { connect: (cart.shippingMethods || []).map((item: any) => ({ id: item.id })) },
        lineItems: { connect: lineItemIds.map((id) => ({ id })) },
        status: "pending",
        displayId: Math.floor(Date.now() / 1000),
        taxRate: cart.region.taxRate || 0,
        metadata: { ...(cart.metadata || {}), commercialSnapshot },
        secretKey,
        events: {
          create: {
            type: "ORDER_PLACED",
            data: { cartId: cart.id, isGuestOrder: !userId },
          },
        },
      },
    });
    await tx.cart.update({ where: { id: cart.id }, data: { orderId: order.id } });
    const webhookAddress = (id: string) => orderWebhookEndpointIds.length ? tx.address.findUnique({ where: { id }, select: WEBHOOK_ADDRESS_SELECT }) : null;
    const shippingAddress = await webhookAddress(cart.shippingAddress.id);
    const billingAddress = await webhookAddress(cart.billingAddress.id);
    const webhookEventIds = await enqueueWebhookOutbox(
      tx,
      orderWebhookEndpointIds,
      "order.created",
      "Order",
      order.id,
      {
        id: order.id,
        cartId: cart.id,
        displayId: order.displayId,
        email: order.email,
        status: order.status,
        rawTotal: cart.rawTotal,
        subtotal: webhookTotals?.subtotal ?? null,
        shipping: webhookTotals?.shipping ?? null,
        discount: webhookTotals?.discount ?? null,
        tax: webhookTotals?.tax ?? null,
        total: webhookTotals?.total ?? null,
        currency: { id: cart.region.currency.id, code: cart.region.currency.code },
        shippingAddress,
        billingAddress,
        lineItems: webhookLineItems,
      }
    );
    if (cart.email) {
      await tx.notification.create({
        data: {
          eventName: "ORDER_CONFIRMATION",
          resourceType: "Order",
          resourceId: order.id,
          to: cart.email,
          userId: userId || null,
          data: { orderId: order.id, status: "pending_delivery" },
        },
      });
    }
    return { orderId: order.id, webhookEventIds };
  });

  if (commit.webhookEventIds.length) {
    try {
      await deliverWebhookEventsById(sudo, commit.webhookEventIds);
    } catch (error) {
      console.error(
        "Immediate order webhook delivery failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  return sudo.query.Order.findOne({
    where: { id: commit.orderId },
    query: `
      id status displayId secretKey subtotal total shipping discount tax paymentDetails
      shippingAddress { id firstName lastName company address1 address2 city province postalCode country { id iso2 } phone }
    `,
  });
}
