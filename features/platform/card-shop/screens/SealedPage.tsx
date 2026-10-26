import Link from 'next/link';
import { SealedTile, money, releaseDay } from '@/features/storefront/components/cards';
import { getSealedStock } from '../actions';
import { DeskEmpty, DeskError, DeskFrame, DeskSection } from '../components/frame';

function priceOf(variant: any) {
  const price = variant.prices?.find((p: any) => p.currency?.code?.toLowerCase() === 'usd') ?? variant.prices?.[0];
  return { amount: price?.amount ?? null, code: price?.currency?.code ?? 'USD' };
}

export async function SealedPage() {
  const response = await getSealedStock();
  if (!response.success) return <DeskFrame title="Sealed & pre-orders"><DeskError message={response.error} /></DeskFrame>;
  const { variants, soldByVariant, soldKnown } = response.data;
  const preorders = variants.filter((v: any) => v.preorder);
  const shelf = variants.filter((v: any) => !v.preorder);

  return (
    <DeskFrame title="Sealed & pre-orders" meta={`${shelf.length} sealed products · ${preorders.length} pre-orders`}>
      {variants.length === 0 ? <DeskEmpty>No sealed product yet.</DeskEmpty> : null}

      {preorders.length ? (
        <DeskSection title="Pre-orders" meta="Allocation is the quantity on the variant; limits apply across a customer&rsquo;s orders">
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="py-2 pr-3 font-medium">Street date</th>
                  <th className="py-2 pr-3 text-right font-medium">Sold</th>
                  <th className="py-2 pr-3 text-right font-medium">Allocation left</th>
                  <th className="py-2 pr-3 text-right font-medium">Limit</th>
                  <th className="py-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {preorders.map((v: any) => {
                  const price = priceOf(v);
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3"><Link href={`/dashboard/platform/products/${v.product?.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{v.product?.title}</Link></td>
                      <td className="py-2 pr-3 text-muted-foreground">{releaseDay(v.preorderReleaseDate) || 'Not set'}</td>
                      <td className="py-2 pr-3 text-right">{soldKnown ? soldByVariant[v.id] ?? 0 : '—'}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-foreground">{v.inventoryQuantity}</td>
                      <td className="py-2 pr-3 text-right">{v.preorderLimitPerCustomer ?? 'None'}</td>
                      <td className="py-2 text-right">{money(price.amount, price.code)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DeskSection>
      ) : null}

      {shelf.length ? (
        <DeskSection title="On the shelf">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {shelf.map((v: any) => {
              const set = v.product?.catalogItem?.collectibleSet;
              const price = priceOf(v);
              return (
                <SealedTile
                  key={v.id}
                  href={`/dashboard/platform/products/${v.product?.id}`}
                  title={v.product?.title ?? v.title}
                  setName={set?.name}
                  setCode={set?.code}
                  logoUrl={set?.logoUrl}
                  format={v.product?.catalogItem?.sealedFormat}
                  price={`${money(price.amount, price.code)} · ${v.inventoryQuantity} on hand${soldKnown && soldByVariant[v.id] ? ` · ${soldByVariant[v.id]} sold` : ''}`}
                  soldOut={v.inventoryQuantity <= 0}
                />
              );
            })}
          </ul>
        </DeskSection>
      ) : null}
    </DeskFrame>
  );
}

export default SealedPage;
