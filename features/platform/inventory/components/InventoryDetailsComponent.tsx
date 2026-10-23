'use client';

import Link from 'next/link';
import { Dot, type DotTone } from '@/features/platform/components/vault-ui';

export type InventoryVariant = {
  id: string;
  sku?: string | null;
  inventoryQuantity?: number | null;
  manageInventory?: boolean | null;
  allowBackorder?: boolean | null;
  updatedAt?: string | null;
  location?: { id: string; name?: string | null } | null;
  product?: { id: string; title?: string | null } | null;
};

function stockState(inventory: InventoryVariant): { label: string; tone: DotTone } {
  if (inventory.manageInventory === false) return { label: 'Not tracked', tone: 'muted' };
  const qty = inventory.inventoryQuantity ?? 0;
  if (qty > 0) return { label: 'In stock', tone: 'ok' };
  return inventory.allowBackorder ? { label: 'Backorder', tone: 'info' } : { label: 'Out of stock', tone: 'warn' };
}

export function InventoryDetailsComponent({ inventory }: { inventory: InventoryVariant }) {
  const managed = inventory.manageInventory !== false;
  const state = stockState(inventory);
  const title = inventory.product?.title || 'Untitled product';
  return (
    <article className="flex min-h-14 items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {inventory.product?.id ? (
            <Link
              className="truncate text-sm font-medium text-foreground hover:underline"
              href={`/dashboard/platform/products/${encodeURIComponent(inventory.product.id)}`}
            >
              {title}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium text-muted-foreground">Product unavailable</span>
          )}
          <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
            <Dot tone={state.tone} />
            {state.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{inventory.sku || 'No SKU'}</span>
          {' · '}{inventory.location?.name || 'Default location'}
          {inventory.allowBackorder ? ' · Backorders allowed' : ''}
          {inventory.updatedAt ? ` · Updated ${new Date(inventory.updatedAt).toLocaleDateString()}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="block font-mono text-base font-medium tabular-nums text-foreground">
          {managed ? inventory.inventoryQuantity ?? 0 : '—'}
        </span>
        <span className="text-[11px] text-muted-foreground">On hand</span>
      </div>
    </article>
  );
}
