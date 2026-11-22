"use client"

import { isManual, isStripe, isPaypal } from "@/features/storefront/lib/constants"
import { placeOrder } from "@/features/storefront/lib/data/cart"
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { RiLoader2Fill } from "@remixicon/react"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
  cart: {
    shippingAddress: any;
    billingAddress: any;
    email: string;
    shippingMethods: any[];
    giftCards?: any[];
    rawTotal?: number;
    paymentCollection?: {
      paymentSessions?: {
        id: string;
        isSelected: boolean;
        paymentProvider?: {
          code: string;
        };
        data?: {
          clientSecret?: string;
          orderId?: string;
        };
      }[];
    };
  };
  /** Text on the button, for example "Pay $12.98". */
  label?: string;
  /** Stripe only: the card field reports a complete card. */
  cardComplete?: boolean;
  "data-testid": string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  label = "Place order",
  cardComplete = false,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shippingAddress ||
    !cart.billingAddress ||
    !cart.email ||
    (cart.shippingMethods?.length ?? 0) < 1

  const paymentSession = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected
  )

  if ((cart.giftCards?.length ?? 0) > 0 && cart.rawTotal === 0) {
    return <GiftCardPaymentButton notReady={notReady} label={label} data-testid={dataTestId} />
  }

  switch (true) {
    case isStripe(paymentSession?.paymentProvider?.code):
      return (
        <StripePaymentButton
          notReady={notReady}
          label={label}
          cardComplete={cardComplete}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isPaypal(paymentSession?.paymentProvider?.code):
      return (
        <PayPalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.paymentProvider?.code):
      return (
        <ManualTestPaymentButton notReady={notReady} label={label} cart={cart} data-testid={dataTestId} />
      )
    default:
      return <button type="button" disabled className="cx-btn w-full sm:w-auto">Select a payment method</button>
  }
}

interface StripePaymentButtonProps {
  cart: PaymentButtonProps["cart"];
  notReady: boolean;
  label: string;
  cardComplete: boolean;
  "data-testid"?: string;
}

const StripePaymentButton: React.FC<StripePaymentButtonProps> = ({
  cart,
  notReady,
  label,
  cardComplete,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const onPaymentCompleted = async (paymentSessionId: string) => {
    try {
      const result = await placeOrder(paymentSessionId)
      if (result && typeof result === 'object' && 'success' in result && result.success && 'redirectTo' in result) {
        router.push(result.redirectTo as string)
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()

  const session = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected && s.paymentProvider?.code === 'pp_stripe_stripe'
  )

  const disabled = !stripe || !elements || !cardComplete

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    // Read the card field when the customer pays: it sits in the same step as this button.
    const card = elements?.getElement(CardElement)
    if (!stripe || !elements || !card || !cart || !session?.data?.clientSecret || !session.id) {
      setSubmitting(false)
      setErrorMessage("The card payment could not start. Reload the page and try again.")
      return
    }

    // Confirm the payment intent with the card details, then pass session ID to backend
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        session.data.clientSecret,
        {
          payment_method: {
            card: card,
            billing_details: {
              name: `${cart.shippingAddress?.firstName} ${cart.shippingAddress?.lastName}`,
              email: cart.email,
            },
          },
        }
      );

      if (confirmError) {
        console.error('Stripe confirmation error:', confirmError);
        setErrorMessage(confirmError.message || "Payment confirmation failed.");
        return;
      }

      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        await onPaymentCompleted(session.id);
      } else {
        setErrorMessage("Payment was not successful. Please try again.");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || "An error occurred during payment processing.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="cx-btn w-full sm:w-auto"
        disabled={disabled || notReady || submitting}
        onClick={handlePayment}
        data-testid={dataTestId}
      >
        {submitting && <RiLoader2Fill className="size-4 animate-spin" />}
        {label}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

// The order is fully covered by gift cards or store credit: nothing to charge.
const GiftCardPaymentButton = ({ notReady, label, "data-testid": dataTestId }: { notReady: boolean; label: string; "data-testid"?: string }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await placeOrder()
      if (result?.success && result.redirectTo) return router.push(result.redirectTo)
      setErrorMessage("The order could not be placed")
    } catch (err: any) {
      setErrorMessage(err?.message || "The order could not be placed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={notReady || submitting}
        onClick={handlePayment}
        className="cx-btn w-full sm:w-auto"
        data-testid={dataTestId}
      >
        {submitting ? <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" /> : null}
        {label}
      </button>
      <ErrorMessage error={errorMessage} data-testid="gift-card-payment-error-message" />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady, label, cart, "data-testid": dataTestId }: { 
  notReady: boolean, 
  label: string,
  cart: PaymentButtonProps["cart"],
  "data-testid"?: string 
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const onPaymentCompleted = async (paymentSessionId?: string) => {
    try {
      const result = await placeOrder(paymentSessionId)
      if (result && typeof result === 'object' && 'success' in result && result.success && 'redirectTo' in result) {
        router.push(result.redirectTo as string)
      }
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    setSubmitting(true)
    
    const session = cart.paymentCollection?.paymentSessions?.find(
      (s) => s.isSelected && s.paymentProvider?.code === 'pp_system_default'
    )
    
    if (!session?.id) {
      setErrorMessage("Payment session not found. Please refresh and try again.");
      setSubmitting(false);
      return;
    }
    
    // For Cash on Delivery payments, we still pass the session ID but no actual payment processing needed
    onPaymentCompleted(session.id)
  }

  return (
    <>
      <button
        type="button"
        className="cx-btn w-full sm:w-auto"
        disabled={notReady || submitting}
        onClick={handlePayment}
        data-testid={dataTestId || "submit-order-button"}
      >
        {submitting && <RiLoader2Fill className="size-4 animate-spin" />} 
        {label}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="cash-on-delivery-error-message"
      />
    </>
  )
}

interface PayPalPaymentButtonProps {
  cart: PaymentButtonProps["cart"];
  notReady: boolean;
  "data-testid"?: string;
}

const PayPalPaymentButton: React.FC<PayPalPaymentButtonProps> = ({
  notReady,
  cart,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const onPaymentCompleted = async (paymentSessionId: string) => {
    try {
      const result = await placeOrder(paymentSessionId)
      if (result && typeof result === 'object' && 'success' in result && result.success && 'redirectTo' in result) {
        router.push(result.redirectTo as string)
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const session = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected && s.paymentProvider?.code === 'pp_paypal_paypal'
  )

  const handlePayment = async (
    _data: any,
    actions: any
  ) => {
    setSubmitting(true)
    
    if (!session?.id) {
      setErrorMessage("PayPal payment session not found.")
      setSubmitting(false)
      return
    }

    // Instead of authorizing here, just pass the session ID to backend
    // The backend will handle the authorization using the orderId in the session
    try {
      await onPaymentCompleted(session.id)
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred during payment processing.")
    } finally {
      setSubmitting(false)
    }
  }

  const [{ isPending }] = usePayPalScriptReducer()

  if (isPending) {
    return <RiLoader2Fill className="size-5 animate-spin text-cx-ink-3" role="status" aria-label="Loading PayPal" />
  }

  if (!session?.data?.orderId) {
    return <ErrorMessage error="PayPal order ID not found." />;
  }

  return (
    <>
      <PayPalButtons
        style={{ layout: "horizontal" }}
        createOrder={async () => session.data?.orderId as string}
        onApprove={handlePayment}
        disabled={notReady || submitting || isPending}
        data-testid={dataTestId || "paypal-payment-button"}
      />
      <ErrorMessage error={errorMessage} data-testid="paypal-payment-error-message" />
    </>
  )
}

export default PaymentButton