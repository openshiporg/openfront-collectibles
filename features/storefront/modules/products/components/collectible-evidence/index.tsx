import { formatGradingEvidence, getCollectibleEvidenceTimestamp } from '@/features/storefront/lib/collectible-evidence-presentation';

type EvidencePanelProps = { result: any; unavailable?: boolean };

function formatMinorAmount(amountMinor: number, currencyCode: string): string {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode });
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** exponent);
}

export function CollectibleEvidencePanel({ result, unavailable = false }: EvidencePanelProps) {
  const extension = result?.extension?.value;
  const specimen = extension?.specimen;
  if (!specimen) {
    return unavailable ? <section role="status" className="border-y bg-stone-50 px-5 py-8 text-sm text-stone-600 sm:px-8 lg:px-12">Item details are temporarily unavailable.</section> : null;
  }

  const observations = extension.observations || {};
  const sections = [
    ['Condition', observations.condition, (item: any) => `${item.label}${item.score ? ` · ${item.score}` : ''}`],
    ['Grading & certificate', observations.grading, formatGradingEvidence],
    ['Provenance', observations.provenance, (item: any) => item.eventType.replaceAll('_', ' ')],
    ['Valuation', observations.valuation, (item: any) => `${formatMinorAmount(item.amountMinor, item.currencyCode)}${item.sourceName ? ` · ${item.sourceName}` : ''}`],
  ] as const;

  return (
    <section className="border-y bg-stone-50 px-5 py-14 text-stone-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-b pb-8 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{specimen.category}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Item details</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600">Condition, grading, provenance, and valuation details as reported by the seller.</p>
        </div>
        <div className="grid gap-px bg-stone-300 md:grid-cols-2">
          {sections.map(([title, items, format]) => (
            <article key={title} className="min-w-0 bg-stone-50 py-7 md:px-7 first:pl-0">
              <h3 className="font-semibold">{title}</h3>
              {items?.length ? (
                <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                  {items.map((item: any) => {
                    const timestamp = getCollectibleEvidenceTimestamp(item);
                    return (
                      <li key={item.id}>
                        {format(item)}
                        {timestamp ? <time dateTime={timestamp.dateTime} className="block text-xs text-stone-400">{timestamp.label} {new Date(timestamp.dateTime).toLocaleDateString()}</time> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="mt-4 text-sm text-stone-500">Not provided</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
