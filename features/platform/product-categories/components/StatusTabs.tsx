"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Dot, Pill, Track, type DotTone } from "../../components/vault-ui";

const statusConfig: Record<"active" | "inactive", { label: string; tone: DotTone }> = {
  active: { label: "Active", tone: "ok" },
  inactive: { label: "Inactive", tone: "muted" },
};

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    inactive: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();

  const statuses = [
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "inactive", label: "Inactive", count: statusCounts.inactive },
  ] as const;

  // Get current status from URL - isActive is a checkbox field
  const isActiveFilter = searchParams.get("!isActive_is");
  let currentStatus = "all";

  if (isActiveFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(isActiveFilter));
      if (parsed === true) {
        currentStatus = "active";
      } else if (parsed === false) {
        currentStatus = "inactive";
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
      params.delete("!isActive_is");
    } else {
      // For checkbox fields, use simple boolean value
      const filterValue = status === "active" ? true : false;
      params.set("!isActive_is", JSON.stringify(filterValue));
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
