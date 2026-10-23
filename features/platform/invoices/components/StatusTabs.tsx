"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Dot, Pill, Track, type DotTone } from "../../components/vault-ui";

const statusConfig: Record<string, { label: string; tone: DotTone }> = {
  active: { label: "Active", tone: "ok" },
  suspended: { label: "Suspended", tone: "warn" },
  not_approved: { label: "Not Approved", tone: "danger" },
  paid: { label: "Paid", tone: "ok" },
  overdue: { label: "Overdue", tone: "danger" },
};

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    suspended: number;
    not_approved: number;
    paid: number;
    overdue: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams()!;
  const pathname = usePathname();

  const statuses = [
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "suspended", label: "Suspended", count: statusCounts.suspended },
    { value: "not_approved", label: "Not Approved", count: statusCounts.not_approved },
    { value: "paid", label: "Paid", count: statusCounts.paid },
    { value: "overdue", label: "Overdue", count: statusCounts.overdue },
  ] as const;

  // Get current status from URL
  const statusFilter = searchParams.get("!status_equals");
  let currentStatus = "all";

  if (statusFilter) {
    currentStatus = statusFilter;
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 when changing status
    params.set("page", "1");

    if (status === "all") {
      params.delete("!status_equals");
    } else {
      params.set("!status_equals", status);
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
