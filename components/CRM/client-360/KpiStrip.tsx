// app/(dashboard)/crm/client-360/components/KpiStrip.tsx
'use client';

import React from 'react';
import type { Client360 } from './constants';
import { fmtMoney, fmtDate } from './constants';

interface Props {
  client: Client360;
}

export function KpiStrip({ client }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Lifetime Value"
        value={fmtMoney(client.lifetimeValue)}
      />
      <KpiCard
        label="Orders (FY26)"
        value={String(client.ordersFY26)}
      />
      <KpiCard
        label="Avg. Margin"
        value={`${(client.avgMarginPct || 0).toFixed(1)}%`}
        hint="Illustrative estimate"
      />
      <KpiCard
        label="Last Order"
        value={fmtDate(client.lastOrderAt)}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white px-5 py-4 shadow-xs">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-xl font-bold text-[#0F2D4A]">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[10px] text-slate-400">{hint}</div>
      )}
    </div>
  );
}