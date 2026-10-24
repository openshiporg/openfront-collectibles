import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { BandRow, Dot, ListBand, PageTitle, PillLink, SectionTitle, humanize, type DotTone } from '../../components/vault-ui'
import { money, dateTime, day } from '../../collectibles/lib/format'
import { getEvidenceOptions, getItem } from '../actions'
import { EvidenceActions } from '../components/EvidenceActions'
import { LISTING_TONES, UNIT_TONES, VERIFICATION_TONES, lifecycleTone } from '../lib/constants'

type Entry = { key: string; at?: string | null; kind: string; title: ReactNode; tone?: DotTone; state?: string; meta?: ReactNode; note?: string | null; isPublic?: boolean }

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (!shown.length) return null
  return (
    <ListBand>
      <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
        {shown.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm sm:border-b sm:border-border">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </ListBand>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <ListBand>
      <p className="px-4 py-3.5 text-sm text-muted-foreground">{children}</p>
    </ListBand>
  )
}

export async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [response, options] = await Promise.all([getItem(id), getEvidenceOptions()])
  if (response.success && !response.data) notFound()

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'Items', href: '/dashboard/platform/items' },
    { type: 'page' as const, label: response.success && response.data ? response.data.specimenCode : 'Item' },
  ]

  if (!response.success) {
    return (
      <PageContainer title="Item" breadcrumbs={breadcrumbs}>
        <div className="px-4 md:px-6">
          <ListBand>
            <p role="alert" className="flex items-baseline gap-2 px-4 py-3.5 text-sm text-muted-foreground">
              <Dot tone="danger" /> Item unavailable
            </p>
          </ListBand>
        </div>
      </PageContainer>
    )
  }

  const item = response.data!
  const catalog = item.catalogItem
  const unit = item.inventoryUnits?.[0]
  const product = unit?.commerceVariant?.product

  const evidence: Entry[] = [
    ...(item.conditionObservations || []).map((o: any) => ({
      key: `c-${o.id}`, at: o.observedAt, kind: 'Condition', title: o.label, state: humanize(o.status),
      tone: o.status === 'disputed' ? 'danger' : o.status === 'reviewed' ? 'ok' : 'muted',
      meta: [o.scale, o.score, humanize(o.sourceType), o.observer?.name].filter(Boolean).join(' · '), note: o.notes, isPublic: o.publiclyVisible,
    })),
    ...(item.gradeObservations || []).map((o: any) => ({
      key: `g-${o.id}`, at: o.observedAt, kind: 'Grade',
      title: <span className="font-mono tabular-nums">{[o.gradingCompany?.code, o.reportedGrade].filter(Boolean).join(' ')}</span>,
      state: humanize(o.verificationState), tone: VERIFICATION_TONES[o.verificationState] ?? 'muted',
      meta: [o.reportedLabel, o.certificateReference && `Cert ${o.certificateReference}`, o.gradingCompany?.name].filter(Boolean).join(' · '),
      note: o.disclaimer, isPublic: o.publiclyVisible,
    })),
    ...(item.provenanceEvents || []).map((o: any) => ({
      key: `p-${o.id}`, at: o.occurredAt || o.recordedAt, kind: 'Provenance', title: humanize(o.eventType), state: humanize(o.reviewState),
      tone: o.reviewState === 'reviewed' ? 'ok' : o.reviewState === 'disputed' || o.reviewState === 'rejected' ? 'danger' : 'muted',
      meta: [o.source, `Confidence ${humanize(o.confidence).toLowerCase()}`].filter(Boolean).join(' · '), note: o.summary, isPublic: o.publiclyVisible,
    })),
    ...(item.custodyEvents || []).map((o: any) => ({
      key: `k-${o.id}`, at: o.occurredAt, kind: 'Custody', title: humanize(o.type),
      meta: [o.fromLocation?.code && `From ${o.fromLocation.code}`, o.toLocation?.code && `To ${o.toLocation.code}`, o.actor?.name].filter(Boolean).join(' · '),
      isPublic: false,
    })),
    ...(item.valuationObservations || []).map((o: any) => ({
      key: `v-${o.id}`, at: o.observedAt, kind: 'Valuation',
      title: <span className="font-mono tabular-nums">{money(o.amountMinor, o.currencyCode)}</span>,
      state: `Confidence ${humanize(o.confidence).toLowerCase()}`,
      meta: [o.sourceName, humanize(o.sourceType), o.sourceReference].filter(Boolean).join(' · '), note: o.disclaimer, isPublic: o.publiclyVisible,
    })),
  ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())

  const header = (
    <PageTitle
      title={item.displayName}
      tone={lifecycleTone(item.lifecycleStatus)}
      state={humanize(item.lifecycleStatus)}
      meta={
        <span className="flex flex-wrap gap-x-2">
          <span className="font-mono tabular-nums text-foreground/80">{item.specimenCode}</span>
          {[catalog?.category?.name, catalog?.maker, catalog?.year].filter(Boolean).join(' · ')}
        </span>
      }
      actions={
        <>
          {product && <PillLink href={`/dashboard/platform/products/${product.id}`}>Product</PillLink>}
          <PillLink href={`/dashboard/specimens/${item.id}`}>Edit fields</PillLink>
        </>
      }
    />
  )

  return (
    <PageContainer title={item.displayName} header={header} breadcrumbs={breadcrumbs}>
      <div className="grid w-full max-w-6xl gap-8 px-4 pb-28 md:px-6 md:pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle meta={evidence.length}>Record</SectionTitle>
            <div className="mb-3">
              <EvidenceActions
                specimenId={item.id}
                storeId={item.store?.id}
                defaultCurrency={unit?.currencyCode}
                gradingCompanies={options.gradingCompanies}
                locations={options.inventoryLocations}
              />
            </div>
            {evidence.length === 0 ? (
              <Empty>No condition, grading, provenance, custody or valuation records</Empty>
            ) : (
              <ListBand>
                {evidence.map((entry) => (
                  <div key={entry.key} className="space-y-1 px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{entry.kind}</span>
                      <span className="text-sm font-medium text-foreground">{entry.title}</span>
                      {entry.state && (
                        <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                          {entry.tone && <Dot tone={entry.tone} />}
                          {entry.state}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">{entry.at ? day(entry.at) : '—'}</span>
                    </div>
                    {entry.meta && <p className="text-xs text-muted-foreground">{entry.meta}</p>}
                    {entry.note && <p className="max-w-[70ch] text-xs leading-5 text-muted-foreground">{entry.note}</p>}
                    <p className="text-[11px] text-muted-foreground">{entry.isPublic ? 'Public' : 'Internal'}</p>
                  </div>
                ))}
              </ListBand>
            )}
          </section>

          <section>
            <SectionTitle meta={(item.listings || []).length}>Listings</SectionTitle>
            {(item.listings || []).length === 0 ? (
              <Empty>Not listed</Empty>
            ) : (
              <ListBand>
                {item.listings.map((listing: any) => (
                  <BandRow
                    key={listing.id}
                    href={`/dashboard/listings/${listing.id}`}
                    title={listing.title}
                    tone={LISTING_TONES[listing.status] ?? 'muted'}
                    state={humanize(listing.status)}
                    meta={[humanize(listing.format), listing.publishedAt && `Published ${day(listing.publishedAt)}`].filter(Boolean).join(' · ')}
                    trailing={listing.priceMinor != null ? money(listing.priceMinor, listing.currencyCode) : 'Unpriced'}
                  />
                ))}
              </ListBand>
            )}
            <div className="mt-2">
              <PillLink href="/dashboard/platform/collectible-commerce">Manage listings</PillLink>
            </div>
          </section>

          <section>
            <SectionTitle meta={unit?.movements?.length ?? 0}>Movements</SectionTitle>
            {!unit?.movements?.length ? (
              <Empty>No movements</Empty>
            ) : (
              <ListBand>
                {unit.movements.map((movement: any) => (
                  <BandRow
                    key={movement.id}
                    title={humanize(movement.type)}
                    meta={[movement.reason, [movement.fromStatus, movement.toStatus].filter(Boolean).map(humanize).join(' → '), movement.actor?.name].filter(Boolean).join(' · ')}
                    trailing={dateTime(movement.occurredAt)}
                  />
                ))}
              </ListBand>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Catalogue entry</SectionTitle>
            {catalog ? (
              <>
                <Facts
                  rows={[
                    ['Title', catalog.title],
                    ['Catalogue no.', catalog.catalogNumber && <span className="font-mono">{catalog.catalogNumber}</span>],
                    ['Maker', catalog.maker],
                    ['Year', catalog.year && <span className="font-mono">{catalog.year}</span>],
                    ['Category', catalog.category?.name],
                    ['Franchise', catalog.franchise?.name],
                    ['Set', catalog.collectibleSet?.name],
                    ['Release', [catalog.release?.name, catalog.release?.edition].filter(Boolean).join(' · ')],
                    ['Status', humanize(catalog.status)],
                  ]}
                />
                <div className="mt-2">
                  <PillLink href={`/dashboard/catalog-items/${catalog.id}`}>Open catalogue entry</PillLink>
                </div>
              </>
            ) : (
              <Empty>No catalogue entry</Empty>
            )}
          </section>

          <section>
            <SectionTitle>Holding</SectionTitle>
            {unit ? (
              <Facts
                rows={[
                  ['SKU', <span key="sku" className="font-mono">{unit.sku}</span>],
                  ['Status', <span key="st" className="inline-flex items-baseline gap-1.5"><Dot tone={UNIT_TONES[unit.status] ?? 'muted'} />{humanize(unit.status)}</span>],
                  ['Ownership', humanize(unit.ownershipBasis)],
                  ['Location', unit.location ? `${unit.location.code} · ${unit.location.name}` : null],
                  ['Acquired for', unit.acquiredAmountMinor != null ? <span key="acq" className="font-mono">{money(unit.acquiredAmountMinor, unit.currencyCode)}</span> : null],
                  ['Version', <span key="v" className="font-mono">{unit.version}</span>],
                  ['Product', product ? <Link key="p" href={`/dashboard/platform/products/${product.id}`} className="hover:underline">{product.title}</Link> : null],
                ]}
              />
            ) : (
              <Empty>No inventory unit</Empty>
            )}
          </section>

          <section>
            <SectionTitle meta={(item.identifiers || []).length}>Identifiers</SectionTitle>
            {(item.identifiers || []).length === 0 ? (
              <Empty>No identifiers</Empty>
            ) : (
              <ListBand>
                {item.identifiers.map((identifier: any) => (
                  <BandRow
                    key={identifier.id}
                    title={<span className="font-mono">{identifier.value}</span>}
                    meta={[humanize(identifier.type), identifier.issuer].filter(Boolean).join(' · ')}
                    trailing={day(identifier.observedAt)}
                  />
                ))}
              </ListBand>
            )}
          </section>

          <section>
            <SectionTitle meta={(item.media || []).length}>Media</SectionTitle>
            {(item.media || []).length === 0 ? (
              <Empty>No media</Empty>
            ) : (
              <ListBand>
                {item.media.map((media: any) => (
                  <div key={media.id} className="flex items-center gap-3 px-4 py-2.5">
                    {media.kind === 'image' || media.kind === 'scan' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media.url} alt={media.altText || ''} className="size-12 shrink-0 rounded-md bg-muted object-cover" />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground">{humanize(media.kind)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <a href={media.url} target="_blank" rel="noreferrer" className="block truncate text-sm text-foreground hover:underline">
                        {media.altText || media.url}
                      </a>
                      <p className="text-xs text-muted-foreground">{[humanize(media.kind), humanize(media.visibility), media.source].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                ))}
              </ListBand>
            )}
          </section>
        </aside>
      </div>
    </PageContainer>
  )
}

export default ItemPage
