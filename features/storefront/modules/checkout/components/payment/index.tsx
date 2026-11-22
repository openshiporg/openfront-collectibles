"use client";
import { isStripe, isManual, paymentInfoMap } from "@/features/storefront/lib/constants";
import { initiatePaymentSession } from "@/features/storefront/lib/data/payment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ErrorMessage from "../error-message";
import { StripeContext } from "../payment-wrapper/stripe-wrapper";
import Radio from "@/features/storefront/modules/common/components/radio";
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot";
import StepHeader, { StepSection, SummaryBlock, optionBand, optionRow, secondaryPill } from "../step-header";
import PaymentButton from "../payment-button";
import { CardElement } from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RiLoader2Fill } from "@remixicon/react";

interface PaymentProps {
  cart: {
    id: string;
    total: number | string;
    shippingAddress?: any;
    billingAddress?: any;
    email?: string;
    paymentCollection?: {
      paymentSessions?: Array<{
        id: string;
        data?: { clientSecret?: string; orderId?: string };
        isSelected: boolean;
        status?: string;
        paymentProvider: {
          code: string;
        };
      }>;
    };
    shippingMethods: any[];
    giftCards?: any[];
    rawTotal?: number;
  };
  availablePaymentMethods: Array<{
    id: string;
    code: string;
  }>;
}

