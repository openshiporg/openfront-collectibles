import { cn } from "@/lib/utils";

interface LineItemPriceProps {
  item: {
    percentageOff: number;
    originalPrice: string | number;
    total: string | number;
  };
  style?: "default" | string;
}

const LineItemPrice = ({
  item,
  style = "default"
}: LineItemPriceProps) => {
  const hasReducedPrice = item.percentageOff > 0;

  return (
    <div className="cx-num flex flex-col items-end text-cx-ink">
      {hasReducedPrice && (
        <span className="flex items-baseline gap-1.5 text-[12px] text-cx-ink-3">
          <span className="line-through">{item.originalPrice}</span>
          {style === "default" && <span className="text-cx-accent">-{item.percentageOff}%</span>}
        </span>
      )}
      <span className={cn({ "text-cx-accent": hasReducedPrice })}>{item.total}</span>
    </div>
  );
}

export default LineItemPrice
