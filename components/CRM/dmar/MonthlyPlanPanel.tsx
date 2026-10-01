// app/(dashboard)/dmar/components/MonthlyPlanPanel.tsx
'use client';

import React from 'react';
import type { MonthlyPlanData } from './constants';

interface Props {
  data: MonthlyPlanData | null;
  onOpenSettings?: () => void;
}

export function MonthlyPlanPanel({ data, onOpenSettings }: Props) {
  if (!data) {
    return (
      <div className="h-[280px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white" />
    );
  }

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
        Monthly Marketing Plan — {data.month}
      </h3>

      <div className="divide-y divide-[#F0EBE3]">
        {data.rows.map((row) => {
          const pct =
            row.planned > 0
              ? Math.min(100, Math.round((row.actual / row.planned) * 100))
              : 0;
          const isOver = row.actual > row.planned;
          return (
            <div key={row.key} className="py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-slate-700">
                  {row.key}
                </span>
                <span className="font-mono text-[11px] text-slate-600">
                  <strong className={isOver ? 'text-emerald-700' : 'text-slate-800'}>
                    {row.actual}
                  </strong>
                  {' / '}
                  {row.planned} planned
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    isOver ? 'bg-emerald-600' : 'bg-[#A06126]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.rows.length === 0 && (
          <div className="py-8 text-center text-[11px] italic text-slate-400">
            No plan configured for this month.
          </div>
        )}
      </div>

      <button
        onClick={onOpenSettings}
        className="mt-4 text-[10px] text-slate-500 hover:text-[#A06126] transition underline-offset-2 hover:underline"
      >
        Set in Universal Settings — editable per marketing staff, per month.
      </button>
    </div>
  );
}