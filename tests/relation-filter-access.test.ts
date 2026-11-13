// Filter paths follow read access. Runs against a scratch database (DATABASE_URL, SESSION_SECRET set by the caller).
import assert from "node:assert/strict";
import test from "node:test";
import { getContext } from "@keystone-6/core/context";
import * as PrismaModule from "@prisma/client";
import config from "../keystone";
import { permissionsList } from "../features/keystone/models/fields";

const base: any = getContext(config as any, PrismaModule as any);
const sudo = base.sudo();
const flags = (on: string[]) => Object.fromEntries(permissionsList.map((p: string) => [p, on.includes(p)]));
const session = (itemId: string, role: Record<string, boolean> | null, extra: object = {}) => ({
  itemId, listKey: "User", data: { id: itemId, role }, ...extra,
});

let ids: any = {};
test("seed", async () => {
  const stamp = Date.now();
  const role = await sudo.query.Role.createOne({ data: { name: `flt-limited-${stamp}`, canAccessDashboard: true }, query: "id" });
  const limited = await sudo.query.User.createOne({
    data: { name: "Limited", email: `limited-${stamp}@example.com`, password: "limited-password-1", role: { connect: { id: role.id } } }, query: "id" });
  const secret = await sudo.query.User.createOne({
    data: { name: "Zelda Hidden", email: `zelda-${stamp}@example.com`, password: "hidden-password-12" }, query: "id" });
  const customer = await sudo.query.User.createOne({
    data: { name: "Casey Customer", email: `casey-${stamp}@example.com`, password: "customer-password-1" }, query: "id" });
  const currency = (await sudo.query.Currency.findOne({ where: { code: "usd" }, query: "id" })) ?? await sudo.query.Currency.createOne({ data: { code: "usd", name: "Test", symbol: "$", symbolNative: "$" }, query: "id" });
  const order = await sudo.query.Order.createOne({
    data: { currency: { connect: { id: currency.id } }, email: `zelda-${stamp}@example.com`, displayId: stamp % 2000000000, user: { connect: { id: secret.id } } }, query: "id secretKey" });
  ids = { customer: customer.id, limited: limited.id, secret: secret.id, order: order.id, secretKey: order.secretKey, stamp };
});

const run = async (ctx: any, query: string) => {
  try {
    const data = await ctx.graphql.run({ query });
    return { count: Object.values(data)[0] as number };
  } catch (e: any) {
    return { error: String(e.message).slice(0, 80) };
  }
};
const same = (a: any, b: any) => (a.error && b.error) || a.count === b.count;

// Each probe: a where-path into data the role must not read. A hit and a miss must be indistinguishable.
const probes = (hit: string, miss: string) => [
  ["users", `usersCount(where: { name: { startsWith: "%" } })`],
  ["orders.user.name", `ordersCount(where: { user: { name: { startsWith: "%" } } })`],
  ["orders.user.email", `ordersCount(where: { user: { email: { startsWith: "%" } } })`],
  ["orders.secretKey", `ordersCount(where: { secretKey: { startsWith: "%" } })`],
  ["users.orders", `usersCount(where: { orders: { some: { secretKey: { startsWith: "%" } } } })`],
  ["users.password", `usersCount(where: { password: { isSet: true } })`],
  ["oauthTokens.token", `oAuthTokensCount(where: { token: { startsWith: "%" } })`],
  ["webhookEndpoints.secret", `webhookEndpointsCount(where: { secret: { startsWith: "%" } })`],
  ["oauthApps.clientSecret", `oAuthAppsCount(where: { clientSecret: { startsWith: "%" } })`],
  ["invites.token", `invitesCount(where: { token: { startsWith: "%" } })`],
  ["users.customerToken", `usersCount(where: { customerToken: { startsWith: "%" } })`],
  ["currencies.orders.email", `currenciesCount(where: { orders: { some: { email: { startsWith: "%" } } } })`],
  ["currencies.orders.user.name", `currenciesCount(where: { orders: { some: { user: { name: { startsWith: "%" } } } } })`],
  ["currencies.payments", `currenciesCount(where: { payments: { some: { status: { not: { equals: "%" } } } } })`],
  ["countries.addresses.firstName", `countriesCount(where: { addresses: { some: { firstName: { startsWith: "%" } } } })`],
  ["productVariants.product.status", `productVariantsCount(where: { product: { status: { equals: "%" } } })`],
  ["products.productVariants.barcode", `productsCount(where: { productVariants: { some: { barcode: { startsWith: "%" } } } })`],
  ["moneyAmounts.productVariant.upc", `moneyAmountsCount(where: { productVariant: { upc: { startsWith: "%" } } })`],
].map(([name, q]) => [name, q.replace(/%/g, hit), q.replace(/%/g, miss)]);

