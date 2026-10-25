import { cn } from "@/lib/utils";

interface PreviewPriceProps {
  price: any;
  region: any;
}

export default function PreviewPrice({ price, region }: PreviewPriceProps) {
  if (!price || !price.calculatedAmount) {
    return <span className="text-[13px] text-cx-ink-3">Price not available</span>;
  }

  const format = (amount: number) =>
    new Intl.NumberFormat(region.locale, {
      style: "currency",
      currency: price.currencyCode,
    }).format(amount / 100);

  const isOnSale = price.calculatedAmount < price.originalAmount;

  return (
    <div className="cx-num flex items-baseline gap-2 text-[17px]">
      <span
        className={cn("whitespace-nowrap text-cx-ink", { "text-cx-accent": isOnSale })}
        data-testid="price"
      >
        {format(price.calculatedAmount)}
      </span>
      {isOnSale && (
        <span className="text-[14px] text-cx-ink-3 line-through" data-testid="original-price">
          {format(price.originalAmount)}
        </span>
      )}
    </div>
  );
}
