import { conditionLabel, money, observedDay } from '@/features/storefront/components/cards';
import { getMarketStatus, getPricingRules } from '../actions';
import { RefreshMarketPrices, Repricing } from '../components/PricingActions';
import { DeskError, DeskFrame, DeskLink, DeskSection } from '../components/frame';

const APPLIES: Record<string, string> = { raw: 'Singles', sealed: 'Sealed', graded: 'Graded slabs' };
const BASIS: Record<string, string> = { market: 'market', low: 'low', mid: 'mid' };
const ROUNDING: Record<string, string> = { none: 'to the cent', ninety_nine: 'up to .99', quarter: 'up to the quarter', whole: 'up to the dollar' };

export async function PricingPage() {
  const [rules, status] = await Promise.all([getPricingRules(), getMarketStatus()]);
  const latest = status.success ? status.data.latest[0] : null;

  return (
    <DeskFrame
      title="Market & repricing"
      meta={latest ? `${status.success ? status.data.marketPricesCount : 0} market readings · latest ${observedDay(latest.observedAt)}` : 'No market readings yet'}
      actions={<><DeskLink href="/dashboard/market-prices">All readings</DeskLink><DeskLink href="/dashboard/pricing-rules">Edit rules</DeskLink></>}
    >
      <DeskSection title="Market prices">
        <RefreshMarketPrices />
      </DeskSection>

      <DeskSection title="Pricing rules" meta={rules.success ? `${rules.data.pricingRules.length} rules` : undefined}>
        {!rules.success ? (
          <DeskError message={rules.error} />
        ) : rules.data.pricingRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rules. Market-priced stock is skipped until a rule covers it.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border text-sm">
            {rules.data.pricingRules.map((rule: any) => (
              <li key={rule.id} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                <a href={`/dashboard/pricing-rules/${rule.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {rule.name}
                  {!rule.active ? <span className="ml-2 text-xs font-normal text-muted-foreground">Off</span> : null}
                </a>
                <span className="tabular-nums text-muted-foreground">
                  {APPLIES[rule.appliesTo] ?? rule.appliesTo}
                  {rule.condition ? ` · ${conditionLabel(rule.condition)}` : ''}
                  {` · ${(rule.percentBasisPoints / 100).toFixed(rule.percentBasisPoints % 100 ? 1 : 0)}% of ${BASIS[rule.basis] ?? rule.basis}`}
                  {` · floor ${money(rule.minimumMinor)} · ${ROUNDING[rule.rounding] ?? rule.rounding}`}
                  {rule.maximumChangeBasisPoints ? ` · review past ±${rule.maximumChangeBasisPoints / 100}%` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DeskSection>

      <DeskSection title="Repricing">
        <p className="text-sm text-muted-foreground">
          Applies the rules to every variant set to follow the market, from its latest reading. Swings past a rule&rsquo;s review limit are listed, not applied.
        </p>
        <Repricing />
      </DeskSection>
    </DeskFrame>
  );
}

export default PricingPage;
