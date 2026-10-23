import { cn } from "@/lib/utils"

const Divider = ({ className }: { className?: string }) => (
  <div
    className={cn("h-px w-full bg-cx-line", className)}
  />
)

export default Divider
