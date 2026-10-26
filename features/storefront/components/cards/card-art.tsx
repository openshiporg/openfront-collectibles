import type { ReactNode } from 'react';
import { cn } from './format';

// Card art at the printed 63 x 88 mm ratio. Images come from the Pokémon TCG API's host by URL.
export function CardArt({
  src,
  alt,
  fallback,
  badges,
  eager,
  sizes,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback?: ReactNode;
  badges?: ReactNode;
  eager?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={cn('tc-art', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote card art by URL, sized by its frame
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" sizes={sizes} fetchPriority={eager ? 'high' : undefined} />
      ) : (
        <div className="tc-art-fallback">{fallback ?? alt}</div>
      )}
      {badges ? <div className="tc-badges">{badges}</div> : null}
    </div>
  );
}

export function CardBadge({ children, tone }: { children: ReactNode; tone?: 'accent' }) {
  return <span className="tc-badge" data-tone={tone}>{children}</span>;
}

const TICK_LABEL: Record<string, string> = {
  in: 'In stock',
  out: 'Sold out',
  wanted: 'On your want list',
  preorder: 'Pre-order',
  owned: 'In your binder',
  none: 'Not stocked',
};

/** The checklist's one control shape. Solid when held, hollow when out, dashed when wanted. */
export function Tick({ state, index = 0, label }: { state: keyof typeof TICK_LABEL; index?: number; label?: string }) {
  const filled = state === 'in' || state === 'owned';
  return (
    <span className="tc-tick" data-state={state} role="img" aria-label={label ?? TICK_LABEL[state]} style={{ ['--tc-i' as string]: index }}>
      {filled ? (
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.2 6.4l2.4 2.4 5.2-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      ) : null}
    </span>
  );
}
