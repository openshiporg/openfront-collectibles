"use client"

import { Track, PillButton } from "@/features/storefront/modules/common/components/collectibles/track"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

/** Single-choice filter as raised pills in a recessed track. */
const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex min-w-0 items-center gap-3" data-testid={dataTestId}>
      <span className="cx-label hidden shrink-0 sm:inline">{title}</span>
      <Track label={title}>
        {items?.map((i) => (
          <PillButton
            key={i.value}
            active={i.value === value}
            onClick={() => handleChange(i.value)}
            data-testid="radio-label"
          >
            {i.label}
          </PillButton>
        ))}
      </Track>
    </div>
  )
}

export default FilterRadioGroup
