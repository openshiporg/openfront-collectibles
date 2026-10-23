import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import React, { useId } from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  const id = useId()

  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        name={name}
        data-testid={dataTestId}
        className="size-5 rounded-[6px] border-cx-ink-3 bg-cx-surface data-[state=checked]:border-cx-ink data-[state=checked]:bg-cx-ink data-[state=checked]:text-cx-bg"
      />
      <Label htmlFor={id} className="text-[14px] font-normal text-cx-ink">
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
