import repeat from "@/features/storefront/lib/util/repeat"
import Item from "@/features/storefront/modules/order/components/item"

// Define inline types based on GraphQL schema and component usage
export type OrderLineItem = {
  id: string;
  quantity: number;
  title: string;
  sku?: string | null;
  thumbnail?: string | null;
  metadata?: Record<string, any>;
  productData?: unknown;
  variantData?: unknown;
  variantTitle?: string | null;
  formattedUnitPrice?: string | null;
  formattedTotal?: string | null;
  productVariant?: any;
  originalLineItem?: any;
  fulfillmentItems?: any[];
  createdAt?: string;
  updatedAt?: string;
};

import { StoreRegion } from "@/features/storefront/types/storefront";

export type ItemsProps = {
  items: OrderLineItem[];
  region: Pick<StoreRegion, 'id' | 'name' | 'currency'>;
};

const Items = ({ items, region }: ItemsProps) => {

  return (
    <ul className="cx-band divide-y divide-cx-line overflow-hidden" data-testid="products-table">
      {items?.length
        ? items
            .sort((a: OrderLineItem, b: OrderLineItem) => {
              return (a.createdAt ?? "") > (b.createdAt ?? "") ? -1 : 1;
            })
            .map((item: OrderLineItem) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  region={region}
                />
              )
            })
        : repeat(3).map((i) => (
            <li key={i} className="flex items-center gap-4 p-4">
              <div className="size-16 animate-pulse rounded-[2px] bg-cx-line/60" />
              <div className="h-4 flex-1 animate-pulse rounded bg-cx-line/60" />
            </li>
          ))}
    </ul>
  )
}

export default Items
