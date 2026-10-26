'use client';

import { useId, useMemo, useState } from 'react';
import { money, observedDay } from './format';
import type { MarketReading } from './types';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 56 };

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) return [min];
  const span = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const unit = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= count) ?? step * 10;
  const ticks = [];
  for (let v = Math.ceil(min / unit) * unit; v <= max + 1e-9; v += unit) ticks.push(Math.round(v));
  return ticks;
}

/**
 * Market price over time for one printing: the market line, the low line dashed under it.
 * Until there is a week of readings it prints the readings as a table instead of a chart.
 */
export function PriceHistory({ readings, currencyCode = 'USD', label }: { readings: MarketReading[]; currencyCode?: string; label: string }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(
    () => readings.filter((r) => r.marketMinor != null).sort((a, b) => a.observedAt.localeCompare(b.observedAt)),
    [readings],
  );

  if (!points.length) {
    return <p className="text-[14px] text-[var(--tc-ink-3)]">No market readings yet.</p>;
  }

  const spanDays = (new Date(points[points.length - 1].observedAt).getTime() - new Date(points[0].observedAt).getTime()) / 86_400_000;
  if (points.length < 3 || spanDays < 7) {
    // Too little history for a trend: print the readings themselves.
    const latest = points[points.length - 1];
    return (
      <figure className="tc grid gap-3" aria-label={label}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="tc-num text-[28px] font-bold leading-none text-[var(--tc-ink)]">{money(latest.marketMinor, currencyCode)}</span>
          <span className="text-[13px] text-[var(--tc-ink-3)]">{label}, {observedDay(latest.observedAt)}</span>
        </div>
        <table className="tc-num w-full text-left text-[13px] text-[var(--tc-ink-2)]">
          <thead className="text-[var(--tc-ink-3)]">
            <tr><th className="py-1 font-normal">Read</th><th className="py-1 text-right font-normal">Low</th><th className="py-1 text-right font-normal">Mid</th><th className="py-1 text-right font-normal">Market</th></tr>
          </thead>
          <tbody>
            {points.slice().reverse().map((p) => (
              <tr key={p.observedAt} className="border-t border-[var(--tc-line)]">
                <td className="py-1.5">{observedDay(p.observedAt)}</td>
                <td className="py-1.5 text-right">{money(p.lowMinor, currencyCode)}</td>
                <td className="py-1.5 text-right">{money(p.midMinor ?? null, currencyCode)}</td>
                <td className="py-1.5 text-right font-semibold text-[var(--tc-ink)]">{money(p.marketMinor, currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <figcaption className="text-[12px] text-[var(--tc-ink-3)]">A chart appears once there is a week of readings.</figcaption>
      </figure>
    );
  }

  const t0 = new Date(points[0].observedAt).getTime();
  const t1 = new Date(points[points.length - 1].observedAt).getTime();
  const values = points.flatMap((p) => [p.marketMinor!, p.lowMinor ?? p.marketMinor!]);
  const vMin = Math.min(...values) * 0.97;
  const vMax = Math.max(...values) * 1.03;
  const x = (iso: string) => PAD.left + ((new Date(iso).getTime() - t0) / Math.max(1, t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - vMin) / Math.max(1, vMax - vMin)) * (H - PAD.top - PAD.bottom);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.observedAt).toFixed(1)},${y(p.marketMinor!).toFixed(1)}`).join('');
  const lowLine = points.filter((p) => p.lowMinor != null).map((p, i) => `${i ? 'L' : 'M'}${x(p.observedAt).toFixed(1)},${y(p.lowMinor!).toFixed(1)}`).join('');
  // Ticks inside the fitted domain, plus the floor so the lowest reading is never unlabeled.
  const ticks = [...new Set([Math.round(vMin), ...niceTicks(vMin, vMax).filter((v) => v > vMin && v < vMax)])];
  const last = points[points.length - 1];
  const first = points[0];
  const change = last.marketMinor! - first.marketMinor!;
  const active = hover != null ? points[hover] : null;

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * (W - PAD.left - PAD.right) + PAD.left;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(x(p.observedAt) - px) < Math.abs(x(points[best].observedAt) - px)) best = i; });
    setHover(best);
  };

  return (
    <figure className="tc grid gap-3" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="tc-num text-[28px] font-bold leading-none text-[var(--tc-ink)]">{money(last.marketMinor, currencyCode)}</span>
        <span className="text-[13px] text-[var(--tc-ink-3)]">
          {label} · {change === 0 ? 'unchanged' : `${change > 0 ? 'up' : 'down'} ${money(Math.abs(change), currencyCode)}`} since {observedDay(first.observedAt)}
        </span>
      </figcaption>
      <div className="tc-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: market price from ${money(first.marketMinor, currencyCode)} to ${money(last.marketMinor, currencyCode)}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--tc-line)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--tc-ink-3)" className="tc-num">{money(t, currencyCode, { whole: true })}</text>
            </g>
          ))}
          <path d={lowLine} fill="none" stroke="var(--tc-ink-3)" strokeWidth="1" strokeDasharray="3 3" />
          <path d={line} fill="none" stroke="var(--tc-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--tc-ink-3)">{observedDay(first.observedAt)}</text>
          <text x={W - PAD.right} y={H - 8} fontSize="11" textAnchor="end" fill="var(--tc-ink-3)">{observedDay(last.observedAt)}</text>
          {active ? (
            <g>
              <line x1={x(active.observedAt)} x2={x(active.observedAt)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--tc-ink-3)" strokeWidth="1" />
              <circle cx={x(active.observedAt)} cy={y(active.marketMinor!)} r="5" fill="var(--tc-accent)" stroke="var(--tc-bg)" strokeWidth="2" />
            </g>
          ) : null}
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {active ? (
          <div className="tc-chart-tip tc-num" style={{ left: `${(x(active.observedAt) / W) * 100}%`, top: `${(y(active.marketMinor!) / H) * 100}%` }}>
            <div className="font-bold">{money(active.marketMinor, currencyCode)}</div>
            <div className="text-[var(--tc-ink-3)]">{observedDay(active.observedAt)} · low {money(active.lowMinor, currencyCode)}</div>
          </div>
        ) : null}
      </div>
      <details className="text-[13px] text-[var(--tc-ink-2)]">
        <summary className="cursor-pointer text-[var(--tc-ink-3)] hover:text-[var(--tc-ink)]">Readings as a table</summary>
        <table className="tc-num mt-2 w-full text-left">
          <thead className="text-[var(--tc-ink-3)]"><tr><th className="py-1 font-normal">Date</th><th className="font-normal text-right">Low</th><th className="font-normal text-right">Market</th></tr></thead>
          <tbody>
            {points.slice().reverse().map((p) => (
              <tr key={p.observedAt} className="border-t border-[var(--tc-line)]">
                <td className="py-1">{observedDay(p.observedAt)}</td>
                <td className="text-right">{money(p.lowMinor, currencyCode)}</td>
                <td className="text-right">{money(p.marketMinor, currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
