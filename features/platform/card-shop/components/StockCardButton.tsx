'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { conditionLabel, finishLabel } from '@/features/storefront/components/cards';
import { stockCardAction } from '../actions';

const field = 'h-10 w-full border border-border bg-background px-2 text-sm max-sm:h-11 max-sm:text-base';

/** "Stock" on a checklist row: put raw copies of this card into stock without leaving the set. */
export function StockCardButton({ catalogItemId, name, finishes }: { catalogItemId: string; name: string; finishes: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(stockCardAction, null);
  const options = finishes.length ? finishes : ['normal'];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex min-h-9 items-center text-xs font-medium text-foreground underline underline-offset-4 max-sm:min-h-11" aria-label={`Stock ${name}`}>
          Stock
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <form action={action} className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Stock {name}</p>
          <input type="hidden" name="catalogItemId" value={catalogItemId} />
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Condition
              <select name="condition" defaultValue="NM" className={field}>
                {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c} value={c}>{conditionLabel(c)}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Finish
              <select name="finish" defaultValue={options[0]} className={field}>
                {options.map((f) => <option key={f} value={f}>{finishLabel(f)}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Quantity
              <input name="quantity" type="number" min={1} max={9999} defaultValue={1} required className={field} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Cost each
              <input name="cost" inputMode="decimal" placeholder="0.00" className={`${field} font-mono`} />
            </label>
          </div>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Price (leave blank to follow the market)
            <input name="price" inputMode="decimal" placeholder="Market" className={`${field} font-mono`} />
          </label>
          {state && !state.success ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
          {state?.success ? (
            <p role="status" className="text-sm text-foreground">
              {state.data.quantity} added to <span className="font-mono">{state.data.sku}</span>.{' '}
              <Link href={`/dashboard/platform/products/${state.data.productId}`} className="underline underline-offset-4">Open product</Link>
            </p>
          ) : null}
          <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center justify-center bg-foreground px-4 text-[13px] font-medium text-background disabled:opacity-50 max-sm:min-h-11">
            {pending ? 'Stocking…' : 'Add to stock'}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
