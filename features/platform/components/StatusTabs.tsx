'use client';

import { StatusFilter, type DotTone } from '@/features/platform/components/vault-ui';

type StatusConfig = Record<string, { label: string; color?: string }>;

interface StatusTabsProps {
  statusCounts: Record<string, number | undefined>;
  statusConfig?: StatusConfig;
  entityName?: string;
}

const TONE_BY_COLOR: Record<string, DotTone> = {
  green: 'ok', emerald: 'ok', teal: 'ok',
  amber: 'warn', orange: 'warn', yellow: 'warn',
  red: 'danger', rose: 'danger',
  blue: 'info', sky: 'info', indigo: 'info', purple: 'accent', violet: 'accent',
  zinc: 'muted', gray: 'muted', slate: 'muted',
};

const TONE_BY_STATUS: Record<string, DotTone> = {
  active: 'ok', published: 'ok', completed: 'ok', paid: 'ok', approved: 'ok', available: 'ok',
  pending: 'info', draft: 'muted', scheduled: 'info', proposed: 'info',
  requires_action: 'warn', review: 'warn', paused: 'warn', on_hold: 'warn',
  archived: 'muted', inactive: 'muted', disabled: 'muted', expired: 'muted',
  canceled: 'danger', cancelled: 'danger', rejected: 'danger', failed: 'danger', declined: 'danger',
};

// Adapt the family filter protocol, but render the actual supported states rather
// than the starter's hard-coded order states on every kind of record.
export function StatusTabs({ statusCounts, statusConfig, entityName = 'Items' }: StatusTabsProps) {
  const states = Object.entries(statusCounts).filter(([key]) => key !== 'all');
  return (
    <StatusFilter
      allLabel={`All ${entityName.toLowerCase()}`}
      allCount={statusCounts.all}
      statuses={states.map(([key, count]) => {
        const color = statusConfig?.[key]?.color;
        const label = statusConfig?.[key]?.label ?? key.replaceAll('_', ' ');
        return {
          value: key,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          count,
          tone: (color && TONE_BY_COLOR[color]) || TONE_BY_STATUS[key] || 'muted',
        };
      })}
    />
  );
}
