import type { DotTone } from '../../components/vault-ui';

export const DISPUTE_STATUSES: { value: string; label: string; tone: DotTone }[] = [
  { value: 'open', label: 'Open', tone: 'danger' },
  { value: 'evidence_requested', label: 'Evidence requested', tone: 'warn' },
  { value: 'review', label: 'In review', tone: 'warn' },
  { value: 'resolved', label: 'Resolved', tone: 'ok' },
  { value: 'closed', label: 'Closed', tone: 'muted' },
];

export const DISPUTE_TYPES: { value: string; label: string }[] = [
  { value: 'condition', label: 'Condition' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'authenticity_concern', label: 'Authenticity concern' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'payment', label: 'Payment' },
  { value: 'return', label: 'Return' },
  { value: 'other', label: 'Other' },
];

/** Allowed status moves, enforced again on the server before any update. */
export const DISPUTE_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  open: [
    { to: 'evidence_requested', label: 'Request evidence' },
    { to: 'review', label: 'Start review' },
  ],
  evidence_requested: [{ to: 'review', label: 'Start review' }],
  review: [
    { to: 'evidence_requested', label: 'Request more evidence' },
    { to: 'resolved', label: 'Resolve' },
  ],
  resolved: [{ to: 'closed', label: 'Close' }],
  closed: [],
};

export function disputeStatus(value?: string | null) {
  return DISPUTE_STATUSES.find((s) => s.value === value) ?? { value: value || '', label: value || 'Unknown', tone: 'muted' as DotTone };
}

export function disputeTypeLabel(value?: string | null) {
  return DISPUTE_TYPES.find((t) => t.value === value)?.label ?? (value || 'Other');
}

export function canTransition(from: string | null | undefined, to: string) {
  return (DISPUTE_TRANSITIONS[from || ''] || []).some((t) => t.to === to);
}
