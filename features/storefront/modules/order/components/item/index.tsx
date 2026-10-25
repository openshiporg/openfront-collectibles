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
        <p className="font-cx-serif text-[17px] leading-[22px] text-cx-ink">{item.title}</p>
        {item.variantTitle && (
          <div className="mt-0.5 text-[13px] text-cx-ink-2">
            <LineItemOptions variant={item.productVariant} variantTitle={item.variantTitle} />
          </div>
        )}
      </div>
      <div className="cx-num flex shrink-0 flex-col items-end text-[14px]">
        <span className="text-[13px] text-cx-ink-3">
          {item.quantity} × {item.formattedUnitPrice}
        </span>
        <span className="text-cx-ink">{item.formattedTotal}</span>
      </div>
    </li>
  );
};

export default Item
