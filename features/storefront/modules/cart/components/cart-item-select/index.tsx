"use client"

import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  InputHTMLAttributes,
} from "react"

type CartItemSelectProps = {
  min?: number
  max?: number
  step?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">

const CartItemSelect = forwardRef<HTMLInputElement, CartItemSelectProps>(
  ({ className, min = 1, max = 10, step = 1, value: controlledValue, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState<number | undefined>(
      typeof controlledValue === "number" ? controlledValue : Number(controlledValue)
    )

    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    useEffect(() => {
      if (typeof controlledValue === "number") {
        setValue(controlledValue)
      } else if (controlledValue !== undefined) {
        const parsed = Number(controlledValue)
        if (!isNaN(parsed)) setValue(parsed)
      }
    }, [controlledValue])

    const notifyChange = useCallback((newValue: number) => {
      if (onChange) {
        const event = {
          target: { value: String(newValue) }
        } as unknown as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }, [onChange])

    const handleIncrement = useCallback(() => {
      const newValue = value === undefined ? step : Math.min((value ?? 0) + step, max)
      setValue(newValue)
      notifyChange(newValue)
    }, [value, step, max, notifyChange])

    const handleDecrement = useCallback(() => {
      const newValue = value === undefined ? step : Math.max((value ?? 0) - step, min)
      setValue(newValue)
      notifyChange(newValue)
    }, [value, step, min, notifyChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (!isNaN(newValue)) {
        setValue(newValue)
        if (onChange) {
          onChange(e)
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === innerRef.current) {
        if (e.key === "ArrowUp") {
          e.preventDefault()
          handleIncrement()
        } else if (e.key === "ArrowDown") {
          e.preventDefault()
          handleDecrement()
        }
      }
    }

    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleIncrement, handleDecrement])

    return (
      <div className={cn("cx-track items-center", className)}>
        <button
          type="button"
          aria-label="Decrease quantity"
          className="inline-flex size-9 items-center justify-center rounded-full text-cx-ink-2 hover:bg-cx-surface hover:text-cx-ink disabled:opacity-40 max-sm:size-10"
          onClick={handleDecrement}
          disabled={value !== undefined && value <= min}
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <input
          ref={innerRef}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={handleInputChange}
          className="cx-num h-9 w-10 rounded-full bg-cx-surface text-center text-[14px] text-cx-ink shadow-[0_1px_2px_rgb(26_23_18/0.14)] outline-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-cx-accent max-sm:h-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...props}
        />
        <button
          type="button"
          aria-label="Increase quantity"
          className="inline-flex size-9 items-center justify-center rounded-full text-cx-ink-2 hover:bg-cx-surface hover:text-cx-ink disabled:opacity-40 max-sm:size-10"
          onClick={handleIncrement}
          disabled={value !== undefined && value >= max}
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
