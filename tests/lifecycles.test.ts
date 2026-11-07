import test from "node:test";
import assert from "node:assert/strict";
import {
  AGREEMENT_TRANSITIONS, CLAIM_FULFILLMENT_TRANSITIONS, CLAIM_PAYMENT_TRANSITIONS, DISPUTE_TRANSITIONS, INTAKE_TRANSITIONS,
  ITEM_TRANSITIONS, LIFECYCLES, PAYMENT_TRANSITIONS, RETURN_TRANSITIONS, SELLER_TRANSITIONS, SUBMISSION_TRANSITIONS,
  canAddTradeInItem, canMovePayment, isAbandonedCartHold, itemMoveBlockedByIntake, returnCancelError, returnRefundError,
  transitionError, tradeInAmountError, tradeInStageAmountsError, validateFieldMove, validateStatusWrite,
} from "../features/keystone/lib/lifecycles";

const maps: Record<string, Record<string, string[]>> = {
  INTAKE_TRANSITIONS, ITEM_TRANSITIONS, AGREEMENT_TRANSITIONS, SUBMISSION_TRANSITIONS, DISPUTE_TRANSITIONS, SELLER_TRANSITIONS,
  RETURN_TRANSITIONS, PAYMENT_TRANSITIONS, CLAIM_PAYMENT_TRANSITIONS, CLAIM_FULFILLMENT_TRANSITIONS,
};

test("every transition target is a declared state", () => {
  for (const [name, map] of Object.entries(maps)) {
    for (const [from, tos] of Object.entries(map)) {
      for (const to of tos) assert.ok(to in map, `${name}: ${from} -> ${to} is not a declared state`);
    }
  }
});

test("every state can be left or is deliberately terminal, and no state leaps backwards into a cycle of terminals", () => {
  const terminal = (m: Record<string, string[]>) => Object.entries(m).filter(([, t]) => t.length === 0).map(([s]) => s).sort();
  assert.deepEqual(terminal(INTAKE_TRANSITIONS), ["accepted", "returned"]);
  assert.deepEqual(terminal(SUBMISSION_TRANSITIONS), ["paid", "returned"]);
  assert.deepEqual(terminal(DISPUTE_TRANSITIONS), ["closed"]);
  assert.deepEqual(terminal(SELLER_TRANSITIONS), ["closed"]);
  assert.deepEqual(terminal(RETURN_TRANSITIONS), ["canceled"]);
  assert.deepEqual(terminal(PAYMENT_TRANSITIONS), ["captured"]);
});

test("every state is reachable from the initial state", () => {
  const reach = (map: Record<string, string[]>, start: string) => {
    const seen = new Set([start]); const q = [start];
    while (q.length) for (const n of map[q.pop()!] || []) if (!seen.has(n)) { seen.add(n); q.push(n); }
    return seen;
  };
  for (const [key, life] of Object.entries(LIFECYCLES)) {
    const seen = reach(life.transitions, life.initial[0]);
    for (const state of Object.keys(life.transitions)) assert.ok(seen.has(state), `${key}: ${state} unreachable`);
  }
});

test("illegal moves are refused with a clear message", () => {
  assert.match(transitionError(LIFECYCLES.consignmentIntake, "accepted", "received")!, /cannot move from accepted to received/);
  assert.match(transitionError(LIFECYCLES.consignmentItem, "sold", "listed")!, /cannot move from sold to listed/);
  assert.match(transitionError(LIFECYCLES.consignmentItem, "settled", "pending")!, /cannot move/);
  assert.match(transitionError(LIFECYCLES.return, "canceled", "received")!, /cannot move from canceled to received/);
  assert.match(transitionError(LIFECYCLES.dispute, "closed", "open")!, /cannot move/);
  assert.match(transitionError(LIFECYCLES.seller, "closed", "active")!, /cannot move/);
  assert.match(transitionError(LIFECYCLES.tradeInSubmission, "accepted", "declined")!, /cannot move/);
  assert.match(transitionError(LIFECYCLES.tradeInSubmission, "draft", "bogus")!, /Unknown trade-in status/);
});

