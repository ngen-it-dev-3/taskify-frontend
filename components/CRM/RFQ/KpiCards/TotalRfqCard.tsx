'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import type { RFQStats } from '@/services/rfq.service';

interface Props {
  stats: RFQStats | null;
}

export default function TotalRfqCard({ stats }: Props) {
  const total = stats?.total ?? 0;
  const quoteRate = stats?.quoteRate ?? 0;
  const thisMonth = stats?.thisMonth ?? 0;
  const lastMonth = stats?.lastMonth ?? 0;
  const delta = stats?.momDelta ?? 0;

  // Trend direction
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isFlat = delta === 0;
  const isFirstBatch = isUp && lastMonth === 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total RFQ
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EAEFF7] text-[#1F3864] flex items-center justify-center text-sm">
            📋
          </div>
        </div>

        {/* Big number */}
        <div className="text-3xl font-serif font-bold text-[#0F2D4A] mt-2">
          {total}
        </div>

        {/* Trend badge + real month values */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* First batch case */}
          {isFirstBatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50">
              <Sparkles className="w-3 h-3" />
              First batch
            </span>
          )}

          {/* Up trend */}
          {isUp && !isFirstBatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50">
              <TrendingUp className="w-3 h-3" />
              ▲ {delta}%
            </span>
          )}

          {/* Down trend */}
          {isDown && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-rose-600 bg-rose-50">
              <TrendingDown className="w-3 h-3" />
              ▼ {Math.abs(delta)}%
            </span>
          )}

          {/* Flat */}
          {isFlat && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-500 bg-slate-100">
              — 0%
            </span>
          )}

          <span className="text-xs text-slate-500">
            This Month:{' '}
            <strong className="text-slate-700">{thisMonth}</strong>
            {' · '}
            Last Month:{' '}
            <strong className="text-slate-700">{lastMonth}</strong>
          </span>
        </div>
      </div>

      {/* Footer */}
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