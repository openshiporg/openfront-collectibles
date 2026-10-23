"use client";

import { StatusFilter } from "../../components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    draft: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "active", label: "Active", count: statusCounts.active, tone: "ok" },
        { value: "draft", label: "Draft", count: statusCounts.draft, tone: "muted" },
      ]}
    />
  );
}
