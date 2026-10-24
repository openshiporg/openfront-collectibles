'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { BandRow, ListBand, PageTitle, Pill, SectionTitle, Track, humanize } from '../../components/vault-ui';
import { day, money } from '../../collectibles/lib/format';
import { ActionError, inputCls, useAction } from '../../disputes/components/form-kit';
import { moveSeller, setSellerBio, setSellerIdentityState } from '../actions';
import { IDENTITY_STATES, SELLER_TRANSITIONS, identityState, sellerStatus } from '../lib/lifecycle';

export function SellerDetailPageClient({ seller }: { seller: any }) {
  const status = sellerStatus(seller.status);
  const transitions = SELLER_TRANSITIONS[seller.status] || [];
  const { pending, error, run } = useAction();
  const [bio, setBio] = useState(seller.publicBio || '');

  return (
    <PageContainer
      title={seller.displayName}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'link', label: 'Sellers', href: '/dashboard/platform/sellers' },
        { type: 'page', label: seller.displayName },
      ]}
      header={
        <PageTitle
          title={seller.displayName}
          tone={status.tone}
          state={status.label}
          meta={[seller.user?.email || 'No linked account', `Since ${day(seller.createdAt)}`].join(' · ')}
        />
      }
    >
      <div className="grid gap-8 px-4 pb-28 md:px-6 md:pb-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-3">
            <SectionTitle>Status</SectionTitle>
            {transitions.length ? (
              <Track label="Seller actions">
                {transitions.map((t) => (
                  <Pill key={t.to} active={t.to === 'active'} disabled={!!pending} onClick={() => run(t.to, () => moveSeller(seller.id, t.to))}>
                    {pending === t.to ? 'Saving' : t.label}
                  </Pill>
                ))}
              </Track>
            ) : (
              <p className="text-sm text-muted-foreground">Closed</p>
            )}
            <ActionError error={error} />
          </section>

          <section>
            <SectionTitle meta={seller.intakes.length}>Consignment intakes</SectionTitle>
            <ListBand>
              {seller.intakes.length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No intakes</div>}
              {seller.intakes.map((intake: any) => (
                <BandRow
                  key={intake.id}
                  href={`/dashboard/platform/consignments/${intake.id}`}
                  title={intake.reference}
                  state={humanize(intake.status)}
                  tone={intake.status === 'declined' || intake.status === 'returned' ? 'muted' : intake.status === 'accepted' ? 'ok' : 'warn'}
                  meta={[`${intake.itemsCount ?? 0} items`, intake.agreement ? `Agreement ${humanize(intake.agreement.status).toLowerCase()}` : 'No agreement', day(intake.receivedAt || intake.createdAt)].join(' · ')}
                  trailing={intake.agreement?.commissionBasisPoints != null ? `${(intake.agreement.commissionBasisPoints / 100).toFixed(2)}%` : undefined}
                />
              ))}
            </ListBand>
          </section>

          <section>
            <SectionTitle meta={seller.settlements.length}>Settlements</SectionTitle>
            <ListBand>
              {seller.settlements.length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No settlements</div>}
              {seller.settlements.map((s: any) => (
                <BandRow
                  key={s.id}
                  href={`/dashboard/consignment-settlements/${s.id}`}
                  title={s.reference}
                  state={humanize(s.status)}
                  tone={s.status === 'paid' ? 'ok' : s.status === 'failed' || s.status === 'reversed' ? 'danger' : 'warn'}
                  meta={`Gross ${money(s.grossAmountMinor, s.currencyCode)} · Fees ${money(s.feeAmountMinor, s.currencyCode)} · ${day(s.createdAt)}`}
                  trailing={money(s.payableAmountMinor, s.currencyCode)}
                />
              ))}
            </ListBand>
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section className="space-y-2">
            <SectionTitle>Identity evidence</SectionTitle>
            <select
              aria-label="Identity evidence state"
              className={inputCls}
              defaultValue={identityState(seller.identityEvidenceState).value}
              disabled={!!pending}
              onChange={(event) => run('identity', () => setSellerIdentityState(seller.id, event.target.value))}
            >
              {IDENTITY_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </section>
          <section className="space-y-2">
            <SectionTitle>Public bio</SectionTitle>
            <Textarea aria-label="Public bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={4000} rows={6} />
            <Track label="Bio actions">
              <Pill disabled={!!pending || bio === (seller.publicBio || '')} onClick={() => run('bio', () => setSellerBio(seller.id, bio))}>
                {pending === 'bio' ? 'Saving' : 'Save bio'}
              </Pill>
            </Track>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}
