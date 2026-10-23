import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="group inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-cx-ink hover:text-cx-accent"
      href={href}
      onClick={onClick}
      {...props}
    >
      <span>{children}</span>
      <ArrowUpRight
        className="size-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
