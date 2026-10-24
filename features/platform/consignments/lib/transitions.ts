import type { DotTone } from '@/features/platform/components/vault-ui';

// Allowed lifecycle moves. Server actions check these before writing; the UI
// offers only these.
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
  sold: [],
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
  return_requested: 'Request return', sent: 'Mark sent', expired: 'Mark expired', terminated: 'Terminate',
};

export function canMove(map: Record<string, string[]>, from: string | null | undefined, to: string) {
  return !!from && (map[from] || []).includes(to);
}
