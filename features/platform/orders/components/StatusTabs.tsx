"use client";

import { StatusFilter } from "@/features/platform/components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    pending: number;
    requires_action: number;
    completed: number;
    archived: number;
    canceled: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "pending", label: "Pending", count: statusCounts.pending, tone: "info" },
        { value: "requires_action", label: "Requires action", count: statusCounts.requires_action, tone: "warn" },
        { value: "completed", label: "Completed", count: statusCounts.completed, tone: "ok" },
        { value: "archived", label: "Archived", count: statusCounts.archived, tone: "muted" },
        { value: "canceled", label: "Canceled", count: statusCounts.canceled, tone: "danger" },
      ]}
    />
  );
}
