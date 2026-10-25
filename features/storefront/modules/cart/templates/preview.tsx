"use client";
import { cn } from "@/lib/utils";

import Item from "@/features/storefront/modules/cart/components/item";

interface ItemsPreviewTemplateProps {
  items?: any[];
  region?: any;
}

const ItemsPreviewTemplate = ({ items, region }: ItemsPreviewTemplateProps) => {
  const hasOverflow = items && items.length > 4;

  return (
    <ul
      aria-label="Items"
      className={cn("divide-y divide-cx-line", {
        "no-scrollbar max-h-[420px] overflow-y-auto overflow-x-hidden": hasOverflow,
      })}
    >
      {items && region
        ? items
            .sort((a, b) => {
              return a.createdAt > b.createdAt ? -1 : 1;
            })
            .map((item) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  region={region}
                  type="preview"
                />
              );
            })
        : Array.from(Array(3).keys()).map((i) => (
            <li key={i} className="flex gap-3 py-3">
              <div className="size-14 animate-pulse rounded-[2px] bg-cx-line/60" />
              <div className="h-4 flex-1 animate-pulse rounded bg-cx-line/60" />
            </li>
          ))}
    </ul>
  );
};

export default ItemsPreviewTemplate;
