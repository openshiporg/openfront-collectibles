"use client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import LinkStatus from "@/features/storefront/modules/common/components/link-status"
import LineItemOptions from "@/features/storefront/modules/common/components/line-item-options"
import LineItemPrice from "@/features/storefront/modules/common/components/line-item-price"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import Thumbnail from "@/features/storefront/modules/products/components/thumbnail"
import { deleteLineItem } from "@/features/storefront/lib/data/cart";

interface CartItem {
  id: string
  quantity: number
  created_at: string
  thumbnail: string
  title: string
  variantTitle?: string
  percentageOff: number
  originalPrice: string | number
  total: string | number
  productVariant: {
    title?: string
    sku?: string
    product: {
      handle: string
    }
  }
}

interface CartState {
  lineItems: CartItem[]
  subtotal: string
}

const CartDropdown = ({
  cart: cartState,
}: {
  cart: CartState
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => {
    setCartDropdownOpen(true);
    itemRef.current = totalItems;
  }
  
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.lineItems?.reduce((acc: number, item: CartItem) => {
      return acc + item.quantity
    }, 0) || 0

  const itemRef = useRef(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !(pathname ?? "").includes("/cart")) {
      timedOpen()
    }
  }, [totalItems, pathname])

  return (
    // TODO: Remove suppressHydrationWarning when React 19.2.0 useId bug is fixed upstream
    // Known issue: https://github.com/radix-ui/primitives/issues/3700
    <div className="z-50" suppressHydrationWarning>
      <Popover open={cartDropdownOpen} onOpenChange={setCartDropdownOpen}>
        <div className="relative" onMouseEnter={openAndCancel} onMouseLeave={close}>
          <PopoverTrigger asChild>
            <LocalizedClientLink
              className="inline-flex min-h-11 items-center gap-2 rounded-[2px] px-3 text-[14px] font-medium text-cx-ink hover:bg-cx-well"
              href="/cart"
              data-testid="nav-cart-link"
            >
              Cart
              <span
                className={
                  totalItems > 0
                    ? "cx-num inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cx-ink px-1.5 text-[13px] text-cx-bg"
                    : "cx-num text-[13px] text-cx-ink-3"
                }
              >
                {totalItems}
              </span>
            </LocalizedClientLink>
          </PopoverTrigger>
          <PopoverContent
            className="hidden w-[400px] overflow-hidden rounded-[2px] border border-cx-line bg-cx-surface p-0 text-cx-ink shadow-[0_24px_48px_-24px_rgb(26_23_18/0.4)] sm:block"
            sideOffset={8}
            align="end"
            onMouseEnter={openAndCancel}
            onMouseLeave={close}
          >
            {cartState && cartState.lineItems?.length ? (
              <>
                <div className="no-scrollbar max-h-[380px] space-y-1 overflow-y-auto p-1">
                  {cartState.lineItems
                    .sort((a: CartItem, b: CartItem) => {
                      return a.created_at > b.created_at ? -1 : 1
                    })
                    .map((item: CartItem) => (
                      <div className="grid grid-cols-[72px_1fr] gap-x-3 p-4" key={item.id}>
                        <LocalizedClientLink href={`/products/${item.productVariant.product.handle}`} className="w-[72px]">
                          <Thumbnail thumbnail={item.thumbnail} size="square" />
                        </LocalizedClientLink>
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-cx-serif text-[16px] leading-[20px]">
                              <LocalizedClientLink href={`/products/${item.productVariant.product.handle}`}>
                                {item.title}
                              </LocalizedClientLink>
                            </h3>
                            {item.productVariant.title && <p className="truncate text-[13px] text-cx-ink-2">{item.productVariant.title}</p>}
                            <LineItemOptions variant={item.productVariant} variantTitle={item.variantTitle}/>
                            <div className="mt-1.5 flex items-center gap-2 text-[13px] text-cx-ink-2">
                              <span className="cx-num">Qty {item.quantity}</span>
                              <span aria-hidden="true">·</span>
                              <DeleteButton id={item.id} />
                            </div>
                          </div>
                          <div className="cx-num shrink-0 text-[13px]">
                            <LineItemPrice item={item} />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="space-y-3 bg-cx-bg p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px] font-medium">
                      Subtotal <span className="font-normal text-cx-ink-3">excl. tax</span>
                    </span>
                    <span className="cx-num text-[16px]">{cartState.subtotal}</span>
                  </div>
                  <LocalizedClientLink href="/cart" className="cx-btn w-full" onClick={close}>
                    <LinkStatus />
                    View cart
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-4 p-6">
                <p className="font-cx-serif text-[20px]">Your cart is empty</p>
                <LocalizedClientLink href="/store" className="cx-btn" onClick={close}>
                  Browse items
                </LocalizedClientLink>
              </div>
            )}
          </PopoverContent>
        </div>
      </Popover>
    </div>
  );
}

const DeleteButton = ({
  id,
}: {
  id: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteLineItem(id).catch(() => {
      setIsDeleting(false);
    });
  };

  return (
    <button
      onClick={() => handleDelete(id)}
      className="cursor-pointer text-[13px] font-medium text-cx-danger hover:underline"
      disabled={isDeleting}
    >
      {isDeleting ? "Removing" : "Remove"}
    </button>
  );
};

export default CartDropdown
