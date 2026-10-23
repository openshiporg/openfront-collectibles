"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Dot, Pill, Track, type DotTone } from "../../components/vault-ui";

const statusConfig: Record<"active" | "disabled", { label: string; tone: DotTone }> = {
  active: { label: "Active", tone: "ok" },
  disabled: { label: "Disabled", tone: "muted" },
};

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    disabled: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams()!;
  const pathname = usePathname();

  const statuses = [
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "disabled", label: "Disabled", count: statusCounts.disabled },
  ] as const;

  // Get current status from URL - isDisabled is a checkbox field
  const isDisabledFilter = searchParams.get("!isDisabled_is");
  let currentStatus = "all";

  if (isDisabledFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(isDisabledFilter));
      if (parsed === false) {
        currentStatus = "active";
      } else if (parsed === true) {
        currentStatus = "disabled";
      }
    } catch (e) {
      // Invalid JSON in URL, ignore
    }
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 when changing status
    params.set("page", "1");

    if (status === "all") {
      params.delete("!isDisabled_is");
    } else {
      // For checkbox fields, use simple boolean value
      // isDisabled: false for active, true for disabled
      const filterValue = status === "active" ? false : true;
      params.set("!isDisabled_is", JSON.stringify(filterValue));
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
