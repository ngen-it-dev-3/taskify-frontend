// components/CRM/rfq/RfqListItem.tsx
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
  if (!rfq) return null;

  const assignedTo = (rfq.assignedTo ?? '').toString().trim();
  const isAssigned = assignedTo !== '' && assignedTo !== 'Unassigned';

  // ⭐ DYNAMIC AGING CALCULATION (Days, Hours, Mins)
  const calculateAging = () => {
    if (!rfq.createdAt) {
      // Fallback if createdAt is missing
      const fallbackDays = rfq.agingDays || 0;
      return {
        display: fallbackDays > 0 ? `${fallbackDays}d` : 'Just now',
        rawDays: fallbackDays
      };
    }

    const createdDate = new Date(rfq.createdAt);
    const now = new Date();

    const diffTime = now.getTime() - createdDate.getTime();
    if (diffTime < 0) return { display: 'Just now', rawDays: 0 }; // Safety fallback

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    let display = '';

    if (diffDays > 0) {
      display = `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      display = `${diffHours}h ${diffMins}m`;
    } else if (diffMins > 0) {
      display = `${diffMins}m`;
    } else {
      display = 'Just now';
    }

    return { display, rawDays: diffDays };
  };

  const aging = calculateAging();

  const agingBadge = () => {
    if (rfq.stage === 'archived') return 'bg-slate-100 text-slate-600';
    if (aging.rawDays > 14) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (aging.rawDays > 5) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 transition cursor-pointer border-l-3 ${isSelected
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
          {rfq.stage === 'archived' ? '🗃 Archived' : `⏰ ${aging.display}`}
        </span>
      </div>

      <div className="text-[11.5px] text-slate-500 mt-1 mb-2.5">
        RFQ# {rfq.rfqNumber} | {rfq.country} · {rfq.date}, {rfq.time}

        <span
          className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${rfq.source === 'manual'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-blue-700'
            }`}
        >
          {rfq.source === 'manual' ? '✍️ Manual' : '🌐 Web RFQ'}
        </span>
      </div>

      <div className="flex gap-2 justify-end items-center pt-1 min-h-[28px]">
        {!hideActions ? (
          <>
            {/* Assigned Badge (Only shows if assigned) */}
            {isAssigned && (
              <div
                className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 max-w-[60%] mr-auto"
                title={`Assigned to ${assignedTo}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  <span className="text-emerald-600 font-normal">Assigned:</span>{' '}
                  {assignedTo}
                </span>
              </div>
            )}

            {/* Assign Button (Only shows if NOT assigned) */}
            {!isAssigned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign();
                }}
                className="px-3 py-1 rounded border border-[#E2DBD1] hover:bg-white text-slate-700 text-[11px] font-medium transition"
              >
                Assign
              </button>
            )}

            {/* Quote Button (Disabled if not assigned) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAssigned) {
                  onAssign(); // Optional: Open Assign modal if they click without assigning
                  return;
                }
                onQuote();
              }}
              disabled={!isAssigned}
              title={!isAssigned ? "Please assign this RFQ first" : "Create Quote"}
              className={`px-3.5 py-1 rounded text-[11px] font-semibold transition ${!isAssigned
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-[#0F2D4A] hover:bg-[#1C3760] text-white shadow-2xs cursor-pointer'
                }`}
            >
              {!isAssigned ? 'Assign First' : 'Quote'}
            </button>
          </>
        ) : (
          <span
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border ${rfq.stage === 'lost'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
          >
            {rfq.stage === 'lost' ? '🔒 Lost — no actions' : '🔒 Already Quoted'}
          </span>
        )}
      </div>
    </div>
  );
}