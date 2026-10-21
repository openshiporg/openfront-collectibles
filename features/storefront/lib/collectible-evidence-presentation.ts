export function getCollectibleEvidenceTimestamp(item: {
  occurredAt?: unknown;
  observedAt?: unknown;
}) {
  const occurredAt = validDate(item?.occurredAt);
  if (occurredAt) return { label: 'Occurred', dateTime: occurredAt.toISOString() };

  const observedAt = validDate(item?.observedAt);
  if (observedAt) return { label: 'Observed', dateTime: observedAt.toISOString() };
  return null;
}

function validDate(value: unknown): Date | null {
  const parsed = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function formatGradingEvidence(item: {
  gradingCompany?: { name?: unknown } | null;
  reportedGrade?: unknown;
  verificationState?: unknown;
  certificateReference?: unknown;
}): string {
  const company = typeof item?.gradingCompany?.name === 'string' && item.gradingCompany.name.trim()
    ? item.gradingCompany.name.trim()
    : 'Provider';
  const grade = typeof item?.reportedGrade === 'string' ? item.reportedGrade : 'Unspecified grade';
  const verification = typeof item?.verificationState === 'string'
    ? item.verificationState.replace(/_/g, ' ')
    : null;
  const reference = typeof item?.certificateReference === 'string'
    ? item.certificateReference.trim().slice(0, 160)
    : '';

  return [company, grade, verification, reference ? `Reported certificate ref: ${reference}` : null]
    .filter(Boolean)
    .join(' · ');
}
