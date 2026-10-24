'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BandRow, ListBand, PageTitle, Pill, PillLink, SectionTitle, Track } from '../../components/vault-ui';
import { dateTime, day } from '../../collectibles/lib/format';
import { addDisputeEvidence, assignDispute, transitionDispute } from '../actions';
import { DISPUTE_TRANSITIONS, disputeStatus, disputeTypeLabel } from '../lib/lifecycle';
import { ActionError, Field, FormSheet, inputCls, useAction } from '../components/form-kit';

export function DisputeDetailPageClient({ dispute, staff }: { dispute: any; staff: { id: string; name?: string | null; email?: string | null }[] }) {
  const status = disputeStatus(dispute.status);
  const transitions = DISPUTE_TRANSITIONS[dispute.status] || [];
  const { pending, error, run } = useAction();
  const [resolution, setResolution] = useState(dispute.resolution || '');
  const title = dispute.order ? `Order #${dispute.order.displayId} · ${disputeTypeLabel(dispute.type)}` : disputeTypeLabel(dispute.type);

  return (
    <PageContainer
      title={title}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'link', label: 'Disputes', href: '/dashboard/platform/disputes' },
        { type: 'page', label: dispute.order ? `#${dispute.order.displayId}` : 'Case' },
      ]}
      header={
        <PageTitle
          title={title}
          tone={status.tone}
          state={status.label}
          meta={`Opened ${dateTime(dispute.createdAt)}${dispute.openedBy?.name ? ` by ${dispute.openedBy.name}` : ''}`}
        />
      }
    >
      <div className="grid gap-8 px-4 pb-28 md:px-6 md:pb-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Summary</SectionTitle>
            <ListBand>
              <p className="whitespace-pre-wrap px-4 py-3.5 text-sm text-foreground">{dispute.summary}</p>
            </ListBand>
          </section>

          <section className="space-y-3">
            <SectionTitle>Status</SectionTitle>
            {(transitions.some((t) => t.to === 'resolved') || dispute.status === 'resolved' || dispute.status === 'closed') && (
              <Field id="dispute-resolution" label="Resolution">
                <Textarea
                  id="dispute-resolution"
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  maxLength={4000}
                  rows={4}
                  readOnly={dispute.status === 'resolved' || dispute.status === 'closed'}
                />
              </Field>
            )}
            {transitions.length > 0 ? (
              <Track label="Case actions">
                {transitions.map((t) => (
                  <Pill
                    key={t.to}
                    active={t.to === 'resolved' || t.to === 'closed'}
                    disabled={!!pending}
                    onClick={() => run(t.to, () => transitionDispute(dispute.id, t.to, resolution))}
                  >
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
            <SectionTitle meta={dispute.evidence?.length || 0}>Evidence</SectionTitle>
            <ListBand>
              {(dispute.evidence || []).length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No evidence</div>}
              {(dispute.evidence || []).map((file: any) => (
                <BandRow
                  key={file.id}
                  title={<a href={file.url} target="_blank" rel="noreferrer" className="hover:underline">{file.type || file.url}</a>}
                  meta={[file.uploadedBy?.name, dateTime(file.createdAt)].filter(Boolean).join(' · ')}
                />
              ))}
            </ListBand>
            <div className="mt-3">
              <FormSheet
                title="Add evidence"
                description="Attach a file link to this case"
                submitLabel="Add evidence"
                trigger={(open) => (
                  <Track label="Evidence actions">
                    <Pill onClick={open}>Add evidence</Pill>
                  </Track>
                )}
                onSubmit={async (form) => {
                  const result = await addDisputeEvidence(dispute.id, { url: String(form.get('url') || ''), type: String(form.get('type') || '') });
                  if (!result.success) return result.error;
                }}
              >
                <Field id="evidence-url" label="File link">
                  <Input id="evidence-url" name="url" type="url" required maxLength={2000} />
                </Field>
                <Field id="evidence-type" label="Type">
                  <Input id="evidence-type" name="type" maxLength={120} placeholder="Photo, carrier report, message" />
                </Field>
              </FormSheet>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Assignee</SectionTitle>
            <select
              aria-label="Assignee"
              className={inputCls}
              defaultValue={dispute.assignedTo?.id || ''}
              disabled={!!pending}
              onChange={(event) => run('assign', () => assignDispute(dispute.id, event.target.value || null))}
            >
              <option value="">Unassigned</option>
              {staff.map((user) => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}
            </select>
          </section>

          {dispute.order && (
            <section>
              <SectionTitle>Order</SectionTitle>
              <ListBand>
                <BandRow
                  href={`/dashboard/platform/orders/${dispute.order.id}`}
                  title={`#${dispute.order.displayId}`}
                  state={dispute.order.status ? String(dispute.order.status).replaceAll('_', ' ') : undefined}
                  meta={[dispute.order.user?.name || dispute.order.email, day(dispute.order.createdAt)].filter(Boolean).join(' · ')}
                  trailing={dispute.order.total}
                />
                {(dispute.order.lineItems || []).map((line: any) => (
                  <BandRow
                    key={line.id}
                    title={line.title}
                    meta={[line.variantTitle !== line.sku ? line.variantTitle : null, line.sku, `Qty ${line.quantity}`].filter(Boolean).join(' · ')}
                    trailing={line.formattedTotal}
                  />
                ))}
              </ListBand>
              <div className="mt-3">
                <PillLink href={`/dashboard/platform/orders/${dispute.order.id}`}>Open order</PillLink>
              </div>
            </section>
          )}
          {dispute.return && (
            <section>
              <SectionTitle>Return</SectionTitle>
              <ListBand>
                <BandRow href={`/dashboard/returns/${dispute.return.id}`} title="Return" state={dispute.return.status || undefined} />
              </ListBand>
            </section>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
