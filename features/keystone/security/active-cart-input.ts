const MAX_LINE_ITEMS = 50;
const MAX_ID_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254;

function record(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, any>;
}

function exactKeys(value: Record<string, any>, allowed: string[], label: string) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label} contains unsupported fields`);
}

function id(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ID_LENGTH) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function connectOnly(value: unknown, label: string): { connect: { id: string } } {
  const relation = record(value, label);
  exactKeys(relation, ['connect'], label);
  const connect = record(relation.connect, `${label}.connect`);
  exactKeys(connect, ['id'], `${label}.connect`);
  return { connect: { id: id(connect.id, `${label} ID`) } };
}

function lineItemCreate(value: unknown) {
  const item = record(value, 'Line item');
  exactKeys(item, ['productVariant', 'quantity'], 'Line item');
  const variant = connectOnly(item.productVariant, 'Product variant');
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
    throw new Error('Line item quantity must be an integer between 1 and 99');
  }
  return { productVariant: variant, quantity: item.quantity };
}

function lineItemUpdate(value: unknown) {
  const update = record(value, 'Line item update');
  exactKeys(update, ['where', 'data'], 'Line item update');
  const where = record(update.where, 'Line item selector');
  exactKeys(where, ['id'], 'Line item selector');
  const data = record(update.data, 'Line item changes');
  exactKeys(data, ['quantity'], 'Line item changes');
  if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 99) {
    throw new Error('Line item quantity must be an integer between 1 and 99');
  }
  return { where: { id: id(where.id, 'Line item ID') }, data: { quantity: data.quantity } };
}

function lineItemDisconnect(value: unknown) {
  const selector = record(value, 'Line item selector');
  exactKeys(selector, ['id'], 'Line item selector');
  return { id: id(selector.id, 'Line item ID') };
}

export function normalizeActiveCartInput(input: unknown, sessionUserId?: string) {
  const data = record(input, 'Cart changes');
  exactKeys(data, ['email', 'region', 'shippingAddress', 'billingAddress', 'user', 'lineItems'], 'Cart changes');
  const normalized: Record<string, any> = {};

  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || data.email.length > MAX_EMAIL_LENGTH) {
      throw new Error('Cart email is invalid');
    }
    normalized.email = data.email;
  }
  if (data.region !== undefined) normalized.region = connectOnly(data.region, 'Region');
  for (const key of ['shippingAddress', 'billingAddress'] as const) {
    if (data[key] !== undefined) normalized[key] = connectOnly(data[key], key);
  }
  if (data.user !== undefined) {
    if (!sessionUserId) throw new Error('A signed-in user is required to associate a cart');
    const user = connectOnly(data.user, 'User');
    if (user.connect.id !== sessionUserId) throw new Error('A cart can only be associated with the current user');
    normalized.user = user;
  }
  if (data.lineItems !== undefined) {
    const items = record(data.lineItems, 'Line items');
    exactKeys(items, ['create', 'update', 'disconnect'], 'Line items');
    const lineItems: Record<string, unknown[]> = {};
    if (items.create !== undefined) {
      if (!Array.isArray(items.create) || items.create.length > MAX_LINE_ITEMS) throw new Error('Too many line items');
      lineItems.create = items.create.map(lineItemCreate);
    }
    if (items.update !== undefined) {
      if (!Array.isArray(items.update) || items.update.length > MAX_LINE_ITEMS) throw new Error('Too many line item updates');
      lineItems.update = items.update.map(lineItemUpdate);
    }
    if (items.disconnect !== undefined) {
      if (!Array.isArray(items.disconnect) || items.disconnect.length > MAX_LINE_ITEMS) throw new Error('Too many line items');
      lineItems.disconnect = items.disconnect.map(lineItemDisconnect);
    }
    if (!Object.keys(lineItems).length) throw new Error('Line item changes are empty');
    normalized.lineItems = lineItems;
  }

  if (!Object.keys(normalized).length) throw new Error('Cart changes are empty');
  return normalized;
}
