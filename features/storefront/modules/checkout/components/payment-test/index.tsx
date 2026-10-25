import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentTestProps {
  className?: string
  provider?: "stripe" | "paypal" | "general"
}

const PaymentTest = ({ className, provider = "general" }: PaymentTestProps) => {
  const providerText = provider === "stripe"
    ? "Stripe test mode"
    : provider === "paypal"
    ? "PayPal sandbox"
    : "Test mode"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-cx-tint px-2.5 py-1 text-[13px] text-cx-accent",
        className
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      <span className="font-medium">{providerText}</span>
      <span>· do not enter real payment details</span>
    </span>
  )
}

export default PaymentTest
