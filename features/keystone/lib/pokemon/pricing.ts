// Pure pricing arithmetic for singles, sealed and buylist offers. All amounts are integer minor units.
import type { CardCondition, PriceBasis, RoundingMode } from './card-enums';

export type MarketReading = {
  lowMinor?: number | null;
  midMinor?: number | null;
  marketMinor?: number | null;
};

export type Rule = {
  id?: string;
  appliesTo: string;
  condition?: string | null;
  basis: PriceBasis | string;
  percentBasisPoints: number;
  minimumMinor?: number | null;
  maximumChangeBasisPoints?: number | null;
  rounding: RoundingMode | string;
  priority?: number | null;
  active?: boolean | null;
};

/** The reading a rule prices from; market falls back to mid, then low. */
export function basisAmount(reading: MarketReading, basis: string): number | null {
  const pick = (value: number | null | undefined) => (typeof value === 'number' && value > 0 ? value : null);
  if (basis === 'low') return pick(reading.lowMinor) ?? pick(reading.marketMinor);
  if (basis === 'mid') return pick(reading.midMinor) ?? pick(reading.marketMinor);
  return pick(reading.marketMinor) ?? pick(reading.midMinor) ?? pick(reading.lowMinor);
}

/** Rounds up to the store's price ending; never rounds below the computed amount. */
export function roundPrice(amount: number, rounding: string): number {
  const value = Math.max(0, Math.ceil(amount));
  if (rounding === 'ninety_nine') {
    const dollars = Math.floor(value / 100);
    const candidate = dollars * 100 + 99;
    return candidate >= value ? candidate : candidate + 100;
  }
  if (rounding === 'quarter') return Math.ceil(value / 25) * 25;
  if (rounding === 'whole') return Math.ceil(value / 100) * 100;
  return value;
}

/** Most specific active rule wins: a condition rule beats an every-condition rule, then priority. */
export function chooseRule(rules: Rule[], stockKind: string, condition: CardCondition | string | null | undefined): Rule | null {
  const candidates = rules.filter(
    (rule) => rule.active !== false && rule.appliesTo === stockKind && (!rule.condition || rule.condition === condition),
  );
  candidates.sort((a, b) => {
    const specific = Number(Boolean(b.condition)) - Number(Boolean(a.condition));
    return specific || (b.priority ?? 0) - (a.priority ?? 0);
  });
  return candidates[0] ?? null;
}

export type PriceSuggestion =
  | { status: 'priced'; suggestedMinor: number; basisMinor: number; changeBasisPoints: number | null }
  | { status: 'review'; suggestedMinor: number; basisMinor: number; changeBasisPoints: number }
  | { status: 'skipped'; reason: 'no_rule' | 'no_market' };

/** Suggested sell price for one variant, with the swing guard applied against its current price. */
export function suggestPrice(rule: Rule | null, reading: MarketReading | null, currentMinor: number | null): PriceSuggestion {
  if (!rule) return { status: 'skipped', reason: 'no_rule' };
  const basis = reading ? basisAmount(reading, rule.basis) : null;
  if (!basis) return { status: 'skipped', reason: 'no_market' };
  const raw = (basis * rule.percentBasisPoints) / 10_000;
  const suggestedMinor = Math.max(roundPrice(raw, rule.rounding), rule.minimumMinor ?? 0);
  if (!currentMinor || currentMinor <= 0) return { status: 'priced', suggestedMinor, basisMinor: basis, changeBasisPoints: null };
  const changeBasisPoints = Math.round(((suggestedMinor - currentMinor) / currentMinor) * 10_000);
  const limit = rule.maximumChangeBasisPoints;
  if (limit != null && limit > 0 && Math.abs(changeBasisPoints) > limit) {
    return { status: 'review', suggestedMinor, basisMinor: basis, changeBasisPoints };
  }
  return { status: 'priced', suggestedMinor, basisMinor: basis, changeBasisPoints };
}

export type BuylistTerms = {
  cashPercentBasisPoints: number;
  creditPercentBasisPoints: number;
  conditionBasisPoints?: Record<string, number> | null;
  minimumOfferMinor?: number | null;
};

const DEFAULT_CONDITION_SHARE: Record<string, number> = { NM: 10_000, LP: 8_500, MP: 7_000, HP: 5_000, DMG: 3_000 };

export function conditionShare(terms: BuylistTerms, condition: string): number {
  const table = { ...DEFAULT_CONDITION_SHARE, ...(terms.conditionBasisPoints ?? {}) };
  return table[condition] ?? 0;
}

/** Near Mint cash and credit offers from a market price; offers round down to the cent. */
export function buylistOffersFromMarket(marketMinor: number, terms: BuylistTerms) {
  const cash = Math.floor((marketMinor * terms.cashPercentBasisPoints) / 10_000);
  const credit = Math.floor((marketMinor * terms.creditPercentBasisPoints) / 10_000);
  const minimum = terms.minimumOfferMinor ?? 0;
  return { cashMinor: Math.max(cash, minimum), creditMinor: Math.max(credit, minimum) };
}

/** The offer for a given condition, scaled from the Near Mint offer. Zero when the shop doesn't buy it. */
export function offerForCondition(nearMintMinor: number, terms: BuylistTerms, condition: string, minimumCondition?: string | null) {
  const order = ['NM', 'LP', 'MP', 'HP', 'DMG'];
  if (minimumCondition && order.indexOf(condition) > order.indexOf(minimumCondition)) return 0;
  const share = conditionShare(terms, condition);
  if (!share) return 0;
  return Math.floor((nearMintMinor * share) / 10_000);
}
