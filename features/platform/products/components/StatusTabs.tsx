"use client";

import { StatusFilter } from "@/features/platform/components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
    draft: number;
    proposed: number;
    published: number;
    rejected: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  return (
    <StatusFilter
      allCount={statusCounts.all}
      statuses={[
        { value: "published", label: "Published", count: statusCounts.published, tone: "ok" },
        { value: "draft", label: "Draft", count: statusCounts.draft, tone: "muted" },
        { value: "proposed", label: "Proposed", count: statusCounts.proposed, tone: "info" },
        { value: "rejected", label: "Rejected", count: statusCounts.rejected, tone: "danger" },
      ]}
    />
  );
}
