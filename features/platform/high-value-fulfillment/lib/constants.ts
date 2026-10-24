export const EVIDENCE_TYPES: { value: string; label: string }[] = [
  { value: 'label', label: 'Label' },
  { value: 'acceptance_scan', label: 'Acceptance scan' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'exception', label: 'Exception' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'signature', label: 'Signature' },
  { value: 'insurance_response', label: 'Insurance response' },
  { value: 'packaging', label: 'Packaging' },
];

export const QUEUES = [
  { value: 'needs', label: 'Needs requirements' },
  { value: 'set', label: 'Requirements set' },
  { value: 'all', label: 'All open orders' },
] as const;

export type QueueKey = (typeof QUEUES)[number]['value'];

/** Orders still being worked: not completed, archived or canceled. */
export const OPEN_ORDER_STATUSES = ['pending', 'requires_action'];
