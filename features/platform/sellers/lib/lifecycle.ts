import type { DotTone } from '../../components/vault-ui';

export const SELLER_STATUSES: { value: string; label: string; tone: DotTone }[] = [
  { value: 'applicant', label: 'Applicant', tone: 'warn' },
  { value: 'active', label: 'Active', tone: 'ok' },
  { value: 'paused', label: 'Paused', tone: 'warn' },
  { value: 'suspended', label: 'Suspended', tone: 'danger' },
  { value: 'closed', label: 'Closed', tone: 'muted' },
];

export const IDENTITY_STATES: { value: string; label: string; tone: DotTone }[] = [
  { value: 'not_requested', label: 'Not requested', tone: 'muted' },
  { value: 'pending', label: 'Pending', tone: 'warn' },
  { value: 'provider_reported', label: 'Provider reported', tone: 'ok' },
  { value: 'manual_review', label: 'Manual review', tone: 'warn' },
  { value: 'rejected', label: 'Rejected', tone: 'danger' },
];

/** Allowed status moves, enforced again on the server before any update. */
export const SELLER_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  applicant: [
    { to: 'active', label: 'Approve' },
    { to: 'closed', label: 'Decline' },
  ],
  active: [
    { to: 'paused', label: 'Pause' },
    { to: 'suspended', label: 'Suspend' },
    { to: 'closed', label: 'Close' },
  ],
  paused: [
    { to: 'active', label: 'Resume' },
    { to: 'suspended', label: 'Suspend' },
    { to: 'closed', label: 'Close' },
  ],
  suspended: [
    { to: 'active', label: 'Reinstate' },
    { to: 'closed', label: 'Close' },
  ],
  closed: [],
};

export function sellerStatus(value?: string | null) {
  return SELLER_STATUSES.find((s) => s.value === value) ?? { value: value || '', label: value || 'Unknown', tone: 'muted' as DotTone };
}

export function identityState(value?: string | null) {
  return IDENTITY_STATES.find((s) => s.value === value) ?? IDENTITY_STATES[0];
}

export function canMoveSeller(from: string | null | undefined, to: string) {
  return (SELLER_TRANSITIONS[from || ''] || []).some((t) => t.to === to);
}
