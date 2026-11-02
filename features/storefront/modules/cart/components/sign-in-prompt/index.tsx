import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import LinkStatus from "@/features/storefront/modules/common/components/link-status"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between gap-3 text-[14px] text-cx-ink-2">
      <h2 className="font-normal">Have an account?</h2>
      <LocalizedClientLink
        href="/account"
        data-testid="sign-in-button"
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-cx-ink underline underline-offset-4 hover:text-[#c8ff00]"
      >
        <LinkStatus />
        Sign in
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
