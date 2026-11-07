// One transitions map per lifecycle. Every writer uses these: the Keystone list hooks
// (so raw GraphQL, the dashboard and API keys are all held to the same rules), the
// payment webhook and the refund commands. Pure and import-free so tests and the
// dashboard can load it. Commands that write with prisma (checkout, refund, payout)
// bypass the hooks on purpose; they enforce their own guards and use these maps.

export type Lifecycle = {
  name: string;
  /** Allowed next statuses for each status. Missing or empty means terminal. */
  transitions: Record<string, string[]>;
  /** Statuses a record may be created in. */
  initial: string[];
  /** Statuses only a server command may set (they move money or stock). */
  commandOnly?: string[];
};

export const INTAKE_TRANSITIONS: Record<string, string[]> = {
  submitted: ['received'],
  received: ['inspecting'],
  inspecting: ['offered'],
  offered: ['accepted', 'declined'],
  declined: ['returned'],
  accepted: [],
  returned: [],
};

export const ITEM_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'return_requested'],
  accepted: ['listed', 'return_requested'],
  listed: ['sold', 'return_requested'],
  sold: ['settled'],
  return_requested: ['returned'],
  returned: [],
  settled: [],
};

export const AGREEMENT_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'terminated'],
  sent: ['accepted', 'expired', 'terminated'],
  accepted: ['terminated'],
  expired: [],
  terminated: [],
};

export const SUBMISSION_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['received', 'declined'],
  received: ['inspecting', 'declined'],
  inspecting: ['quoted', 'declined'],
  quoted: ['accepted', 'declined'],
  accepted: ['paid'],
  declined: ['returned'],
  paid: [],
  returned: [],
};

export const DISPUTE_TRANSITIONS: Record<string, string[]> = {
  open: ['evidence_requested', 'review'],
  evidence_requested: ['review'],
  review: ['evidence_requested', 'resolved'],
  resolved: ['closed'],
  closed: [],
};

export const SELLER_TRANSITIONS: Record<string, string[]> = {
  applicant: ['active', 'closed'],
  active: ['paused', 'suspended', 'closed'],
  paused: ['active', 'suspended', 'closed'],
  suspended: ['active', 'closed'],
  closed: [],
};

export const RETURN_TRANSITIONS: Record<string, string[]> = {
  requested: ['received', 'requires_action', 'canceled'],
  requires_action: ['received', 'canceled'],
  received: ['requires_action'],
  canceled: [],
};

export const CLAIM_PAYMENT_TRANSITIONS: Record<string, string[]> = {
  na: [],
  not_refunded: ['refunded'],
  refunded: [],
};

export const CLAIM_FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  not_fulfilled: ['partially_fulfilled', 'fulfilled', 'canceled', 'requires_action'],
  partially_fulfilled: ['fulfilled', 'partially_shipped', 'shipped', 'canceled', 'requires_action'],
  fulfilled: ['partially_shipped', 'shipped', 'canceled', 'requires_action'],
  partially_shipped: ['shipped', 'canceled', 'requires_action'],
  shipped: ['partially_returned', 'returned', 'requires_action'],
  partially_returned: ['returned', 'requires_action'],
  returned: [],
  canceled: [],
  requires_action: ['not_fulfilled', 'partially_fulfilled', 'fulfilled', 'canceled'],
};

// Payment rows are written only by checkout, the provider webhook, manual receipt
// and refund/cancel commands (no GraphQL access). Money is the truth: a capture is
// accepted from any state that has not already captured, but a late failed,
// authorized or voided event can never undo a capture.
export const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['authorized', 'captured', 'failed', 'canceled'],
  authorized: ['captured', 'failed', 'canceled'],
  failed: ['authorized', 'captured', 'canceled'],
  canceled: ['captured'],
  captured: [],
};

export const LIFECYCLES = {
  consignmentIntake: { name: 'consignment', transitions: INTAKE_TRANSITIONS, initial: ['submitted'] },
  consignmentItem: { name: 'consignment item', transitions: ITEM_TRANSITIONS, initial: ['pending'] },
  consignmentAgreement: { name: 'agreement', transitions: AGREEMENT_TRANSITIONS, initial: ['draft'] },
  tradeInSubmission: { name: 'trade-in', transitions: SUBMISSION_TRANSITIONS, initial: ['draft', 'submitted'], commandOnly: ['paid'] },
  dispute: { name: 'dispute', transitions: DISPUTE_TRANSITIONS, initial: ['open'] },
  seller: { name: 'seller', transitions: SELLER_TRANSITIONS, initial: ['applicant'] },
  return: { name: 'return', transitions: RETURN_TRANSITIONS, initial: ['requested'] },
} satisfies Record<string, Lifecycle>;

export function canMove(map: Record<string, string[]>, from: string | null | undefined, to: string): boolean {
  return !!from && (map[from] || []).includes(to);
}

