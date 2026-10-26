import { CardArt, CONDITIONS, OfferTable, RarityMark, conditionLabel, finishLabel, money, observedDay } from '@/features/storefront/components/cards';
import { offerForCondition } from '@/features/keystone/lib/pokemon/pricing';
import { getActiveBuylist } from '../actions';
import { DeskEmpty, DeskError, DeskFrame, DeskLink, DeskSection } from '../components/frame';

const pct = (bp: number | null | undefined) => (bp == null ? '—' : `${(bp / 100).toFixed(bp % 100 ? 1 : 0)}%`);

/** The buylist desk: terms, then what the shop is buying and at what offer, card by card. */
export async function BuylistPage({ workbench }: { workbench?: React.ReactNode }) {
  const response = await getActiveBuylist();
  if (!response.success) return <DeskFrame title="Buylist"><DeskError message={response.error} /></DeskFrame>;
  const buylist = response.data.buylists.find((b: any) => b.status === 'active') ?? response.data.buylists[0];

  return (
    <DeskFrame
      title="Buylist"
      meta={buylist ? `${buylist.name} · ${buylist.status === 'active' ? 'Open' : 'Closed'} · ${buylist.entries.length} cards` : 'No buylist'}
      actions={<><DeskLink href="/dashboard/platform/trade-ins">Trade-ins</DeskLink>{buylist ? <DeskLink href={`/dashboard/buylists/${buylist.id}`}>Edit terms</DeskLink> : null}<DeskLink href="/dashboard/buylist-entries/create">Add a card</DeskLink></>}
    >
      {!buylist ? (
        <DeskEmpty>No buylist yet. Create one under Edit terms to publish what the shop buys.</DeskEmpty>
      ) : (
        <>
          <DeskSection title="Terms">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted-foreground">Cash</dt><dd className="text-lg font-semibold tabular-nums text-foreground">{pct(buylist.cashPercentBasisPoints)} of market</dd></div>
              <div><dt className="text-xs text-muted-foreground">Store credit</dt><dd className="text-lg font-semibold tabular-nums text-foreground">{pct(buylist.creditPercentBasisPoints)} of market</dd></div>
              <div><dt className="text-xs text-muted-foreground">Minimum offer</dt><dd className="text-lg font-semibold tabular-nums text-foreground">{money(buylist.minimumOfferMinor, buylist.currencyCode)}</dd></div>
              <div>
                <dt className="text-xs text-muted-foreground">Played copies</dt>
                <dd className="tabular-nums text-foreground">
                  {CONDITIONS.filter((c) => c !== 'NM').map((c) => `${c} ${pct((buylist.conditionBasisPoints ?? {})[c])}`).join(' · ')}
                </dd>
              </div>
            </dl>
            {buylist.publicNotes ? <p className="max-w-[70ch] text-sm text-muted-foreground">{buylist.publicNotes}</p> : null}
          </DeskSection>

          <DeskSection title="Cards we buy" meta={`${buylist.entries.filter((e: any) => e.hotlist).length} on the hotlist`}>
            {buylist.entries.length === 0 ? (
              <DeskEmpty>No cards on the buylist.</DeskEmpty>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {buylist.entries.map((entry: any) => {
                  const card = entry.catalogItem;
                  const reading = (card?.marketPrices ?? []).find((m: any) => !m.grade && (!entry.cardFinish || m.finish === entry.cardFinish));
                  const offers = Object.fromEntries(CONDITIONS.map((c) => [c, {
                    cashMinor: offerForCondition(entry.offerAmountMinor, buylist, c, entry.minimumCondition),
                    creditMinor: offerForCondition(entry.creditOfferMinor ?? entry.offerAmountMinor, buylist, c, entry.minimumCondition),
                  }]).filter(([, o]) => (o as any).cashMinor > 0));
                  const remaining = entry.maximumQuantity == null ? null : Math.max(0, entry.maximumQuantity - entry.quantityBought);
                  return (
                    <li key={entry.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[72px_minmax(0,1fr)_minmax(220px,280px)]">
                      <CardArt src={card?.imageUrl} alt={`${card?.title ?? 'Card'} art`} />
                      <div className="grid content-start gap-1 text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <a href={`/dashboard/buylist-entries/${entry.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{card?.title ?? 'Unlinked entry'}</a>
                          <RarityMark rarity={card?.rarity} />
                          {entry.hotlist ? <span className="border border-foreground px-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">Hotlist</span> : null}
                          {entry.active !== 'active' ? <span className="text-xs text-muted-foreground">Paused</span> : null}
                        </div>
                        <span className="tabular-nums text-muted-foreground">
                          {[card?.collectibleSet?.name, card?.cardNumber, finishLabel(entry.cardFinish), entry.minimumCondition ? `${conditionLabel(entry.minimumCondition)} or better` : null].filter(Boolean).join(' · ')}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {reading ? `Market ${money(reading.marketMinor)} (${observedDay(reading.observedAt)})` : 'No market reading'}
                          {' · '}
                          {entry.pricingMode === 'market' ? 'Follows market' : 'Fixed offer'}
                          {' · '}
                          {remaining == null ? `${entry.quantityBought} bought` : `${entry.quantityBought} bought, ${remaining} still wanted`}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <OfferTable offers={offers as any} currencyCode={buylist.currencyCode} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DeskSection>
        </>
      )}
      {workbench ? <DeskSection title="Buylist and trade-in queues">{workbench}</DeskSection> : null}
    </DeskFrame>
  );
}

export default BuylistPage;
