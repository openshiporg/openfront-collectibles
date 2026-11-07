import type { DotTone } from '@/features/platform/components/vault-ui';

// Allowed lifecycle moves. Server actions check these before writing; the UI
// offers only these.
export { INTAKE_TRANSITIONS, ITEM_TRANSITIONS, AGREEMENT_TRANSITIONS, canMove } from '@/features/keystone/lib/lifecycles';

export const INTAKE_STATUSES = ['submitted', 'received', 'inspecting', 'offered', 'accepted', 'declined', 'returned'];

export const INTAKE_TONES: Record<string, DotTone> = {
  submitted: 'info', received: 'accent', inspecting: 'warn', offered: 'warn', accepted: 'ok', declined: 'danger', returned: 'muted',
};
export const ITEM_TONES: Record<string, DotTone> = {
  pending: 'info', accepted: 'accent', listed: 'ok', sold: 'ok', return_requested: 'warn', returned: 'muted', settled: 'muted',
};
export const AGREEMENT_TONES: Record<string, DotTone> = {
  draft: 'muted', sent: 'warn', accepted: 'ok', expired: 'muted', terminated: 'danger',
};
export const SETTLEMENT_TONES: Record<string, DotTone> = {
  pending: 'info', on_hold: 'warn', approved: 'accent', paid: 'ok', failed: 'danger', reversed: 'muted',
};

export const ACTION_LABELS: Record<string, string> = {
  received: 'Mark received', inspecting: 'Start inspection', offered: 'Mark offered', accepted: 'Accept',
  declined: 'Decline', returned: 'Mark returned', listed: 'Mark listed', sold: 'Mark sold',
  return_requested: 'Request return', sent: 'Mark sent', settled: 'Mark settled', expired: 'Mark expired', terminated: 'Terminate',
};

