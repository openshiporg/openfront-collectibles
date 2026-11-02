import { test } from "node:test";
import assert from "node:assert/strict";
import { plural } from "./plural";

test("singular only at exactly one", () => {
  assert.equal(plural(1, "item"), "1 item");
  assert.equal(plural(0, "item"), "0 items");
  assert.equal(plural(2, "variant"), "2 variants");
  assert.equal(plural(1, "currency", "currencies"), "1 currency");
  assert.equal(plural(3, "currency", "currencies"), "3 currencies");
});
