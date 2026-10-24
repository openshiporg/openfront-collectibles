'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageContainer } from '../../../dashboard/components/PageContainer';
import { BandRow, Dot, ListBand, PageTitle, Pill, PillLink, SectionTitle, Track, humanize } from '../../components/vault-ui';
import { dateTime, day, money } from '../../collectibles/lib/format';
import { Field, FormSheet, inputCls } from '../../disputes/components/form-kit';
import { createRequirement, recordShipmentEvidence } from '../actions';
import { EVIDENCE_TYPES } from '../lib/constants';

function CheckRow({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex min-h-10 items-center gap-2">
      <Checkbox id={`req-${name}`} name={name} defaultChecked={defaultChecked} />
      <Label htmlFor={`req-${name}`} className="text-sm">{label}</Label>
    </div>
  );
}

export function OrderFulfillmentPageClient({ order, requirements, evidence }: { order: any; requirements: any[]; evidence: any[] }) {
  const current = requirements[0];
  const currency = String(order.currency?.code || '').toUpperCase();
  const title = `Order #${order.displayId}`;
  const address = order.shippingAddress;

  return (
    <PageContainer
      title={title}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'link', label: 'High-Value Fulfillment', href: '/dashboard/platform/high-value-fulfillment' },
        { type: 'page', label: `#${order.displayId}` },
      ]}
      header={
        <PageTitle
          title={title}
          tone={current ? 'ok' : 'warn'}
          state={current ? 'Requirements set' : 'Needs requirements'}
          meta={[order.user?.name || order.email, order.total, day(order.createdAt)].filter(Boolean).join(' · ')}
          actions={
            <>
              <PillLink href={`/dashboard/platform/orders/${order.id}/fulfill`}>Fulfil order</PillLink>
              <PillLink href={`/dashboard/platform/orders/${order.id}`}>Open order</PillLink>
            </>
          }
        />
      }
    >
      <div className="grid gap-8 px-4 pb-28 md:px-6 md:pb-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle meta={requirements.length}>Requirements</SectionTitle>
            <ListBand>
              {requirements.length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No requirements</div>}
              {requirements.map((req, index) => (
                <div key={req.id} className="space-y-1 px-4 py-3">
                  <BandRowLike
                    title={req.orderLineItem?.title ? `Line: ${req.orderLineItem.title}` : 'Whole order'}
                    state={index === 0 ? 'Current' : 'Superseded'}
                    tone={index === 0 ? 'ok' : 'muted'}
                    trailing={req.declaredValueMinor != null ? money(req.declaredValueMinor, req.currencyCode) : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    {[req.signatureRequired ? 'Signature required' : 'No signature', req.insuranceRequested ? `Insured${req.insuranceProviderReference ? ` · ${req.insuranceProviderReference}` : ''}` : 'Not insured', `Set ${dateTime(req.createdAt)}`].join(' · ')}
                  </p>
                  {req.packagingInstructions && <p className="whitespace-pre-wrap text-xs text-foreground">{req.packagingInstructions}</p>}
                </div>
              ))}
            </ListBand>
            <div className="mt-3">
              <FormSheet
                title={current ? 'Replace requirements' : 'Set requirements'}
                description="Declared value, signature, insurance and packaging for this order"
                submitLabel="Save requirements"
                trigger={(open) => (
                  <Track label="Requirement actions">
                    <Pill active={!current} onClick={open}>{current ? 'Replace requirements' : 'Set requirements'}</Pill>
                  </Track>
                )}
                onSubmit={async (form) => {
                  const result = await createRequirement(order.id, {
                    declaredValue: String(form.get('declaredValue') || ''),
                    signatureRequired: form.get('signatureRequired') === 'on',
                    insuranceRequested: form.get('insuranceRequested') === 'on',
                    insuranceProviderReference: String(form.get('insuranceProviderReference') || ''),
                    packagingInstructions: String(form.get('packagingInstructions') || ''),
                    orderLineItemId: String(form.get('orderLineItemId') || ''),
                  });
                  if (!result.success) return result.error;
                }}
              >
                <Field id="req-value" label={`Declared value (${currency || 'order currency'})`}>
                  <Input
                    id="req-value"
                    name="declaredValue"
                    required
                    inputMode="decimal"
                    className="font-mono"
                    defaultValue={current?.declaredValueMinor != null ? money(current.declaredValueMinor, current.currencyCode).replace(/^[A-Z]{3} /, '').replaceAll(',', '') : ''}
                  />
                </Field>
                <Field id="req-line" label="Applies to">
                  <select id="req-line" name="orderLineItemId" className={inputCls} defaultValue={current?.orderLineItem?.id || ''}>
                    <option value="">Whole order</option>
                    {(order.lineItems || []).map((line: any) => <option key={line.id} value={line.id}>{line.title}</option>)}
                  </select>
                </Field>
                <CheckRow name="signatureRequired" label="Signature required" defaultChecked={current?.signatureRequired ?? true} />
                <CheckRow name="insuranceRequested" label="Insurance requested" defaultChecked={current?.insuranceRequested} />
                <Field id="req-insurance" label="Insurance provider reference">
                  <Input id="req-insurance" name="insuranceProviderReference" maxLength={200} defaultValue={current?.insuranceProviderReference || ''} />
                </Field>
                <Field id="req-packaging" label="Packaging instructions">
                  <Textarea id="req-packaging" name="packagingInstructions" maxLength={4000} rows={4} defaultValue={current?.packagingInstructions || ''} />
                </Field>
              </FormSheet>
            </div>
          </section>

          <section>
            <SectionTitle meta={evidence.length}>Shipment evidence</SectionTitle>
            <ListBand>
              {evidence.length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No evidence</div>}
              {evidence.map((item) => (
                <BandRow
                  key={item.id}
                  title={`${humanize(item.type)} · ${item.provider}`}
                  state={item.status || undefined}
                  tone={item.type === 'exception' ? 'danger' : item.type === 'delivery' || item.type === 'signature' ? 'ok' : 'info'}
                  meta={[item.providerReference, item.publicSummary, dateTime(item.observedAt)].filter(Boolean).join(' · ')}
                />
              ))}
            </ListBand>
            {current && (
              <div className="mt-3">
                <FormSheet
                  title="Record evidence"
                  description="Record carrier, insurer or packaging evidence for this order"
                  submitLabel="Record evidence"
                  trigger={(open) => (
                    <Track label="Evidence actions">
                      <Pill onClick={open}>Record evidence</Pill>
                    </Track>
                  )}
                  onSubmit={async (form) => {
                    const result = await recordShipmentEvidence(order.id, {
                      requirementId: current.id,
                      type: String(form.get('type') || ''),
                      provider: String(form.get('provider') || ''),
                      providerReference: String(form.get('providerReference') || ''),
                      status: String(form.get('status') || ''),
                      publicSummary: String(form.get('publicSummary') || ''),
                      fulfillmentId: String(form.get('fulfillmentId') || ''),
                    });
                    if (!result.success) return result.error;
                  }}
                >
                  <Field id="ev-type" label="Type">
                    <select id="ev-type" name="type" className={inputCls} defaultValue="tracking">
                      {EVIDENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field id="ev-provider" label="Provider">
                    <Input id="ev-provider" name="provider" required maxLength={120} />
                  </Field>
                  <Field id="ev-ref" label="Provider reference">
                    <Input id="ev-ref" name="providerReference" maxLength={200} className="font-mono" />
                  </Field>
                  <Field id="ev-status" label="Status">
                    <Input id="ev-status" name="status" maxLength={120} />
                  </Field>
                  <Field id="ev-summary" label="Public summary">
                    <Input id="ev-summary" name="publicSummary" maxLength={1000} />
                  </Field>
                  <Field id="ev-fulfillment" label="Shipment">
                    <select id="ev-fulfillment" name="fulfillmentId" className={inputCls} defaultValue="">
                      <option value="">None</option>
                      {(order.fulfillments || []).map((f: any) => (
                        <option key={f.id} value={f.id}>
                          {f.shippingLabels?.[0]?.trackingNumber || `Shipment ${day(f.createdAt)}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormSheet>
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section>
            <SectionTitle meta={order.lineItems?.length || 0}>Items</SectionTitle>
            <ListBand>
              {(order.lineItems || []).map((line: any) => (
                <BandRow
                  key={line.id}
                  title={line.title}
                  meta={[line.variantTitle !== line.sku ? line.variantTitle : null, line.sku, `Qty ${line.quantity}`].filter(Boolean).join(' · ')}
                  trailing={line.formattedTotal}
                />
              ))}
            </ListBand>
          </section>
          {address && (
            <section>
              <SectionTitle>Ship to</SectionTitle>
              <ListBand>
                <p className="px-4 py-3 text-sm leading-6 text-foreground">
                  {[address.firstName, address.lastName].filter(Boolean).join(' ')}<br />
                  {address.address1}{address.address2 ? `, ${address.address2}` : ''}<br />
                  {[address.city, address.province, address.postalCode].filter(Boolean).join(' ')}<br />
                  {address.country?.name}
                </p>
              </ListBand>
            </section>
          )}
          <section>
            <SectionTitle meta={order.fulfillments?.length || 0}>Shipments</SectionTitle>
            <ListBand>
              {(order.fulfillments || []).length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">Not shipped</div>}
              {(order.fulfillments || []).map((f: any) => (
                <BandRow
                  key={f.id}
                  title={f.shippingLabels?.[0]?.trackingNumber || 'Shipment'}
                  tone={f.canceledAt ? 'muted' : f.shippedAt ? 'ok' : 'warn'}
                  state={f.canceledAt ? 'Canceled' : f.shippedAt ? 'Shipped' : 'Packed'}
                  meta={[f.shippingLabels?.[0]?.carrier, day(f.shippedAt || f.createdAt)].filter(Boolean).join(' · ')}
                />
              ))}
            </ListBand>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}

function BandRowLike({ title, state, tone, trailing }: { title: string; state: string; tone: 'ok' | 'muted'; trailing?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
          <Dot tone={tone} />
          {state}
        </span>
      </div>
      {trailing && <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">{trailing}</span>}
    </div>
  );
}
