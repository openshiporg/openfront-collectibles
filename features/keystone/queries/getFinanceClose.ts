import crypto from 'node:crypto';
import type { Context } from '.keystone/types';
import { permissions } from '../access';
import { currencyExponent } from '../../lib/minor-units';

function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function minor(value: number) { if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid recorded minor-unit money'); return value; }
function sum(values: readonly number[]) { const result = values.reduce((total, value) => total + minor(value), 0); if (!Number.isSafeInteger(result)) throw new Error('Reporting amount exceeds the safe integer range'); return result; }
export interface CurrencyClose { currency: string; exponent: number; captured: number; refunded: number; netTender: number; count: number }
export function groupFinanceRows(rows: readonly { currency: string; captured: number; refunded: number }[]): CurrencyClose[] {
  const result = new Map<string, CurrencyClose>();
  for (const row of rows) {
    const current = result.get(row.currency) ?? { currency: row.currency, exponent: currencyExponent(row.currency), captured: 0, refunded: 0, netTender: 0, count: 0 };
    current.captured = sum([current.captured, row.captured]); current.refunded = sum([current.refunded, row.refunded]);
    current.netTender = current.captured - current.refunded; current.count += 1; result.set(row.currency, current);
  }
  return [...result.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export default async function getFinanceClose(_root: unknown, { start, end }: { start: string; end: string }, context: Context) {
  if (!context.session?.itemId || !permissions.canReadPayments({ session: context.session })) throw new Error('Access denied');
  const startAt = new Date(start), endAt = new Date(end);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || startAt >= endAt || endAt.getTime() - startAt.getTime() > 31 * 86_400_000) throw new Error('Finance close range must be valid and no longer than 31 days');
  // Global payment-read authority was checked above. Native bounded projections
  // avoid formatted-price parsing and field virtuals; no provider is contacted.
  const payments = await context.sudo().prisma.payment.findMany({
    where: { createdAt: { gte: startAt, lt: endAt } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 5001,
    select: { id: true, status: true, amount: true, currencyCode: true, capturedAt: true, data: true,
      captures: { take: 501, select: { amount: true, providerCaptureKey: true } }, refunds: { take: 501, select: { amount: true } },
      order: { select: { id: true, displayId: true, metadata: true } } },
  });
  if (payments.length > 5000 || payments.some(payment => payment.captures.length > 500 || payment.refunds.length > 500)) throw new Error('Finance close exceeds the bounded reporting limit');
  const rows = payments.map(payment => {
    const currency = payment.currencyCode.toUpperCase(); currencyExponent(currency);
    const captured = sum(payment.captures.map(capture => capture.amount));
    const refunded = sum(payment.refunds.map(refund => refund.amount));
    const data = record(payment.data) ? payment.data : {};
    const reference = data.paymentIntentId ?? data.orderId ?? data.id;
    const providerReference = typeof reference === 'string' ? reference.slice(0, 500) : null;
    const metadata = record(payment.order?.metadata) ? payment.order.metadata : {};
    const snapshot = record(metadata.commercialSnapshot) ? metadata.commercialSnapshot : {};
    // A captured status, without immutable capture evidence, is not money.
    const exception = (payment.status === 'captured' && (!providerReference || captured !== minor(payment.amount))) || payment.captures.some(capture => !capture.providerCaptureKey) || refunded > captured ? 'TENDER_EVIDENCE_MISMATCH' : null;
    return { paymentId: payment.id, orderId: payment.order?.id ?? null, orderDisplayId: payment.order?.displayId ?? null, currency, status: payment.status,
      captured, refunded, netTender: captured - refunded, providerReference, capturedAt: payment.capturedAt?.toISOString() ?? null,
      accountingPolicyVersion: typeof snapshot.accountingPolicyVersion === 'string' ? snapshot.accountingPolicyVersion : null, exception };
  });
  const byCurrency = groupFinanceRows(rows), range = { start: startAt.toISOString(), end: endAt.toISOString() };
  return { generatedAt: new Date().toISOString(), range, legalEntityId: null,
    reportingCurrency: byCurrency.length === 1 ? byCurrency[0].currency : null, accountingPolicyVersion: null,
    providerSettlementStatus: 'not_reconciled', rows, byCurrency, exceptions: rows.filter(row => row.exception),
    control: { rowCount: rows.length, sha256: crypto.createHash('sha256').update(JSON.stringify({ range, byCurrency, rows })).digest('hex') } };
}
