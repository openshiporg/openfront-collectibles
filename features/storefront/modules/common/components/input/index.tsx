import { Label } from "@/components/ui/label"
import { Input as BaseInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import React, { useEffect, useId, useImperativeHandle, useState } from "react"

import Eye from "@/features/storefront/modules/common/icons/eye"
import EyeOff from "@/features/storefront/modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  placeholder?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, placeholder, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    const generatedId = useId()
    const inputId = props.id || `${name}-${generatedId}`

    return (
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor={inputId} className="text-[13px] font-medium leading-[18px] text-cx-ink-2">
          {topLabel || label}
          {required && <span className="text-cx-ink-3"> *</span>}
        </Label>
        <div className="relative w-full">
          <BaseInput
            type={inputType}
            name={name}
            placeholder={placeholder}
            required={required}
            className="block h-12 w-full appearance-none rounded-xl border border-cx-line bg-cx-surface px-4 text-[15px] text-cx-ink shadow-none transition-colors placeholder:text-cx-ink-3 hover:border-cx-ink-3 focus-visible:border-cx-accent focus-visible:ring-2 focus-visible:ring-cx-accent/25 aria-invalid:border-cx-danger"
            {...props}
            id={inputId}
            ref={inputRef}
          />
          {type === "password" && (
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-cx-ink-3 outline-none transition-colors hover:text-cx-ink focus-visible:text-cx-ink"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
