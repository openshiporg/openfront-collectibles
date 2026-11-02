import * as React from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Reads <option> elements (fragments and arrays included) into select options.
 * A disabled option with an empty value is the prompt ("Select customer"): it becomes the
 * placeholder instead of a choice. An enabled empty option ("Unassigned", "None") stays a choice.
 */
export function optionsFromChildren(children: React.ReactNode): { options: SelectOption[]; placeholder?: string } {
  const options: SelectOption[] = [];
  let placeholder: string | undefined;
  const walk = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean }>(child)) return;
      if (child.type === React.Fragment) { walk(child.props.children); return; }
      const label = React.Children.toArray(child.props.children).join("");
      const value = String(child.props.value ?? label);
      if (value === "" && child.props.disabled) { placeholder = label; return; }
      options.push({ value, label, ...(child.props.disabled ? { disabled: true } : {}) });
    });
  };
  walk(children);
  return { options, placeholder };
}
