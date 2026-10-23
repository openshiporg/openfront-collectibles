"use client";

import { StatusFilter } from "../../components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    pending: number;
    approved: number;
    not_approved: number;
    requires_info: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "pending", label: "Pending", count: statusCounts.pending, tone: "info" },
        { value: "approved", label: "Approved", count: statusCounts.approved, tone: "ok" },
        { value: "not_approved", label: "Not Approved", count: statusCounts.not_approved, tone: "danger" },
        { value: "requires_info", label: "Requires Info", count: statusCounts.requires_info, tone: "warn" },
      ]}
    />
  );
}
