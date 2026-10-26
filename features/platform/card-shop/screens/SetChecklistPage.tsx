import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CardSheet,
  CardRow,
  ConditionRun,
  SetSummary,
  finishLabel,
  money,
  type StockCell,
} from '@/features/storefront/components/cards';
import { getSetChecklist } from '../actions';
import { DeskError, DeskFrame, DeskLink, DeskSection } from '../components/frame';

function latestMarket(market: Record<string, { marketMinor: number | null }>) {
  const values = Object.values(market ?? {}).map((m) => m.marketMinor).filter((v): v is number => v != null);
  return values.length ? Math.max(...values) : null;
}

export async function SetChecklistPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const response = await getSetChecklist(handle);
  if (!response.success) return <DeskFrame title="Set checklist"><DeskError message={response.error} /></DeskFrame>;
  if (!response.data) notFound();
  const { set, cards, currencyCode, idByHandle } = response.data as any;
  const singles = (cards as any[]).filter((c) => c.kind === 'single');
  const sealed = (cards as any[]).filter((c) => c.kind === 'sealed');
  const inStock = (card: any) => (card.stock as any[]).some((s) => s.variants.some((v: any) => v.available));
  const cells = singles.map(inStock);

  return (
    <DeskFrame
      title={set.name}
      crumbs={[{ label: 'Cards & sets', href: '/dashboard/platform/cards' }]}
      meta={`${cells.filter(Boolean).length} of ${singles.length} cards in stock`}
      actions={<DeskLink href="/dashboard/platform/pricing">Market & repricing</DeskLink>}
    >
      <SetSummary set={set} have={cells.filter(Boolean).length} cells={cells} size="head" titleAs="p" />

      <DeskSection title="Checklist" meta={`${singles.length} cards`}>
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <CardSheet label={`${set.name} checklist`} priceHead="Our price" actions>
            {singles.map((card: any, index: number) => {
              const variants = (card.stock as any[]).flatMap((s) => s.variants.map((v: any) => ({ ...v, handle: s.handle })));
              const raw = variants.filter((v: any) => v.stockKind === 'raw');
              const graded = variants.filter((v: any) => v.stockKind === 'graded');
              const cellsByCondition: StockCell[] = raw
                .filter((v: any) => v.condition)
                .map((v: any) => ({ condition: v.condition, variantId: v.id, quantity: v.quantity, available: v.available, priceMinor: v.priceMinor }));
              const prices = variants.filter((v: any) => v.available && v.priceMinor != null).map((v: any) => v.priceMinor as number);
              const productHandle = card.stock[0]?.handle as string | undefined;
              const productId = productHandle ? idByHandle[productHandle] : undefined;
              const status = variants.length ? (prices.length ? 'in' : 'out') : 'none';
              const finishes = [...new Set(raw.map((v: any) => v.finish).filter(Boolean))].map((f) => finishLabel(f as string));
              return (
                <CardRow
                  key={card.id}
                  index={index}
                  status={status}
                  card={{ id: card.id, name: card.name, number: card.number, rarity: card.rarity, imageUrl: card.imageUrl, setName: set.name }}
                  href={productId ? `/dashboard/platform/products/${productId}` : undefined}
                  detail={[finishes.join(', '), graded.length ? `${graded.length} graded` : ''].filter(Boolean).join(' · ') || undefined}
                  run={cellsByCondition.length ? <ConditionRun cells={cellsByCondition} currencyCode={currencyCode} label={`${card.name} stock by condition`} /> : null}
                  market={money(latestMarket(card.market), 'USD')}
                  price={prices.length ? money(Math.min(...prices), currencyCode) : null}
                  action={productId ? (
                    <Link href={`/dashboard/platform/products/${productId}`} className="text-xs font-medium text-foreground underline underline-offset-4">Edit</Link>
                  ) : (
                    <span className="text-xs text-muted-foreground" title="Not stocked"><span aria-hidden="true">—</span><span className="sr-only">Not stocked</span></span>
                  )}
                />
              );
            })}
          </CardSheet>
        </div>
      </DeskSection>

      {sealed.length ? (
        <DeskSection title="Sealed" meta={`${sealed.length} products`}>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {sealed.map((item: any) => {
              const variant = item.stock[0]?.variants[0];
              const productId = item.stock[0]?.handle ? idByHandle[item.stock[0].handle] : undefined;
              return (
                <li key={item.id} className="flex min-h-12 items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate font-medium text-foreground">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-4 tabular-nums text-muted-foreground">
                    <span>{variant ? `${variant.quantity ?? 0} on hand` : 'Not stocked'}</span>
                    <span className="text-foreground">{money(variant?.priceMinor, currencyCode)}</span>
                    {productId ? <Link href={`/dashboard/platform/products/${productId}`} className="text-xs font-medium text-foreground underline underline-offset-4">Edit</Link> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </DeskSection>
      ) : null}
    </DeskFrame>
  );
}

export default SetChecklistPage;
