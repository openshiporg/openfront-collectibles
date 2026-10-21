type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLength);
}

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function projectCustomerProductData(value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null;

  // ProductData also contains arbitrary metadata and the internal collectible
  // evidence snapshot. Only stable, storefront-visible basics cross this boundary.
  const projected: JsonRecord = {};
  const id = boundedString(value.id, 128);
  const title = boundedString(value.title, 500);
  const thumbnail = boundedString(value.thumbnail, 2048);
  if (id !== undefined) projected.id = id;
  if (title !== undefined) projected.title = title;
  if (thumbnail !== undefined) projected.thumbnail = thumbnail;
  return projected;
}

function projectCustomerLineItem(value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null;

  const projected: JsonRecord = {};
  for (const key of ["id", "title", "sku", "thumbnail", "variantTitle", "formattedUnitPrice", "formattedTotal"]) {
    const maxLength = key === "thumbnail" ? 2048 : key === "title" ? 500 : 256;
    const field = boundedString(value[key], maxLength);
    if (field !== undefined) projected[key] = field;
  }
  for (const key of ["quantity", "totalQuantity", "fulfilledQuantity"]) {
    const field = nonNegativeInteger(value[key]);
    if (field !== undefined) projected[key] = field;
  }
  if (Object.hasOwn(value, "productData")) {
    projected.productData = projectCustomerProductData(value.productData);
  }
  if (isRecord(value.moneyAmount)) {
    const moneyAmount: JsonRecord = {};
    for (const key of ["amount", "originalAmount"]) {
      const field = nonNegativeInteger(value.moneyAmount[key]);
      if (field !== undefined) moneyAmount[key] = field;
    }
    projected.moneyAmount = moneyAmount;
  }
  return projected;
}

function projectShippingLabels(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const label: JsonRecord = {};
    for (const key of ["id", "labelUrl", "trackingNumber", "trackingUrl", "url", "carrier"]) {
      const field = boundedString(entry[key], key.toLowerCase().includes("url") ? 2048 : 256);
      if (field !== undefined) label[key] = field;
    }
    return [label];
  });
}

function projectFulfillmentItems(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    return [{
      id: boundedString(entry.id, 128) ?? null,
      quantity: nonNegativeInteger(entry.quantity) ?? null,
      lineItem: projectCustomerLineItem(entry.lineItem),
    }];
  });
}

function projectPaymentData(value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null;
  const projected: JsonRecord = {};
  const provider = boundedString(value.provider, 128);
  if (provider !== undefined) projected.provider = provider;
  if (typeof value.cardLast4 === "string" && /^\d{4}$/.test(value.cardLast4)) {
    projected.cardLast4 = value.cardLast4;
  }
  return projected;
}

function projectPayment(value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null;
  const projected: JsonRecord = {};
  const id = boundedString(value.id, 128);
  const status = boundedString(value.status, 64);
  const createdAt = boundedString(value.createdAt, 64);
  const amount = nonNegativeInteger(value.amount);
  if (id !== undefined) projected.id = id;
  if (status !== undefined) projected.status = status;
  if (createdAt !== undefined) projected.createdAt = createdAt;
  if (amount !== undefined) projected.amount = amount;
  projected.data = projectPaymentData(value.data);

  if (isRecord(value.paymentCollection)) {
    const paymentSessions = Array.isArray(value.paymentCollection.paymentSessions)
      ? value.paymentCollection.paymentSessions.flatMap((session: unknown) => {
          if (!isRecord(session)) return [];
          const sessionId = boundedString(session.id, 128);
          const paymentProvider = isRecord(session.paymentProvider)
            ? {
                ...(boundedString(session.paymentProvider.id, 128) !== undefined
                  ? { id: boundedString(session.paymentProvider.id, 128) }
                  : {}),
                ...(boundedString(session.paymentProvider.code, 128) !== undefined
                  ? { code: boundedString(session.paymentProvider.code, 128) }
                  : {}),
              }
            : null;
          return [{
            ...(sessionId !== undefined ? { id: sessionId } : {}),
            isSelected: session.isSelected === true,
            paymentProvider,
          }];
        })
      : [];
    projected.paymentCollection = { paymentSessions };
  }
  return projected;
}

function projectFulfillmentDetails(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const items = Array.isArray(entry.items)
      ? entry.items.flatMap((item: unknown) => {
          if (!isRecord(item)) return [];
          return [{
            id: boundedString(item.id, 128) ?? null,
            quantity: nonNegativeInteger(item.quantity) ?? null,
            lineItem: projectCustomerLineItem(item.lineItem),
          }];
        })
      : [];
    const createdAt = boundedString(entry.createdAt, 64);
    const canceledAt = boundedString(entry.canceledAt, 64);
    return [{
      id: boundedString(entry.id, 128) ?? null,
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(canceledAt !== undefined ? { canceledAt } : {}),
      shippingLabels: projectShippingLabels(entry.shippingLabels),
      items,
    }];
  });
}

export function projectCustomerOrderForRead(order: unknown): JsonRecord | null {
  if (!isRecord(order)) return null;

  const projected: JsonRecord = { ...order };
  delete projected.secretKey;
  if (Object.hasOwn(order, "lineItems")) {
    projected.lineItems = Array.isArray(order.lineItems)
      ? order.lineItems.map(projectCustomerLineItem)
      : [];
  }
  if (Object.hasOwn(order, "fulfillments")) {
    projected.fulfillments = Array.isArray(order.fulfillments)
      ? order.fulfillments.flatMap((fulfillment: unknown) => {
          if (!isRecord(fulfillment)) return [];
          const createdAt = boundedString(fulfillment.createdAt, 64);
          const canceledAt = boundedString(fulfillment.canceledAt, 64);
          return [{
            id: boundedString(fulfillment.id, 128) ?? null,
            ...(createdAt !== undefined ? { createdAt } : {}),
            ...(canceledAt !== undefined ? { canceledAt } : {}),
            shippingLabels: projectShippingLabels(fulfillment.shippingLabels),
            fulfillmentItems: projectFulfillmentItems(fulfillment.fulfillmentItems),
          }];
        })
      : [];
  }
  if (Object.hasOwn(order, "fulfillmentDetails")) {
    projected.fulfillmentDetails = projectFulfillmentDetails(order.fulfillmentDetails);
  }
  if (Object.hasOwn(order, "payments")) {
    projected.payments = Array.isArray(order.payments)
      ? order.payments.map(projectPayment)
      : [];
  }
  if (Object.hasOwn(order, "unfulfilled")) {
    projected.unfulfilled = Array.isArray(order.unfulfilled)
      ? order.unfulfilled.map(projectCustomerLineItem)
      : [];
  }
  return projected;
}
