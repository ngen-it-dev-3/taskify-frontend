// components/CRM/sales-crm/SalesReportTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SalesCrmApi,
    type SalesReportData,
    type SalesReportEntry,
} from '@/services/salesCrm.service';
import { formatMoney } from './constants';
import type { SalesFilters } from './FilterBar';

interface Props {
    filters: SalesFilters;
}

export function SalesReportTab({ filters }: Props) {
    const [data, setData] = useState<SalesReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selected, setSelected] = useState<SalesReportEntry | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const params: Record<string, string> = {};
                if (filters.region !== 'All Regions') params.country = filters.region;
                if (filters.territory !== 'All Territories') params.territory = filters.territory;
                if (filters.owner) params.owner = filters.owner;
                const res = await SalesCrmApi.salesReport(params);
                setData(res);
            } catch (e: any) {
                toast.error(e.message || 'Failed to load sales report');
            } finally {
                setLoading(false);
            }
        })();
    }, [filters.region, filters.territory, filters.owner]);

    if (loading || !data) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-[120px] animate-pulse rounded-xl bg-white border border-[#EBE6DF]"
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="overflow-hidden rounded-2xl border border-[#EBE6DF] bg-white shadow-sm">
                <div className="border-b border-[#F0EBE3] px-6 py-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1e3a8a]">
                        {data.fiscalYear} — MONTHLY TARGET VS ACHIEVED
                    </h3>
                </div>

                <table className="w-full text-xs">
                    <thead className="bg-white">
                        <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="w-48 px-6 py-3 text-left">PO REF</th>
                            <th className="px-6 py-3 text-left">SALESMAN</th>
                            <th className="px-6 py-3 text-left">CLIENT</th>
                            <th className="px-6 py-3 text-left">PRODUCT</th>
                            <th className="px-6 py-3 text-right">VALUE</th>
                            <th className="px-6 py-3 text-right">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {data.months.map((m) => {
                            const isOpen = expanded[m.month];
                            const achievementPct =
                                m.target > 0 ? Math.round((m.achieved / m.target) * 100) : 0;
                            const status =
                                achievementPct >= 100
                                    ? 'On Track'
                                    : achievementPct >= 50
                                        ? 'Behind'
                                        : 'Poor';

                            const statusColor =
                                status === 'On Track'
                                    ? 'bg-emerald-100/70 text-emerald-800'
                                    : status === 'Behind'
                                        ? 'bg-[#fde8d0] text-[#a04e12]'
                                        : 'bg-[#fce4e4] text-[#b91c1c]';

                            return (
                                <React.Fragment key={m.month}>
                                    <tr
                                        className="cursor-pointer bg-white transition-colors hover:bg-[#FAF8F5]"
                                        onClick={() =>
                                            setExpanded((prev) => ({
                                                ...prev,
                                                [m.month]: !prev[m.month],
                                            }))
                                        }
                                    >
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#fef7e7] text-[#c08218]">
                                                    {isOpen ? (
                                                        <Minus className="h-3 w-3 stroke-[2.5]" />
                                                    ) : (
                                                        <Plus className="h-3 w-3 stroke-[2.5]" />
                                                    )}
                                                </span>
                                                <span className="font-bold text-[#1f3a5f]">{m.month}</span>
                                            </div>
                                        </td>
                                        <td colSpan={3} className="px-6 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-medium text-slate-500">
                                                    Total Sales Value
                                                </span>
                                                <span className="font-mono text-[13px] font-bold text-[#0F2D4A]">
                                                    {formatMoney(m.achieved, filters.currency, { rate: filters.rate })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-right font-mono text-[11px] text-slate-500">
                                            Target {formatMoney(m.target, filters.currency, { rate: filters.rate })} · {m.entries.length} sale
                                            {m.entries.length === 1 ? '' : 's'}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <span
                                                className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-semibold ${statusColor}`}
                                            >
                                                {status}
                                            </span>
                                        </td>
                                    </tr>

                                    {isOpen &&
                                        m.entries.map((e) => {
                                            const pillClass = e.deliveredAt
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : e.invoicedAt
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                    : e.executedAt
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200';

                                            const pillLabel = e.deliveredAt
                                                ? 'Delivered'
                                                : e.invoicedAt
                                                    ? 'Invoiced'
                                                    : e.executedAt
                                                        ? 'Executed'
                                                        : 'Pending';

                                            return (
                                                <tr
                                                    key={e.id}
                                                    onClick={() => setSelected(e)}
                                                    className="cursor-pointer bg-[#FAF8F5] transition-colors hover:bg-[#F5F0E8]"
                                                >
                                                    <td className="px-6 py-3 pl-12 font-mono text-[11px] text-slate-600">
                                                        {e.pqNumber || '—'}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F2D4A] text-[9px] font-bold text-white">
                                                                {(e.owner || '?').slice(0, 2).toUpperCase()}
                                                            </span>
                                                            <span className="font-semibold text-slate-700">
                                                                {e.owner || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 font-semibold text-slate-800">
                                                        {e.client}
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-600">{e.item}</td>
                                                    <td className="px-6 py-3 text-right font-mono font-semibold text-slate-800">
                                                        {formatMoney(e.value, filters.currency, { rate: filters.rate })}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span
                                                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${pillClass}`}
                                                        >
                                                            {pillLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                    {isOpen && m.entries.length === 0 && (
                                        <tr className="bg-[#FAF8F5]">
                                            <td
                                                colSpan={6}
                                                className="px-6 py-5 text-center text-[11px] italic text-slate-400"
                                            >
                                                No sales recorded for {m.month}.
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selected && (
                <SalesDetailModal
                    entry={selected}
                    month={
                        data.months.find((m) => m.entries.some((x) => x.id === selected.id))
                            ?.month || ''
                    }
                    currency={filters.currency}
                    rate={filters.rate}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}

/* ========================================================= */
function SalesDetailModal({
    entry,
    month,
    currency,
    rate,
    onClose,
}: {
    entry: SalesReportEntry;
    month: string;
    currency: string;
    rate: number;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const statusLabel = entry.deliveredAt
        ? 'Delivered'
        : entry.invoicedAt
            ? 'Invoiced'
            : entry.executedAt
                ? 'Executed'
                : 'Pending';

    const mrNumber = (entry as any).mrNumber || 'MR-0114';
    const comments =
        (entry as any).comments || 'Awaiting client payment confirmation.';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-[600px] rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between px-7 pt-6 pb-4">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
                            {entry.client}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            PO {entry.pqNumber || '—'} · {month}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-7 pb-7">
                    <div className="overflow-hidden rounded-lg border border-[#F0EBE3]">
                        <DetailRow label="Salesman" value={entry.owner || 'Unassigned'} />
                        <DetailRow label="Product" value={entry.item || '—'} />
                        <DetailRow
                            label="Order Value"
                            value={formatMoney(entry.value, currency, { rate })}
                            mono
                        />
                        <DetailRow label="Status" value={statusLabel} />
                        <DetailRow label="MR No." value={mrNumber} mono />
                        <DetailRow label="Comments" value={comments} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="grid grid-cols-[140px_1fr] items-center border-b border-[#F0EBE3] last:border-b-0">
            <div className="bg-[#FAF8F5] px-4 py-3 text-[11px] font-medium text-slate-500">
                {label}
            </div>
            <div
                className={`px-4 py-3 text-[12px] font-semibold text-slate-800 ${mono ? 'font-mono' : ''
                    }`}
            >
                {value}
            </div>
        </div>
    );
}