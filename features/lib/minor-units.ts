// Adapted from Restaurant's features/keystone/utils/providerRefunds.ts:
// decimal text -> integer digits, never parseFloat/multiply/round a price.
export function currencyExponent(currency: string): number {
  const code = currency.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !Intl.supportedValuesOf('currency').includes(code)) throw new Error('Unsupported currency');
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits;
  if (digits === undefined || digits < 0 || digits > 4) throw new Error('Unsupported currency precision');
  return digits;
}
export function parseMajorToMinor(value: unknown, currency: string, maximum = 2_147_483_647): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Amount must be decimal text or a finite number');
  const text = String(value).trim();
  if (text.length > 80 || !/^\d+(\.\d+)?$/.test(text)) throw new Error('Enter a non-negative decimal amount');
  const digits = currencyExponent(currency);
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > digits && /[1-9]/.test(fraction.slice(digits))) throw new Error('Amount exceeds currency precision');
  const minor = BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.slice(0, digits).padEnd(digits, '0') || '0');
  if (!Number.isSafeInteger(maximum) || maximum < 0 || minor > BigInt(maximum)) throw new Error('Amount exceeds the supported integer range');
  return Number(minor);
}
export function formatMinorToMajor(amount: number, currency: string): string {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid minor-unit amount');
  const digits = currencyExponent(currency), raw = String(amount).padStart(digits + 1, '0');
  return digits ? `${raw.slice(0, -digits)}.${raw.slice(-digits)}` : raw;
}
