import type { DotTone } from '@/features/platform/components/vault-ui';

// Allowed trade-in moves. Server actions check these before writing; the UI
// offers only these.
import { SUBMISSION_TRANSITIONS, canMove as canMoveIn } from '@/features/keystone/lib/lifecycles';

export { SUBMISSION_TRANSITIONS };

export const SUBMISSION_STATUSES = ['draft', 'submitted', 'received', 'inspecting', 'quoted', 'accepted', 'declined', 'paid', 'returned'];

export const SUBMISSION_TONES: Record<string, DotTone> = {
  draft: 'muted', submitted: 'info', received: 'accent', inspecting: 'warn', quoted: 'warn',
  accepted: 'ok', declined: 'danger', paid: 'ok', returned: 'muted',
};

export const ACTION_LABELS: Record<string, string> = {
  submitted: 'Submit', received: 'Mark received', inspecting: 'Start inspection', quoted: 'Send quote',
  accepted: 'Accept', declined: 'Decline', paid: 'Mark paid', returned: 'Mark returned',
};

// Statuses in which quotes and inspections can still change.
export const QUOTABLE = new Set(['received', 'inspecting']);

export function canMove(from: string | null | undefined, to: string) {
  return canMoveIn(SUBMISSION_TRANSITIONS, from, to);
}
