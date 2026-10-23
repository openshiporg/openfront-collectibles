"use client"

import { useActionState, useEffect, startTransition } from "react"
import { toast } from "@/components/ui/use-toast"
import type { StorefrontAccountCustomer as User } from "@/features/storefront/types"
import { submitBusinessAccountRequest } from "@/features/storefront/lib/data/business-accounts"

type BusinessAccountRequestFormProps = {
  customer: User
}

const BusinessAccountRequestForm = ({ customer }: BusinessAccountRequestFormProps) => {
  // Server action with useActionState
  const [state, action, loading] = useActionState(submitBusinessAccountRequest, { success: false, error: '' })

  const handleSubmit = () => {
    const form = new FormData()
    form.append('customerId', customer.id)
    form.append('businessName', customer.name || 'Business Account')
    form.append('businessType', 'other')
    form.append('monthlyOrderVolume', 'medium')
    form.append('requestedCreditLimit', '100000')
    form.append('businessDescription', 'Business account request')

    startTransition(() => action(form))
  }

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Request submitted",
        description: state.message || undefined,
      })
      // Refresh the page to show the new state
      window.location.reload()
    }
  }, [state])

  return (
    <div className="flex flex-col items-start gap-3">
      <button type="button" className="cx-btn" onClick={handleSubmit} disabled={loading || state.success}>
        {loading ? "Requesting" : "Request business account"}
      </button>
      {state.error && (
        <p className="inline-flex items-baseline gap-2 text-[13px] text-cx-danger" role="alert">
          <span className="cx-dot bg-cx-danger" aria-hidden="true" />
          {state.error}
        </p>
      )}
    </div>
  )
}

export default BusinessAccountRequestForm
