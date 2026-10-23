'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Columns3,
  Plus,
} from "lucide-react"
import { FilterAdd } from "../../dashboard/components/FilterAdd"
import { FilterList } from "../../dashboard/components/FilterList"
import { SortSelection } from "../../dashboard/components/SortSelection"
import { FieldSelection } from "../../dashboard/components/FieldSelection"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { useDashboard } from '../../dashboard/context/DashboardProvider'
import { enhanceFields } from '../../dashboard/utils/enhanceFields'

/** Class for a feature's own create button passed as `customCreateButton`. */
export const platformCreateButtonClass =
  "h-10 rounded-full px-3 text-[13px] font-medium lg:w-auto lg:px-4 [&_svg]:size-4"

interface PlatformFilterBarProps {
  list: any
  customCreateButton?: React.ReactNode
  createMode?: 'button' | 'dropdown'
  onCreateClick?: (mode?: 'scratch' | 'popular') => void
  createLabel?: string
  showDisplayButton?: boolean
  selectedFields?: Set<string>
}

export function PlatformFilterBar({ 
  list, 
  customCreateButton, 
  createMode = 'button',
  onCreateClick,
  createLabel,
  showDisplayButton = false,
  selectedFields = new Set()
}: PlatformFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams() ?? new URLSearchParams()
  const { basePath } = useDashboard()

  const [searchString, setSearchString] = useState(
    searchParams?.get("search") || ""
  )

  // Get enhanced fields using dashboard's pattern
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields, list.key)
  }, [list.fields, list.key])

  // Create a new URLSearchParams instance to manipulate
  const createQueryString = (
    params: Record<string, string | number | null | undefined>
  ) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "")

    // Update or delete parameters based on the provided object
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, String(value))
      }
    })

    return newSearchParams.toString()
  }

  // Handle search submission
  const updateSearch = (value: string) => {
    const query = createQueryString({
      search: value.trim() || null,
      page: 1, // Reset to first page when search changes
    })
    router.push(`${pathname}?${query}`)
  }

  // Update search string when URL changes
  useEffect(() => {
    setSearchString(searchParams?.get("search") || "")
  }, [searchParams])

  // Get searchable field labels for placeholder
  const searchableFields = Object.values(enhancedFields).filter((field: any) => 
    field.controller?.filter && Object.keys(field.controller.filter.types || {}).length > 0
  )
  const searchLabels = searchableFields.map((field: any) => field.label)

  const control =
    "h-10 rounded-full border-0 bg-muted px-3 text-[13px] font-medium text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] hover:bg-muted/80 dark:bg-muted/60 lg:w-auto lg:px-4 [&_svg]:size-4"
  const create = platformCreateButtonClass

  return (
    <div>
      {/* Controls Row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateSearch(searchString)
            }}
          >
            <Input
              type="search"
              className="h-10 w-full rounded-full border-0 bg-muted pl-10 text-sm shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] placeholder:text-muted-foreground/80 focus-visible:bg-background dark:bg-muted/60"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              placeholder={`Search by ${
                searchLabels.length
                  ? searchLabels.join(", ").toLowerCase()
                  : "ID"
              }`}
            />
          </form>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5">
          <FilterAdd list={list}>
            <Button variant="ghost" size="icon" className={control}>
              <SlidersHorizontal className="stroke-muted-foreground" />
              <span className="hidden lg:inline">Filter</span>
            </Button>
          </FilterAdd>

          <SortSelection listMeta={list}>
            <Button variant="ghost" size="icon" className={control}>
              <ArrowUpDown className="stroke-muted-foreground" />
              <span className="hidden lg:inline">Sort</span>
            </Button>
          </SortSelection>

          {showDisplayButton && (
            <FieldSelection listMeta={list} selectedFields={selectedFields}>
              <Button variant="ghost" size="icon" className={control}>
                <Columns3 className="stroke-muted-foreground" />
                <span className="hidden lg:inline">Display</span>
              </Button>
            </FieldSelection>
          )}

          {!list.hideCreate && (
            customCreateButton || (
              (createMode === 'dropdown' && onCreateClick) ? (
                <Button
                  onClick={() => onCreateClick?.()}
                  size="icon"
                  className={create}
                >
                  <Plus />
                  <span className="hidden lg:inline">{createLabel || `Create ${list.singular}`}</span>
                </Button>
              ) : (
                <Link
                  href={`${basePath}/platform/${list.path}/create`}
                  className={cn(buttonVariants({ size: "icon" }), create)}
                >
                  <Plus />
                  <span className="hidden lg:inline">Create {list.singular}</span>
                </Link>
              )
            )
          )}
        </div>
      </div>

    </div>
  )
}
