import type { DotTone } from '../../components/vault-ui';
import { DISPUTE_TRANSITIONS as CENTRAL_DISPUTE_TRANSITIONS } from '@/features/keystone/lib/lifecycles';

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

const DISPUTE_ACTION_LABELS: Record<string, string> = {
  evidence_requested: 'Request evidence',
  review: 'Start review',
  resolved: 'Resolve',
  closed: 'Close',
};

/** Allowed status moves (one map in keystone/lib/lifecycles), enforced again on the server before any update. */
export const DISPUTE_TRANSITIONS: Record<string, { to: string; label: string }[]> = Object.fromEntries(
  Object.entries(CENTRAL_DISPUTE_TRANSITIONS).map(([from, tos]) => [
    from,
    tos.map((to) => ({ to, label: from === 'review' && to === 'evidence_requested' ? 'Request more evidence' : DISPUTE_ACTION_LABELS[to] })),
  ]),
);

export function disputeStatus(value?: string | null) {
  return DISPUTE_STATUSES.find((s) => s.value === value) ?? { value: value || '', label: value || 'Unknown', tone: 'muted' as DotTone };
}

export function disputeTypeLabel(value?: string | null) {
  return DISPUTE_TYPES.find((t) => t.value === value)?.label ?? (value || 'Other');
}

export function canTransition(from: string | null | undefined, to: string) {
  return (DISPUTE_TRANSITIONS[from || ''] || []).some((t) => t.to === to);
}
