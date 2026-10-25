"use client";
import { isStripe, isPaypal, paymentInfoMap, isStripeSandbox, isPayPalSandbox } from "@/features/storefront/lib/constants";
import { initiatePaymentSession } from "@/features/storefront/lib/data/payment";
import { CreditCard, FlaskConical } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ErrorMessage from "../error-message";
import { StripeContext } from "../payment-wrapper/stripe-wrapper";
import Radio from "@/features/storefront/modules/common/components/radio";
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot";
import StepHeader, { StepSection, SummaryBlock, optionBand, optionRow, secondaryPill } from "../step-header";
import { CardElement } from "@stripe/react-stripe-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RiLoader2Fill } from "@remixicon/react";

interface PaymentProps {
  cart: {
    id: string;
    total: number;
    paymentCollection?: {
      paymentSessions?: Array<{
        isSelected: boolean;
        status?: string;
        paymentProvider: {
          code: string;
        };
      }>;
    };
    shippingMethods: any[];
    giftCards?: any[];
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.paymentProvider?.code ?? ""
  );

  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const isOpen = searchParams?.get("step") === "payment";

  const isStripePayment = isStripe(selectedPaymentMethod);
  const stripeReady = useContext(StripeContext);

  // Check if we're in sandbox/test mode

  const paidByGiftcard =
    cart?.giftCards && cart?.giftCards?.length > 0 && cart?.total === 0;

  const paymentReady =
    (activeSession && cart?.shippingMethods.length !== 0) || paidByGiftcard;

  const useOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: "16px",
          color: "#efebe2",
          "::placeholder": {
            color: "#9d978d",
          },
        },
      },
      classes: {
        base: "block h-12 w-full appearance-none rounded-[2px] border border-cx-line bg-cx-surface px-4 pt-3.5 pb-1 transition-colors hover:border-cx-ink-3",
        focus: "border-cx-accent ring-2 ring-cx-accent/25",
        invalid: "border-cx-danger",
      },
      // Hide postal code since we already collect it in the billing address form
      hidePostalCode: true,
    };
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const shouldInputCard = isStripe(selectedPaymentMethod) && !cardComplete;

      const hasExistingSelectedSession =
        cart.paymentCollection?.paymentSessions?.some(
          (session) =>
            session.isSelected &&
            session.paymentProvider.code === selectedPaymentMethod &&
            session.status !== "error"
        );

      if (!hasExistingSelectedSession) {
        await initiatePaymentSession(cart.id, selectedPaymentMethod);
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
  }, [isOpen]);

  const giftCardSummary = (
    <SummaryBlock label="Payment method">
      <p data-testid="payment-method-summary">Gift card</p>
    </SummaryBlock>
  );

  return (
    <StepSection>
      <StepHeader
        step={3}
        title="Payment"
        done={!isOpen && !!paymentReady}
        muted={!isOpen && !paymentReady}
        action={
          !isOpen && paymentReady ? (
            <button
              type="button"
              onClick={handleEdit}
              data-testid="edit-payment-button"
              className={secondaryPill}
            >
              Edit
            </button>
          ) : null
        }
      />
      <div className={isOpen ? "mt-6 block space-y-5" : "hidden"}>
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
              onValueChange={setSelectedPaymentMethod}
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
                        {((isStripe(method.code) && isStripeSandbox()) || (isPaypal(method.code) && isPayPalSandbox())) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-cx-tint px-2 py-0.5 text-[13px] font-medium text-cx-accent">
                                  <FlaskConical className="size-3" strokeWidth={2.5} aria-hidden="true" />
                                  Test
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sandbox: do not enter real payment details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="flex size-5 items-center justify-center text-cx-ink-2">
                          {paymentInfoMap[method.code]?.icon}
                        </span>
                      </span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
            {isStripePayment && stripeReady && (
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-cx-ink-2">Card details</p>
                <CardElement
                  options={useOptions}
                  onChange={(e) => {
                    if (e.brand) {
                      setCardBrand(e.brand.charAt(0).toUpperCase() + e.brand.slice(1));
                    }
                    setError(e.error?.message || null);
                    setCardComplete(e.complete);
                  }}
                />
              </div>
            )}
          </>
        )}

        {paidByGiftcard && giftCardSummary}

        <div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              (!selectedPaymentMethod && !paidByGiftcard) ||
              !cart?.shippingMethods?.length ||
              isLoading
            }
            data-testid="submit-payment-button"
            className="cx-btn w-full sm:w-auto"
          >
            {isLoading && <RiLoader2Fill className="size-4 animate-spin"/>}
            {isStripePayment && !cardComplete
              ? "Enter card details"
              : "Continue to review"}
          </button>
          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />
        </div>
      </div>

      <div className={isOpen ? "hidden" : "block"}>
        {cart && paymentReady && activeSession ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <SummaryBlock label="Payment method">
              <p data-testid="payment-method-summary">
                {paymentInfoMap[selectedPaymentMethod]?.title ||
                  selectedPaymentMethod}
              </p>
            </SummaryBlock>
            <SummaryBlock label="Details">
              <div className="flex items-center gap-2" data-testid="payment-details-summary">
                <span className="flex h-7 items-center rounded-[2px] bg-cx-well px-2 text-cx-ink-2">
                  {paymentInfoMap[selectedPaymentMethod]?.icon || (
                    <CreditCard className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span>
                  {isStripe(selectedPaymentMethod) && cardBrand
                    ? cardBrand
                    : "Confirmed at review"}
                </span>
              </div>
            </SummaryBlock>
          </div>
        ) : paidByGiftcard ? (
          <div className="mt-5">{giftCardSummary}</div>
        ) : null}
      </div>
    </StepSection>
  );
};

export default Payment;
