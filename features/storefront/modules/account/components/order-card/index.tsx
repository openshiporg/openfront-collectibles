import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { StorefrontOrderOverviewItem } from "@/features/storefront/types";

import Thumbnail from "@/features/storefront/modules/products/components/thumbnail";
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link";
import { TitleState, statusLabel, statusTone } from "../account-ui";

type OrderCardProps = {
  order: StorefrontOrderOverviewItem & { status?: string | null };
};

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.lineItems?.reduce((acc: number, item) => {
        return acc + item.quantity;
      }, 0) ?? 0
    );
  }, [order]);

  const shown = order.lineItems?.slice(0, 4) ?? [];
  const hidden = Math.max(0, (order.lineItemsCount ?? order.lineItems?.length ?? 0) - shown.length);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5" data-testid="order-card">
      <div className="min-w-0 flex-1">
        <TitleState
          className="text-[16px] font-medium text-cx-ink"
          title={
            <span className="cx-num">
              #<span data-testid="order-display-id">{order.displayId}</span>
            </span>
          }
          tone={statusTone(order.status)}
          state={statusLabel(order.status || "pending")}
        />
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-cx-ink-2">
          <span data-testid="order-created-at">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span className="cx-num text-cx-ink" data-testid="order-amount">{order.total}</span>
          <span aria-hidden="true">·</span>
          <span className="cx-num">{`${numberOfLines} ${numberOfLines === 1 ? "item" : "items"}`}</span>
        </div>
        {shown.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[13px] text-cx-ink-2">
            {shown.map((item) => (
              <li key={item.id} className="flex min-w-0 gap-2" data-testid="order-item">
                <span className="truncate font-cx-serif text-[14px] text-cx-ink" data-testid="item-title">{item.title}</span>
                <span className="cx-num shrink-0">×<span data-testid="item-quantity">{item.quantity}</span></span>
              </li>
            ))}
            {hidden > 0 && <li className="cx-num">+{hidden} more</li>}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <div className="flex -space-x-3">
          {shown.slice(0, 3).map((item) => (
            <div key={item.id} className="size-12 overflow-hidden rounded-[2px] ring-2 ring-cx-well">
              <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
            </div>
          ))}
        </div>
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          data-testid="order-details-link"
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-[2px] bg-cx-surface px-4 text-[14px] font-medium text-cx-ink shadow-[0_1px_2px_rgb(26_23_18/0.14)] hover:bg-cx-bg"
        >
          Details
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </LocalizedClientLink>
      </div>
    </div>
  );
};

export default OrderCard;
