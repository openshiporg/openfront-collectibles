import { Dot } from "../../components/vault-ui";

interface StatusBadgeProps {
  isActive: boolean;
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
      <Dot tone={isActive ? "ok" : "muted"} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
