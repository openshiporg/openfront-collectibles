import { cn } from "@/lib/utils"

interface LineItemUnitPriceProps {
  item: {
    percentageOff: number
    originalPrice: string | number
    unitPrice: string | number
  }
  style?: "default" | string
}

const LineItemUnitPrice = ({
  item,
  style = "default"
}: LineItemUnitPriceProps) => {
  const hasReducedPrice = item.percentageOff > 0

  return (
    <span className="cx-num inline-flex items-baseline gap-1.5">
      {hasReducedPrice && (
        <>
          <span className="line-through text-cx-ink-3">{item.originalPrice}</span>
          {style === "default" && <span className="text-cx-accent">-{item.percentageOff}%</span>}
        </>
      )}
      <span className={cn({ "text-cx-accent": hasReducedPrice })}>{item.unitPrice}</span>
    </span>
  );
}

export default LineItemUnitPrice
