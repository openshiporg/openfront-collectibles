import { requireHumanOwnerId } from './customer-personalization-owner';
import type { Context, AddressCreateInput } from '.keystone/types';
import { jsonTransport } from '../lib/json-transport';

const CUSTOMER_ADDRESS_FIELDS = new Set([
  "company",
  "firstName",
  "lastName",
  "address1",
  "address2",
  "city",
  "province",
  "postalCode",
  "phone",
  "isBilling",
  "metadata",
  "country",
]);

type AddressData = Record<string, unknown>;

const TEXT_FIELDS = ['company', 'firstName', 'lastName', 'address1', 'address2', 'city', 'province', 'postalCode', 'phone'] as const;

/** Validate before a privileged DB call: list resolveInput runs too late to
 * prevent nested creates. Self-service accepts values and one country connect,
 * never user/control-plane or inverse lifecycle relationship writes. */
export function sanitizeCustomerAddressInput(value: unknown): AddressCreateInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid address');
  const input: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  for (const key of Object.keys(input)) if (!CUSTOMER_ADDRESS_FIELDS.has(key)) throw new Error('Unsupported address field');
  const text = Object.fromEntries(TEXT_FIELDS.flatMap(key => {
    const value = input[key];
    if (value === undefined) return [];
    if (value === null) return [[key, '']];
    if (typeof value !== 'string' || value.length > 2000) throw new Error('Address fields must be bounded text');
    return [[key, value]];
  }));
  if (input.isBilling !== undefined && typeof input.isBilling !== 'boolean') throw new Error('Invalid billing-address flag');
  let country: AddressCreateInput['country'];
  if (input.country !== undefined) {
    const relation = input.country;
    if (!relation || typeof relation !== 'object' || Array.isArray(relation) || Object.keys(relation).length !== 1 || !('connect' in relation)) throw new Error('Select an existing country');
    const connect = relation.connect;
    if (!connect || typeof connect !== 'object' || Array.isArray(connect) || Object.keys(connect).length !== 1) throw new Error('Select an existing country');
    if ('id' in connect && typeof connect.id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(connect.id)) country = { connect: { id: connect.id } };
    else if ('iso2' in connect && typeof connect.iso2 === 'string' && /^[a-z]{2}$/i.test(connect.iso2)) country = { connect: { iso2: connect.iso2.toLowerCase() } };
    else throw new Error('Select an existing country');
  }
  const metadata = input.metadata === undefined ? undefined : jsonTransport(input.metadata);
  if (metadata !== undefined && JSON.stringify(metadata).length > 16_384) throw new Error('Address metadata is too large');
  return { ...text, ...(country ? { country } : {}), ...(typeof input.isBilling === 'boolean' ? { isBilling: input.isBilling } : {}), ...(metadata !== undefined ? { metadata } : {}) };
}

/** All self-service address writers share this owner lock and native context
 * transaction. The bypass is reached only after human-session validation. */
export async function runOwnedAddressCommand<T>(context: Pick<Context, 'session' | 'sudo'>, command: (tx: Context, ownerId: string) => Promise<T>): Promise<T> {
  const ownerId = requireHumanOwnerId(context.session);
  return context.sudo().transaction(async tx => {
    await tx.prisma.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`customer-addresses:${ownerId}`}::text, 0))::text`;
    if (!await tx.db.User.findOne({ where: { id: ownerId } })) throw new Error('User not found');
    return command(tx, ownerId);
  });
}
export async function lockOwnedAddress(tx: Context, ownerId: string, addressId: unknown): Promise<string> {
  if (typeof addressId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(addressId)) throw new Error('Address not found');
  const rows = await tx.prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Address" WHERE "id" = ${addressId} AND "userId" = ${ownerId} FOR UPDATE`;
  if (rows.length !== 1) throw new Error('Address not found');
  return addressId;
}

/** Preserve Keystone defaults while constraining customer-controlled address data. */
export function resolveCustomerAddressData({
  inputData,
  resolvedData,
  userId,
}: {
  inputData?: AddressData;
  resolvedData: AddressData;
  userId: string;
}): AddressData {
  const restrictedData = { ...resolvedData };

  for (const key of Object.keys(inputData ?? {})) {
    if (!CUSTOMER_ADDRESS_FIELDS.has(key)) delete restrictedData[key];
  }

  restrictedData.user = { connect: { id: userId } };
  return restrictedData;
}
