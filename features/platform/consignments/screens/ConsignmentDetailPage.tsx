import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Dot, ListBand, PageTitle, SectionTitle, humanize } from '../../components/vault-ui';
import { day, money } from '../../collectibles/lib/format';
import { getConsignmentOptions, getIntake } from '../actions';
import {
  AddItemButton,
  AgreementMoves,
  CreateAgreementButton,
  IntakeMoves,
  ItemMoves,
} from '../components/ConsignmentActions';
import { AGREEMENT_TONES, INTAKE_TONES, ITEM_TONES, SETTLEMENT_TONES } from '../lib/transitions';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}

function percentFromBasisPoints(bp: number) {
  const whole = Math.floor(bp / 100);
  const rest = bp % 100;
  return rest ? `${whole}.${String(rest).padStart(2, '0').replace(/0$/, '')}%` : `${whole}%`;
}

export async function ConsignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [response, options] = await Promise.all([getIntake(id), getConsignmentOptions()]);
  if (response.success && !response.data) notFound();
  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'Consignments', href: '/dashboard/platform/consignments' },
    { type: 'page' as const, label: response.success && response.data ? response.data.intake.reference : 'Consignment' },
  ];

  if (!response.success || !response.data) {
    return (
      <PageContainer title="Consignment" breadcrumbs={breadcrumbs}>
        <div className="px-4 md:px-6">
          <ListBand><p role="alert" className="px-4 py-3.5 text-sm text-destructive">{response.success ? 'Consignment unavailable' : response.error}</p></ListBand>
        </div>
      </PageContainer>
    );
  }

  const { intake, settlements } = response.data;
  const currencyCode = intake.agreement?.currencyCode || (options.success ? options.data.currencyCode : 'USD');
  const specimens = options.success ? options.data.specimens : [];
  const items: any[] = intake.items || [];
  const agreement = intake.agreement;
  const canAddItems = !['declined', 'returned'].includes(intake.status);

  return (
    <PageContainer title={intake.reference} breadcrumbs={breadcrumbs}>
      <div className="w-full max-w-6xl space-y-8 px-4 pb-28 md:px-6 md:pb-12">
        <PageTitle
          title={intake.reference}
          tone={INTAKE_TONES[intake.status]}
          state={humanize(intake.status)}
          meta={intake.consignor ? `Consignor ${intake.consignor.displayName}` : 'No consignor'}
          actions={<IntakeMoves id={intake.id} status={intake.status} />}
        />

        <ListBand>
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            <Fact label="Opened">{day(intake.createdAt)}</Fact>
            <Fact label="Received">{intake.receivedAt ? day(intake.receivedAt) : '—'}</Fact>
            <Fact label="Items">{items.length}</Fact>
            <Fact label="Agreement">{agreement ? humanize(agreement.status) : 'None'}</Fact>
          </dl>
          {intake.submittedDescription && (
            <p className="whitespace-pre-line px-4 py-3 text-sm text-foreground">{intake.submittedDescription}</p>
          )}
        </ListBand>

        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Items <span className="font-mono text-xs font-normal text-muted-foreground">{items.length}</span></h2>
            {canAddItems && <AddItemButton intakeId={intake.id} currencyCode={currencyCode} specimens={specimens} />}
          </div>
          <ListBand>
            {items.length === 0 && <p className="px-4 py-3.5 text-sm text-muted-foreground">No items</p>}
            {items.map((item) => (
              <div key={item.id} className="space-y-2.5 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {item.specimen ? (
                        <Link href={`/dashboard/specimens/${item.specimen.id}`} className="truncate text-sm font-medium text-foreground hover:underline">
                          {item.specimen.displayName}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-foreground">Unrecorded item</span>
                      )}
                      <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground"><Dot tone={ITEM_TONES[item.status]} />{humanize(item.status)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[item.specimen?.specimenCode, item.inventoryUnit?.sku, item.notes].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <dl className="flex shrink-0 gap-4 text-right font-mono text-xs tabular-nums">
                    <div><dt className="font-sans text-muted-foreground">Reserve</dt><dd>{item.reserveAmountMinor != null ? money(item.reserveAmountMinor, item.currencyCode) : '—'}</dd></div>
                    <div><dt className="font-sans text-muted-foreground">Agreed</dt><dd>{item.agreedPriceMinor != null ? money(item.agreedPriceMinor, item.currencyCode) : '—'}</dd></div>
                  </dl>
                </div>
                <ItemMoves intakeId={intake.id} itemId={item.id} status={item.status} />
              </div>
            ))}
          </ListBand>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Agreement</h2>
              {(!agreement || ['expired', 'terminated'].includes(agreement.status)) && (
                <CreateAgreementButton intakeId={intake.id} currencyCode={currencyCode} label={agreement ? 'New version' : 'Draft agreement'} />
              )}
            </div>
            <ListBand>
              {!agreement ? (
                <p className="px-4 py-3.5 text-sm text-muted-foreground">No agreement</p>
              ) : (
                <div className="space-y-3 px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium text-foreground">Version {agreement.version}</span>
                    <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground"><Dot tone={AGREEMENT_TONES[agreement.status]} />{humanize(agreement.status)}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Commission</dt><dd className="font-mono tabular-nums">{percentFromBasisPoints(agreement.commissionBasisPoints ?? 0)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Fixed fee</dt><dd className="font-mono tabular-nums">{money(agreement.fixedFeeMinor ?? 0, agreement.currencyCode)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Pricing</dt><dd>{agreement.pricingAuthority === 'operator' ? 'Store' : humanize(agreement.pricingAuthority)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Term</dt><dd>{agreement.startsAt ? day(agreement.startsAt) : '—'} – {agreement.endsAt ? day(agreement.endsAt) : '—'}</dd></div>
                    {agreement.acceptedAt && <div><dt className="text-xs text-muted-foreground">Accepted</dt><dd>{day(agreement.acceptedAt)}</dd></div>}
                  </dl>
                  <AgreementMoves intakeId={intake.id} agreementId={agreement.id} status={agreement.status} />
                </div>
              )}
            </ListBand>
          </section>

          <section>
            <SectionTitle meta={settlements.length}>Consignor settlements</SectionTitle>
            <ListBand>
              {settlements.length === 0 && <p className="px-4 py-3.5 text-sm text-muted-foreground">No settlements</p>}
              {settlements.map((s: any) => (
                <div key={s.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono text-sm text-foreground">{s.reference}</span>
                      <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground"><Dot tone={SETTLEMENT_TONES[s.status]} />{humanize(s.status)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Gross {money(s.grossAmountMinor, s.currencyCode)} · Fees {money(s.feeAmountMinor, s.currencyCode)} · Held {money(s.refundHoldbackMinor, s.currencyCode)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">{money(s.payableAmountMinor, s.currencyCode)}</span>
                </div>
              ))}
            </ListBand>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

export default ConsignmentDetailPage;
