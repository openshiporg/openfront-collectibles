"use client";

import * as React from "react";
import { PlatformSelect } from "./PlatformSelect";
import { optionsFromChildren } from "../lib/select-options";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  /** Same shape as a native select's change handler, so call sites keep reading event.target.value. */
  onChange?: (event: { target: { value: string } }) => void;
  children: React.ReactNode;
};

/**
 * Drop-in for a native <select> with <option> children: same props, but it opens the platform's
 * popover list, so phones get readable type and real touch targets instead of the OS wheel.
 * A disabled empty-value option becomes the placeholder.
 */
export function OptionSelect({ children, onChange, className, ...props }: Props) {
  const { options, placeholder } = optionsFromChildren(children);
  return (
    <PlatformSelect
      {...props}
      className={className}
      options={options}
      placeholder={placeholder}
      onValueChange={onChange ? (value) => onChange({ target: { value } }) : undefined}
    />
  );
}
