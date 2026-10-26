import Link from 'next/link';
import { SlabView, money } from '@/features/storefront/components/cards';
import { getGradedSlabs } from '../actions';
import { DeskEmpty, DeskError, DeskFrame, DeskLink } from '../components/frame';

const UNIT_STATE: Record<string, string> = {
  intake: 'Intake', available: 'Available', reserved: 'Reserved', sold: 'Sold', return_hold: 'Return hold', withdrawn: 'Withdrawn', lost: 'Lost',
};

export async function GradedSlabsPage() {
  const response = await getGradedSlabs();
  if (!response.success) return <DeskFrame title="Graded slabs"><DeskError message={response.error} /></DeskFrame>;
  const slabs = response.data.productVariants;
  const available = slabs.filter((v: any) => (v.collectibleInventoryUnit?.status ?? (v.inventoryQuantity > 0 ? 'available' : 'sold')) === 'available');
  const consigned = slabs.filter((v: any) => v.collectibleInventoryUnit?.ownershipBasis === 'consigned').length;

  return (
    <DeskFrame
      title="Graded slabs"
      meta={`${slabs.length} slabs · ${available.length} available${consigned ? ` · ${consigned} consigned` : ''}`}
      actions={<><DeskLink href="/dashboard/platform/items">Receive a slab</DeskLink><DeskLink href="/dashboard/platform/evidence">Condition & grading</DeskLink></>}
    >
      {slabs.length === 0 ? (
        <DeskEmpty>No graded slabs. Receive one from Items with its grading company, grade and certificate.</DeskEmpty>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {slabs.map((variant: any) => {
            const product = variant.product;
            const catalog = product?.catalogItem;
            const unit = variant.collectibleInventoryUnit;
            const grade = unit?.specimen?.gradeObservations?.[0];
            const sample = Boolean(unit?.specimen?.identifiers?.some((i: any) => i.evidence?.sample));
            const price = variant.prices?.find((p: any) => p.currency?.code?.toLowerCase() === 'usd') ?? variant.prices?.[0];
            const state = unit ? UNIT_STATE[unit.status] ?? unit.status : variant.inventoryQuantity > 0 ? 'Available' : 'Sold';
            return (
              <li key={variant.id} className="grid content-start gap-3">
                {grade ? (
                  <SlabView
                    compact
                    card={{ id: catalog?.id ?? variant.id, name: catalog?.title ?? product?.title ?? variant.title, number: catalog?.cardNumber, setName: catalog?.collectibleSet?.name, imageUrl: catalog?.imageUrl, imageLargeUrl: catalog?.imageLargeUrl }}
                    grade={{ company: grade.gradingCompany?.code ?? '', grade: grade.reportedGrade, label: grade.reportedLabel, certificate: grade.certificateReference, certificateUrl: grade.certificateLookupUrl || null, sample }}
                    year={catalog?.collectibleSet?.releaseDate ? new Date(catalog.collectibleSet.releaseDate).getUTCFullYear() : catalog?.year}
                  />
                ) : (
                  <p className="border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">No grade recorded</p>
                )}
                <div className="grid gap-1 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/dashboard/platform/products/${product?.id}`} className="truncate font-medium text-foreground underline-offset-4 hover:underline">{product?.title}</Link>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{money(price?.amount, price?.currency?.code ?? 'USD')}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {[state, unit?.ownershipBasis === 'consigned' ? 'Consigned' : null, grade?.certificateReference ? `Cert ${grade.certificateReference}${sample ? ' (sample)' : ''}` : null, variant.sku].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DeskFrame>
  );
}

export default GradedSlabsPage;
