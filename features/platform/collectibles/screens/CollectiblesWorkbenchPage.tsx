import Link from 'next/link';
import { ManagedListings } from '../components/ManagedListings';
import type { LucideIcon } from 'lucide-react';
import { Archive, BadgeDollarSign, Boxes, Gavel, Handshake, PackageCheck, SearchCheck, ShieldAlert, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/features/dashboard/components/PageContainer';

type Workbench = {
  title: string;
  description: string;
  icon: LucideIcon;
  queues: Array<{ title: string; description: string; href: string; label: string }>;
};

const workbenches: Record<string, Workbench> = {
  catalog: {
    title: 'Catalog & Items', icon: Archive,
    description: 'Manage catalog entries and the individual items you hold.',
    queues: [
      { title: 'Categories', description: 'Category hierarchy and item attributes.', href: '/dashboard/collectible-categories', label: 'Open categories' },
      { title: 'Catalog', description: 'Franchises, sets, releases, and reference items.', href: '/dashboard/catalog-items', label: 'Open catalog' },
      { title: 'Items', description: 'Individual items, identifiers, and status.', href: '/dashboard/specimens', label: 'Open items' },
    ],
  },
  inventory: {
    title: 'Inventory & Custody', icon: Boxes,
    description: 'Track where every item is and what is on hold.',
    queues: [
      { title: 'Inventory', description: 'Owned, consigned, and trade-in stock.', href: '/dashboard/inventory-units', label: 'Open inventory' },
      { title: 'Holds', description: 'Items held for carts, offers, auctions, and returns.', href: '/dashboard/reservations', label: 'Review holds' },
      { title: 'Custody history', description: 'Received, moved, shipped, delivered, and returned.', href: '/dashboard/custody-events', label: 'Review custody' },
    ],
  },
  commerce: {
    title: 'Listings & Offers', icon: BadgeDollarSign,
    description: 'Publish fixed-price listings and negotiate offers.',
    queues: [
      { title: 'Listings', description: 'Draft, scheduled, published, sold, and withdrawn.', href: '/dashboard/listings', label: 'Open listings' },
      { title: 'Offers', description: 'Open offers, counters, and expiries.', href: '/dashboard/offers', label: 'Review offers' },
      { title: 'Orders', description: 'Payments, returns, and refunds.', href: '/dashboard/platform/orders', label: 'Process orders' },
    ],
  },
  auctions: {
    title: 'Auctions', icon: Gavel,
    description: 'Run timed auctions with reserves, bid increments, and extensions.',
    queues: [
      { title: 'Live and scheduled', description: 'Timing, reserves, and extensions.', href: '/dashboard/auctions', label: 'Open auctions' },
      { title: 'Bids', description: 'Accepted, outbid, and rejected bids.', href: '/dashboard/bids', label: 'Review bids' },
      { title: 'Results', description: 'Winning bids and orders.', href: '/dashboard/platform/orders', label: 'Open orders' },
    ],
  },
  consignment: {
    title: 'Consignment', icon: Handshake,
    description: 'Take in consigned items, agree terms, sell, and settle payouts.',
    queues: [
      { title: 'Intake', description: 'Submitted, received, inspecting, offered, and returned.', href: '/dashboard/consignment-intakes', label: 'Open intake' },
      { title: 'Agreements', description: 'Terms, commission, and acceptance.', href: '/dashboard/consignment-agreements', label: 'Review agreements' },
      { title: 'Settlements', description: 'Sales, fees, refunds, and payouts.', href: '/dashboard/consignment-settlements', label: 'Review settlements' },
    ],
  },
  buylist: {
    title: 'Buylist & Trade-In', icon: SearchCheck,
    description: 'Publish what you are buying and review trade-in submissions.',
    queues: [
      { title: 'Buylists', description: 'Wanted items, criteria, prices, and quantity limits.', href: '/dashboard/buylists', label: 'Open buylists' },
      { title: 'Submissions', description: 'Cash, store-credit, and trade requests.', href: '/dashboard/trade-in-submissions', label: 'Review submissions' },
      { title: 'Inspection', description: 'Inspected condition and decisions.', href: '/dashboard/trade-in-items', label: 'Inspect items' },
    ],
  },
  evidence: {
    title: 'Condition & Grading', icon: ShieldAlert,
    description: 'Record condition, grading, provenance, valuations, and disputes.',
    queues: [
      { title: 'Condition & grading', description: 'Condition notes, grades, and certificates.', href: '/dashboard/grade-observations', label: 'Review grades' },
      { title: 'Provenance & valuation', description: 'Ownership history and valuations.', href: '/dashboard/provenance-events', label: 'Review provenance' },
      { title: 'Disputes', description: 'Open disputes and decisions.', href: '/dashboard/dispute-cases', label: 'Open cases' },
    ],
  },
  fulfillment: {
    title: 'High-Value Fulfillment', icon: PackageCheck,
    description: 'Manage packaging, declared value, signature delivery, and tracking.',
    queues: [
      { title: 'Order queue', description: 'Paid orders awaiting fulfillment.', href: '/dashboard/platform/orders', label: 'Open orders' },
      { title: 'Requirements', description: 'Signature, declared value, and packaging.', href: '/dashboard/fulfillment-requirements', label: 'Review requirements' },
      { title: 'Shipments', description: 'Labels, scans, delivery, and signature.', href: '/dashboard/shipment-evidences', label: 'Review shipments' },
    ],
  },
  customers: {
    title: 'Collectors & Sellers', icon: Users,
    description: 'Manage buyers, sellers, and consignors.',
    queues: [
      { title: 'Collectors', description: 'Accounts, interests, wishlists, and saved searches.', href: '/dashboard/collector-profiles', label: 'Open collectors' },
      { title: 'Sellers', description: 'Applications, status, and profiles.', href: '/dashboard/seller-profiles', label: 'Open sellers' },
      { title: 'Users', description: 'Customer accounts and permissions.', href: '/dashboard/platform/users', label: 'Open users' },
    ],
  },
};

function WorkbenchPage({ kind }: { kind: keyof typeof workbenches }) {
  const workbench = workbenches[kind];
  const Icon = workbench.icon;
  return (
    <PageContainer
      title={workbench.title}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: workbench.title },
      ]}
    >
      <div className="w-full max-w-6xl space-y-6 px-4 pb-8 md:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted"><Icon className="size-5" aria-hidden="true" /></div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{workbench.title}</h1>
            <p className="text-sm text-muted-foreground">{workbench.description}</p>
          </div>
        </div>
        {kind === 'commerce' && <ManagedListings />}
        <section className="grid gap-0 overflow-hidden rounded-xl border md:grid-cols-3">
          {workbench.queues.map((queue) => (
            <Card key={queue.title} className="rounded-none border-0 border-b shadow-none last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <CardHeader>
                <CardTitle>{queue.title}</CardTitle>
                <CardDescription>{queue.description}</CardDescription>
              </CardHeader>
              <CardContent><Button variant="outline" asChild><Link href={queue.href}>{queue.label}</Link></Button></CardContent>
            </Card>
          ))}
        </section>
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
