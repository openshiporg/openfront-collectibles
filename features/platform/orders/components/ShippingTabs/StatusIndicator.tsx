'use client';

import { Dot } from '@/features/platform/components/vault-ui';
import type { ShippingProvider } from '../../types';

interface StatusIndicatorProps {
  provider: Partial<ShippingProvider> & { id: string; name: string };
  isPreset?: boolean;
}

export function StatusIndicator({ provider, isPreset }: StatusIndicatorProps) {
  if (isPreset && !provider?.isActive) {
    return <Dot tone="muted" className="translate-y-0" />;
  }

  return <Dot tone={provider?.isActive ? 'ok' : 'danger'} className="translate-y-0" />;
}
