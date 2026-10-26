import { PageContainer } from '@/features/dashboard/components/PageContainer';
import { PageTitle, PillLink } from '@/features/platform/components/vault-ui';
import { ManagedListings } from '../components/ManagedListings';
import { DeskQueue } from '../components/DeskQueue';
import { loadQueue } from '../lib/desk-data';
import { DESKS, type DeskKind } from '../lib/desks';

async function WorkbenchPage({ kind }: { kind: DeskKind }) {
  const desk = DESKS[kind];
  const queues = await Promise.all(desk.queues.map(loadQueue));

  let state: string | undefined;
  let tone = desk.attention?.tone;
  if (desk.attention) {
    const queue = queues.find((q) => q.key === desk.attention!.queue);
    if (queue?.ok) {
      const count = queue.counts
        .filter((status) => desk.attention!.statuses.includes(status.value))
        .reduce((sum, status) => sum + status.count, 0);
      state = count > 0 ? `${count} ${desk.attention.label}` : desk.attention.clear;
      if (count === 0) tone = 'muted';
    }
  }

  const [lead, ...rest] = queues;

  return (
    <PageContainer
      title={desk.title}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: desk.title },
      ]}
    >
      <div className="w-full max-w-6xl space-y-8 px-4 pb-28 md:px-6 md:pb-12">
        <PageTitle
          title={desk.title}
          state={state}
          tone={tone}
          actions={desk.links?.map((link) => (
            <PillLink key={link.href} href={link.href}>{link.label}</PillLink>
          ))}
        />
        {lead && <DeskQueue queue={lead} />}
        {kind === 'commerce' && <ManagedListings />}
        {rest.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-2">
            {rest.map((queue) => (
              <DeskQueue key={queue.key} queue={queue} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export const CatalogWorkbenchPage = () => <WorkbenchPage kind="catalog" />;
export const InventoryWorkbenchPage = () => <WorkbenchPage kind="inventory" />;
export const CommerceWorkbenchPage = () => <WorkbenchPage kind="commerce" />;
export const AuctionsWorkbenchPage = () => <WorkbenchPage kind="auctions" />;
export const ConsignmentWorkbenchPage = () => <WorkbenchPage kind="consignment" />;
export const BuylistWorkbenchPage = () => <WorkbenchPage kind="buylist" />;
export const EvidenceWorkbenchPage = () => <WorkbenchPage kind="evidence" />;
export const FulfillmentWorkbenchPage = () => <WorkbenchPage kind="fulfillment" />;
export const CollectorsWorkbenchPage = () => <WorkbenchPage kind="customers" />;

/** A desk's queues without the page frame, for embedding under another desk. */
export async function DeskQueues({ kind }: { kind: DeskKind }) {
  const queues = await Promise.all(DESKS[kind].queues.map(loadQueue));
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {queues.map((queue) => (
        <DeskQueue key={queue.key} queue={queue} />
      ))}
    </div>
  );
}
