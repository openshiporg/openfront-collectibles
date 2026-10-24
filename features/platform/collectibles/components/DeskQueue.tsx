import Link from 'next/link';

import { BandRow, Count, Dot, ListBand, PillLink, humanize, pillClass, trackClass } from '@/features/platform/components/vault-ui';
import type { QueueResult } from '../lib/desk-data';

export function DeskQueue({ queue }: { queue: QueueResult }) {
  // Records with their own platform page open there; the rest use the generic list.
  const listHref = queue.platformPath ?? `/dashboard/${queue.path}`;
  return (
    <section aria-labelledby={`queue-${queue.key}`} className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h2 id={`queue-${queue.key}`} className="text-base font-semibold text-foreground">{queue.title}</h2>
          {queue.ok && <span className="font-mono text-xs tabular-nums text-muted-foreground">{queue.total}</span>}
        </div>
        <PillLink href={listHref}>Open list</PillLink>
      </div>

      {!queue.ok ? (
        <ListBand>
          <div className="flex min-h-12 items-baseline gap-2 px-4 py-3.5 text-sm text-muted-foreground">
            <Dot tone="muted" />
            Unavailable
          </div>
        </ListBand>
      ) : (
        <>
          {queue.counts.some((status) => status.count > 0) && (
            <nav aria-label={`${queue.title} by status`} className={trackClass}>
              <span data-active="true" className={pillClass}>
                All <Count>{queue.total}</Count>
              </span>
              {queue.counts
                .filter((status) => status.count > 0)
                .map((status) => (
                  <Link key={status.value} href={status.href} className={pillClass}>
                    <Dot tone={status.tone} className="translate-y-0" />
                    {status.label || humanize(status.value)} <Count>{status.count}</Count>
                  </Link>
                ))}
            </nav>
          )}
          <ListBand>
            {queue.rows.length === 0 ? (
              <div className="px-4 py-3.5 text-sm text-muted-foreground">None yet</div>
            ) : (
              queue.rows.map((row) => (
                <BandRow
                  key={row.id}
                  href={`${listHref}/${row.id}`}
                  title={row.title}
                  tone={row.tone}
                  state={row.state}
                  meta={row.meta || undefined}
                  trailing={row.trailing}
                />
              ))
            )}
          </ListBand>
        </>
      )}
    </section>
  );
}

