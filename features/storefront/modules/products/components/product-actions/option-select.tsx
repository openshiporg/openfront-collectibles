"use client"

import React from "react";

import { onlyUnique } from "../../../../lib/util/only-unique";
import { Track, PillButton } from "@/features/storefront/modules/common/components/collectibles/track";

const SIZE_ORDER = {
  "XXS": 1, "XS": 2, "S": 3, "M": 4, "L": 5, "XL": 6, "XXL": 7, "XXXL": 8
};

type OptionSelectProps = {
  option: any;
  current: string | undefined;
  updateOption: (update: any) => void;
  title: string;
  disabled?: boolean;
  "data-testid"?: string;
};

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = option.productOptionValues
    .map((v: any) => v.value)
    .filter(onlyUnique)
    .sort((a: string, b: string) => {
      if (title.toLowerCase() === "size") {
        return (SIZE_ORDER[a as keyof typeof SIZE_ORDER] || 999) - (SIZE_ORDER[b as keyof typeof SIZE_ORDER] || 999);
      }
      return a.localeCompare(b);
    });

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="cx-label">{title}</span>
        {current && <span className="text-cx-ink-2">{current}</span>}
      </span>
      <Track label={title} className="self-start" >
        {filteredOptions.map((v: any) => (
          <PillButton
            key={v}
            active={current === v}
            onClick={() => updateOption({ [option.id]: v })}
            disabled={disabled}
            data-testid={dataTestId ?? "option-button"}
          >
            {v}
          </PillButton>
        ))}
      </Track>
    </div>
  );
}

export default OptionSelect;
