// app/(dashboard)/sales-crm/components/KpiCard.tsx
'use client';

import React from 'react';

interface Props {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: string;
  valueClass?: string;
  trend?: 'up' | 'down' | 'flat';
}

export function KpiCard({
  icon,
  label,
  sub,
  value,
  valueClass = 'text-[#0F2D4A]',
  trend,
}: Props) {
  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span className="text-sm">{icon}</span>
        {label}
      </div>
      <div className={`mt-2 font-mono text-2xl font-bold ${valueClass}`}>
        {value}
        {trend === 'up' && (
          <span className="ml-1 text-xs text-emerald-600 align-top">↑</span>
        )}
      </div>
      <div className="mt-1 text-[10.5px] text-slate-500">{sub}</div>
    </div>
  );
}