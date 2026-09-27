'use client';

import React from 'react';
import type { RFQStats } from '@/services/rfq.service';

export default function TotalRfqCard({ stats }: { stats: RFQStats | null }) {
  const total = stats?.total ?? 0;
  const quoteRate = stats?.quoteRate ?? 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total RFQ
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EAEFF7] text-[#1F3864] flex items-center justify-center text-sm">
            📋
          </div>
        </div>
        <div className="text-3xl font-serif font-bold text-[#0F2D4A] mt-2">
          {total}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            ▼ 37.5%
          </span>
          <span className="text-xs text-slate-500">
            This Month: — · Last Month: —
          </span>
        </div>
      </div>
      <div className="pt-3 border-t border-[#F0EBE3] flex justify-between items-center text-xs text-slate-600 mt-4">
        <span>
          <strong className="text-[#0F2D4A]">{total}</strong> Online ·{' '}
          <strong>0</strong> Manual
        </span>
        <span className="text-emerald-700 font-bold">
          Quote Rate: {quoteRate}%
        </span>
      </div>
    </div>
  );
}