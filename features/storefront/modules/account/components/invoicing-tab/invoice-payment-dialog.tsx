"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { CardElement } from '@stripe/react-stripe-js'
import InvoicePaymentWrapper from "./invoice-payment-wrapper"
import InvoicePaymentButton from "./invoice-payment-button"
import { createInvoicePaymentSessions, createInvoiceFromLineItems, initiateInvoicePaymentSession, setInvoicePaymentSession, getActiveInvoice } from "./invoice-actions"
import { isStripe, paymentInfoMap } from "@/features/storefront/lib/constants"
import { cn } from "@/lib/utils"
import { listCartPaymentMethods } from "@/features/storefront/lib/data/payment"
import { RiLoader2Fill } from "@remixicon/react"

type InvoicePaymentDialogProps = {
  isOpen: boolean
  onClose: () => void
  businessAccount: any
  unpaidLineItems: any
}

export default function InvoicePaymentDialog({ 
  isOpen, 
  onClose, 
  businessAccount, 
  unpaidLineItems 
}: InvoicePaymentDialogProps) {
  const router = useRouter()
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethodSwitching, setPaymentMethodSwitching] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [step, setStep] = useState<'select-region' | 'payment' | 'review'>('select-region')

  const handleRegionSelect = async (regionId: string) => {
    setSelectedRegion(regionId)
    
    // Load payment methods for this region (same as checkout)
    try {
      const paymentMethods = await listCartPaymentMethods(regionId)
      setAvailablePaymentMethods(paymentMethods || [])
      
    } catch (error) {
      setAvailablePaymentMethods([])
    }
  }

  const handleCreateInvoiceWithPaymentSessions = async () => {
    if (!selectedRegion || !businessAccount?.id) return
    
    setLoading(true)
    try {
      // First create invoice from unpaid line items for this region
      const regionData = unpaidLineItems.regions?.find(
        (region: any) => region.region?.id === selectedRegion
      )
      
      if (!regionData) return

      // Create invoice using the GraphQL mutation
      const invoiceResult = await createInvoiceFromLineItems({
        accountId: businessAccount.id,
        regionId: selectedRegion,
        lineItemIds: regionData.lineItems.map((item: any) => item.id)
      })

      if (invoiceResult.success && invoiceResult.invoiceId) {
        // Load payment methods for this region first  
        const paymentMethods = await listCartPaymentMethods(selectedRegion)
        setAvailablePaymentMethods(paymentMethods || [])
        
        // Create payment sessions for this invoice (but don't initiate any yet)
        await createInvoicePaymentSessions(invoiceResult.invoiceId)
        
        // Get the invoice with payment sessions (now with clientSecret)
        const invoiceData = await getActiveInvoice(invoiceResult.invoiceId)

        if (invoiceData) {
          
          // Format the amount since JSON response doesn't have virtual fields
          const formatAmount = (amount: number, currency: { code: string; noDivisionCurrency?: boolean } | null) => {
            if (!currency) return '$0.00'
            const divisor = currency.noDivisionCurrency ? 1 : 100
            const amountValue = (amount || 0) / divisor
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.code,
            }).format(amountValue)
          }
          
          setInvoice({
            ...invoiceData,
            formattedTotal: formatAmount(invoiceData.totalAmount, invoiceData.currency),
            itemCount: invoiceData.lineItems?.length || 0,
            region: regionData.region,
            businessAccount
          })
          
          // Move to payment step  
          setStep('payment')
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invoice not created",
        description: "Payment sessions could not be created"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentMethodChange = async (newPaymentMethod: string) => {
    if (!invoice?.id) return
    
    setPaymentMethodSwitching(true)
    setSelectedPaymentMethod(newPaymentMethod)
    
    try {
      // Find the payment provider ID for this payment method
      const paymentProvider = availablePaymentMethods.find(method => method.code === newPaymentMethod)
      if (!paymentProvider) {
        return
      }

      // Set the payment session as selected
      await setInvoicePaymentSession(invoice.id, paymentProvider.id)
      
      // Initiate the payment session to get clientSecret/orderId
      await initiateInvoicePaymentSession(invoice.id, newPaymentMethod)
      
      // Refresh invoice data to get updated payment sessions with clientSecret/orderId
      const invoiceData = await getActiveInvoice(invoice.id)

      if (invoiceData) {
        
        // Format the amount since JSON response doesn't have virtual fields
        const formatAmount = (amount: number, currency: { code: string; noDivisionCurrency?: boolean } | null) => {
          if (!currency) return '$0.00'
          const divisor = currency.noDivisionCurrency ? 1 : 100
          const amountValue = (amount || 0) / divisor
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
          }).format(amountValue)
        }
        
        setInvoice({
          ...invoiceData,
          formattedTotal: formatAmount(invoiceData.totalAmount, invoiceData.currency),
          itemCount: invoiceData.lineItems?.length || 0,
          region: invoice.region,
          businessAccount: invoice.businessAccount
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment method not changed",
        description: "Try again"
      })
    } finally {
      setPaymentMethodSwitching(false)
    }
  }

  const handlePaymentMethodSubmit = async () => {
    if (!selectedPaymentMethod || !invoice?.id) return
    
    setPaymentLoading(true)
    try {
      // If Stripe is selected and card not complete, stay on payment step
      const shouldInputCard = isStripe(selectedPaymentMethod) && !cardComplete
      
      // Check if we need to initiate payment session for this method
      const currentSession = invoice.paymentCollection?.paymentSessions?.find(
        (session: any) => session.isSelected
      )

      if (currentSession && !currentSession.isInitiated) {
        await initiateInvoicePaymentSession(invoice.id, selectedPaymentMethod)

        // Refresh invoice data to get updated payment sessions with clientSecret/orderId
        const invoiceData = await getActiveInvoice(invoice.id)

        if (invoiceData) {
          
          // Format the amount since JSON response doesn't have virtual fields
          const formatAmount = (amount: number, currency: { code: string; noDivisionCurrency?: boolean } | null) => {
            if (!currency) return '$0.00'
            const divisor = currency.noDivisionCurrency ? 1 : 100
            const amountValue = (amount || 0) / divisor
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.code,
            }).format(amountValue)
          }
          
          setInvoice({
            ...invoiceData,
            formattedTotal: formatAmount(invoiceData.totalAmount, invoiceData.currency),
            itemCount: invoiceData.lineItems?.length || 0,
            region: invoice.region,
            businessAccount: invoice.businessAccount
          })
        }
      }

      if (!shouldInputCard) {
        // Move to review step for non-Stripe payments or completed Stripe
        setStep('review')
      }
    } catch (error) {
      setCardError(error instanceof Error ? error.message : 'Payment setup failed')
    } finally {
      setPaymentLoading(false)
    }
  }

  const selectedSessionReady = invoice?.paymentCollection?.paymentSessions?.find(
    (s: { isSelected: boolean; data?: { clientSecret?: string } }) => s.isSelected && s.data?.clientSecret
  )

  // Single payment screen - like storefront checkout
  if (invoice && availablePaymentMethods.length > 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-cx-line bg-cx-bg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cx-serif text-[24px] font-normal leading-[28px] text-cx-ink">
              Invoice <span className="cx-num text-[20px]">#{invoice.invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">Payment</DialogDescription>
          </DialogHeader>

          <InvoicePaymentWrapper invoice={invoice}>
            <div className="space-y-5">
              <section>
                <div className="flex items-baseline justify-between gap-3 pb-2">
                  <span className="cx-label">Total</span>
                  <span className="cx-num text-[13px] text-cx-ink-2">
                    {invoice.itemCount} {invoice.itemCount === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <p className="cx-num pb-3 text-[28px] leading-none text-cx-ink">{invoice.formattedTotal}</p>
                <ul className="cx-band max-h-56 divide-y divide-cx-line overflow-y-auto">
                  {invoice.lineItems?.map((lineItem: any) => (
                    <li key={lineItem.id}>
                      <a
                        href={`/account/orders/details/${lineItem.accountLineItem.order?.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-12 items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-cx-surface/60"
                      >
                        <span className="cx-num font-medium text-cx-ink">#{lineItem.accountLineItem.order.displayId}</span>
                        <span className="flex-1 text-cx-ink-2">
                          {new Date(lineItem.accountLineItem.order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="cx-num text-cx-ink">{lineItem.accountLineItem.order.total}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="cx-label pb-2">Payment method</p>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className="cx-band gap-0 divide-y divide-cx-line overflow-hidden"
                >
                  {availablePaymentMethods.map((method) => (
                    <div key={method.id} className="relative">
                      <RadioGroupItem value={method.code} id={method.id} className="sr-only" />
                      <Label
                        htmlFor={method.id}
                        className={cn(
                          "flex min-h-14 min-w-0 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-[14px] font-normal transition-colors",
                          selectedPaymentMethod === method.code ? "bg-cx-surface" : "hover:bg-cx-surface/50"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-x-3">
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              selectedPaymentMethod === method.code ? "border-cx-ink" : "border-cx-ink-3"
                            )}
                          >
                            {selectedPaymentMethod === method.code && <span className="size-2 rounded-full bg-cx-ink" />}
                          </span>
                          <span className="truncate font-medium text-cx-ink">
                            {paymentInfoMap[method.code]?.title || method.code}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center">
                          {paymentInfoMap[method.code]?.icon}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </section>

              {isStripe(selectedPaymentMethod) && selectedSessionReady && (
                <section>
                  <p className="cx-label pb-2">Card</p>
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontFamily: "ui-sans-serif, system-ui, sans-serif",
                          color: "#1a1712",
                          "::placeholder": {
                            color: "#8c8477",
                          },
                        },
                      },
                      classes: {
                        base: "block h-12 w-full rounded-xl border border-cx-line bg-cx-surface px-4 pt-3.5 pb-1",
                      },
                      // Hide postal code - billing address is already collected
                      hidePostalCode: true,
                    }}
                    onChange={(e) => {
                      setCardError(e.error?.message || null)
                      setCardComplete(e.complete)
                    }}
                  />
                  {cardError && (
                    <p className="mt-2 text-[13px] text-cx-danger" role="alert">{cardError}</p>
                  )}
                </section>
              )}

              {isStripe(selectedPaymentMethod) && !selectedSessionReady && (
                <section>
                  <p className="cx-label pb-2">Card</p>
                  <div className="h-12 animate-pulse rounded-xl bg-cx-well" />
                </section>
              )}

              <div className="w-full">
                {!selectedPaymentMethod ? (
                  <div className="flex h-12 items-center justify-center rounded-full bg-cx-well text-[14px] text-cx-ink-2">
                    Select a payment method
                  </div>
                ) : paymentMethodSwitching ? (
                  <div className="flex h-12 items-center justify-center gap-2 rounded-full bg-cx-well text-[14px] text-cx-ink-2">
                    <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" />
                    Loading payment method
                  </div>
                ) : (
                  <InvoicePaymentButton
                    invoice={invoice}
                    selectedPaymentMethod={selectedPaymentMethod}
                    onPaymentSuccess={onClose}
                    data-testid="pay-invoice-button"
                  />
                )}
              </div>
            </div>
          </InvoicePaymentWrapper>
        </DialogContent>
      </Dialog>
    )
  }

  // Show region selection (like checkout shows cart items)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border-cx-line bg-cx-bg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cx-serif text-[24px] font-normal leading-[28px] text-cx-ink">Pay balance</DialogTitle>
          <DialogDescription className="text-[14px] text-cx-ink-2">Region</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {unpaidLineItems.success && unpaidLineItems.regions?.length > 0 ? (
            <RadioGroup
              value={selectedRegion || ""}
              onValueChange={handleRegionSelect}
              className="cx-band gap-0 divide-y divide-cx-line overflow-hidden"
            >
              {unpaidLineItems.regions.map((regionData: any) => (
                <div key={regionData.region.id} className="relative">
                  <RadioGroupItem value={regionData.region.id} id={regionData.region.id} className="sr-only" />
                  <Label
                    htmlFor={regionData.region.id}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 text-[14px] font-normal",
                      selectedRegion === regionData.region.id ? "bg-cx-surface" : "hover:bg-cx-surface/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        selectedRegion === regionData.region.id ? "border-cx-ink" : "border-cx-ink-3"
                      )}
                    >
                      {selectedRegion === regionData.region.id && <span className="size-2 rounded-full bg-cx-ink" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-cx-ink">{regionData.region.name}</span>
                      <span className="cx-num block text-[12px] text-cx-ink-2">
                        {regionData.itemCount} {regionData.itemCount === 1 ? 'order' : 'orders'}
                      </span>
                    </span>
                    <span className="cx-num shrink-0 text-cx-ink">{regionData.formattedTotalAmount}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="cx-band px-5 py-6 text-[14px] text-cx-ink-2">No unpaid orders</div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-[15px] font-medium text-cx-ink-2 hover:bg-cx-well"
            >
              Cancel
            </button>
            <button
              type="button"
              className="cx-btn"
              onClick={handleCreateInvoiceWithPaymentSessions}
              disabled={!selectedRegion || loading}
            >
              {loading ? "Creating invoice" : "Continue"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
