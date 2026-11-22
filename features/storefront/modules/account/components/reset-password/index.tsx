"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { cxInput, cxSubmit } from "@/features/storefront/modules/account/components/account-ui"
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button"
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { redeemCustomerPasswordReset, requestCustomerPasswordReset } from "@/features/storefront/lib/data/user"

const heading = "mt-2 font-cx-display font-extrabold text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[44px] sm:leading-[46px]"

export default function ResetPassword({ token, email }: { token: string | null; email: string | null }) {
  const [requested, requestAction] = useActionState(requestCustomerPasswordReset, null)
  const [redeemed, redeemAction] = useActionState(redeemCustomerPasswordReset, null)
  const back = (
    <LocalizedClientLink href="/account" className="inline-flex min-h-11 items-center font-medium text-cx-ink underline underline-offset-4" data-testid="back-to-sign-in">
      Back to sign in
    </LocalizedClientLink>
  )

  if (token && email) {
    return (
      <div className="flex w-full max-w-[400px] flex-col" data-testid="reset-password-page">
        <h1 className={heading}>Choose a new password</h1>
        {redeemed?.success ? (
          <div className="mt-6 space-y-4 text-[16px] text-cx-ink-2">
            <p role="status">Your password is changed. Sign in with the new one.</p>
            {back}
          </div>
        ) : (
          <form className="mt-8 w-full" action={redeemAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={email} />
            <p className="mb-4 text-[15px] text-cx-ink-2">For {email}</p>
            <label htmlFor="password" className="cx-label">New password</label>
            <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className={cn(cxInput, "mt-1.5")} data-testid="new-password-input" />
            <ErrorMessage error={redeemed?.error} data-testid="reset-error-message" />
            <SubmitButton className={cn(cxSubmit, "mt-6")} data-testid="save-password-button">Save password</SubmitButton>
            <div className="mt-6 border-t border-cx-line pt-4 text-[14px]">{back}</div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col" data-testid="forgot-password-page">
      <h1 className={heading}>Forgot password</h1>
      {requested?.success ? (
        <div className="mt-6 space-y-4 text-[16px] text-cx-ink-2">
          <p role="status">If that email has an account, a link to choose a new password is on its way.</p>
          {back}
        </div>
      ) : (
        <form className="mt-8 w-full" action={requestAction}>
          <p className="mb-4 text-[15px] text-cx-ink-2">Enter the email you sign in with and we will send you a link.</p>
          <label htmlFor="email" className="cx-label">Email</label>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={email ?? ""} className={cn(cxInput, "mt-1.5")} data-testid="email-input" />
          <ErrorMessage error={requested?.error} data-testid="reset-error-message" />
          <SubmitButton className={cn(cxSubmit, "mt-6")} data-testid="send-reset-button">Send reset link</SubmitButton>
          <div className="mt-6 border-t border-cx-line pt-4 text-[14px]">{back}</div>
        </form>
      )}
    </div>
  )
}
