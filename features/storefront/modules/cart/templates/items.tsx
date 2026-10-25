import Item from "@/features/storefront/modules/cart/components/item"

interface ItemsTemplateProps {
  items?: any[];
  region?: any;
}

const ItemsTemplate = ({
  items,
  region
}: ItemsTemplateProps) => {
  return (
    <ul className="cx-band divide-y divide-cx-line overflow-hidden" aria-label="Cart items">
      {items && region
        ? items
            .sort((a, b) => {
              return a.createdAt > b.createdAt ? -1 : 1
            })
            .map((item) => {
              return <Item key={item.id} item={item} region={region} />;
            })
        : Array.from(Array(3).keys()).map((i) => (
            <li key={i} className="flex gap-4 p-4">
              <div className="size-20 animate-pulse rounded-[2px] bg-cx-line/60" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-1/2 animate-pulse rounded bg-cx-line/60" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-cx-line/60" />
              </div>
            </li>
          ))}
    </ul>
  );
}

export default ItemsTemplate
