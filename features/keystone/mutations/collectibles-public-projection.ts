const conditionSources = new Set(['operator', 'seller', 'buyer', 'provider', 'import']);
const conditionStatuses = new Set(['reported', 'reviewed', 'superseded', 'disputed']);
const verificationStates = new Set(['not_checked', 'provider_reported', 'matched', 'mismatch', 'unavailable', 'manual_review']);
const provenanceTypes = new Set(['claimed_origin', 'ownership', 'sale', 'exhibition', 'publication', 'restoration', 'loss', 'recovery', 'other']);
const confidenceValues = new Set(['unreviewed', 'low', 'medium', 'high', 'provider_reported']);
const reviewStates = new Set(['reported', 'reviewed', 'disputed', 'rejected']);
const valuationSources = new Set(['operator', 'comparable_sale', 'price_guide', 'auction_result', 'provider', 'seller', 'other']);

function dateValue(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return null;
}

function enumValue(value: unknown, choices: Set<string>): string | null {
  return typeof value === 'string' && choices.has(value) ? value : null;
}

function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export function projectPublicObservations(specimen: any) {
  const condition = rows(specimen?.conditionObservations).flatMap((row) => {
    const sourceType = enumValue(row?.sourceType, conditionSources);
    const status = enumValue(row?.status, conditionStatuses);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== 'string' || !sourceType || !status || !observedAt || typeof row?.label !== 'string') return [];
    return [{ id: row.id, sourceType, scale: typeof row.scale === 'string' ? row.scale : null, label: row.label, score: typeof row.score === 'string' ? row.score : null, observedAt, status }];
  });
  const grading = rows(specimen?.gradeObservations).flatMap((row) => {
    const verificationState = enumValue(row?.verificationState, verificationStates);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== 'string' || typeof row?.reportedGrade !== 'string' || !verificationState || !observedAt || typeof row?.disclaimer !== 'string') return [];
    const company = row.gradingCompany && typeof row.gradingCompany.id === 'string' && typeof row.gradingCompany.name === 'string' && typeof row.gradingCompany.code === 'string'
      ? { id: row.gradingCompany.id, name: row.gradingCompany.name, code: row.gradingCompany.code }
      : null;
    return [{ id: row.id, reportedGrade: row.reportedGrade, reportedLabel: typeof row.reportedLabel === 'string' ? row.reportedLabel : null, certificateReference: typeof row.certificateReference === 'string' ? row.certificateReference : null, observedAt, verificationState, disclaimer: row.disclaimer, gradingCompany: company }];
  });
  const provenance = rows(specimen?.provenanceEvents).flatMap((row) => {
    const eventType = enumValue(row?.eventType, provenanceTypes);
    const confidence = enumValue(row?.confidence, confidenceValues);
    const reviewState = enumValue(row?.reviewState, reviewStates);
    if (typeof row?.id !== 'string' || !eventType || !confidence || !reviewState) return [];
    return [{ id: row.id, eventType, occurredAt: dateValue(row.occurredAt), confidence, reviewState }];
  });
  const valuation = rows(specimen?.valuationObservations).flatMap((row) => {
    const sourceType = enumValue(row?.sourceType, valuationSources);
    const confidence = enumValue(row?.confidence, confidenceValues);
    const observedAt = dateValue(row?.observedAt);
    if (typeof row?.id !== 'string' || !Number.isSafeInteger(row?.amountMinor) || row.amountMinor < 0 || !/^[A-Z]{3}$/.test(String(row?.currencyCode || '')) || !sourceType || typeof row?.sourceName !== 'string' || !observedAt || !confidence || typeof row?.disclaimer !== 'string') return [];
    return [{ id: row.id, amountMinor: row.amountMinor, currencyCode: row.currencyCode, sourceType, sourceName: row.sourceName, observedAt, confidence, disclaimer: row.disclaimer }];
  });
  return { condition, grading, provenance, valuation };
}