test("legal moves and no-ops are allowed", () => {
  assert.equal(transitionError(LIFECYCLES.consignmentIntake, "submitted", "received"), null);
  assert.equal(transitionError(LIFECYCLES.consignmentIntake, "received", "received"), null);
  assert.equal(transitionError(LIFECYCLES.dispute, "review", "evidence_requested"), null);
  assert.equal(transitionError(LIFECYCLES.return, "received", "requires_action"), null);
});

test("a trade-in can be marked paid only by its payout command", () => {
  assert.match(transitionError(LIFECYCLES.tradeInSubmission, "accepted", "paid")!, /own command/);
});

function run(life: any, args: any) {
  const errors: string[] = [];
  const move = validateStatusWrite(life, { ...args, addValidationError: (m: string) => errors.push(m) });
  return { errors, move };
}

test("status writes: create must start at an initial state, update must follow the map", () => {
  assert.equal(run(LIFECYCLES.consignmentIntake, { operation: "create", resolvedData: { status: "submitted" } }).errors.length, 0);
  assert.equal(run(LIFECYCLES.consignmentIntake, { operation: "create", resolvedData: { status: "accepted" } }).errors.length, 1);
  assert.equal(run(LIFECYCLES.consignmentIntake, { operation: "update", resolvedData: { name: "x" }, item: { status: "accepted" } }).errors.length, 0);
  assert.equal(run(LIFECYCLES.consignmentIntake, { operation: "update", resolvedData: { status: "received" }, item: { status: "accepted" } }).errors.length, 1);
  assert.deepEqual(run(LIFECYCLES.consignmentIntake, { operation: "update", resolvedData: { status: "inspecting" }, item: { status: "received" } }).move, { from: "received", to: "inspecting" });
});

test("claims: refunded is final, shipped claims cannot be canceled", () => {
  const errors: string[] = [];
  const args = (field: string, to: string, from: string) => ({ operation: "update" as const, resolvedData: { [field]: to }, item: { [field]: from }, addValidationError: (m: string) => errors.push(m) });
  validateFieldMove("payment status", CLAIM_PAYMENT_TRANSITIONS, "paymentStatus", args("paymentStatus", "not_refunded", "refunded"));
  validateFieldMove("fulfillment status", CLAIM_FULFILLMENT_TRANSITIONS, "fulfillmentStatus", args("fulfillmentStatus", "canceled", "shipped"));
  validateFieldMove("fulfillment status", CLAIM_FULFILLMENT_TRANSITIONS, "fulfillmentStatus", args("fulfillmentStatus", "shipped", "fulfilled"));
  assert.equal(errors.length, 2);
});

test("consignment items cannot be listed on a declined or returned consignment", () => {
  assert.match(itemMoveBlockedByIntake("declined", "listed")!, /declined/);
  assert.match(itemMoveBlockedByIntake("returned", "accepted")!, /returned/);
  assert.equal(itemMoveBlockedByIntake("declined", "return_requested"), null);
  assert.equal(itemMoveBlockedByIntake("accepted", "listed"), null);
});

test("trade-in amounts are editable only in their own stage", () => {
  assert.equal(tradeInAmountError("inspecting", { quotedAmountMinor: 100 }), null);
  assert.match(tradeInAmountError("accepted", { quotedAmountMinor: 100 })!, /Quotes/);
  assert.match(tradeInAmountError("paid", { acceptedAmountMinor: 1 })!, /Accepted amounts/);
  assert.equal(tradeInAmountError("quoted", { acceptedAmountMinor: 100 }), null);
  assert.equal(canAddTradeInItem("quoted"), false);
  assert.equal(canAddTradeInItem("received"), true);
});

