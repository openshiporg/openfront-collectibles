import { Plus, Minus } from 'lucide-react';
import { ProductImage } from '../../components/ProductImage';
import type { UnfulfilledItemProps, UnfulfilledItemsProps } from '../types';
import { Dot, ListBand, SectionTitle } from '@/features/platform/components/vault-ui';

const stepButton =
  'inline-flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-xs ring-1 ring-border disabled:opacity-40 max-sm:size-10';

function UnfulfilledItem({
  item,
  quantity,
  onQuantityChange,
}: UnfulfilledItemProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <ProductImage
            src={item.thumbnail}
            alt={item.title}
            width={48}
            height={48}
            className="size-12"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
            <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
              <Dot tone="warn" />
              Unfulfilled
            </span>
          </div>
          {item.variantTitle && (
            <p className="font-mono text-xs tabular-nums text-foreground/80">{item.variantTitle}</p>
          )}
          {item.sku && (
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">SKU {item.sku}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
        <div className="text-right font-mono tabular-nums">
          <div className="text-sm font-medium text-foreground">{item.formattedTotal}</div>
          <div className="text-xs text-muted-foreground">
            {item.quantity} x {item.formattedUnitPrice}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            className={stepButton}
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            disabled={quantity === 0}
          >
            <Minus className="size-3.5" />
          </button>
          <div className="flex min-w-12 items-baseline justify-center gap-1 font-mono text-xs tabular-nums">
            <span className="text-sm text-foreground" aria-label={`Current quantity is ${quantity}`}>
              {quantity}
            </span>
            <span className="text-muted-foreground">/ {item.quantity}</span>
          </div>
          <button
            type="button"
            aria-label="Increase quantity"
            className={stepButton}
            onClick={() =>
              onQuantityChange(Math.min(item.quantity, quantity + 1))
            }
            disabled={quantity === item.quantity}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnfulfilledItems({
  items,
  selectedQuantities,
  setSelectedQuantities,
}: UnfulfilledItemsProps) {
  return (
    <section>
      <SectionTitle meta={items.length}>Unfulfilled items</SectionTitle>
      <ListBand>
        {items.length > 0 ? (
          items.map((item) => (
            <UnfulfilledItem
              key={item.id}
              item={item}
              selected={parseInt(selectedQuantities[item.id] || '0') > 0}
              quantity={parseInt(selectedQuantities[item.id] || '0')}
              onQuantityChange={(quantity) =>
                setSelectedQuantities({
                  ...selectedQuantities,
                  [item.id]: quantity.toString(),
                })
              }
            />
          ))
        ) : (
          <div className="px-4 py-3 text-sm text-muted-foreground">No items to fulfill</div>
        )}
      </ListBand>
    </section>
  );
}
