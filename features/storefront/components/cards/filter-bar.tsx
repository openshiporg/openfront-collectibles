'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

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

  return (
    <section className="tc" aria-label={label} aria-busy={pending}>
      <div className="tc-filters grid grid-cols-2 sm:flex">
        {filters.map((filter) => {
          const value = params.get(filter.id) ?? '';
          return (
            <label key={filter.id} className="tc-field">
              <span>{filter.label}</span>
              <select className="tc-select w-full sm:w-auto" value={value} data-active={value ? 'true' : undefined} onChange={(e) => update(filter.id, e.target.value)}>
                <option value="">{filter.allLabel ?? 'All'}</option>
                {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          );
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
