// components/CRM/sales-orders/SalesOrderTable.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import type { SalesOrder } from './constants';
import {
    STAGE_STYLES,
    PAYMENT_STYLES,
    SOURCE_STYLES,
    SOURCE_LABELS,
    fmtFull,
} from './constants';

interface Props {
    orders: SalesOrder[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onEdit: (order: SalesOrder) => void;
    onDelete: (order: SalesOrder) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function SalesOrderTable({
    orders,
    selectedId,
    onSelect,
    onEdit,
    onDelete,
}: Props) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(1);
    }, [orders, pageSize]);

    const total = orders.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageRows = useMemo(
        () => orders.slice(start, end),
        [orders, start, end]
    );

    return (
        <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EBE3] px-5 py-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                    Order Log
                </h3>
                <div className="text-[10px] text-slate-500">
                    {total === 0 ? 'No orders' : `Showing ${start + 1}–${end} of ${total}`}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#FDFBF7]">
                        <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                            <th className="px-4 py-3 w-[70px]">Source</th>
                            <th className="px-4 py-3">PO Ref</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 text-right">Sales Value</th>
                            <th className="px-4 py-3">Current Stage</th>
                            <th className="px-4 py-3">Client Payment</th>
                            <th className="px-4 py-3 text-center w-[120px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {pageRows.map((o) => {
                            const isSelected = o.id === selectedId;
                            const stageStyle =
                                STAGE_STYLES[o.stage] ||
                                'bg-slate-100 text-slate-600 border-slate-200';
                            const payStatus = o.clientPayment?.status || 'Not Invoiced';
                            const payStyle =
                                PAYMENT_STYLES[payStatus] ||
                                'bg-slate-100 text-slate-600 border-slate-200';
                            const srcStyle =
                                SOURCE_STYLES[o.source] ||
                                'bg-slate-100 text-slate-600 border-slate-200';
                            const srcLabel = SOURCE_LABELS[o.source] || o.source;

                            return (
                                <tr
                                    key={o.id}
                                    onClick={() => onSelect(o.id)}
                                    className={`cursor-pointer transition ${isSelected ? 'bg-[#FFF7E8]' : 'hover:bg-[#FDFBF7]'
                                        }`}
                                >
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${srcStyle}`}
                                        >
                                            {srcLabel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                                        {o.poRef}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 truncate max-w-[200px]">
                                        {o.client?.company || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 truncate max-w-[260px]">
                                        {o.product || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                                        {fmtFull(o.salesValue)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${stageStyle}`}
                                        >
                                            {o.stage}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${payStyle}`}
                                        >
                                            {payStatus}
                                        </span>
                                    </td>

                                    {/* ⭐ ACTIONS — Edit + Delete */}
                                    <td
                                        className="px-4 py-3 text-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                onClick={() => onEdit(o)}
                                                title="Edit order"
                                                className="inline-flex items-center justify-center rounded border border-[#E2DBD1] px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(o)}
                                                title="Delete order"
                                                className="inline-flex items-center justify-center rounded border border-rose-200 px-2 py-1 text-rose-500 hover:bg-rose-50 transition"
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
                                    colSpan={8}
                                    className="px-6 py-12 text-center text-[11px] italic text-slate-400"
                                >
                                    No orders yet. Won quotations/tenders will appear here
                                    automatically.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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