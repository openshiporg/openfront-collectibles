"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Track, PillButton } from "@/features/storefront/modules/common/components/collectibles/track"

export function Pagination({
  page,
  totalPages,
  'data-testid': dataTestid
}: {
  page: number
  totalPages: number
  'data-testid'?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams() ?? new URLSearchParams()

  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  const handlePageChange = (newPage: number) => {
    const currentParams = searchParams ? new URLSearchParams(searchParams) : new URLSearchParams()
    currentParams.set("page", newPage.toString())
    router.push(`${pathname}?${currentParams.toString()}`)
  }

  const pageButton = (p: number) => (
    <PillButton
      key={p}
      active={p === page}
      disabled={p === page}
      onClick={() => handlePageChange(p)}
      aria-label={`Page ${p}`}
      className="cx-num min-w-10 px-3"
    >
      {p}
    </PillButton>
  )

  const ellipsis = (key: string) => (
    <span key={key} className="cx-num inline-flex min-w-6 items-center justify-center text-[13px] text-cx-ink-3" aria-hidden="true">
      …
    </span>
  )

  const pages = () => {
    if (totalPages <= 7) return arrayRange(1, totalPages).map(pageButton)
    if (page <= 4) return [...arrayRange(1, 5).map(pageButton), ellipsis("e1"), pageButton(totalPages)]
    if (page >= totalPages - 3)
      return [pageButton(1), ellipsis("e2"), ...arrayRange(totalPages - 4, totalPages).map(pageButton)]
    return [
      pageButton(1),
      ellipsis("e3"),
      ...arrayRange(page - 1, page + 1).map(pageButton),
      ellipsis("e4"),
      pageButton(totalPages),
    ]
  }

  return (
    <nav aria-label="Pagination" className="mt-12 flex w-full justify-center" data-testid={dataTestid}>
      <Track label="Pages">
        <PillButton
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="px-2.5 disabled:no-underline"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </PillButton>
        {pages()}
        <PillButton
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="px-2.5 disabled:no-underline"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </PillButton>
      </Track>
    </nav>
  )
}
