import { Metadata } from "next"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { getCardSets } from "@/features/storefront/lib/data/cards"
import { SetSummary } from "@/features/storefront/components/cards"

export const metadata: Metadata = { title: "Sets" }

export async function SetsPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  const currencyCode = region?.currency?.code?.toUpperCase() || "USD"
  const sets = await getCardSets(currencyCode)
  const bySeries = new Map<string, typeof sets>()
  for (const set of sets) bySeries.set(set.series || "Other", [...(bySeries.get(set.series || "Other") ?? []), set])

  return (
    <div className="tc mx-auto w-full max-w-[1320px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-cx-display text-[44px] leading-none text-cx-ink sm:text-[64px]">Sets</h1>
      <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.5] text-cx-ink-2">
        Every set we carry, as its full printed checklist. {sets.length} sets, newest first.
      </p>
      {sets.length === 0 ? (
        <p className="mt-12 text-[16px] text-cx-ink-2">No sets yet.</p>
      ) : (
        <div className="mt-10 grid gap-14">
          {[...bySeries.entries()].map(([series, list]) => (
            <section key={series} aria-labelledby={`series-${series}`}>
              <h2 id={`series-${series}`} className="border-b-2 border-cx-ink pb-2 text-[18px] font-bold text-cx-ink">{series}</h2>
              <ul className="grid divide-y divide-cx-line sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0">
                {list.map((set) => (
                  <li key={set.handle} className="sm:border-b sm:border-cx-line">
                    <SetSummary set={set} have={set.cardsStocked ?? 0} href={`/${countryCode}/sets/${set.handle}`} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
