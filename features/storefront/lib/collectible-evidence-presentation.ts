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

/** Format integer minor units in their currency's own exponent. */
export function formatMinorAmount(amountMinor: number, currencyCode: string, locale = 'en-US'): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode });
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** exponent);
}

/** Newest grading observation projected onto slab-label fields, or null when ungraded. */
export function slabFromGrading(grading: any[] | undefined | null) {
  const row = Array.isArray(grading) ? grading[0] : null;
  if (!row || typeof row.reportedGrade !== 'string') return null;
  const company = row.gradingCompany;
  return {
    company: (typeof company?.code === 'string' && company.code.trim()) || (typeof company?.name === 'string' && company.name.trim()) || null,
    companyName: typeof company?.name === 'string' ? company.name : null,
    grade: row.reportedGrade as string,
    gradeLabel: typeof row.reportedLabel === 'string' ? row.reportedLabel : null,
    certificate: typeof row.certificateReference === 'string' && row.certificateReference.trim()
      ? row.certificateReference.trim().slice(0, 160)
      : null,
    verification: typeof row.verificationState === 'string' ? row.verificationState : null,
    disclaimer: typeof row.disclaimer === 'string' ? row.disclaimer : null,
  };
}

export function humanizeEvidence(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
