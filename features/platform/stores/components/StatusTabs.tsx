"use client";

import { StatusFilter } from "../../components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    inactive: number;
    draft: number;
    published: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "active", label: "Active", count: statusCounts.active, tone: "ok" },
        { value: "inactive", label: "Inactive", count: statusCounts.inactive, tone: "muted" },
        { value: "draft", label: "Draft", count: statusCounts.draft, tone: "warn" },
        { value: "published", label: "Published", count: statusCounts.published, tone: "info" },
      ]}
    />
  );
}
