'use client';

import { CONDITIONS, conditionLabel, money } from './format';
import type { StockCell } from './types';

/**
 * NM to DMG, read like a size run: a live cell is something the shop holds and can sell.
 * With `onSelect` the live cells are buttons; without, the run is a read-only record.
 */
export function ConditionRun({
  cells,
  selected,
  onSelect,
  currencyCode = 'USD',
  showAll = true,
  label = 'Condition',
}: {
  cells: StockCell[];
  selected?: string | null;
  onSelect?: (cell: StockCell) => void;
  currencyCode?: string;
  showAll?: boolean;
  label?: string;
}) {
  const byCondition = new Map(cells.map((cell) => [cell.condition, cell]));
  const shown = showAll ? CONDITIONS : CONDITIONS.filter((c) => byCondition.has(c));
  return (
    <span className="tc-run" role={onSelect ? 'radiogroup' : 'list'} aria-label={label}>
      {shown.map((condition) => {
        const cell = byCondition.get(condition);
        const live = Boolean(cell?.available);
        const title = cell
          ? `${conditionLabel(condition)}: ${live ? `${cell.quantity ?? ''} ${cell.quantity === 1 ? 'copy' : 'copies'} at ${money(cell.priceMinor, currencyCode)}`.trim() : 'sold out'}`
          : `${conditionLabel(condition)}: not stocked`;
        if (onSelect && live && cell) {
          return (
            <button
              key={condition}
              type="button"
              role="radio"
              aria-checked={selected === condition}
              className="tc-run-cell"
              data-live="true"
              data-selected={selected === condition ? 'true' : undefined}
              title={title}
              aria-label={title}
              onClick={() => onSelect(cell)}
            >
              {condition}
            </button>
          );
        }
        return (
          <span key={condition} role={onSelect ? 'radio' : 'listitem'} aria-checked={onSelect ? false : undefined} aria-disabled={onSelect ? true : undefined} className="tc-run-cell" data-live={live ? 'true' : 'false'} title={title} aria-label={title}>
            {condition}
          </span>
        );
      })}
    </span>
  );
}
