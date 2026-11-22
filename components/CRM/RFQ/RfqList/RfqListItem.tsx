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

const DHAKA_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Dhaka',
};

function formatInDhaka(dateObj: Date): string {
  return dateObj.toLocaleString('en-US', DHAKA_FORMAT_OPTIONS);
}

// ⭐ Helper: Parse Web RFQ exact client timestamp cleanly without double timezone offset
function getWebInquiryDisplay(rfq: RFQItem): string {
  // ১. যদি inquiryDate-তে আসল সময় থাকে (midnight 00:00:00 বা শুধু YYYY-MM-DD না হয়), সরাসরি Dhaka টাইমে দেখান
  if (rfq.inquiryDate) {
    const raw = String(rfq.inquiryDate).trim();
    const isMidnightOrDateOnly =
      /^\d{4}-\d{2}-\d{2}$/.test(raw) ||
      /T00:00:00(\.000)?(Z|[+-]\d{2}:?\d{2})?$/i.test(raw);

    const parsedInquiry = new Date(raw);
    if (!isMidnightOrDateOnly && !isNaN(parsedInquiry.getTime())) {
      return formatInDhaka(parsedInquiry);
    }
  }

  // ২. rfq.date এবং rfq.time ইতিমধ্যে সঠিক ফরম্যাটে থাকলে (যেমন "07 Nov 2026" ও "11:45 AM") UTC না ধরে সরাসরি দেখান
  if (rfq.date && rfq.time) {
    const datePart = String(rfq.date).trim();
    const timePart = String(rfq.time).trim();
    return `${datePart} · ${timePart}`;
  }

  // ৩. ফলব্যাক: createdAt (UTC ISO string -> Asia/Dhaka)
  if (rfq.createdAt) {
    const created = new Date(rfq.createdAt);
    if (!isNaN(created.getTime())) {
      return formatInDhaka(created);
    }
  }

  return '';
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
      const fallbackDays = rfq.agingDays || 0;
      return {
        display: fallbackDays > 0 ? `${fallbackDays}d` : 'Just now',
        rawDays: fallbackDays,
      };
    }

    const createdDate = new Date(rfq.createdAt);
    const now = new Date();

    const diffTime = now.getTime() - createdDate.getTime();
    if (diffTime < 0) return { display: 'Just now', rawDays: 0 };

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
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

  // ⭐ CALCULATE GAP BETWEEN INQUIRY DATE & CREATED DATE
  const calculateResponseGap = () => {
    if (!rfq.inquiryDate || !rfq.createdAt) return null;

    try {
      const entryDate = new Date(rfq.createdAt);
      const inquiryDate = new Date(rfq.inquiryDate);

      if (isNaN(inquiryDate.getTime()) || isNaN(entryDate.getTime())) {
        return 'Invalid Date';
      }

      const diffTime = Math.abs(entryDate.getTime() - inquiryDate.getTime());

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const diffMins = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) return `${diffDays}d ${diffHours}h gap`;
      if (diffHours > 0) return `${diffHours}h ${diffMins}m gap`;
      if (diffMins > 0) return `${diffMins}m gap`;
      return 'Just now';
    } catch {
      return 'Invalid Date';
    }
  };

  const aging = calculateAging();
  const responseGap = calculateResponseGap();
  const webInquiryTime = getWebInquiryDisplay(rfq);
  const manualCreatedTime = rfq.createdAt
    ? formatInDhaka(new Date(rfq.createdAt))
    : formatInDhaka(new Date());

  const agingBadge = () => {
    if (rfq.stage === 'archived') return 'bg-slate-100 text-slate-600';
    if (aging.rawDays > 14) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (aging.rawDays > 5) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 transition cursor-pointer border-l-3 border-b border-[#F0EBE3] ${isSelected
          ? 'bg-[#FAF6EE] border-l-[#A06126]'
          : 'hover:bg-[#FDFBF7] border-l-transparent'
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

      <div className="text-[11.5px] text-slate-500 mt-1 mb-2.5 flex flex-wrap items-center gap-2">
        <span>
          RFQ# {rfq.rfqNumber}
          {rfq.rfqReferenceId ? ` · Ref: ${rfq.rfqReferenceId}` : ''} | {rfq.country}
        </span>

        <span className="text-slate-300">·</span>

        <span>
          {rfq.source === 'online'
            ? `Client Inquiry: ${webInquiryTime}`
            : manualCreatedTime}
        </span>

        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${rfq.source === 'manual'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-blue-700'
            }`}
        >
          {rfq.source === 'manual' ? '✍️ Manual' : '🌐 Web RFQ'}
        </span>
      </div>

      <div className="flex gap-2 justify-between items-center pt-1 min-h-[28px]">
        {/* LEFT SIDE: Client Inquiry Time + Response Gap (Only for Manual) */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {rfq.inquiryDate && rfq.source !== 'online' && (
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap">
              <span className="shrink-0">Client Inquiry Time</span>
              <span className="badge bg-amber-500 rounded-2xl px-2.5 py-0.5 text-white text-[10px] font-semibold shrink-0">
                {formatInDhaka(new Date(rfq.inquiryDate))}
              </span>
              {responseGap && (
                <span className="text-slate-400 text-[10px] shrink-0">
                  (Entry:{' '}
                  <span className="text-emerald-600 font-semibold">
                    {responseGap}
                  </span>
                  )
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Actions (Assigned Badge / Assign & Quote Buttons) */}
        {!hideActions ? (
          <div className="flex items-center gap-2 shrink-0">
            {isAssigned && (
              <div
                className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 max-w-[60%]"
                title={`Assigned to ${assignedTo}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  <span className="text-emerald-600 font-normal">Assigned:</span>{' '}
                  {assignedTo}
                </span>
              </div>
            )}

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

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAssigned) {
                  onAssign();
                  return;
                }
                onQuote();
              }}
              disabled={!isAssigned}
              title={!isAssigned ? 'Please assign this RFQ first' : 'Create Quote'}
              className={`px-3.5 py-1 rounded text-[11px] font-semibold transition ${!isAssigned
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-[#0F2D4A] hover:bg-[#1C3760] text-white shadow-2xs cursor-pointer'
                }`}
            >
              Quote
            </button>
          </div>
        ) : (
          <span
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border shrink-0 ${rfq.stage === 'lost'
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