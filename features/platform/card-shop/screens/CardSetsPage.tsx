import { SetSummary } from '@/features/storefront/components/cards';
import { getCardSets, getSetStrips } from '../actions';
import { DeskEmpty, DeskError, DeskFrame, DeskLink } from '../components/frame';

export async function CardSetsPage() {
  const [sets, strips] = await Promise.all([getCardSets(), getSetStrips()]);
  if (!sets.success) {
    return <DeskFrame title="Cards & sets"><DeskError message={sets.error} /></DeskFrame>;
  }
  const list = sets.data.sets as any[];
  const stripBySet = strips.success ? strips.data : {};
  const stocked = list.reduce((sum, set) => sum + (set.cardsStocked ?? 0), 0);

  return (
    <DeskFrame
      title="Cards & sets"
      meta={`${list.length} sets · ${stocked} cards in stock`}
      actions={<><DeskLink href="/dashboard/platform/pricing">Market & repricing</DeskLink><DeskLink href="/dashboard/card-sets">Edit sets</DeskLink></>}
    >
      {list.length === 0 ? (
        <DeskEmpty>No card sets yet. Onboarding imports the set checklists; sets can also be added under Edit sets.</DeskEmpty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((set) => (
            <li key={set.handle}>
              <SetSummary
                set={set}
                have={set.cardsStocked ?? 0}
                haveLabel="in stock"
                cells={stripBySet[set.handle]}
                href={`/dashboard/platform/cards/${set.handle}`}
                aside={set.sealedStocked ? <span className="text-xs text-muted-foreground">{set.sealedStocked} sealed</span> : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </DeskFrame>
  );
}

export default CardSetsPage;
