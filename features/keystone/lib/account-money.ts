import type { Context } from '.keystone/types';
import { currencyExponent } from '../../lib/minor-units';
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
export function sumAccountCurrencyDebt(code: string, rows: unknown, count: number): number | null {
  if (!Array.isArray(rows) || count !== rows.length || count > 1000) return null;
  const exponent = currencyExponent(code);
  if (exponent !== 0 && exponent !== 2) return null;
  let sum = 0;
  for (const row of rows) {
    if (!record(row) || typeof row.amount !== 'number' || !Number.isSafeInteger(row.amount) || row.amount < 0 || !record(row.order) || !record(row.order.currency) || typeof row.order.currency.code !== 'string' || row.order.currency.code.toUpperCase() !== code.toUpperCase()) return null;
    sum += row.amount;
    if (!Number.isSafeInteger(sum) || sum > 2147483647) return null;
  }
  return sum;
}
export async function loadAccountDebt(id: string, context: Pick<Context, 'sudo'>) {
  const query = context.sudo().query;
  const account = await query.Account.findOne({ where: { id }, query: 'creditLimit currency { code }' });
  if (!record(account) || !record(account.currency) || typeof account.currency.code !== 'string') return null;
  const where = { account: { id: { equals: id } }, paymentStatus: { equals: 'unpaid' as const } };
  const rows = await query.AccountLineItem.findMany({ where, take: 1001, query: 'amount order { currency { code } }' });
  const count = await query.AccountLineItem.count({ where });
  const owed = sumAccountCurrencyDebt(account.currency.code, rows, count);
  const limit = account.creditLimit;
  const available = owed !== null && typeof limit === 'number' && Number.isSafeInteger(limit) && limit >= 0 ? Math.max(0, limit - owed) : null;
  return { currency: account.currency.code, owed, available };
}
export function formatAccountMoney(value: number | null, code: string) {
  return value === null ? null : new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value / 10 ** currencyExponent(code));
}
