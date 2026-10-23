'use client';

import React from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomSetupSteps } from './CustomSetupSteps';
import { SectionRenderer } from './SectionRenderer';
import { useOnboardingState } from '../hooks/useOnboardingState';
import { useOnboardingApi } from '../hooks/useOnboardingApi';
import { STORE_TEMPLATES, SECTION_DEFINITIONS } from '../config/templates';
import { Dot, ListBand, Pill, Track, pillClass } from '@/features/platform/components/vault-ui';
import { COLLECTIBLES_LOGO_COLOR, COLLECTIBLES_LOGO_ICON } from '@/features/storefront/lib/collectibles-brand';





// Payment provider environment variable mapping
const PAYMENT_PROVIDER_ENV_VARS: Record<string, string[]> = {
  Stripe: ['NEXT_PUBLIC_STRIPE_KEY', 'STRIPE_SECRET_KEY'],
  PayPal: ['NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
};

// Component to display payment provider environment variables
interface PaymentProviderEnvDisplayProps {
  createdProviders: string[];
}

const PaymentProviderEnvDisplay: React.FC<PaymentProviderEnvDisplayProps> = ({
  createdProviders,
}) => {
  const providersWithEnvVars = createdProviders.filter(
    (provider) => PAYMENT_PROVIDER_ENV_VARS[provider]
  );

  if (providersWithEnvVars.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
        Payment keys required
        <Dot tone="warn" />
      </h4>
      <ListBand>
        {providersWithEnvVars.map((provider) => (
          <div key={provider} className="space-y-1.5 px-3 py-2.5">
            <p className="text-sm text-foreground">{provider}</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_PROVIDER_ENV_VARS[provider].map((envVar) => (
                <code key={envVar} className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] ring-1 ring-border">
                  {envVar}
                </code>
              ))}
            </div>
          </div>
        ))}
      </ListBand>
    </div>
  );
};

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const onboardingState = useOnboardingState();
  const {
    step,
    selectedTemplate,
    currentJsonData,
    customJsonApplied,
    progressMessage,
    loadingItems,
    completedItems,
    error,
    itemErrors,
    isLoading,
    setStep,
    setSelectedTemplate,
    setCurrentJsonData,
    setCustomJsonApplied,
    setProgress,
    setItemLoading,
    setItemCompleted,
    setItemError,
    setError,
    setIsLoading,
    resetOnboardingState,
  } = onboardingState;

  const { runOnboarding } = useOnboardingApi({
    selectedTemplate,
    currentJsonData,
    completedItems,
    setProgress,
    setItemLoading,
    setItemCompleted,
    setItemError,
    setStep,
    setError,
    setIsLoading,
    resetOnboardingState,
  });



  if (!isOpen) return null;

  const template = STORE_TEMPLATES[selectedTemplate];
  const created: Array<[string, string[]]> = [
    ['Regions', template.displayNames.regions ?? []],
    ['Payment methods', template.displayNames.paymentProviders ?? []],
    ['Shipping options', template.displayNames.shipping ?? []],
    ['Categories', template.displayNames.categories ?? []],
    ['Collections', template.displayNames.collections ?? []],
    ['Items', template.displayNames.products ?? []],
  ];
  const setupOptions: Array<{ value: 'minimal' | 'full' | 'custom'; label: string }> = [
    { value: 'minimal', label: 'Basic' },
    { value: 'full', label: 'Complete' },
    { value: 'custom', label: 'Custom' },
  ];

  const actions = (
    <div className="flex flex-wrap items-center justify-end gap-2 p-4">
      {step === 'done' ? (
        <Track label="Setup actions">
          <DialogClose asChild>
            <Pill>Close</Pill>
          </DialogClose>
          <a href="/" target="_blank" rel="noopener noreferrer" data-active="true" className={pillClass}>
            Storefront
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </Track>
      ) : (
        <Track label="Setup actions">
          <DialogClose asChild>
            <Pill disabled={isLoading}>Cancel</Pill>
          </DialogClose>
          <Pill active onClick={runOnboarding} disabled={isLoading}>
            {isLoading && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {isLoading ? 'Creating' : 'Create store'}
          </Pill>
        </Track>
      )}
    </div>
  );

  const errorBanner = error && !isLoading && step !== 'done' && (
    <p role="alert" className="flex items-baseline gap-2 border-b px-4 py-3 text-sm text-destructive">
      <Dot tone="danger" />
      Setup did not complete. Check the failed items.
    </p>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="mb-0 shrink-0 border-b px-4 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: COLLECTIBLES_LOGO_ICON }}
              style={{ filter: `hue-rotate(${COLLECTIBLES_LOGO_COLOR}deg)` }}
              className="block size-5 shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
            />
            Store setup
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="order-1 flex shrink-0 flex-col lg:order-none lg:w-80 lg:border-r">
            <div className="flex-1 space-y-4 p-4 sm:p-6">
              {step === 'done' ? (
                <>
                  <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
                    Setup complete
                    <Dot tone="ok" />
                  </h3>
                  <ListBand>
                    {created.filter(([, names]) => names.length > 0).map(([label, names]) => (
                      <div key={label} className="flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono text-xs tabular-nums text-foreground">{names.length}</span>
                      </div>
                    ))}
                  </ListBand>
                  <PaymentProviderEnvDisplay createdProviders={template.displayNames.paymentProviders} />
                </>
              ) : isLoading ? (
                <>
                  <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
                    Creating {template.name}
                    <Dot tone="warn" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{progressMessage}</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground">Setup</h3>
                  <Track label="Setup type">
                    {setupOptions.map((option) => (
                      <Pill
                        key={option.value}
                        active={selectedTemplate === option.value}
                        onClick={() => setSelectedTemplate(option.value)}
                      >
                        {option.label}
                      </Pill>
                    ))}
                  </Track>
                  {selectedTemplate !== 'custom' && (
                    <ListBand>
                      {created.filter(([, names]) => names.length > 0).map(([label, names]) => (
                        <div key={label} className="flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono text-xs tabular-nums text-foreground">{names.length}</span>
                        </div>
                      ))}
                    </ListBand>
                  )}
                </>
              )}
            </div>
            <div className="mt-auto hidden flex-col border-t lg:flex">
              {errorBanner}
              {actions}
            </div>
          </div>

          <div className="order-2 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:order-none">
            {selectedTemplate === 'custom' && step === 'template' && !customJsonApplied ? (
              <CustomSetupSteps
                currentJson={currentJsonData}
                onJsonUpdate={(newJsonData) => {
                  setCurrentJsonData(newJsonData);
                  setCustomJsonApplied(true);
                }}
                onBack={() => setCustomJsonApplied(false)}
              />
            ) : (
              <SectionRenderer
                sections={SECTION_DEFINITIONS}
                selectedTemplate={selectedTemplate}
                isLoading={isLoading}
                loadingItems={loadingItems}
                completedItems={completedItems}
                itemErrors={itemErrors}
                error={error}
                step={step}
                currentJsonData={currentJsonData}
              />
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col border-t lg:hidden">
          {errorBanner}
          {actions}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
