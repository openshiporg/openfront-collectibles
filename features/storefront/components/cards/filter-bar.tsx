'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export type FilterOption = { value: string; label: string };
export type FilterSpec = { id: string; label: string; options: FilterOption[]; allLabel?: string };

/**
 * Card filters as square selects that write to the URL: set, rarity, condition, language,
 * price, or whatever the page passes. Mobile-first: they wrap, two to a row on a phone.
 */
export function FilterBar({ filters, label = 'Filter cards', resetLabel = 'Clear filters' }: { filters: FilterSpec[]; label?: string; resetLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams() ?? new URLSearchParams();
  const [pending, startTransition] = useTransition();
  const active = filters.filter((f) => params.get(f.id));

  const update = (id: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(id, value);
    else next.delete(id);
    next.delete('page');
    startTransition(() => router.push(`${pathname}${next.size ? `?${next.toString()}` : ''}`, { scroll: false }));
  };

  const clear = () => {
    const next = new URLSearchParams(params.toString());
    filters.forEach((f) => next.delete(f.id));
    next.delete('page');
    startTransition(() => router.push(`${pathname}${next.size ? `?${next.toString()}` : ''}`, { scroll: false }));
  };

  // On a phone the products come first: Sort stays in view and the other filters fold into one button (S8).
  const [open, setOpen] = useState(false);
  const sort = filters.find((f) => f.id === 'sortBy');
  const rest = filters.filter((f) => f !== sort);
  const field = (filter: FilterSpec, className = '') => {
    const value = params.get(filter.id) ?? '';
    return (
      <label key={filter.id} className={`tc-field ${className}`}>
        <span>{filter.label}</span>
        <select className="tc-select w-full sm:w-auto" value={value} data-active={value ? 'true' : undefined} onChange={(e) => update(filter.id, e.target.value)}>
          <option value="">{filter.allLabel ?? 'All'}</option>
          {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    );
  };
  const restActive = rest.filter((f) => params.get(f.id)).length;

  return (
    <section className="tc" aria-label={label} aria-busy={pending}>
      {rest.length > 2 ? (
        <div className="grid grid-cols-2 items-end gap-2 sm:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="tc-filter-panel"
            onClick={() => setOpen((v) => !v)}
            className="tc-select flex min-h-11 items-center justify-between text-left"
            data-active={restActive ? 'true' : undefined}
          >
            <span>Filters{restActive ? ` (${restActive})` : ''}</span>
            <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
          {sort ? field(sort) : <span />}
        </div>
      ) : null}
      <div id="tc-filter-panel" className={`tc-filters grid grid-cols-2 sm:flex ${rest.length > 2 ? (open ? 'mt-2 sm:mt-0' : 'max-sm:hidden') : ''}`}>
        {filters.map((filter) => {
          if (rest.length > 2 && filter === sort) return field(filter, 'max-sm:hidden');
          return field(filter);
        })}
        {active.length ? (
          <button type="button" onClick={clear} className="col-span-2 min-h-10 self-end px-1 text-left text-[14px] text-[var(--tc-ink-2)] underline underline-offset-4 hover:text-[var(--tc-ink)] sm:col-span-1">
            {resetLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
