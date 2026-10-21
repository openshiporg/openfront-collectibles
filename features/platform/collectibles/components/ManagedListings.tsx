'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMajorToMinor, currencyExponent } from '@/features/lib/minor-units';
import { getManagedListingData, runManagedListingCommand, type ManagedListingData } from '../actions/listings';
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
  return <section className="space-y-5 rounded-xl border p-4" aria-label="Listing management">
    <h2 className="text-xl font-semibold">Listing management</h2>
    {error && <p role="alert" className="text-destructive">{error}</p>}{message && <p role="status">{message}</p>}
    {!data ? <p>Loading listings</p> : <>
      <div className="space-y-3">{data.listings.length === 0 && <p className="text-sm text-muted-foreground">No listings yet</p>}{data.listings.map(row => <article key={row.id} className="rounded-lg border p-3">
        <h3 className="flex flex-wrap items-center gap-2 font-medium">{row.title}<span className="inline-flex items-center gap-1 text-xs font-normal"><span className="size-2 rounded-full bg-current" aria-hidden="true" />{statusLabel(row.status)}</span></h3>
        <p className="my-2 text-sm text-muted-foreground">{row.inventoryUnit?.sku} · {row.currencyCode} {row.priceMinor === null ? 'Unpriced' : (row.priceMinor / 10 ** currencyExponent(row.currencyCode)).toFixed(currencyExponent(row.currencyCode))}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending || row.status !== 'draft' || row.format !== 'fixed_price'} onClick={() => setEditing(row.id)}>Edit draft</Button>
          <Button variant="outline" disabled={pending || !row.inventoryUnit || !['draft','withdrawn'].includes(row.status) || row.format !== 'fixed_price'} onClick={() => submit('publish', { listingId: row.id, expectedVersion: row.inventoryUnit!.version })}>Publish</Button>
          <Button variant="outline" disabled={pending || !row.inventoryUnit || !['draft','published','paused','scheduled'].includes(row.status) || row.format !== 'fixed_price'} onClick={() => submit('withdraw', { listingId: row.id, expectedVersion: row.inventoryUnit!.version })}>Withdraw</Button>
        </div>
      </article>)}</div>
      <form key={editing ?? key} action={save} className="grid gap-3 border-t pt-4">
        <h3 className="font-semibold">{selected ? 'Edit draft' : 'Create draft listing'}</h3>
        {!selected && <><Label htmlFor="listing-unit">Available stock</Label><select id="listing-unit" name="unitId" onChange={event => setUnitChoice(event.target.value)} required className="min-h-11 rounded-md border bg-background px-3"><option value="">Select unit</option>{freeUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.sku}</option>)}</select></>}
        <Label htmlFor="listing-title">Title</Label><Input id="listing-title" name="title" required maxLength={300} defaultValue={selected?.title} />
        {!selected && <><Label htmlFor="listing-slug">Slug</Label><Input id="listing-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} /></>}
        <Label htmlFor="listing-condition">Reported condition</Label><Input id="listing-condition" name="condition" required maxLength={2000} defaultValue={selected?.publicSummary} />
        <Label htmlFor="listing-price">Price ({selected?.currencyCode ?? freeUnits.find(unit => unit.id === unitChoice)?.currencyCode ?? 'Select stock'})</Label><Input id="listing-price" name="price" required inputMode="decimal" defaultValue={selected?.priceMinor == null ? '' : String(selected.priceMinor / 10 ** currencyExponent(selected.currencyCode))} />
        <div className="flex gap-2"><Button disabled={pending || (!selected && !freeUnits.length)} type="submit">{pending ? 'Saving' : selected ? 'Save draft' : 'Create draft'}</Button>{selected && <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel edit</Button>}</div>
      </form>
    </>}
  </section>;
}