/** Error message for an illegal move, or null when the move is allowed. A no-op is allowed. */
export function transitionError(lifecycle: Lifecycle, from: string | null | undefined, to: string): string | null {
  const current = from || lifecycle.initial[0];
  if (current === to) return null;
  if (!(to in lifecycle.transitions)) return `Unknown ${lifecycle.name} status "${to}"`;
  if (lifecycle.commandOnly?.includes(to)) return `A ${lifecycle.name} can only be set to ${to} by its own command`;
  if (!canMove(lifecycle.transitions, current, to)) return `A ${lifecycle.name} cannot move from ${current} to ${to}`;
  return null;
}

/** Checks a non-"status" field (claim payment/fulfillment) against its map. */
export function validateFieldMove(
  label: string,
  map: Record<string, string[]>,
  field: string,
  args: ValidateArgs,
): void {
  const to = args.resolvedData[field];
  if (typeof to !== 'string' || args.operation !== 'update') return;
  const from = args.item?.[field];
  if (!from || from === to) return;
  if (!canMove(map, from, to)) args.addValidationError(`A claim ${label} cannot move from ${from} to ${to}`);
}

export function createStatusError(lifecycle: Lifecycle, to: string): string | null {
  if (lifecycle.initial.includes(to)) return null;
  return `A new ${lifecycle.name} must start as ${lifecycle.initial.join(' or ')}, not ${to}`;
}

type ValidateArgs = {
  operation: 'create' | 'update';
  resolvedData: Record<string, any>;
  item?: Record<string, any> | null;
  addValidationError: (message: string) => void;
};

/** Checks a status write against a lifecycle. Returns the resolved from/to for extra guards. */
export function validateStatusWrite(lifecycle: Lifecycle, args: ValidateArgs): { from: string | null; to: string } | null {
  const to = args.resolvedData.status;
  if (typeof to !== 'string') return null;
  const from = args.operation === 'update' ? (args.item?.status ?? null) : null;
  const message = args.operation === 'create' ? createStatusError(lifecycle, to) : transitionError(lifecycle, from, to);
  if (message) {
    args.addValidationError(message);
    return null;
  }
  return { from, to };
}

/** A consignment item may only move forward while its consignment is still live. */
export function itemMoveBlockedByIntake(intakeStatus: string | null | undefined, to: string): string | null {
  if (!intakeStatus) return null;
  if (['declined', 'returned'].includes(intakeStatus) && ['accepted', 'listed', 'sold'].includes(to)) {
    return `Items cannot be ${to} on a consignment that is ${intakeStatus}`;
  }
  return null;
}

/** Trade-in amounts are editable only in the stage that owns them. */
export function tradeInAmountError(submissionStatus: string | null | undefined, data: Record<string, unknown>): string | null {
  if ('quotedAmountMinor' in data && !['received', 'inspecting'].includes(submissionStatus || '')) {
    return 'Quotes can be changed only while the trade-in is received or being inspected';
  }
  if ('acceptedAmountMinor' in data && submissionStatus !== 'quoted') {
    return 'Accepted amounts are set only while the quote is open';
  }
  return null;
}

export function canAddTradeInItem(submissionStatus: string | null | undefined): boolean {
  return ['draft', 'submitted', 'received', 'inspecting'].includes(submissionStatus || '');
}

/**
 * A return refund is a one-time event for the return: not for a canceled return and
 * not twice under a different idempotency key. Replays of the same key are answered
 * before this check.
 */
export function returnRefundError(record: { status?: string | null; metadata?: any }): string | null {
  if (record.status === 'canceled') return 'A canceled return cannot be refunded';
  if (record.metadata?.refundId) return 'This return has already been refunded';
  return null;
}

export function returnCancelError(record: { metadata?: any }): string | null {
  return record.metadata?.refundId ? 'A refunded return cannot be canceled' : null;
}

/** Whether a provider event may move a payment. Captures always win; nothing undoes one. */
export function canMovePayment(from: string | null | undefined, to: string): boolean {
  if (from === to) return true;
  return canMove(PAYMENT_TRANSITIONS, from, to);
}

/**
 * An abandoned checkout leaves its serialized unit reserved. Another buyer may take the
 * unit over only when the hold is a cart hold that has expired and its checkout never got
 * as far as taking money (no attempt, or an attempt that has sat before payment for two hours).
 */
export function isAbandonedCartHold(
  hold: { purpose?: string | null; status?: string | null; cartId?: string | null; expiresAt?: Date | null },
  attempt: { recoveryPoint?: string | null; lockedAt?: Date | null } | null,
  now: Date,
): boolean {
  if (hold.purpose !== 'cart' || hold.status !== 'active' || !hold.cartId) return false;
  if (!(hold.expiresAt instanceof Date) || hold.expiresAt.getTime() > now.getTime()) return false;
  if (!attempt) return true;
  if (!['started', 'stock_reserved', 'resources_reserved'].includes(attempt.recoveryPoint || '')) return false;
  const last = attempt.lockedAt instanceof Date ? attempt.lockedAt.getTime() : 0;
  return now.getTime() - last > 2 * 60 * 60 * 1000;
}
