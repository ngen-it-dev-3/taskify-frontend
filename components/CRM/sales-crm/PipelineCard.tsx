// components/CRM/sales-crm/PipelineCard.tsx
'use client';

import React from 'react';
import type { ForecastEntry, ForecastStage } from '@/services/salesCrm.service';
import { STAGES, formatMoney } from './constants';

interface Props {
  entry: ForecastEntry;
  stage: ForecastStage;
  currency: string;
  rate: number;
  onClick?: () => void;
}

export function PipelineCard({ entry, stage, currency, rate, onClick }: Props) {
  const stageStyle =
    STAGES.find((s) => s.key === stage)?.color ?? 'border-slate-200 bg-white';

  const isLost = stage === 'lost';
  const isWon = stage === 'won';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border ${stageStyle} px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#A06126]/30`}
    >
      <div className="text-[12px] font-semibold text-[#0F2D4A] leading-tight mb-1">
        {entry.client}
      </div>

      {entry.item && (
        <div className="text-[10.5px] text-slate-500 leading-snug mb-2 line-clamp-2">
          {entry.item}
        </div>
      )}

      <div className="flex items-end justify-between mt-2.5">
        <span className="font-mono text-[13px] font-bold text-[#0F2D4A]">
          {formatMoney(entry.value, currency, { compact: true, rate })}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isLost
              ? 'text-rose-600'
              : isWon
                ? 'text-emerald-700'
                : 'text-[#A06126]'
          }`}
        >
          {isLost ? 'Lost — price' : isWon ? '100%' : `${entry.probability}%`}
        </span>
      </div>

      {entry.country && (
        <div className="mt-2 pt-2 border-t border-black/5">
          <span className="inline-block rounded-md bg-white/70 border border-black/5 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
            {entry.country}
          </span>
        </div>
      )}
    </button>
  );
}