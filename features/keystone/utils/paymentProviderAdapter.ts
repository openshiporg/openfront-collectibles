import { z } from 'zod';
import { paymentProviderAdapters } from '../../integrations/payment';

export async function executeAdapterFunction({ provider, functionName, args }: {
  provider: Record<string, any>;
  functionName: string;
  args: Record<string, unknown>;
}): Promise<unknown> {
  // A specialized claimed workflow export must not be callable through legacy dispatch.
  if (!['createPaymentFunction', 'capturePaymentFunction', 'refundPaymentFunction', 'getPaymentStatusFunction', 'generatePaymentLinkFunction', 'handleWebhookFunction'].includes(functionName)) throw new Error('Payment provider operation is not registered');
  const adapterKey = provider?.[functionName];
  if (typeof adapterKey === 'string' && adapterKey.startsWith('http')) {
    const response = await fetch(adapterKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...args }),
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  if (typeof adapterKey !== 'string' || !Object.prototype.hasOwnProperty.call(paymentProviderAdapters, adapterKey)) {
    throw new Error('Payment provider adapter is not registered');
  }

  const adapter = await paymentProviderAdapters[adapterKey as keyof typeof paymentProviderAdapters]();
  const fn = adapter[functionName as keyof typeof adapter];
  if (typeof fn !== 'function') throw new Error('Payment provider operation is not registered');

  try {
    const operation = fn as unknown as (input: Record<string, unknown>) => Promise<unknown>;
    return await operation({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${adapterKey}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export type VerifiedPaymentOperationResult = {
  status: string;
  amount: number;
  currency: string;
  data?: unknown;
};

export function parseVerifiedPaymentOperationResult(value: unknown): VerifiedPaymentOperationResult {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Payment provider returned an invalid operation result');
  }

  if (!('status' in value) || !('amount' in value) || !('currency' in value)) {
    throw new Error('Payment provider returned an invalid operation result');
  }
  const status = value.status;
  const amount = value.amount;
  const currency = value.currency;
  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
  if (
    typeof status !== 'string' || status.trim().length === 0 || status.trim().length > 64 ||
    typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0 ||
    !/^[A-Z]{3}$/.test(normalizedCurrency)
  ) {
    throw new Error('Payment provider returned an invalid operation result');
  }

  return {
    status: status.trim(),
    amount,
    currency: normalizedCurrency,
    ...('data' in value ? { data: value.data } : {}),
  };
}

type PaymentOperationArgs = {
  provider: Record<string, any>;
  paymentId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
};

export async function createPayment({ provider, cart, amount, currency }: {
  provider: Record<string, any>;
  cart: Record<string, any>;
  amount: number;
  currency: string;
}) {
  return executeAdapterFunction({ provider, functionName: 'createPaymentFunction', args: { cart, amount, currency } });
}

export async function capturePayment({ provider, paymentId, amount, currency, idempotencyKey }: PaymentOperationArgs): Promise<VerifiedPaymentOperationResult> {
  const result = await executeAdapterFunction({ provider, functionName: 'capturePaymentFunction', args: { paymentId, amount, currency, idempotencyKey } });
  return parseVerifiedPaymentOperationResult(result);
}

export async function refundPayment({ provider, paymentId, amount, currency, idempotencyKey }: PaymentOperationArgs) {
  return executeAdapterFunction({ provider, functionName: 'refundPaymentFunction', args: { paymentId, amount, currency, idempotencyKey } });
}

export async function getPaymentStatus({ provider, paymentId }: { provider: Record<string, any>; paymentId: string }): Promise<VerifiedPaymentOperationResult> {
  const result = await executeAdapterFunction({ provider, functionName: 'getPaymentStatusFunction', args: { paymentId } });
  return parseVerifiedPaymentOperationResult(result);
}

export async function generatePaymentLink({ provider, paymentId }: { provider: Record<string, any>; paymentId: string }) {
  return executeAdapterFunction({ provider, functionName: 'generatePaymentLinkFunction', args: { paymentId } });
}

const verifiedWebhookSchema = z.object({
  isValid: z.literal(true), type: z.string().min(1).max(200),
  event: z.object({ id: z.string().min(1).max(500) }).passthrough(),
  resource: z.object({
    id: z.string().max(500).optional(), currency: z.string().regex(/^[a-z]{3}$/i).optional(),
    amount_received: z.number().int().safe().nonnegative().optional(),
    amount: z.union([z.number().int().safe().nonnegative(), z.object({ value: z.string().regex(/^\d+(\.\d+)?$/).max(80), currency_code: z.string().regex(/^[a-z]{3}$/i) })]).optional(),
    metadata: z.record(z.string()).optional(), custom_id: z.string().max(500).optional(),
  }).passthrough(),
});
export function parseVerifiedWebhookResult(value: unknown) { return verifiedWebhookSchema.parse(value); }

export async function handleWebhook({ provider, event, headers }: {
  provider: Record<string, any>;
  event: unknown;
  headers: Record<string, unknown>;
}) {
  const result = await executeAdapterFunction({ provider, functionName: 'handleWebhookFunction', args: { event, headers } });
  return parseVerifiedWebhookResult(result);
}
