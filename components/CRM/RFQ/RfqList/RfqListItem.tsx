'use client';

import React from 'react';
import type { RFQItem } from '../types';

interface Props {
  rfq: RFQItem;
  isSelected: boolean;
  onSelect: () => void;
  onAssign: () => void;
  onQuote: () => void;
  hideActions?: boolean;
}

export default function RfqListItem({
  rfq,
  isSelected,
  onSelect,
  onAssign,
  onQuote,
  hideActions = false,
}: Props) {
  // ---- Guard: if rfq is missing, don't crash ----
  if (!rfq) {
    return null;
  }

  // ---- Safe read of assignedTo ----
  const assignedTo = (rfq.assignedTo ?? '').toString().trim();
  const isAssigned = assignedTo !== '' && assignedTo !== 'Unassigned';

  const isLost = rfq.stage === 'lost';

  const agingBadge = () => {
    if (rfq.stage === 'archived') return 'bg-slate-100 text-slate-600';
    if (rfq.agingDays > 14)
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (rfq.agingDays > 5)
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 transition cursor-pointer border-l-3 ${
        isSelected
          ? 'bg-[#FAF6EE] border-[#A06126]'
          : 'hover:bg-[#FDFBF7] border-transparent'
      }`}
    >
      <div className="flex justify-between items-start">
        <strong className="text-xs font-bold text-[#0F2D4A]">
          {rfq.company ?? '—'}
        </strong>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${agingBadge()}`}
        >
          {rfq.stage === 'archived' ? '🗃 Archived' : `⏰ ${rfq.agingDays} Days`}
        </span>
      </div>

      <div className="text-[11.5px] text-slate-500 mt-1 mb-2.5">
        RFQ# {rfq.rfqNumber} | {rfq.country} · {rfq.date}, {rfq.time}
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
          🌐 Web RFQ
        </span>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        {!hideActions ? (
          <>
            {/* ---- Assign / Already Assigned ---- */}
            {isAssigned ? (
              <div
                className="px-3 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 max-w-[60%]"
                title={`Assigned to ${assignedTo}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  <span className="text-emerald-600 font-normal">Assigned:</span>{' '}
                  {assignedTo}
                </span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign();
                }}
                className="px-3 py-1 rounded border border-[#E2DBD1] hover:bg-white text-slate-700 text-xs font-medium transition"
              >
                Assign
              </button>
            )}

            {/* ---- Quote ---- */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuote();
              }}
              className="px-3.5 py-1 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white text-xs font-semibold shadow-2xs transition"
            >
              Quote
            </button>
          </>
        ) : (
          /* Optional fallback pill — remove this block if you want nothing shown */
          <span
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border ${
              isLost
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isLost ? '🔒 Lost — no actions' : '🔒 Locked'}
          </span>
        )}
      </div>
    </div>
  );
}