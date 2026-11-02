import LineItemOptions from "@/features/storefront/modules/common/components/line-item-options"
import Thumbnail from "@/features/storefront/modules/products/components/thumbnail"

import { OrderLineItem } from "@/features/storefront/modules/order/components/items";
import { StoreRegion } from "@/features/storefront/types/storefront";

type ItemProps = {
  item: OrderLineItem;
  region: Pick<StoreRegion, 'id' | 'name' | 'currency'>;
};

const Item = ({ item }: ItemProps) => {
  return (
    <li className="flex items-center gap-4 p-4" data-testid="product-row">
      <div className="w-16 shrink-0">
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-[22px] text-cx-ink">{item.title}</p>
        {item.variantTitle && (
          <div className="cx-num mt-1.5 text-[12px] uppercase tracking-[0.06em] text-cx-ink-3">
            <LineItemOptions variant={item.productVariant} variantTitle={item.variantTitle} />
          </div>
        )}
      </div>
      <div className="cx-num flex shrink-0 flex-col items-end text-[14px]">
        <span className="text-[16px] font-bold text-cx-ink">{item.formattedTotal}</span>
        {item.quantity > 1 ? (
          <span className="mt-1 text-[13px] text-cx-ink-3">
            {item.quantity} × {item.formattedUnitPrice}
          </span>
        ) : null}
      </div>
    </li>
  );
};

export default Item
