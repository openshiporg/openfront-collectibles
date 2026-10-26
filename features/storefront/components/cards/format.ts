import { CARD_CONDITIONS, CARD_FINISHES, CARD_LANGUAGES, SEALED_FORMATS, labelOf } from '@/features/keystone/lib/pokemon/card-enums';

export const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;

export function money(minor: number | null | undefined, currencyCode = 'USD', options: { whole?: boolean } = {}) {
  if (minor == null || !Number.isFinite(minor)) return '';
  const code = currencyCode.toUpperCase();
  const whole = options.whole && minor % 100 === 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(minor / 100);
  } catch {
    return `${code} ${(minor / 100).toFixed(2)}`;
  }
}

export const conditionLabel = (code: string | null | undefined) => labelOf(CARD_CONDITIONS, code);
export const finishLabel = (code: string | null | undefined) => labelOf(CARD_FINISHES, code);
export const languageLabel = (code: string | null | undefined) => labelOf(CARD_LANGUAGES, code);
export const sealedFormatLabel = (code: string | null | undefined) => labelOf(SEALED_FORMATS, code);

/** "199/165" stays as printed; a bare number is padded to the set's printed width. */
export function printedNumber(number: string | null | undefined) {
  return number ? String(number) : '';
}

/** The part before the slash, for the number column. */
export function shortNumber(number: string | null | undefined) {
  return number ? String(number).split('/')[0] : '';
}

export function releaseDay(iso: string | null | undefined, style: 'short' | 'long' = 'short') {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** "Oct 25" for row stamps; the year only when it isn't this year. */
export function shortDay(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return new Intl.DateTimeFormat('en-US', sameYear ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function observedDay(iso: string | null | undefined) {
  return releaseDay(iso, 'short');
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
