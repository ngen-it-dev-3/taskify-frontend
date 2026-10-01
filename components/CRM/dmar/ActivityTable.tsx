// app/(dashboard)/dmar/components/ActivityTable.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, ExternalLink, Check } from 'lucide-react';
import type { DmarActivity } from './constants';
import {
  ACTIVITY_BADGE_STYLES,
  STATUS_BADGE_STYLES,
  formatMoney,
  formatFull,
  formatDate,
} from './constants';

interface Props {
  activities: DmarActivity[];
  onSelect: (a: DmarActivity) => void;
  onEdit: (a: DmarActivity) => void;
  onMarkSold: (a: DmarActivity) => void;
  onDelete: (a: DmarActivity) => void;
  selectedId?: string | null;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ActivityTable({
  activities,
  onSelect,
  onEdit,
  onMarkSold,
  onDelete,
  selectedId,
}: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when data changes
  useEffect(() => {
    setPage(1);
  }, [activities, pageSize]);

  const total = activities.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  const pageRows = useMemo(
    () => activities.slice(start, end),
    [activities, start, end]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EBE3] px-5 py-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          Activity Log
        </h3>
        <div className="text-[10px] text-slate-500">
          {total === 0 ? 'No rows' : `Showing ${start + 1}–${end} of ${total}`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#FDFBF7]">
            <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
              <th className="px-4 py-3 w-[90px]">Date</th>
              <th className="px-4 py-3 w-[100px]">Activity</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Product / Solution</th>
              <th className="px-4 py-3 text-right w-[100px]">Tentative</th>
              <th className="px-4 py-3 w-[100px]">Status</th>
              <th className="px-4 py-3 w-[100px]">Client Type</th>
              <th className="px-4 py-3 w-[110px]">Sector</th>
              <th className="px-4 py-3 w-[160px]">Area</th>
              <th className="px-4 py-3 w-[130px]">Logged By</th>
              <th className="px-4 py-3 w-[140px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {pageRows.map((a) => {
              const isSelected = selectedId === a.id;
              const actStyle =
                ACTIVITY_BADGE_STYLES[a.activityType] ||
                'bg-slate-100 text-slate-600';
              const statusStyle =
                STATUS_BADGE_STYLES[a.status] || 'bg-slate-100 text-slate-600';

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#FFF7E8]'
                      : 'hover:bg-[#FDFBF7]'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDate(a.date)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${actStyle}`}
                    >
                      {a.activityType}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800 truncate max-w-[200px]">
                    {a.company}
                  </td>

                  <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">
                    {a.product || '—'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatFull(a.value)}
                  </td>

                  <td className="px-4 py-3">
                    {a.status && a.status !== 'To Start' ? (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusStyle}`}
                      >
                        {a.status}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-700">{a.clientType}</td>

                  <td className="px-4 py-3 text-slate-700">{a.sector || '—'}</td>

                  <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">
                    {a.area || '—'}
                  </td>

                  <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                    {a.loggedByName || '—'}
                  </td>

                  <td
                    className="px-4 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1">
                      {a.status === 'Quoted' && (
                        <button
                          onClick={() => onMarkSold(a)}
                          title="Mark as Sold"
                          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Sold
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(a)}
                        title="Edit"
                        className="rounded border border-[#E2DBD1] px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        title="Delete"
                        className="rounded border border-rose-200 px-1.5 py-0.5 text-rose-500 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {total === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-12 text-center text-[11px] italic text-slate-400"
                >
                  No activities match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EBE3] bg-[#FDFBF7] px-5 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-[#E2DBD1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>items</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="px-3 text-[11px] font-semibold text-slate-700">
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}