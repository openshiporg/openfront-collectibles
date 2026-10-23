import { cn } from "@/lib/utils";
import { Dot, type DotTone } from "@/features/platform/components/vault-ui";

export const orderStatusConfig = {
  pending: { label: "Pending", tone: "info" },
  completed: { label: "Completed", tone: "ok" },
  archived: { label: "Archived", tone: "muted" },
  canceled: { label: "Canceled", tone: "danger" },
  requires_action: { label: "Requires action", tone: "warn" },
} as const satisfies Record<string, { label: string; tone: DotTone }>;

export function orderStatusTone(status?: string): DotTone {
  return orderStatusConfig[status as keyof typeof orderStatusConfig]?.tone ?? "muted";
}

export function orderStatusLabel(status?: string): string {
  return orderStatusConfig[status as keyof typeof orderStatusConfig]?.label ?? (status ?? "Unknown");
}

interface StatusBadgeProps {
  status: keyof typeof orderStatusConfig;
  className?: string;
}

/** Status label with its dot. Place on a title line (`items-baseline`). */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <Dot tone={orderStatusTone(status)} />
      {orderStatusLabel(status)}
    </span>
  );
}
