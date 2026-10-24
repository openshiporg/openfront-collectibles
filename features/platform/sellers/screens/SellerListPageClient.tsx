'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Pagination } from '../../../dashboard/components/Pagination';
import { FilterList } from '../../../dashboard/components/FilterList';
import { PlatformFilterBar, platformCreateButtonClass } from '../../components/PlatformFilterBar';
import { PlatformEmptyState } from '../../components/PlatformEmptyState';
import { BandRow, ListBand, PageTitle, StatusFilter } from '../../components/vault-ui';
import { Field, FormSheet } from '../../disputes/components/form-kit';
import { createSeller } from '../actions';
import { identityState, SELLER_STATUSES, sellerStatus } from '../lib/lifecycle';

type Props = {
  list: any;
  items: any[];
  count: number;
  error: string | null;
  counts: { all: number; statuses: Record<string, number> };
  page: number;
  pageSize: number;
  filtered: boolean;
};

export function SellerListPageClient({ list, items, count, error, counts, page, pageSize, filtered }: Props) {
  const router = useRouter();
  const applicants = counts.statuses.applicant || 0;

  return (
    <PageContainer
      title="Sellers"
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        { type: 'page', label: 'Sellers' },
      ]}
      header={<PageTitle title="Sellers" tone={applicants ? 'warn' : 'muted'} state={applicants ? `${applicants} awaiting approval` : 'No applications'} />}
    >
      <div className="px-4 md:px-6">
        <PlatformFilterBar
          list={list}
          customCreateButton={
            <FormSheet
              title="New seller"
              description="Create a seller or consignor profile"
              submitLabel="Create seller"
              trigger={(open) => (
                <Button size="icon" className={platformCreateButtonClass} onClick={open}>
                  <Plus />
                  <span className="hidden lg:inline">New seller</span>
                </Button>
              )}
              onSubmit={async (form) => {
                const result = await createSeller({
                  displayName: String(form.get('displayName') || ''),
                  userEmail: String(form.get('userEmail') || ''),
                  publicBio: String(form.get('publicBio') || ''),
                });
                if (!result.success) return result.error;
                router.push(`/dashboard/platform/sellers/${result.id}`);
              }}
            >
              <Field id="seller-name" label="Display name">
                <Input id="seller-name" name="displayName" required maxLength={200} />
              </Field>
              <Field id="seller-email" label="Account email (optional)">
                <Input id="seller-email" name="userEmail" type="email" maxLength={254} />
              </Field>
              <Field id="seller-bio" label="Public bio">
                <Textarea id="seller-bio" name="publicBio" maxLength={4000} rows={4} />
              </Field>
            </FormSheet>
          }
        />
      </div>
      <StatusFilter allCount={counts.all} statuses={SELLER_STATUSES.map((s) => ({ ...s, count: counts.statuses[s.value] || 0 }))} />
      <div className="px-4 md:px-6">
        <FilterList list={list} />
      </div>
      <div className="space-y-4 px-4 pb-28 md:px-6 md:pb-10">
        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <PlatformEmptyState
            title={filtered ? 'No matching sellers' : 'No sellers'}
            onReset={filtered ? () => router.push('/dashboard/platform/sellers') : undefined}
          />
        ) : (
          <ListBand>
            {items.map((item) => {
              const status = sellerStatus(item.status);
              return (
                <BandRow
                  key={item.id}
                  href={`/dashboard/platform/sellers/${item.id}`}
                  title={item.displayName}
                  tone={status.tone}
                  state={status.label}
                  meta={[item.user?.email || 'No linked account', `Identity: ${identityState(item.identityEvidenceState).label}`].join(' · ')}
                  trailing={item.intakeCount == null ? undefined : `${item.intakeCount} intake${item.intakeCount === 1 ? '' : 's'}`}
                />
              );
            })}
          </ListBand>
        )}
        {count > pageSize && (
          <Pagination currentPage={page} total={count} pageSize={pageSize} list={{ singular: 'seller', plural: 'sellers' }} />
        )}
      </div>
    </PageContainer>
  );
}
