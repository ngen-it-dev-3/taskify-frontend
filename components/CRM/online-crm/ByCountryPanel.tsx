// app/(dashboard)/online-crm/components/ByCountryPanel.tsx
'use client';

import React from 'react';

interface CountryRow {
  country: string;
  count: number;
  pct: number;
}

interface Props {
  rows: CountryRow[];
  total: number;
}

const COLORS = ['#4A3AD9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function ByCountryPanel({ rows, total }: Props) {
  // Build SVG donut segments
  const radius = 40;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = rows.map((r, i) => {
    const dash = (r.pct / 100) * circumference;
    const seg = {
      color: COLORS[i % COLORS.length],
      dash,
      offset,
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          By Country
        </h3>
        <select className="rounded border border-[#E2DBD1] bg-[#FDFBF7] px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none">
          <option>Country wise</option>
          <option>Source wise</option>
        </select>
      </div>

      <div className="mt-4 flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={stroke}
            />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-500">Total</span>
            <span className="text-[18px] font-bold text-[#0F2D4A]">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {rows.map((r, i) => (
            <div key={r.country} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium text-slate-700">{r.country}</span>
              </div>
              <span className="font-mono font-semibold text-slate-800">
                {r.count}{' '}
                <span className="text-slate-400">({r.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}