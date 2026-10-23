'use client';

import { Count, Pill, Track } from "../../components/vault-ui";

interface StatusTabsProps {
  statusCounts: {
    all: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  // Collections only have "all" for now
  return (
    <div className="px-4 py-3 md:px-6">
      <Track label="Status">
        <Pill active>
          All <Count>{statusCounts.all}</Count>
        </Pill>
      </Track>
    </div>
  );
}
