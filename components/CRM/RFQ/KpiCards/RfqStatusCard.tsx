'use client';

import React from 'react';
import type { RFQStats } from '@/services/rfq.service';

export default function RfqStatusCard({ stats }: { stats: RFQStats | null }) {
  const total = stats?.total ?? 0;
  const pending = stats?.pending ?? 0;
  const quoted = stats?.quoted ?? 0;
  const archived = stats?.archived ?? 0;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const p1 = pct(pending);
  const p2 = p1 + pct(quoted);

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          RFQ Status
        </span>
        <div className="w-7 h-7 rounded-lg bg-[#F8F1E5] text-[#A06126] flex items-center justify-center text-sm">
          📊
        </div>
      </div>

      <div className="flex items-center gap-5 my-2">
        <div
          className="w-20 h-20 rounded-full shrink-0 relative flex items-center justify-center shadow-xs"
          style={{
            background: `conic-gradient(#1F3864 0% ${p1}%, #1FAB6F ${p1}% ${p2}%, #A06126 ${p2}% 100%)`,
          }}
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-serif font-bold text-sm text-[#0F2D4A]">
            {total}
          </div>
        </div>

        <div className="flex-1 space-y-1.5 text-xs">
          <Row color="bg-[#1F3864]" label="Pending" count={pending} pct={pct(pending)} />
          <Row color="bg-[#1FAB6F]" label="Quoted" count={quoted} pct={pct(quoted)} />
          <Row color="bg-[#A06126]" label="Archived" count={archived} pct={pct(archived)} />
        </div>
      </div>

      <div className="text-[11px] text-slate-400">
        Status across all tracked pipeline RFQs
      </div>
    </div>
  );
}

function Row({
  color,
  label,
  count,
  pct,
}: {
  color: string;
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-700">
        <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
      </span>
      <span className="font-mono font-bold text-slate-800">
        {count} <span className="text-slate-400 font-normal">({pct}%)</span>
      </span>
    </div>
  );
}