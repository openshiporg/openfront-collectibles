"use client";

import CartItemSelect from "@/features/storefront/modules/cart/components/cart-item-select";
import DeleteButton from "@/features/storefront/modules/common/components/delete-button";
import LineItemOptions from "@/features/storefront/modules/common/components/line-item-options";
import LineItemPrice from "@/features/storefront/modules/common/components/line-item-price";
import LineItemUnitPrice from "@/features/storefront/modules/common/components/line-item-unit-price";
import Thumbnail from "@/features/storefront/modules/products/components/thumbnail";
import { updateLineItem } from "@/features/storefront/lib/data/cart";
import { useState } from "react";
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message";
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link";
import { RiLoader2Fill } from "@remixicon/react";

interface CartItemProps {
  item: any;
  region: any;
  type?: "full" | "preview";
}

const Item = ({ item, region, type = "full" }: CartItemProps) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const { handle } = item.productVariant.product;

  const maxQuantity = Math.min(
    item.productVariant.inventoryQuantity > 0
      ? item.productVariant.inventoryQuantity
      : 10,
    10
  );

  const changeQuantity = async (quantity: number) => {
    setError(null);
    setUpdating(true);

    const message = await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        return err.message;
      })
      .finally(() => {
        setUpdating(false);
      });

    message && setError(message);
  };

  const href = `/products/${handle}`;

  if (type === "preview") {
    return (
      <li className="flex items-center gap-3 py-3">
        <LocalizedClientLink href={href} className="w-14 shrink-0">
          <Thumbnail thumbnail={item.productVariant.product.thumbnail} size="square" />
        </LocalizedClientLink>
        <div className="min-w-0 flex-1">
          <p className="truncate font-cx-serif text-[15px] leading-[20px] text-cx-ink">{item.title}</p>
          <div className="text-[13px] text-cx-ink-2">
            <LineItemOptions variantTitle={item.productVariant?.title} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end text-[13px]">
          <span className="cx-num flex gap-1 text-cx-ink-3">
            {item.quantity}×
            <LineItemUnitPrice item={item} style="tight" />
          </span>
          <LineItemPrice item={item} style="tight" />
        </div>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-start">
      <LocalizedClientLink href={href} className="row-span-2 block w-20 sm:row-span-1 sm:w-24">
        <Thumbnail thumbnail={item.productVariant.product.thumbnail} size="square" />
      </LocalizedClientLink>

      <div className="min-w-0">
        <LocalizedClientLink href={href} className="block">
          <p className="font-cx-serif text-[18px] leading-[22px] text-cx-ink hover:text-cx-accent sm:text-[20px] sm:leading-[24px]">
            {item.title}
          </p>
        </LocalizedClientLink>
        <div className="mt-1 text-[13px] text-cx-ink-2">
          <LineItemOptions
            variant={{ sku: item.productVariant?.sku || "" }}
            variantTitle={item.productVariant?.title}
          />
        </div>
        <div className="mt-1 text-[13px] text-cx-ink-3">
          <LineItemUnitPrice item={item} style="tight" />
        </div>
      </div>

      <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end">
        <div className="flex items-center gap-2">
          <CartItemSelect
            value={item.quantity}
            onChange={(e) => changeQuantity(parseInt(e.target.value))}
            min={1}
            max={maxQuantity}
            step={1}
            aria-label="Quantity"
          />
          {updating ? (
            <span className="inline-flex size-11 items-center justify-center text-cx-ink-3" role="status" aria-label="Updating">
              <RiLoader2Fill className="size-4 animate-spin" />
            </span>
          ) : (
            <DeleteButton id={item.id} />
          )}
        </div>
        <div className="text-[15px]">
          <LineItemPrice item={item} style="tight" />
        </div>
        <ErrorMessage error={error} />
      </div>
    </li>
  );
};

export default Item;
