import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

import useToggleState from "@/features/storefront/lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom";
import { RiLoader2Fill } from "@remixicon/react"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "Update failed. Try again.",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="px-4 py-4 sm:px-5" data-testid={dataTestid}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="cx-label">{label}</span>
          <div className="min-w-0 text-[15px] text-cx-ink">
            {typeof currentInfo === "string" ? (
              <span className="break-words" data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center rounded-[2px] bg-cx-surface px-4 text-[14px] font-medium text-cx-ink shadow-[0_1px_2px_rgb(26_23_18/0.14)] hover:bg-cx-bg data-[active=true]:bg-transparent data-[active=true]:shadow-none data-[active=true]:text-cx-ink-2"
          onClick={handleToggle}
          type={state ? "reset" : "button"}
          data-testid="edit-button"
          data-active={state}
        >
          {state ? "Cancel" : "Edit"}
        </button>
      </div>

      <div
        className={cn("overflow-hidden transition-all duration-300 ease-in-out", {
          "max-h-[200px] opacity-100": isSuccess,
          "max-h-0 opacity-0": !isSuccess,
        })}
        data-testid="success-message"
        role="status"
      >
        <p className="mt-3 inline-flex items-baseline gap-2 text-[13px] text-cx-ok">
          <span className="cx-dot bg-cx-ok" aria-hidden="true" />
          {label} updated
        </p>
      </div>

      <div
        className={cn("overflow-hidden transition-all duration-300 ease-in-out", {
          "max-h-[200px] opacity-100": isError,
          "max-h-0 opacity-0": !isError,
        })}
        data-testid="error-message"
        role="alert"
      >
        <p className="mt-3 inline-flex items-baseline gap-2 text-[13px] text-cx-danger">
          <span className="cx-dot bg-cx-danger" aria-hidden="true" />
          {errorMessage}
        </p>
      </div>

      <Collapsible open={state}>
        <CollapsibleContent
          className={cn("overflow-visible transition-all duration-300 ease-in-out", {
            "max-h-[1000px] opacity-100": state,
            "max-h-0 opacity-0": !state,
          })}
        >
          <div className="flex flex-col gap-4 pt-4">
            <div>{children}</div>
            <div className="flex justify-end">
              <button
                disabled={pending}
                className="cx-btn w-full sm:w-auto sm:min-w-[140px]"
                type="submit"
                data-testid="save-button"
              >
                {pending && <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" />}
                Save
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default AccountInfo
