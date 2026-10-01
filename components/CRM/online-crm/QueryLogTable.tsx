// app/(dashboard)/online-crm/components/QueryLogTable.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UnifiedOnlineRow, QueryStage } from './constants';
import { fmtDate, fmtFull, SOURCE_BADGES } from './constants';

interface Props {
  queries: UnifiedOnlineRow[];
  onEdit: (q: UnifiedOnlineRow) => void;
  onRowClick: (q: UnifiedOnlineRow) => void;
}

const STAGE_COLORS: Record<QueryStage, string> = {
  'To Start': 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
  'Not Quoted': 'bg-rose-50 text-rose-700 border-rose-200',
  Quoted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function QueryLogTable({ queries, onEdit, onRowClick }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ⭐ Reset to page 1 whenever data or pageSize changes
  useEffect(() => {
    setPage(1);
  }, [queries, pageSize]);

  // ⭐ Slice the current page
  const total = queries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = useMemo(
    () => queries.slice(start, end),
    [queries, start, end]
  );

  // ⭐ Generate visible page numbers (with ellipsis)
  const pageNumbers = useMemo(() => {
    const nums: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
      return nums;
    }

    nums.push(1);

    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);

    if (left > 2) nums.push('...');
    for (let i = left; i <= right; i++) nums.push(i);
    if (right < totalPages - 1) nums.push('...');

    nums.push(totalPages);
    return nums;
  }, [safePage, totalPages]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EBE3] px-6 py-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          Unified Query Log — All Sources
        </h3>
        <div className="text-[10px] text-slate-500">
          {total === 0
            ? 'No rows'
            : `Showing ${start + 1}–${end} of ${total}`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white">
            <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
              <th className="px-4 py-3 w-[70px]">Source</th>
              <th className="px-4 py-3">RFQ #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Origin</th>
              <th className="px-4 py-3 text-center">Days</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {pageRows.map((q) => {
              const badge = SOURCE_BADGES[q.source];
              return (
                <tr
                  key={q.id}
                  onClick={() => onRowClick(q)}
                  className="cursor-pointer transition-colors hover:bg-[#FDFBF7]"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-800 max-w-[160px] truncate">
                    {q.rfqNumber || '—'}
                  </td>

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {fmtDate(q.date)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {q.company || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {q.country}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700 max-w-[240px] truncate">
                    {q.product || '—'}
                  </td>

                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {q.assigned || 'Unassigned'}
                  </td>

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {q.origin || '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${q.daysAging > 15
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {q.daysAging}d
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STAGE_COLORS[q.stage]}`}
                    >
                      {q.stage}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                    {fmtFull(q.value)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {q.source === 'online' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(q);
                        }}
                        className="rounded border border-[#E2DBD1] px-3 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {total === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-10 text-center text-[11px] italic text-slate-400"
                >
                  No queries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ⭐ Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EBE3] bg-[#FDFBF7] px-6 py-3">
          {/* Left: page size selector */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-[#E2DBD1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>items</span>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((n, i) =>
              n === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1.5 text-[11px] text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded border px-2 text-[11px] font-semibold transition ${n === safePage
                      ? 'bg-[#A06126] text-white border-[#A06126]'
                      : 'bg-white text-slate-700 border-[#E2DBD1] hover:bg-slate-50'
                    }`}
                >
                  {n}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}