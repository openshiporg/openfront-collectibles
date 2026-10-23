import { getPublicCollectibleListings } from "@/features/storefront/lib/data/collectibles"
import { formatMinorAmount, slabFromGrading } from "@/features/storefront/lib/collectible-evidence-presentation"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import SectionHead from "@/features/storefront/modules/common/components/collectibles/section-head"
import SlabLabel from "@/features/storefront/modules/common/components/collectibles/slab-label"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

/** Recently listed specimens as slab-label tiles. Renders nothing when discovery is unavailable or empty. */
export default async function RecentListings({ countryCode, locale }: { countryCode: string; locale?: string }) {
  let results: any[] = []
  try {
    results = await getPublicCollectibleListings({ countryCode, limit: 8 })
  } catch {
    return null
  }
  if (!Array.isArray(results) || results.length === 0) return null

  return (
    <section className="space-y-6 pt-16 sm:pt-20" aria-label="Recently listed">
      <SectionHead title="Recently listed" meta={results.length} href="/store" />
      <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4">
        {results.map((result) => {
          const specimen = result?.extension?.value?.specimen
          const slab = slabFromGrading(result?.extension?.value?.observations?.grading)
          const price = result?.facts?.price
          const available = result?.facts?.available === true
          const title = typeof result?.title === "string" && result.title ? result.title : specimen?.displayName || "Item"
          return (
            <li key={result?.ref?.id ?? title} className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-auto sm:max-w-none">
              <LocalizedClientLink
                href={typeof result?.merchantUrl === "string" ? result.merchantUrl : "/store"}
                className="group block space-y-3"
              >
                <SlabLabel
                  size="sm"
                  company={slab?.company}
                  grade={slab?.grade}
                  gradeLabel={slab?.gradeLabel}
                  certificate={slab?.certificate}
                  verification={slab?.verification}
                  title={title}
                  line={specimen?.category}
                  className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
                />
                <div className="flex items-baseline justify-between gap-2 px-0.5">
                  {price && Number.isSafeInteger(price.amountMinor) && typeof price.currency === "string" ? (
                    <span className="cx-num text-[14px] text-cx-ink">{formatMinorAmount(price.amountMinor, price.currency, locale)}</span>
                  ) : (
                    <span className="text-[13px] text-cx-ink-3">Price on request</span>
                  )}
                  <span className="inline-flex items-baseline gap-1.5 text-[12px] text-cx-ink-2">
                    <StatusDot tone={available ? "ok" : "muted"} />
                    {result?.facts?.format === "auction" ? "Auction" : available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
