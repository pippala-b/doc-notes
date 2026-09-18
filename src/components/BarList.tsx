"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number; detail?: string };

// Single-series horizontal bars: one hue, thin marks with rounded data-ends,
// values in text ink (never the series color), per-row hover/focus detail.
export default function BarList({
  data,
  unit = "",
  max,
}: {
  data: BarDatum[];
  unit?: string;
  max?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="list" className="flex flex-col gap-1.5">
      {data.map((d, i) => (
        <div
          key={d.label}
          role="listitem"
          tabIndex={0}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 rounded-md px-1 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="truncate text-ink-2" title={d.label}>
            {d.label}
          </span>
          <span className="relative h-2.5 rounded-r bg-track">
            <span
              className="absolute inset-y-0 left-0 rounded-r bg-series"
              style={{ width: `${(Math.max(0, d.value) / top) * 100}%`, minWidth: d.value > 0 ? 3 : 0 }}
            />
          </span>
          <span className="min-w-10 text-right tabular-nums">
            {d.value}
            {unit && <span className="text-ink-2"> {unit}</span>}
          </span>
          {active === i && d.detail && (
            <span className="col-span-3 -mt-0.5 text-xs text-ink-2">{d.detail}</span>
          )}
        </div>
      ))}
    </div>
  );
}
