import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { attenuateScopesToOwnerRole } from "../features/keystone/oauth/owner-scope-ceiling";
import { permissions } from "../features/keystone/access";

const owner = { canReadOrders: true, canManageOrders: true, canReadProducts: true, canManageProducts: true };
const scopes = ["read_orders", "write_orders", "write_products"];

test("an owner who still holds every permission keeps the key's scopes", () => {
  assert.deepEqual(attenuateScopesToOwnerRole(scopes, owner), scopes);
});

test("a downgraded owner narrows the key on the next use", () => {
  const downgraded = { canReadOrders: true };
  assert.deepEqual(attenuateScopesToOwnerRole(scopes, downgraded), ["read_orders"]);
  const session = { itemId: "u1", listKey: "User", apiKeyScopes: attenuateScopesToOwnerRole(scopes, downgraded) };
  assert.equal(permissions.canReadOrders({ session }), true);
  assert.equal(permissions.canManageOrders({ session }), false);
  assert.equal(permissions.canManageProducts({ session }), false);
});

test("an owner with no role leaves the key with nothing, and the role never leaks back in", () => {
  assert.deepEqual(attenuateScopesToOwnerRole(scopes, null), []);
  const session = { itemId: "u1", listKey: "User", apiKeyScopes: [], data: { role: owner } };
  assert.equal(permissions.canReadOrders({ session }), false);
});

test("API key and OAuth sessions re-read the owner's current role on every request", () => {
  const source = readFileSync(new URL("../features/keystone/index.ts", import.meta.url), "utf8");
  assert.match(source, /user \{ id role \{ \$\{ownerPermissionFields\} \} \}/);
  assert.match(source, /apiKeyScopes: attenuateScopesToOwnerRole\(matchingApiKey\.scopes, matchingApiKey\.user\.role\)/);
  assert.match(source, /oauthScopes: attenuateScopesToOwnerRole\(oauthToken\.scopes, oauthToken\.user\.role\)/);
});