const Payment = ({ cart, availablePaymentMethods }: PaymentProps) => {
  const activeSession = cart.paymentCollection?.paymentSessions?.find(
    (session) => session.isSelected
  );

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.paymentProvider?.code ?? availablePaymentMethods?.[0]?.code ?? ""
  );

  const searchParams = useSearchParams() ?? new URLSearchParams();
  const step = searchParams?.get("step");
  // Payment is the last step: the order is placed from here.
  const isOpen = step === "payment" || step === "review";

  const isStripePayment = isStripe(selectedPaymentMethod);
  const stripeReady = useContext(StripeContext);

  const paidByGiftcard =
    (cart?.giftCards?.length ?? 0) > 0 && cart?.rawTotal === 0;

  const deliveryReady =
    !!cart?.shippingAddress && !!cart?.billingAddress && (cart?.shippingMethods?.length ?? 0) > 0;

  // The session for the chosen method exists on the cart, so its pay control can render.
  const sessionReady =
    !!activeSession && activeSession.paymentProvider?.code === selectedPaymentMethod;

  const useOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: "16px",
          fontSmoothing: "antialiased",
          color: "#efebe2",
          iconColor: "#b5afa5",
          "::placeholder": {
            color: "#9d978d",
          },
        },
        invalid: {
          color: "#f0857a",
          iconColor: "#f0857a",
        },
      },
      classes: {
        base: "block h-12 w-full appearance-none rounded-[2px] border border-cx-line bg-cx-surface px-4 pt-3.5 pb-1 transition-colors hover:border-cx-ink-3",
        focus: "border-cx-accent! ring-2 ring-cx-accent/25",
        invalid: "border-cx-danger!",
      },
      // Hide postal code since we already collect it in the billing address form
      hidePostalCode: true,
    };
  }, []);

  // Start (or reuse) the payment session as soon as the step opens or the method changes,
  // so the card field is on screen before the pay button. One attempt per method and total.
  const startedFor = useRef<string | null>(null);
  const startSession = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      await initiatePaymentSession(cart.id, selectedPaymentMethod);
    } catch (err) {
      startedFor.current = null;
      setError(err instanceof Error ? err.message : "Could not start the payment");
    } finally {
      setStarting(false);
    }
  }, [cart.id, selectedPaymentMethod]);

  useEffect(() => {
    if (!isOpen || paidByGiftcard || !deliveryReady || !selectedPaymentMethod) return;
    const key = `${selectedPaymentMethod}:${cart.rawTotal}`;
    if (startedFor.current === key) return;
    startedFor.current = key;
    void startSession();
  }, [isOpen, paidByGiftcard, deliveryReady, selectedPaymentMethod, cart.rawTotal, startSession]);

  const payLabel = paidByGiftcard
    ? "Place order"
    : isManual(selectedPaymentMethod)
      ? `Place order · ${cart.total}`
      : `Pay ${cart.total}`;

  return (
    <StepSection>
      <StepHeader step={3} title="Payment" muted={!isOpen} />
      {isOpen && (
        <div className="mt-6 space-y-5">
          {!paidByGiftcard && !availablePaymentMethods?.length && (
            <p className="cx-band flex items-baseline gap-2 px-4 py-3.5 text-[14px] text-cx-ink-2" role="status" data-testid="no-payment-methods">
              <StatusDot tone="danger" />
              No payment method is available for this region
            </p>
          )}
          {!paidByGiftcard && availablePaymentMethods?.length > 0 && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(value) => {
                  setCardComplete(false);
                  setSelectedPaymentMethod(value);
                }}
                className={optionBand}
                aria-label="Payment method"
              >
                {availablePaymentMethods.map((method) => {
                  const selected = selectedPaymentMethod === method.code
                  return (
                    <div key={method.id} className="relative">
                      <RadioGroupItem
                        value={method.code}
                        id={method.id}
                        className="sr-only"
                      />
                      <Label htmlFor={method.id} className={optionRow(selected)}>
                        <span className="flex min-w-0 items-center gap-3">
                          <Radio checked={selected} />
                          <span className="min-w-0 font-normal">
                            {paymentInfoMap[method.code]?.title || method.code}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="flex size-5 items-center justify-center text-cx-ink-2">
                            {paymentInfoMap[method.code]?.icon}
                          </span>
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
              {isStripePayment && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-cx-ink-2">Card details</p>
                  {stripeReady && sessionReady ? (
                    <CardElement
                      options={useOptions}
                      onChange={(e) => {
                        setError(e.error?.message || null);
                        setCardComplete(e.complete);
                      }}
                    />
                  ) : (
                    <div
                      className="flex h-12 w-full items-center gap-2 rounded-[2px] border border-cx-line bg-cx-surface px-4 text-[14px] text-cx-ink-3"
                      role="status"
                      data-testid="card-field-loading"
                    >
                      {starting && <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" />}
                      {error ? "Card field unavailable" : "Loading card field"}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {paidByGiftcard && (
            <SummaryBlock label="Payment method">
              <p data-testid="payment-method-summary">Gift card</p>
            </SummaryBlock>
          )}

          <div className="flex items-baseline justify-between gap-4 rounded-[2px] bg-cx-well px-4 py-3">
            <span className="text-[14px] text-cx-ink-2">Order total</span>
            <span className="cx-num text-[18px] text-cx-ink" data-testid="payment-total">{cart?.total}</span>
          </div>
          <p className="text-[13px] leading-[20px] text-cx-ink-2">
            Placing the order accepts the store&apos;s terms of sale, returns policy and privacy policy.
          </p>

          <div>
            {paidByGiftcard || (sessionReady && (!isStripePayment || stripeReady)) ? (
              <PaymentButton
                cart={cart as any}
                label={payLabel}
                cardComplete={cardComplete}
                data-testid="submit-order-button"
              />
            ) : (
              <button type="button" disabled className="cx-btn w-full sm:w-auto" data-testid="submit-order-button">
                {starting && <RiLoader2Fill className="size-4 animate-spin" aria-hidden="true" />}
                {payLabel}
              </button>
            )}
            <ErrorMessage error={error} data-testid="payment-method-error-message" />
            {error && !starting && !sessionReady && !paidByGiftcard && (
              <button
                type="button"
                onClick={() => {
                  startedFor.current = `${selectedPaymentMethod}:${cart.rawTotal}`;
                  void startSession();
                }}
                className={`${secondaryPill} mt-3`}
                data-testid="retry-payment-button"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </StepSection>
  );
};

export default Payment;
