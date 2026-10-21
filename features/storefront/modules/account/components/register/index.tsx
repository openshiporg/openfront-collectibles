"use client"

import { useActionState } from "react"
// import Input from "@/features/storefront/modules/common/components/input" 
import { LOGIN_VIEW } from "@/features/storefront/modules/account/templates/login-template" 
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message" 
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button" 
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link" 
import { signUp } from "@/features/storefront/lib/data/user" 
import { Input } from "@/components/ui/input"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signUp, null) 

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-base leading-6 font-semibold uppercase mb-6">
        Create account
      </h1>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            // label="First name"
            name="first_name"
            placeholder="First Name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            // label="Last name"
            name="last_name"
            placeholder="Last Name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            // label="Email"
            name="email"
            placeholder="Email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            // label="Phone"
            name="phone"
            placeholder="Phone Number"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            // label="Password"
            name="password"
            placeholder="Password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Create account
        </SubmitButton>
      </form>
      <span className="text-center text-foreground text-xs leading-5 font-normal mt-6">
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="inline-flex min-h-11 min-w-11 items-center underline"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
