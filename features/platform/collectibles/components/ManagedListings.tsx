'use client';
import { useEffect, useState } from 'react';
import { Dot, ListBand, Pill, Track, type DotTone } from '@/features/platform/components/vault-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMajorToMinor, currencyExponent } from '@/features/lib/minor-units';
import { getManagedListingData, runManagedListingCommand, type ManagedListingData } from '../actions/listings';
import { money } from '../lib/format';
export function ManagedListings() {
  const [data, setData] = useState<ManagedListingData | null>(null);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<string | null>(null), [key, setKey] = useState('');
  const [unitChoice, setUnitChoice] = useState('');
  async function refresh() {
    try { const result = await getManagedListingData(); if (result.success) setData(result.data); else setError(result.error); }
    catch { setError('Listing data unavailable'); }
  }
  const statusLabel = (status: string) => { const text = status.replaceAll('_', ' '); return text.charAt(0).toUpperCase() + text.slice(1); };
  useEffect(() => { void refresh(); setKey(crypto.randomUUID()); }, []);
  const selected = data?.listings.find(row => row.id === editing);
  const freeUnits = data?.inventoryUnits.filter(unit => unit.status === 'available' && !data.listings.some(row => row.inventoryUnit?.id === unit.id && ['draft','scheduled','published','paused'].includes(row.status))) ?? [];
  async function submit(action: 'create' | 'update_draft' | 'publish' | 'withdraw', values: Record<string, unknown>) {
    setPending(true); setError(''); setMessage('');
    try { const result = await runManagedListingCommand({ action, key: crypto.randomUUID(), ...values }); if (!result.success) setError(result.error); else { setMessage(action === 'create' ? 'Draft created' : action === 'update_draft' ? 'Draft updated' : action === 'publish' ? 'Listing published' : 'Listing withdrawn'); setEditing(null); setKey(crypto.randomUUID()); } await refresh(); }
    catch { setError('Listing command unavailable'); }
    finally { setPending(false); }
  }
  async function save(form: FormData) {
    const unit = selected?.inventoryUnit ?? freeUnits.find(unit => unit.id === form.get('unitId'));
    if (!unit) return setError('Available unit required');
    const currency = unit.currencyCode;
    try { const priceMinor = parseMajorToMinor(String(form.get('price')), currency);
      await submit(selected ? 'update_draft' : 'create', { ...(selected ? { listingId: selected.id } : { unitId: unit.id, key, slug: String(form.get('slug')) }), expectedVersion: unit.version, title: String(form.get('title')), publicSummary: String(form.get('condition')), priceMinor });
    } catch { setError('Enter an exact positive price in the stock currency'); }
  }
  // Same money format as the Listings queue above.
  const formatPrice = (row: ManagedListingData['listings'][number]) => row.priceMinor === null ? 'Unpriced' : money(row.priceMinor, row.currencyCode);
  const toneFor = (status: string): DotTone => status === 'published' ? 'ok' : status === 'scheduled' || status === 'paused' ? 'warn' : status === 'sold' ? 'info' : 'muted';
  const selectCls = 'min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
  return <section className="space-y-4" aria-labelledby="listing-editor">
    <div className="flex items-baseline justify-between gap-3">
      <h2 id="listing-editor" className="text-base font-semibold text-foreground">Fixed-price listings</h2>
      {data && <span className="font-mono text-xs tabular-nums text-muted-foreground">{data.listings.filter(row => row.format === 'fixed_price').length}</span>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone="ok" />{message}</p>}
    {!data ? <ListBand><div className="px-4 py-3.5 text-sm text-muted-foreground">Loading listings</div></ListBand> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <ListBand className="self-start">
        {data.listings.filter(row => row.format === 'fixed_price').length === 0 && <div className="px-4 py-3.5 text-sm text-muted-foreground">No listings yet</div>}
        {data.listings.filter(row => row.format === 'fixed_price').map(row => <article key={row.id} className="space-y-2.5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
                <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground"><Dot tone={toneFor(row.status)} />{statusLabel(row.status)}</span>
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.inventoryUnit?.sku ?? 'No stock'}</p>
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">{formatPrice(row)}</span>
          </div>
          {(() => {
            // Only the commands valid for this status are offered.
            const canEdit = row.status === 'draft';
            const canPublish = !!row.inventoryUnit && ['draft', 'withdrawn'].includes(row.status);
            const canWithdraw = !!row.inventoryUnit && ['draft', 'published', 'paused', 'scheduled'].includes(row.status);
            if (!canEdit && !canPublish && !canWithdraw) return null;
            return <Track label={`Actions for ${row.title}`}>
              {canEdit && <Pill active={editing === row.id} disabled={pending} onClick={() => setEditing(row.id)}>Edit draft</Pill>}
              {canPublish && <Pill disabled={pending} onClick={() => submit('publish', { listingId: row.id, expectedVersion: row.inventoryUnit!.version })}>Publish</Pill>}
              {canWithdraw && <Pill disabled={pending} onClick={() => submit('withdraw', { listingId: row.id, expectedVersion: row.inventoryUnit!.version })}>Withdraw</Pill>}
            </Track>;
          })()}
        </article>)}
      </ListBand>
      <form key={editing ?? key} action={save} className="grid content-start gap-3 rounded-xl bg-background p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-border">
        <h3 className="text-sm font-semibold text-foreground">{selected ? 'Edit draft' : 'New draft listing'}</h3>
        {!selected && <div className="grid gap-1.5"><Label htmlFor="listing-unit">Available stock</Label><select id="listing-unit" name="unitId" onChange={event => setUnitChoice(event.target.value)} required className={selectCls}><option value="">Select unit</option>{freeUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.sku}</option>)}</select>{freeUnits.length === 0 && <p className="text-xs text-muted-foreground">{data.inventoryUnits.some(unit => unit.status === 'available') ? 'Every available unit already has an active listing' : 'No available stock'}</p>}</div>}
        <div className="grid gap-1.5"><Label htmlFor="listing-title">Title</Label><Input id="listing-title" name="title" required maxLength={300} defaultValue={selected?.title} /></div>
        {!selected && <div className="grid gap-1.5"><Label htmlFor="listing-slug">Slug</Label><Input id="listing-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} className="font-mono" /></div>}
        <div className="grid gap-1.5"><Label htmlFor="listing-condition">Reported condition</Label><Input id="listing-condition" name="condition" required maxLength={2000} defaultValue={selected?.publicSummary} /></div>
        <div className="grid gap-1.5"><Label htmlFor="listing-price">Price ({selected?.currencyCode ?? freeUnits.find(unit => unit.id === unitChoice)?.currencyCode ?? 'stock currency'})</Label><Input id="listing-price" name="price" required inputMode="decimal" className="font-mono" defaultValue={selected?.priceMinor == null ? '' : String(selected.priceMinor / 10 ** currencyExponent(selected.currencyCode))} /></div>
        <Track label="Form actions" className="justify-self-start">
          <Pill type="submit" active disabled={pending || (!selected && !freeUnits.length)}>{pending ? 'Saving' : selected ? 'Save draft' : 'Create draft'}</Pill>
          {selected && <Pill onClick={() => setEditing(null)}>Cancel</Pill>}
        </Track>
      </form>
    </div>}
  </section>;
}