test("return refunds: once, never for a canceled return, and a refunded return cannot be canceled", () => {
  assert.match(returnRefundError({ status: "canceled" })!, /canceled/);
  assert.match(returnRefundError({ status: "received", metadata: { refundId: "r1" } })!, /already been refunded/);
  assert.equal(returnRefundError({ status: "requested", metadata: {} }), null);
  assert.match(returnCancelError({ metadata: { refundId: "r1" } })!, /refunded/);
  assert.equal(returnCancelError({ metadata: null }), null);
});

test("a late provider event cannot undo a capture", () => {
  assert.equal(canMovePayment("captured", "failed"), false);
  assert.equal(canMovePayment("captured", "canceled"), false);
  assert.equal(canMovePayment("captured", "authorized"), false);
  assert.equal(canMovePayment("pending", "captured"), true);
  assert.equal(canMovePayment("failed", "captured"), true);
  assert.equal(canMovePayment("canceled", "failed"), false);
  assert.equal(canMovePayment("failed", "failed"), true);
});

test("an expired cart hold is abandoned only before payment is taken", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  const hold = { purpose: "cart", status: "active", cartId: "c1", expiresAt: new Date("2026-11-07T11:00:00Z") };
  assert.equal(isAbandonedCartHold(hold, null, now), true);
  assert.equal(isAbandonedCartHold({ ...hold, expiresAt: new Date("2026-11-07T12:30:00Z") }, null, now), false);
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "payment_confirmed", lockedAt: new Date("2026-11-07T08:00:00Z") }, now), false);
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "payment_unknown", lockedAt: new Date("2026-11-07T08:00:00Z") }, now), false);
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "resources_reserved", lockedAt: new Date("2026-11-07T11:30:00Z") }, now), false);
  assert.equal(isAbandonedCartHold(hold, { recoveryPoint: "resources_reserved", lockedAt: new Date("2026-11-07T08:00:00Z") }, now), true);
  assert.equal(isAbandonedCartHold({ ...hold, purpose: "auction" }, null, now), false);
});

test("a refused transition reaches staff with its reason, not a masked error", async () => {
  const { transitionRefused, TRANSITION_REFUSED } = await import("../features/keystone/lib/transitionRefused");
  const { publicGraphQLErrorMessage } = await import("../features/dashboard/lib/security");
  const refusal = transitionRefused("A canceled return cannot be refunded");
  assert.equal(refusal.extensions.code, TRANSITION_REFUSED);
  const wire = { response: { errors: [{ message: refusal.message, extensions: { code: TRANSITION_REFUSED } }] } };
  assert.equal(publicGraphQLErrorMessage(wire), "A canceled return cannot be refunded");
  // An unclassified server error still falls back to the generic text.
  const masked = { response: { errors: [{ message: "Unexpected error.", extensions: { code: "INTERNAL_SERVER_ERROR" } }] } };
  assert.notEqual(publicGraphQLErrorMessage(masked), "Unexpected error.");
});

test("trade-in amount rules read values, since Keystone resolvedData lists unset fields as undefined", () => {
  assert.equal(tradeInAmountError("inspecting", { quotedAmountMinor: 60000, acceptedAmountMinor: undefined }), null);
  assert.equal(tradeInAmountError("quoted", { quotedAmountMinor: undefined, acceptedAmountMinor: 60000 }), null);
  assert.match(tradeInAmountError("inspecting", { quotedAmountMinor: undefined, acceptedAmountMinor: 1 })!, /Accepted amounts/);
});

test("a trade-in is quoted and accepted only with amounts on every card", () => {
  assert.match(tradeInStageAmountsError("quoted", [])!, /Add the cards/);
  assert.match(tradeInStageAmountsError("quoted", [{ quotedAmountMinor: 100 }, { quotedAmountMinor: null }])!, /Quote every card/);
  assert.equal(tradeInStageAmountsError("quoted", [{ quotedAmountMinor: 100 }]), null);
  assert.match(tradeInStageAmountsError("accepted", [{ quotedAmountMinor: 100, acceptedAmountMinor: null }])!, /accepted amount/);
  assert.equal(tradeInStageAmountsError("accepted", [{ quotedAmountMinor: 100, acceptedAmountMinor: 100 }]), null);
});
