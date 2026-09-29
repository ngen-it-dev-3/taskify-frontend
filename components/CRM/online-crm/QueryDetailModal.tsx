// app/(dashboard)/online-crm/components/QueryDetailModal.tsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { OnlineQuery } from './constants';
import { fmtDate, fmtFull } from './constants';

interface Props {
  query: OnlineQuery;
  onClose: () => void;
}

export function QueryDetailModal({ query, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              {query.company}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {query.rfqNumber} · {query.country} · Assigned: {query.assigned}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 overflow-hidden rounded-lg border border-[#F0EBE3]">
          <Row label="Product" value={query.product} />
          <Row label="Date Received" value={fmtDate(query.date)} />
          <Row label="Source" value={query.source} />
          <Row
            label="Days Aging"
            value={
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  query.daysAging > 15
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {query.daysAging} days
              </span>
            }
          />
          <Row
            label="Stage"
            value={
              <span className="inline-block rounded-full bg-[#EEF4FB] text-[#1F3864] px-2.5 py-0.5 text-[10px] font-bold">
                {query.stage}
              </span>
            }
          />
          <Row label="Value" value={fmtFull(query.value)} />
          <Row label="Status" value={query.status} />
          <Row label="Last Updated" value={fmtDate(query.lastUpdated)} />
          <Row label="Comments" value={query.comments || '—'} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center border-b border-[#F0EBE3] last:border-b-0">
      <div className="bg-[#FAF8F5] px-4 py-3 text-[11px] font-medium text-slate-500">
        {label}
      </div>
      <div className="px-4 py-3 text-[12px] font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}