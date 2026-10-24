import type { DotTone } from '../../components/vault-ui';

export const LIFECYCLE: { value: string; label: string; tone: DotTone }[] = [
  { value: 'intake', label: 'Intake', tone: 'info' },
  { value: 'review', label: 'Review', tone: 'warn' },
  { value: 'available', label: 'Available', tone: 'ok' },
  { value: 'reserved', label: 'Reserved', tone: 'accent' },
  { value: 'sold', label: 'Sold', tone: 'muted' },
  { value: 'returned', label: 'Returned', tone: 'warn' },
  { value: 'withdrawn', label: 'Withdrawn', tone: 'muted' },
];

export const UNIT_TONES: Record<string, DotTone> = {
  intake: 'info', available: 'ok', reserved: 'accent', sold: 'muted', return_hold: 'warn', withdrawn: 'muted', lost: 'danger',
};

export const LISTING_TONES: Record<string, DotTone> = {
  draft: 'muted', scheduled: 'warn', published: 'ok', paused: 'warn', sold: 'info', ended: 'muted', withdrawn: 'muted',
};

export const VERIFICATION_TONES: Record<string, DotTone> = {
  matched: 'ok', provider_reported: 'accent', manual_review: 'warn', not_checked: 'muted', unavailable: 'muted', mismatch: 'danger',
};

export const lifecycleTone = (value?: string | null): DotTone => LIFECYCLE.find((s) => s.value === value)?.tone ?? 'muted';

// Option sets mirror the select options in features/keystone/models/CollectibleEvidence.ts and CollectibleCatalog.ts.
export const OPTIONS = {
  identifierType: ['operator', 'serial', 'edition', 'manufacturer', 'registry', 'certificate', 'other'],
  conditionSource: ['operator', 'seller', 'buyer', 'provider', 'import'],
  conditionStatus: ['reported', 'reviewed', 'superseded', 'disputed'],
  verification: ['not_checked', 'provider_reported', 'matched', 'mismatch', 'unavailable', 'manual_review'],
  provenanceType: ['claimed_origin', 'ownership', 'sale', 'exhibition', 'publication', 'restoration', 'loss', 'recovery', 'other'],
  confidence: ['unreviewed', 'low', 'medium', 'high', 'provider_reported'],
  reviewState: ['reported', 'reviewed', 'disputed', 'rejected'],
  custodyType: ['intake', 'received', 'stored', 'moved', 'released', 'shipped', 'delivered', 'returned', 'inspection'],
  valuationSource: ['operator', 'comparable_sale', 'price_guide', 'auction_result', 'provider', 'seller', 'other'],
  mediaKind: ['image', 'video', 'document', 'scan'],
  mediaVisibility: ['public', 'restricted', 'private'],
} as const;

export type EvidenceKind = 'identifier' | 'condition' | 'grade' | 'provenance' | 'custody' | 'valuation' | 'media';
