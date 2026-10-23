import { ListBand, SectionTitle } from "@/features/platform/components/vault-ui";

/** Section title over one list band of label / mono value rows. */
export function MetricBand({
  title,
  rows,
}: {
  title: string;
  rows?: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="min-w-0">
      <SectionTitle>{title}</SectionTitle>
      <ListBand>
        {rows
          ? rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="font-mono text-base font-medium tabular-nums text-foreground">{row.value}</span>
              </div>
            ))
          : [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
              </div>
            ))}
      </ListBand>
    </section>
  );
}

/** Section title row (with optional control) over one chart panel. */
export function ChartPanel({
  title,
  value,
  control,
  className,
  children,
}: {
  title: string;
  value?: React.ReactNode;
  control?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 ${className ?? ""}`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {value !== undefined && (
            <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-foreground">{value}</div>
          )}
        </div>
        {control}
      </div>
      <div className="rounded-xl bg-background p-4 ring-1 ring-border">{children}</div>
    </section>
  );
}
