"use client"

import FilterRadioGroup from "../../../../common/components/filter-radio-group"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Newest",
  },
  {
    value: "price_asc",
    label: "Price low to high",
  },
  {
    value: "price_desc",
    label: "Price high to low",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title="Sort"
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
