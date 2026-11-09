// components/CRM/online-crm/ByCountryPanel.tsx
'use client';

import React from 'react';

interface CountryRow {
  country: string;
  count: number;
  pct: number;
}

export type GroupBy = 'country' | 'source' | 'assigned' | 'stage';

interface Props {
  rows: CountryRow[];
  total: number;
  by?: GroupBy;
  onChangeBy?: (by: GroupBy) => void;
}

const COLORS = [
  '#4A3AD9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export function ByCountryPanel({
  rows,
  total,
  by = 'country',
  onChangeBy,
}: Props) {
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

  const title =
    by === 'source'
      ? 'By Source'
      : by === 'assigned'
        ? 'By Assignee'
        : by === 'stage'
          ? 'By Stage'
          : 'By Country';

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {title}
        </h3>
        <select
          value={by}
          onChange={(e) => onChangeBy?.(e.target.value as GroupBy)}
          className="rounded border border-[#E2DBD1] bg-[#FDFBF7] px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="country">Country wise</option>
          <option value="source">Source wise</option>
          <option value="assigned">Assignee wise</option>
          <option value="stage">Stage wise</option>
        </select>
      </div>

      <div className="mt-4 flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="-1 -1 105 100">
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
            <span className="text-[10px] font-semibold text-slate-500">
              Total
            </span>
            <span className="text-[18px] font-bold text-[#0F2D4A]">
              {total}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {rows.map((r, i) => (
            <div
              key={`${r.country}-${i}`}
              className="flex items-center justify-between text-[11px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium text-slate-700 truncate">
                  {r.country}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-800 shrink-0 ml-2">
                {r.count} <span className="text-slate-400">({r.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}