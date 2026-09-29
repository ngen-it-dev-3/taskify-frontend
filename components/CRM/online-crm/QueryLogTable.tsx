// app/(dashboard)/online-crm/components/QueryLogTable.tsx
'use client';

import React from 'react';
import type { OnlineQuery, QueryStage } from './constants';
import { fmtDate, fmtFull } from './constants';

interface Props {
  queries: OnlineQuery[];
  onEdit: (q: OnlineQuery) => void;
  onRowClick: (q: OnlineQuery) => void;
}

const STAGE_COLORS: Record<QueryStage, string> = {
  'To Start': 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
  'Not Quoted': 'bg-rose-50 text-rose-700 border-rose-200',
  Quoted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function QueryLogTable({ queries, onEdit, onRowClick }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white">
      <div className="border-b border-[#F0EBE3] px-6 py-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          Online Query Log — All Months
        </h3>
      </div>

      <table className="w-full text-xs">
        <thead className="bg-white">
          <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
            <th className="px-6 py-3">RFQ #</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Company</th>
            <th className="px-6 py-3">Product</th>
            <th className="px-6 py-3">Assigned</th>
            <th className="px-6 py-3">Source</th>
            <th className="px-6 py-3">Days</th>
            <th className="px-6 py-3">Stage</th>
            <th className="px-6 py-3 text-right">Value</th>
            <th className="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EBE3]">
          {queries.map((q) => (
            <tr
              key={q.id}
              onClick={() => onRowClick(q)}
              className="cursor-pointer transition-colors hover:bg-[#FDFBF7]"
            >
              <td className="px-6 py-3 font-mono text-[11px] font-semibold text-slate-800">
                {q.rfqNumber}
              </td>
              <td className="px-6 py-3 text-slate-600">
                {fmtDate(q.date)}
              </td>
              <td className="px-6 py-3">
                <div className="font-semibold text-slate-800">{q.company}</div>
                <div className="text-[10px] text-slate-500">{q.country}</div>
              </td>
              <td className="px-6 py-3 text-slate-700 max-w-[260px]">
                {q.product}
              </td>
              <td className="px-6 py-3 text-slate-700">{q.assigned}</td>
              <td className="px-6 py-3 text-slate-600">{q.source}</td>
              <td className="px-6 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    q.daysAging > 15
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {q.daysAging}d
                </span>
              </td>
              <td className="px-6 py-3">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STAGE_COLORS[q.stage]}`}
                >
                  {q.stage}
                </span>
              </td>
              <td className="px-6 py-3 text-right font-mono font-semibold text-slate-800">
                {fmtFull(q.value)}
              </td>
              <td className="px-6 py-3 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(q);
                  }}
                  className="rounded border border-[#E2DBD1] px-3 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}

          {queries.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="px-6 py-10 text-center text-[11px] italic text-slate-400"
              >
                No queries match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}