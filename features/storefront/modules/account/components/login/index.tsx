import { login } from "@/features/storefront/lib/data/user" 
import { LOGIN_VIEW } from "@/features/storefront/modules/account/templates/login-template" 
import ErrorMessage from "@/features/storefront/modules/checkout/components/error-message" 
import { SubmitButton } from "@/features/storefront/modules/checkout/components/submit-button" 
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { cxInput, cxSubmit } from "@/features/storefront/modules/account/components/account-ui"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible((prev) => !prev)

  return (
    <div
      className="flex w-full max-w-[400px] flex-col"
      data-testid="login-page"
    >
      <p className="cx-label">Account</p>
      <h1 className="mt-2 font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[44px] sm:leading-[46px]">Sign in</h1>
      <form className="mt-8 w-full" action={formAction}>
        <div className="flex w-full flex-col gap-y-4">
          <div className="flex flex-col gap-y-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-cx-ink">Email</label>
            <Input
              id="email"
              aria-label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="email-input"
              className={cxInput}
            />
          </div>
          <div className="flex flex-col gap-y-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-cx-ink">Password</label>
            <div className="relative">
              <Input
                id="password"
                aria-label="Password"
                name="password"
                type={isVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                data-testid="password-input"
                className={cn(cxInput, "pe-12")}
              />
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-12 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={toggleVisibility}
                aria-label={isVisible ? "Hide password" : "Show password"}
                aria-pressed={isVisible}
                tabIndex={-1}
              >
                {isVisible ? (
                  <EyeOffIcon size={16} aria-hidden="true" />
                ) : (
                  <EyeIcon size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className={cn(cxSubmit, "mt-6")}>
          Sign in
        </SubmitButton>
      </form>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-cx-line pt-4 text-[14px] text-cx-ink-2">
        <span>No account</span>
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="inline-flex min-h-11 items-center rounded-[2px] px-3 font-medium text-cx-ink hover:bg-cx-well"
          data-testid="register-button"
        >
          Create account
        </button>
      </div>
    </div>
  )
}

export default Login
