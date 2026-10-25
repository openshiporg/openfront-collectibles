"use client"

import { useActionState } from "react"
// import Input from "@/features/storefront/modules/common/components/input" 
import { LOGIN_VIEW } from "@/features/storefront/modules/account/templates/login-template" 
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message" 
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button" 
import { signUp } from "@/features/storefront/lib/data/user" 
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { cxInput, cxSubmit } from "@/features/storefront/modules/account/components/account-ui"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signUp, null) 

  return (
    <div
      className="flex w-full max-w-[480px] flex-col"
      data-testid="register-page"
    >
      <p className="cx-label">Account</p>
      <h1 className="mt-2 font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[44px] sm:leading-[46px]">
        Create account
      </h1>
      <form className="mt-8 flex w-full flex-col" action={formAction}>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-y-1.5 sm:col-span-1">
            <label htmlFor="register-first_name" className="text-[13px] font-medium text-cx-ink">First name</label>
            <Input
              id="register-first_name"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
              className={cxInput}
            />
          </div>
          <div className="flex flex-col gap-y-1.5 sm:col-span-1">
            <label htmlFor="register-last_name" className="text-[13px] font-medium text-cx-ink">Last name</label>
            <Input
              id="register-last_name"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
              className={cxInput}
            />
          </div>
          <div className="flex flex-col gap-y-1.5 sm:col-span-2">
            <label htmlFor="register-email" className="text-[13px] font-medium text-cx-ink">Email</label>
            <Input
              id="register-email"
              name="email"
              required
              type="email"
              autoComplete="email"
              data-testid="email-input"
              className={cxInput}
            />
          </div>
          <div className="flex flex-col gap-y-1.5 sm:col-span-2">
            <label htmlFor="register-phone" className="text-[13px] font-medium text-cx-ink">Phone <span className="font-normal text-cx-ink-3">optional</span></label>
            <Input
              id="register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              data-testid="phone-input"
              className={cxInput}
            />
          </div>
          <div className="flex flex-col gap-y-1.5 sm:col-span-2">
            <label htmlFor="register-password" className="text-[13px] font-medium text-cx-ink">Password</label>
            <Input
              id="register-password"
              name="password"
              required
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
              className={cxInput}
            />
          </div>
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <SubmitButton className={cn(cxSubmit, "mt-6")} data-testid="register-button">
          Create account
        </SubmitButton>
      </form>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-cx-line pt-4 text-[14px] text-cx-ink-2">
        <span>Have an account</span>
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="inline-flex min-h-11 items-center rounded-[2px] px-3 font-medium text-cx-ink hover:bg-cx-well"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default Register
