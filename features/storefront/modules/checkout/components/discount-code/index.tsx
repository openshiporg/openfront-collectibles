"use client";
import { Minus, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

import Trash from "@/features/storefront/modules/common/icons/trash";
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message";
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button";
import {
  removeDiscount,
  removeGiftCard,
  submitDiscountForm,
} from "@/features/storefront/lib/data/cart";
import { formatAmount } from "@/features/storefront/lib/util/prices";
import { useState, useMemo, useActionState } from "react";
import { Input } from "@/components/ui/input";

interface DiscountCodeProps {
  cart?: {
    discounts?: any[];
    giftCards?: any[];
    region?: any;
    discountsById?: Record<string, number>;
  };
}

const DiscountCode = ({ cart }: DiscountCodeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { discounts, giftCards, region } = cart || {};

  const appliedDiscounts = useMemo(() => {
    if (!discounts || !discounts.length) {
      return [];
    }

    const discountAmounts = cart?.discountsById || {};

    return discounts
      .map((discount) => {
        if (!discount.discountRule) return null;

        const value = (() => {
          switch (discount.discountRule.type) {
            case "percentage":
              return `${discount.discountRule.value}% off`;
            case "fixed":
              return `${formatAmount({
                amount: discount.discountRule.value,
                region: region,
              })} off`;
            case "free_shipping":
              return "Free shipping";
            default:
              return "";
          }
        })();

        return {
          code: discount.code,
          value,
          id: discount.id,
          type: discount.discountRule.type,
          discountAmount: discountAmounts[discount.id] || 0,
        };
      })
      .filter(Boolean);
  }, [discounts, region, cart?.discountsById]);

  const removeGiftCardCode = async (code: string) => {
    await removeGiftCard(code);
  };

  const removeDiscountCode = async (code: string) => {
    await removeDiscount(code);
  };

  const [message, formAction] = useActionState(submitDiscountForm, null);

  return (
    <div className="flex w-full flex-col gap-3">
      <form action={formAction} className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-expanded={isOpen}
          className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-cx-ink underline-offset-4 hover:underline"
        >
          {isOpen ? <Minus className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Gift card or discount code
        </button>
        {isOpen && (
          <>
            <div className="mt-2 flex w-full items-center gap-2">
              <Label htmlFor="discount-code" className="sr-only">Code</Label>
              <Input
                id="discount-code"
                placeholder="Code"
                name="code"
                type="text"
                autoFocus={false}
                className="cx-num h-11 flex-1 rounded-[2px] border-cx-line bg-cx-surface px-4 text-[14px] uppercase text-cx-ink placeholder:normal-case placeholder:text-cx-ink-3 focus-visible:border-cx-accent focus-visible:ring-2 focus-visible:ring-cx-accent/25"
              />
              <SubmitButton variant="secondary">Apply</SubmitButton>
            </div>
            <ErrorMessage error={message} />
          </>
        )}
      </form>

      {giftCards && giftCards.length > 0 && (
        <div className="space-y-1.5">
          <p className="cx-label">Gift cards</p>
          {giftCards.map((gc) => (
            <div className="flex items-center justify-between gap-3 text-[14px]" key={gc.id}>
              <span className="cx-num truncate text-cx-ink">{gc.code}</span>
              <span className="flex items-center gap-1">
                <span className="cx-num text-cx-ink">
                  {formatAmount({
                    region: region,
                    amount: gc.balance,
                    includeTaxes: false,
                  })}
                </span>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-[2px] text-cx-ink-2 hover:bg-cx-well hover:text-cx-danger"
                  onClick={() => removeGiftCardCode(gc.code)}
                >
                  <Trash size={14} />
                  <span className="sr-only">Remove gift card</span>
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {appliedDiscounts.length > 0 && (
        <div className="space-y-1.5">
          <p className="cx-label">Discounts</p>
          {appliedDiscounts.map((discount) =>
            discount ? (
              <div className="flex items-center justify-between gap-3 text-[14px]" key={discount.code}>
                <span className="flex min-w-0 items-center gap-1">
                  <span className="cx-num inline-flex h-7 items-center rounded-[2px] bg-cx-tint px-3 text-[13px] uppercase text-cx-accent">
                    {discount.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDiscountCode(discount.code)}
                    className="inline-flex size-11 items-center justify-center rounded-[2px] text-cx-ink-2 hover:bg-cx-well hover:text-cx-danger"
                  >
                    <X size={14} />
                    <span className="sr-only">Remove discount code</span>
                  </button>
                  <span className="truncate text-[13px] text-cx-ink-3">{discount.value}</span>
                </span>
                <span className="cx-num shrink-0 text-cx-ok">−{discount.discountAmount}</span>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountCode;
