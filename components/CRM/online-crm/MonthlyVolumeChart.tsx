// app/(dashboard)/online-crm/components/MonthlyVolumeChart.tsx
'use client';

import React from 'react';
import { MONTHS_SHORT } from './constants';

interface Props {
  data: number[];          // 12 numbers
  activeMonth?: number;    // 0-11, highlight
  onSelectMonth?: (m: number) => void;
}

export function MonthlyVolumeChart({ data, activeMonth, onSelectMonth }: Props) {
  const max = Math.max(1, ...data);

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
        Monthly Online Query Volume — FY26
      </h3>

      <div className="mt-5 flex h-[140px] items-end gap-1.5">
        {data.map((val, i) => {
          const heightPct = (val / max) * 100;
          const isActive = activeMonth === i;
          return (
            <button
              key={i}
              onClick={() => onSelectMonth?.(i)}
              className="flex flex-1 flex-col items-center gap-1.5 group"
            >
              <div
                className="relative w-full flex flex-col justify-end"
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    isActive
                      ? 'bg-[#A06126]'
                      : 'bg-[#C9A574] group-hover:bg-[#A06126]/80'
                  }`}
                  style={{ height: `${Math.max(heightPct, val > 0 ? 6 : 0)}%` }}
                  title={`${MONTHS_SHORT[i]}: ${val} queries`}
                />
              </div>
              <span
                className={`text-[9px] font-semibold ${
                  isActive ? 'text-[#A06126]' : 'text-slate-500'
                }`}
              >
                {MONTHS_SHORT[i]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10.5px] text-slate-500">
        <span className="text-[#A06126] font-semibold">
          Click a bar, or pick a month above, to drill into a daily trend.
        </span>
      </p>
    </div>
  );
}