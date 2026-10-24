import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageContainer } from '../../../dashboard/components/PageContainer';
import { formatMinorToMajor } from '@/features/lib/minor-units';
import { ListBand, PageTitle, humanize } from '../../components/vault-ui';
import { day, money } from '../../collectibles/lib/format';
import { getSpecimenOptions, getSubmission, getTradeInOptions } from '../actions';
import {
  AddTradeInItemButton,
  AmountForm,
  InspectionButton,
  LinkSpecimenForm,
  SubmissionMoves,
} from '../components/TradeInActions';
import { QUOTABLE, SUBMISSION_TONES } from '../lib/transitions';

function major(amount: number | null | undefined, currency: string) {
  if (amount == null) return undefined;
  try {
    return formatMinorToMajor(amount, currency);
  } catch {
    return undefined;
  }
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}

function totals(items: any[], key: 'quotedAmountMinor' | 'acceptedAmountMinor') {
  const rows = items.filter((i) => i[key] != null && i.currencyCode);
  if (!rows.length) return '—';
  if (new Set(rows.map((i) => i.currencyCode)).size !== 1) return 'Mixed currencies';
  return money(rows.reduce((sum, i) => sum + i[key], 0), rows[0].currencyCode);
}

export async function TradeInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [response, options, specimens] = await Promise.all([getSubmission(id), getTradeInOptions(), getSpecimenOptions()]);
  if (response.success && !response.data) notFound();
  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'Trade-ins', href: '/dashboard/platform/trade-ins' },
    { type: 'page' as const, label: response.success && response.data ? response.data.submission.reference : 'Trade-in' },
  ];
  if (!response.success || !response.data) {
    return (
      <PageContainer title="Trade-in" breadcrumbs={breadcrumbs}>
        <div className="px-4 md:px-6">
          <ListBand><p role="alert" className="px-4 py-3.5 text-sm text-destructive">{response.success ? 'Trade-in unavailable' : response.error}</p></ListBand>
        </div>
      </PageContainer>
    );
  }

  const { submission, offers } = response.data;
  const items: any[] = submission.items || [];
  const storeCurrency = options.success ? options.data.currencyCode : 'USD';
  const catalogItems = options.success ? options.data.catalogItems : [];
  const quotable = QUOTABLE.has(submission.status);
  const canAdd = ['draft', 'submitted', 'received', 'inspecting'].includes(submission.status);

  return (
    <PageContainer title={submission.reference} breadcrumbs={breadcrumbs}>
      <div className="w-full max-w-6xl space-y-8 px-4 pb-28 md:px-6 md:pb-12">
        <PageTitle
          title={submission.reference}
          tone={SUBMISSION_TONES[submission.status]}
          state={humanize(submission.status)}
          meta={submission.customer ? `${submission.customer.name || ''} ${submission.customer.email}`.trim() : 'No customer'}
          actions={<SubmissionMoves id={submission.id} status={submission.status} />}
        />

        <ListBand>
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            <Fact label="Opened">{day(submission.createdAt)}</Fact>
            <Fact label="Payout">{humanize(submission.disposition)}</Fact>
            <Fact label="Quoted">{totals(items, 'quotedAmountMinor')}</Fact>
            <Fact label="Accepted">{totals(items, 'acceptedAmountMinor')}</Fact>
          </dl>
        </ListBand>

        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Items <span className="font-mono text-xs font-normal text-muted-foreground">{items.length}</span></h2>
            {canAdd && <AddTradeInItemButton submissionId={submission.id} catalogItems={catalogItems} />}
          </div>
          <ListBand>
            {items.length === 0 && <p className="px-4 py-3.5 text-sm text-muted-foreground">No items</p>}
            {items.map((item) => {
              const offer = item.catalogItem?.id ? offers[item.catalogItem.id] : undefined;
              const currency = item.currencyCode || offer?.currencyCode || storeCurrency;
              const title = item.catalogItem?.title || item.customerDescription || 'Item';
              return (
                <div key={item.id} className="space-y-3 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-medium text-foreground">{title}</span>
                        {item.inspectedConditionObservation && (
                          <span className="text-xs text-muted-foreground">
                            Inspected: {item.inspectedConditionObservation.label}
                            {item.inspectedConditionObservation.score ? ` · ${item.inspectedConditionObservation.score}` : ''}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[
                          item.catalogItem?.catalogNumber,
                          item.customerCondition && `Customer: ${item.customerCondition}`,
                          item.catalogItem && item.customerDescription,
                        ].filter(Boolean).join(' · ') || '—'}
                      </p>
                      {item.specimen ? (
                        <Link href={`/dashboard/specimens/${item.specimen.id}`} className="mt-0.5 inline-block font-mono text-xs text-foreground hover:underline">
                          {item.specimen.specimenCode}
                        </Link>
                      ) : null}
                    </div>
                    <dl className="flex shrink-0 gap-4 text-right font-mono text-xs tabular-nums">
                      <div><dt className="font-sans text-muted-foreground">Buylist</dt><dd>{offer ? money(offer.offerAmountMinor, offer.currencyCode) : '—'}</dd></div>
                      <div><dt className="font-sans text-muted-foreground">Quote</dt><dd>{item.quotedAmountMinor != null ? money(item.quotedAmountMinor, item.currencyCode) : '—'}</dd></div>
                      <div><dt className="font-sans text-muted-foreground">Accepted</dt><dd>{item.acceptedAmountMinor != null ? money(item.acceptedAmountMinor, item.currencyCode) : '—'}</dd></div>
                    </dl>
                  </div>

                  {(quotable || submission.status === 'quoted') && (
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                      {quotable && (
                        <AmountForm
                          kind="quote"
                          label="Quote"
                          submit="Save quote"
                          submissionId={submission.id}
                          itemId={item.id}
                          currencyCode={currency}
                          defaultValue={major(item.quotedAmountMinor ?? offer?.offerAmountMinor, currency)}
                        />
                      )}
                      {submission.status === 'quoted' && (
                        <AmountForm
                          kind="accepted"
                          label="Accepted amount"
                          submit="Save"
                          submissionId={submission.id}
                          itemId={item.id}
                          currencyCode={item.currencyCode || currency}
                          defaultValue={major(item.acceptedAmountMinor ?? item.quotedAmountMinor, item.currencyCode || currency)}
                        />
                      )}
                      {quotable && !item.specimen && (
                        <LinkSpecimenForm submissionId={submission.id} itemId={item.id} specimens={specimens} />
                      )}
                      {quotable && item.specimen && (
                        <InspectionButton submissionId={submission.id} itemId={item.id} specimenId={item.specimen.id} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </ListBand>
        </section>
      </div>
    </PageContainer>
  );
}

export default TradeInDetailPage;
