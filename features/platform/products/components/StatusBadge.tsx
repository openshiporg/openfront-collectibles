import { cn } from "@/lib/utils";
import { Dot, type DotTone } from "@/features/platform/components/vault-ui";

export const productStatusConfig = {
  draft: { label: "Draft", tone: "muted" },
  proposed: { label: "Proposed", tone: "info" },
  published: { label: "Published", tone: "ok" },
  rejected: { label: "Rejected", tone: "danger" },
} as const satisfies Record<string, { label: string; tone: DotTone }>;

interface StatusBadgeProps {
  status: keyof typeof productStatusConfig;
  className?: string;
}

/** Status label with its dot. Place on a title line (`items-baseline`). */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = productStatusConfig[status] ?? { label: status ?? "Unknown", tone: "muted" as const };

  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <Dot tone={config.tone} />
      {config.label}
    </span>
  );
}
