// A signed-in customer's storefront getUser query must return their own addresses and billing address.
// Runs against a scratch database (DATABASE_URL, SESSION_SECRET set by the caller).
import assert from "node:assert/strict";
import test from "node:test";
import { getContext } from "@keystone-6/core/context";
import * as PrismaModule from "@prisma/client";
import config from "../keystone";

const base: any = getContext(config as any, PrismaModule as any);
const sudo = base.sudo();

// Same selection as features/storefront/lib/data/user.ts getUser().
const GET_USER = `query { authenticatedItem { ... on User {
  id email firstName lastName phone tokenGeneratedAt
  billingAddress { id firstName address1 country { id iso2 name } }
  addresses(orderBy: [{ isBilling: desc }]) { id firstName address1 isBilling country { id iso2 name } }
} } }`;

test("signed-in customer reads their own user, addresses and billing address", async () => {
  const stamp = Date.now();
  const country = (await sudo.query.Country.findOne({ where: { iso2: "us" }, query: "id" }))
    ?? await sudo.query.Country.createOne({ data: { iso2: "us", iso3: "usa", numCode: 840, name: "us", displayName: "United States" }, query: "id" });
  const customer = await sudo.query.User.createOne({
    data: { name: "Casey Customer", email: `getuser-${stamp}@example.com`, password: "customer-password-1" }, query: "id" });
  const other = await sudo.query.User.createOne({
    data: { name: "Other Person", email: `getuser-other-${stamp}@example.com`, password: "customer-password-1" }, query: "id" });
  const as = (id: string) => base.withSession({ itemId: id, listKey: "User", data: { id, role: null } });
  const mk = (userId: string, firstName: string, isBilling: boolean) => as(userId).query.Address.createOne({
    data: { firstName, lastName: "T", address1: "1 Main St", city: "Austin", postalCode: "78701", isBilling,
      country: { connect: { id: country.id } }, user: { connect: { id: userId } } }, query: "id" });
  await mk(customer.id, "Home", false);
  await mk(customer.id, "Billing", true);
  await mk(other.id, "NotMine", true);

  const ctx = base.withSession({ itemId: customer.id, listKey: "User", data: { id: customer.id, role: null } });
  const { authenticatedItem } = await ctx.graphql.run({ query: GET_USER });
  assert.equal(authenticatedItem.id, customer.id);
  assert.deepEqual(authenticatedItem.addresses.map((a: any) => a.firstName), ["Billing", "Home"]);
  assert.equal(authenticatedItem.billingAddress?.firstName, "Billing");
});
