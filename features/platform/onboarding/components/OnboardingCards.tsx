"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";
import { Dot, Pill, Track } from "@/features/platform/components/vault-ui";

export interface OnboardingStep {
  href: string;
  title: string;
  description: string;
}

// Base InfoCard components
interface CommonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const InfoCardTitle = React.memo(
  ({ children, className, ...props }: CommonCardProps) => {
    return (
      <div className={cn("font-medium mb-1", className)} {...props}>
        {children}
      </div>
    );
  }
);
InfoCardTitle.displayName = "InfoCardTitle";

const InfoCardDescription = React.memo(
  ({ children, className, ...props }: CommonCardProps) => {
    return (
      <div
        className={cn("text-muted-foreground leading-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoCardDescription.displayName = "InfoCardDescription";

const InfoCardContent = React.memo(
  ({ children, className, ...props }: CommonCardProps) => {
    return (
      <div className={cn("flex flex-col gap-1 text-xs", className)} {...props}>
        {children}
      </div>
    );
  }
);
InfoCardContent.displayName = "InfoCardContent";

const InfoCardFooter = ({
  children,
  className,
  isHovered,
}: CommonCardProps & { isHovered: boolean }) => {
  return (
    <div
      className={cn(
        "flex justify-between text-xs text-muted-foreground mt-2 overflow-hidden transition-all duration-300 ease-spring",
        isHovered ? "max-h-[60px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
};

export function OnboardingCards({
  steps,
  onboardingStatus,
  onDismiss,
  onOpenDialog,
  userRole,
}: {
  steps: OnboardingStep[];
  onboardingStatus?: string;
  onDismiss: () => void;
  onOpenDialog?: () => void;
  userRole?: any;
}) {
  const [dismissedSteps] = React.useState<string[]>([]);
  const cards = steps.filter(({ href }) => !dismissedSteps.includes(href));
  const cardCount = cards.length;
  const [showCompleted, setShowCompleted] = React.useState(cardCount > 0);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    if (cardCount === 0)
      timeout = setTimeout(() => setShowCompleted(false), 2700);
    return () => clearTimeout(timeout);
  }, [cardCount]);

  // Don't show onboarding if user doesn't have permission
  if (!userRole?.canManageOnboarding) {
    return null;
  }

  if (onboardingStatus === "completed" || onboardingStatus === "dismissed") {
    return null;
  }

  return cards.length || showCompleted ? (
    <div className="w-full">
      {cards.map(({ href, title, description }) => (
        <OnboardingCard
          key={href}
          title={title}
          description={description}
          onDismiss={onDismiss}
          onOpenDialog={onOpenDialog}
        />
      ))}
    </div>
  ) : null;
}

function OnboardingCard({
  title,
  description,
  onDismiss,
  onOpenDialog,
}: {
  title: string;
  description: string;
  onDismiss?: () => void;
  onOpenDialog?: () => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* Full sidebar view */}
      <div
        className={cn(
          "group relative rounded-xl bg-background p-2.5 ring-1 ring-border transition-shadow duration-200 group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden",
          "hover:shadow-sm"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
      >
        <InfoCardContent>
          <InfoCardTitle className="flex items-baseline gap-1.5">
            {title}
            <Dot tone="accent" />
          </InfoCardTitle>
          <InfoCardDescription>{description}</InfoCardDescription>
        </InfoCardContent>

        <InfoCardFooter isHovered={isHovered}>
          <Track label="Setup" className="mt-1">
            <Pill active onClick={onOpenDialog} className="min-h-7 px-2.5 text-xs">
              Set up
            </Pill>
            <Pill onClick={handleDismiss} className="min-h-7 px-2.5 text-xs">
              Skip
            </Pill>
          </Track>
        </InfoCardFooter>
      </div>

      {/* Icon-only sidebar view */}
      <div className="relative hidden group-has-[[data-collapsible=icon]]/sidebar-wrapper:block">
        <Dot tone="accent" className="absolute -right-0.5 -top-0.5 z-10 translate-y-0" />
        <button
          type="button"
          aria-label={title}
          onClick={onOpenDialog}
          className="inline-flex size-8 items-center justify-center rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] hover:text-foreground"
        >
          <Rocket className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
