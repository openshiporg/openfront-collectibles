import { formatMinorToMajor } from '@/features/lib/minor-units';

/** `USD 1,250.00` from integer minor units; never floats. */
export function money(amountMinor: unknown, currencyCode: unknown): string {
  if (typeof amountMinor !== 'number' || typeof currencyCode !== 'string') return '—';
  try {
    const [whole, fraction] = formatMinorToMajor(amountMinor, currencyCode).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currencyCode} ${fraction ? `${grouped}.${fraction}` : grouped}`;
  } catch {
    return '—';
  }
}

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC', timeZoneName: 'short',
});

function parse(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function day(value: unknown): string {
  const date = parse(value);
  return date ? dayFormat.format(date) : '—';
}

export function dateTime(value: unknown): string {
  const date = parse(value);
  return date ? timeFormat.format(date) : '—';
}
