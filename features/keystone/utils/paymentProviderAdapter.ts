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
  if (typeof adapterKey === 'string' && /^[a-z]+:/i.test(adapterKey)) {
    // External adapters: HTTPS only, bounded, no redirects, projected provider record.
    if (!/^https:\/\//i.test(adapterKey)) throw new Error('External payment adapters must use HTTPS');
    const projectedProvider = { id: provider.id, code: provider.code, credentials: provider.credentials || {}, metadata: provider.metadata || {} };
    try {
      const response = await fetch(adapterKey, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, provider: projectedProvider }),
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      return await response.json();
    } catch {
      throw new Error('External payment adapter request failed; reconcile the original attempt before retrying');
    }
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
    const wrapped = new Error(
      `Error executing ${functionName} for provider ${adapterKey}: ${error instanceof Error ? error.message : String(error)}`
    );
    // Adapters mark a definitive refusal (the processor did not move money); everything else is an unknown outcome.
    if ((error as { providerDeclined?: unknown } | null)?.providerDeclined === true) Object.assign(wrapped, { providerDeclined: true });
    throw wrapped;
  }
}

export type ProviderRefundSummary = { id: string; amount: number; status: string };

export type VerifiedPaymentOperationResult = {
  status: string;
  amount: number;
  currency: string;
  data?: unknown;
  /** Present only when the adapter was asked for refunds and reports them. */
  refunds?: ProviderRefundSummary[];
};

function parseProviderRefunds(value: unknown): ProviderRefundSummary[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const refunds: ProviderRefundSummary[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return undefined;
    const { id, amount, status } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) return undefined;
    refunds.push({ id, amount, status: typeof status === 'string' ? status : '' });
  }
  return refunds;
}

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

  const refunds = 'refunds' in value ? parseProviderRefunds(value.refunds) : undefined;
  return {
    status: status.trim(),
    amount,
    currency: normalizedCurrency,
    ...('data' in value ? { data: value.data } : {}),
    ...(refunds ? { refunds } : {}),
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

export async function getPaymentStatus({ provider, paymentId, includeRefunds }: { provider: Record<string, any>; paymentId: string; includeRefunds?: boolean }): Promise<VerifiedPaymentOperationResult> {
  const result = await executeAdapterFunction({ provider, functionName: 'getPaymentStatusFunction', args: includeRefunds ? { paymentId, includeRefunds } : { paymentId } });
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
