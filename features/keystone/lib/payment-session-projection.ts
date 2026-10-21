import type { JSONValue } from '@keystone-6/core/types';

// Fixed intermediate GraphQL selections only. Typed item returns still use the
// native DB API so DateTime fields retain their installed scalar representation.
export interface PaymentSessionProjection {
  id: string; isSelected?: boolean; isInitiated?: boolean;
  paymentProvider: { id: string; code?: string };
  data?: JSONValue;
}
export interface PaymentCollectionProjection {
  id: string; amount?: number; paymentSessions?: PaymentSessionProjection[];
}
export interface PaymentContainerProjection {
  id: string; totalAmount: number;
  currency: { code: string; noDivisionCurrency?: boolean };
  region?: { paymentProviders: { id: string; code: string; isInstalled: boolean }[] } | null;
  paymentCollection?: PaymentCollectionProjection | null;
}