const limitedRoles = () => ({
  anonymous: base.withSession(undefined),
  "customer (own account)": base.withSession(session(ids.customer, null, { customerToken: "x" })),
  "dashboard role, no grants": base.withSession(session(ids.limited, flags(["canAccessDashboard"]))),
  "product manager only": base.withSession(session(ids.limited, flags(["canAccessDashboard", "canManageProducts"]))),
});

test("relation and scalar where-filters give a hit and a miss the same answer for limited roles", async () => {
  for (const [who, ctx] of Object.entries(limitedRoles())) {
    for (const [path, ...pairs] of probes("zelda", "q9q9").map(([n, h, m]) => [n, h, m])) {
      const [hitQ, missQ] = pairs as string[];
      const hit = await run(ctx, `query { ${hitQ} }`);
      const miss = await run(ctx, `query { ${missQ} }`);
      assert.ok(same(hit, miss), `${who}: ${path} leaks (hit ${JSON.stringify(hit)} vs miss ${JSON.stringify(miss)})`);
    }
  }
});

test("customers cannot filter through to other lists' hidden fields via their own order or user", async () => {
  const ctx = base.withSession(session(ids.customer, null, { customerToken: "x" }));
  for (const where of [
    `{ user: { password: { isSet: true } } }`,
    `{ user: { customerToken: { startsWith: "a" } } }`,
    `{ secretKey: { startsWith: "a" } }`,
    `{ payments: { some: { data: { equals: "a" } } } }`,
  ]) {
    const r = await run(ctx, `query { ordersCount(where: ${where}) }`);
    assert.ok(r.error, `customer filter ${where} should be refused, got ${JSON.stringify(r)}`);
  }
});

test("admin keeps real filters", async () => {
  const admin = base.withSession(session(ids.limited, flags(permissionsList)));
  const hit = await run(admin, `query { usersCount(where: { name: { startsWith: "Zelda" } }) }`);
  const miss = await run(admin, `query { usersCount(where: { name: { startsWith: "Qqqq" } }) }`);
  assert.ok(hit.count && hit.count >= 1, JSON.stringify(hit));
  assert.equal(miss.count, 0);
  const rel = await run(admin, `query { ordersCount(where: { user: { name: { startsWith: "Zelda" } } }) }`);
  assert.ok(rel.count && rel.count >= 1, JSON.stringify(rel));
});

test("secrets are not filterable even for admin", async () => {
  const admin = base.withSession(session(ids.limited, flags(permissionsList)));
  for (const q of [
    `ordersCount(where: { secretKey: { startsWith: "a" } })`,
    `webhookEndpointsCount(where: { secret: { startsWith: "a" } })`,
    `usersCount(where: { customerToken: { startsWith: "a" } })`,
    `invitesCount(where: { token: { startsWith: "a" } })`,
  ]) {
    const r = await run(admin, `query { ${q} }`);
    assert.ok(r.error, `${q} should be refused, got ${JSON.stringify(r)}`);
  }
});
