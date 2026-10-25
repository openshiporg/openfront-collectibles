import type { ReactNode } from 'react';

import {
  formatMinorAmount,
  getCollectibleEvidenceTimestamp,
  humanizeEvidence,
} from '@/features/storefront/lib/collectible-evidence-presentation';
import StatusDot, { type DotTone } from '@/features/storefront/modules/common/components/collectibles/status-dot';
import { verificationOf } from '@/features/storefront/modules/common/components/collectibles/slab-label';

type EvidencePanelProps = { result: any; unavailable?: boolean };

const REVIEW_TONE: Record<string, DotTone> = {
  reviewed: 'ok',
  reported: 'muted',
  disputed: 'warn',
  rejected: 'danger',
  superseded: 'muted',
};

function Stamp({ item }: { item: any }) {
  const timestamp = getCollectibleEvidenceTimestamp(item);
  if (!timestamp) return null;
  return (
    <time dateTime={timestamp.dateTime} className="cx-num text-[13px] text-cx-ink-3">
      {timestamp.label} {timestamp.dateTime.slice(0, 10)}
    </time>
  );
}

function Entry({
  title,
  state,
  tone,
  meta,
  note,
  item,
}: {
  title: ReactNode;
  state?: string;
  tone?: DotTone;
  meta?: ReactNode;
  note?: string | null;
  item: any;
}) {
  return (
    <li className="space-y-1 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-cx-serif text-[18px] leading-[24px] text-cx-ink">{title}</span>
        {state && (
          <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
            {tone && <StatusDot tone={tone} />}
            {state}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-cx-ink-2">
        {meta}
        <Stamp item={item} />
      </div>
      {note && <p className="max-w-[60ch] text-[13px] leading-[18px] text-cx-ink-3">{note}</p>}
    </li>
  );
}

// Sections the record has no entries for are left out, like the facts band.
function Field({ label, children, empty }: { label: string; children?: ReactNode; empty: boolean }) {
  if (empty) return null;
  return (
    <div className="grid gap-3 border-t border-cx-line py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
      <h3 className="cx-label pt-1">{label}</h3>
      <ul className="divide-y divide-cx-line">{children}</ul>
    </div>
  );
}

function attributeValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function CollectibleEvidencePanel({ result, unavailable = false }: EvidencePanelProps) {
  const extension = result?.extension?.value;
  const specimen = extension?.specimen;
  if (!specimen) {
    return unavailable ? (
      <section role="status" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
        <p className="cx-band px-5 py-4 text-[14px] text-cx-ink-2">Item record unavailable</p>
      </section>
    ) : null;
  }

  const observations = extension.observations || {};
  const condition: any[] = observations.condition || [];
  const grading: any[] = observations.grading || [];
  const provenance: any[] = observations.provenance || [];
  const valuation: any[] = observations.valuation || [];
  const attributes = Object.entries((specimen.attributes || {}) as Record<string, unknown>);

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="item-record-title" data-testid="item-record">
      <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 id="item-record-title" className="font-cx-display text-[32px] font-extrabold leading-[34px] text-cx-ink sm:text-[44px] sm:leading-[44px]">
            Item record
          </h2>
          <p className="cx-label">{specimen.category}</p>
        </div>
        {(specimen.catalogNumber || specimen.maker) && (
          <span className="cx-num text-[13px] text-cx-ink-2">
            {[specimen.catalogNumber && `Catalogue ${specimen.catalogNumber}`, specimen.maker, specimen.year].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      {attributes.length > 0 && (
        <div className="grid gap-3 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
          <h3 className="cx-label pt-1">Attributes</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {attributes.map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="text-[13px] text-cx-ink-3">{humanizeEvidence(key)}</dt>
                <dd className="truncate text-[14px] text-cx-ink">{attributeValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Field label="Condition" empty={!condition.length}>
        {condition.map((item) => (
          <Entry
            key={item.id}
            item={item}
            title={item.label}
            state={humanizeEvidence(item.status)}
            tone={REVIEW_TONE[item.status]}
            meta={
              <>
                {item.score && <span className="cx-num text-cx-ink">{item.score}{item.scale ? ` / ${item.scale}` : ''}</span>}
                <span>{humanizeEvidence(item.sourceType)} reported</span>
              </>
            }
          />
        ))}
      </Field>

      <Field label="Grading & certificate" empty={!grading.length}>
        {grading.map((item) => {
          const v = verificationOf(item.verificationState);
          return (
            <Entry
              key={item.id}
              item={item}
              title={`${item.gradingCompany?.name || 'Provider'} ${item.reportedGrade}`}
              state={v.label}
              tone={v.tone}
              meta={
                <>
                  {item.reportedLabel && <span>{item.reportedLabel}</span>}
                  {item.certificateReference && (
                    <span className="cx-num">Cert {String(item.certificateReference).trim().slice(0, 160)}</span>
                  )}
                </>
              }
              note={item.disclaimer}
            />
          );
        })}
      </Field>

      <Field label="Provenance" empty={!provenance.length}>
        {provenance.map((item) => (
          <Entry
            key={item.id}
            item={item}
            title={humanizeEvidence(item.eventType)}
            state={humanizeEvidence(item.reviewState)}
            tone={REVIEW_TONE[item.reviewState]}
            meta={<span>Confidence {humanizeEvidence(item.confidence).toLowerCase()}</span>}
          />
        ))}
      </Field>

      <Field label="Valuation" empty={!valuation.length}>
        {valuation.map((item) => (
          <Entry
            key={item.id}
            item={item}
            title={<span className="cx-num text-[17px]">{formatMinorAmount(item.amountMinor, item.currencyCode)}</span>}
            meta={
              <>
                <span>{item.sourceName}</span>
                <span>{humanizeEvidence(item.sourceType)}</span>
                <span>Confidence {humanizeEvidence(item.confidence).toLowerCase()}</span>
              </>
            }
            note={item.disclaimer}
          />
        ))}
      </Field>
    </section>
  );
}
