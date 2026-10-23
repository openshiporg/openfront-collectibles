import InteractiveLink from "@/features/storefront/modules/common/components/interactive-link"

const Help = () => {
  return (
    <div className="flex flex-wrap gap-x-6 border-t border-cx-line pt-4">
      <InteractiveLink href="/account/orders">Your orders</InteractiveLink>
      <InteractiveLink href="/store">Continue browsing</InteractiveLink>
    </div>
  )
}

export default Help
