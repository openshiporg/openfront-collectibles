import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import LinkStatus from "@/features/storefront/modules/common/components/link-status"

const SignInPrompt = () => {
  return (
    <div className="flex flex-col gap-3 rounded-[2px] bg-cx-surface p-4 ring-1 ring-cx-line sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[15px] font-medium text-cx-ink">Already have an account?</h2>
      <LocalizedClientLink
        href="/account"
        data-testid="sign-in-button"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-cx-well px-5 text-[14px] font-medium text-cx-ink hover:bg-cx-line/70"
      >
        <LinkStatus />
        Sign in
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
