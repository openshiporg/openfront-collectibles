'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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

export function InventoryDetailsComponent({ inventory }: { inventory: InventoryVariant }) {
  const managed = inventory.manageInventory !== false;
  return (
    <article className="flex items-start justify-between gap-4 border-b px-4 py-4 md:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{inventory.sku || 'No SKU'}</span>
            <Badge variant="outline">{managed ? 'Tracked' : 'Not tracked'}</Badge>
            {inventory.allowBackorder && <Badge variant="secondary">Backorders allowed</Badge>}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {inventory.product?.id ? (
              <Link className="hover:underline" href={`/dashboard/platform/products/${encodeURIComponent(inventory.product.id)}`}>
                {inventory.product.title || 'Untitled product'}
              </Link>
            ) : 'Product unavailable'}
          </p>
          <p className="text-xs text-muted-foreground">
            {managed ? `On hand: ${inventory.inventoryQuantity ?? 0}` : 'Quantity is not tracked'}
            {' · Location: '}{inventory.location?.name || 'Default'}
            {inventory.updatedAt ? ` · Updated ${new Date(inventory.updatedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
      </div>
    </article>
  );
}
