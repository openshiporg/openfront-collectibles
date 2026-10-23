"use client";

import { Count, Dot, Pill, Track, type DotTone } from "../../components/vault-ui";

const statusConfig: Record<"active" | "inactive", { label: string; tone: DotTone }> = {
  active: { label: "Active", tone: "ok" },
  inactive: { label: "Inactive", tone: "muted" },
};

interface RegionStatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    inactive: number;
  };
}

export function RegionStatusTabs({ statusCounts }: RegionStatusTabsProps) {
  const statuses = [
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "inactive", label: "Inactive", count: statusCounts.inactive },
  ] as const;

  // Regions don't have a status field, so the tabs are for display only.
  const currentStatus = "all";

  const handleStatusChange = (status: string) => {
    console.log('Status changed to:', status);
  };

  return (
    <div className="px-4 py-3 md:px-6">
      <Track label="Status">
        <Pill active={currentStatus === "all"} onClick={() => handleStatusChange("all")}>
          All <Count>{statusCounts.all}</Count>
        </Pill>
        {statuses.map((status) => (
          <Pill key={status.value} active={false} onClick={() => handleStatusChange(status.value)}>
            <Dot tone={statusConfig[status.value].tone} className="translate-y-0" />
            {statusConfig[status.value].label} <Count>{status.count}</Count>
          </Pill>
        ))}
      </Track>
    </div>
  );
}
