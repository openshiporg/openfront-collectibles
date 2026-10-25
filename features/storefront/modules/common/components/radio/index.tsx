const Radio = ({ checked, 'data-testid': dataTestId }: { checked: boolean, 'data-testid'?: string }) => {
  return (
    <span
      role="presentation"
      data-state={checked ? "checked" : "unchecked"}
      className="relative flex size-5 shrink-0 items-center justify-center rounded-[2px] bg-cx-surface ring-1 ring-cx-ink-3 transition-colors data-[state=checked]:bg-cx-ink data-[state=checked]:ring-cx-ink"
      data-testid={dataTestId || 'radio-button'}
    >
      {checked && <span className="size-2 rounded-full bg-cx-bg" />}
    </span>
  )
}

export default Radio
