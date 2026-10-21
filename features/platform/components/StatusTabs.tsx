'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type StatusConfig = Record<string, { label: string; color: string }>;
interface StatusTabsProps {
  statusCounts: Record<string, number>;
  statusConfig?: StatusConfig;
  entityName?: string;
}
// Adapt the family filter protocol, but render actual supported states rather
// than the starter's hard-coded order states on every kind of record.
export function StatusTabs({ statusCounts, statusConfig, entityName = 'Items' }: StatusTabsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();
  let current = 'all';
  try {
    const parsed: unknown = JSON.parse(searchParams?.get('!status_matches') ?? '[]');
    if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0] in statusCounts) current = parsed[0];
  } catch { /* Malformed URL filters are not selected states. */ }
  const states = Object.entries(statusCounts).filter(([key]) => key !== 'all');
  const change = (status: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (status === 'all') params.delete('!status_matches');
    else params.set('!status_matches', JSON.stringify([status]));
    params.set('page', '1');
    router.push(`${pathname}?${params}`);
  };
  return <div className="overflow-x-auto px-4 py-2 md:px-6">
    <div className="inline-flex min-h-11 gap-1 rounded-lg bg-muted p-1" aria-label={`${entityName} status`}>
      {[['all', `All ${entityName}`, statusCounts.all], ...states.map(([key, count]) => [key, statusConfig?.[key]?.label ?? key.replaceAll('_', ' '), count] as const)].map(([key, label, count]) => <button
        key={String(key)} type="button" aria-pressed={current === key}
        onClick={() => change(String(key))}
        className={cn('min-h-11 min-w-11 whitespace-nowrap rounded-md px-3 text-sm font-medium focus-visible:outline-2', current === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
      >{label} {typeof count === 'number' ? `(${count})` : ''}</button>)}
    </div>
  </div>;
}
