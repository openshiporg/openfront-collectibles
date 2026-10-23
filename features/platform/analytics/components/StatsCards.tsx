"use client";

import { cn } from "@/lib/utils";
import { ListBand } from "@/features/platform/components/vault-ui";

interface StatData {
  name: string;
  value: string;
  previous: string;
  change: string;
  changeType: "positive" | "negative";
}

interface StatsCardsProps {
  data: StatData[];
  loading?: boolean;
}

const tileClass = (index: number) =>
  cn(
    "min-w-0 px-4 py-4",
    index % 2 === 0 && "border-r border-border md:border-r",
    index < 2 && "border-b border-border md:border-b-0",
    index === 1 && "md:border-r",
  );

export function StatsCards({ data, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <ListBand className="grid grid-cols-2 divide-y-0 md:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className={tileClass(index)}>
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </ListBand>
    );
  }

  return (
    <ListBand className="grid grid-cols-2 divide-y-0 md:grid-cols-4">
      {data.map((item, index) => (
        <div key={item.name} className={tileClass(index)}>
          <p className="truncate text-xs text-muted-foreground">{item.name}</p>
          <p className="mt-1 truncate font-mono text-xl font-medium tabular-nums text-foreground md:text-2xl">
            {item.value}
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-mono text-xs tabular-nums">
            <span
              className={cn(
                item.changeType === "positive"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              )}
            >
              {item.changeType === "positive" ? "+" : "-"}{item.change.replace(/^-/, "")}
            </span>
            <span className="text-muted-foreground">prev {item.previous}</span>
          </p>
        </div>
      ))}
    </ListBand>
  );
}
