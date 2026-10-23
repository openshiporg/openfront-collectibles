"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Dot, Pill, Track, type DotTone } from "../../components/vault-ui";

const statusConfig: Record<"withAccount" | "withoutAccount", { label: string; tone: DotTone }> = {
  withAccount: { label: "With Account", tone: "ok" },
  withoutAccount: { label: "Without Account", tone: "muted" },
};

interface StatusTabsProps {
  statusCounts: {
    all: number;
    withAccount: number;
    withoutAccount: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();

  const statuses = [
    { value: "withAccount", label: "With Account", count: statusCounts.withAccount },
    { value: "withoutAccount", label: "Without Account", count: statusCounts.withoutAccount },
  ] as const;

  // Get current status from URL
  const hasAccountFilter = searchParams.get("!hasAccount_is");
  let currentStatus = "all";

  if (hasAccountFilter === "true") {
    currentStatus = "withAccount";
  } else if (hasAccountFilter === "false") {
    currentStatus = "withoutAccount";
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 when changing status
    params.set("page", "1");

    if (status === "all") {
      params.delete("!hasAccount_is");
    } else if (status === "withAccount") {
      params.set("!hasAccount_is", "true");
    } else if (status === "withoutAccount") {
      params.set("!hasAccount_is", "false");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="px-4 py-3 md:px-6">
      <Track label="Status">
        <Pill active={currentStatus === "all"} onClick={() => handleStatusChange("all")}>
          All <Count>{statusCounts.all}</Count>
        </Pill>
        {statuses.map((status) => (
          <Pill
            key={status.value}
            active={currentStatus === status.value}
            onClick={() => handleStatusChange(status.value)}
          >
            <Dot tone={statusConfig[status.value].tone} className="translate-y-0" />
            {status.label} <Count>{status.count}</Count>
          </Pill>
        ))}
      </Track>
    </div>
  );
}
