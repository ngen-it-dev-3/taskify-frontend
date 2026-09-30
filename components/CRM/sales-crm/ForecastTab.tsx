// components/CRM/sales-crm/ForecastTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SalesCrmApi,
    type ForecastEntry,
    type ForecastMonth,
    type ForecastStage,
} from '@/services/salesCrm.service';
import { MONTHS, formatMoney, fmtDate } from './constants';
import { MonthTab } from './MonthTab';
import { AddForecastModal } from './AddForecastModal';
import type { SalesFilters } from './FilterBar';

interface Props {
    filters: SalesFilters;
    activeMonth: ForecastMonth | 'all';
    onChangeMonth: (m: ForecastMonth | 'all') => void;
}

// ---------- HELPERS ----------
function getCategory(entry: ForecastEntry): { label: string; variant: string } {
    if (entry.stage === 'won') return { label: 'Closed (Won)', variant: 'closed' };
    if (entry.stage === 'lost') return { label: 'Lost', variant: 'lost' };
    const p = entry.probability;
    if (p >= 90) return { label: 'Very Likely (A)', variant: 'very-likely' };
    if (p >= 76) return { label: 'Promising (L-2)', variant: 'promising' };
    if (p >= 60) return { label: 'Possible (L-3)', variant: 'possible' };
    if (p >= 40) return { label: 'Early Stage (L-4)', variant: 'early' };
    return { label: 'Low Priority', variant: 'low' };
}

const CATEGORY_STYLES: Record<string, string> = {
    'very-likely': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    promising: 'bg-orange-50 text-[#A06126] border-orange-200',
    possible: 'bg-amber-50 text-amber-700 border-amber-200',
    early: 'bg-slate-100 text-slate-600 border-slate-200',
    low: 'bg-slate-100 text-slate-500 border-slate-200',
    closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lost: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STAGE_STYLES: Record<ForecastStage, string> = {
    query: 'bg-slate-50 text-slate-600',
    rfq: 'bg-amber-50 text-amber-700',
    quotation: 'bg-violet-50 text-violet-700',
    negotiation: 'bg-orange-50 text-[#A06126]',
    won: 'bg-emerald-50 text-emerald-700',
    lost: 'bg-rose-50 text-rose-700',
};

const STAGE_LABELS: Record<ForecastStage, string> = {
    query: 'Query',
    rfq: 'RFQ',
    quotation: 'Quotation',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
};

function getFollowUpDate(entry: ForecastEntry): string {
    const monthIdx = MONTHS.indexOf(entry.month);
    const year = new Date(entry.createdAt || Date.now()).getFullYear();
    const d = new Date(year, monthIdx, 10);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getDotColor(stage: ForecastStage): string {
    if (stage === 'won') return 'bg-emerald-500';
    if (stage === 'lost') return 'bg-rose-500';
    if (stage === 'negotiation') return 'bg-[#A06126]';
    return 'bg-blue-500';
}

// ---------- COMPONENT ----------
export function ForecastTab({ filters, activeMonth, onChangeMonth }: Props) {
    const [entries, setEntries] = useState<ForecastEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const base: Record<string, string> = {};
            if (filters.region !== 'All Regions') base.country = filters.region;
            if (filters.territory !== 'All Territories') base.territory = filters.territory;
            if (filters.owner) base.owner = filters.owner;
            if (activeMonth !== 'all') base.month = activeMonth;

            const listRes = await SalesCrmApi.list({ ...base, limit: 100, page: 1 });
            setEntries(listRes.items);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load forecast entries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMonth, filters.region, filters.territory, filters.owner]);

    const entriesLabel =
        activeMonth === 'all'
            ? `ENTRIES — ALL MONTHS (${entries.length})`
            : `ENTRIES — ${activeMonth.toUpperCase()} (${entries.length})`;

    return (
        <>
            {/* ⭐ Month Tabs — now below Summary, above Entries */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[#EBE6DF] pb-2">
                <MonthTab
                    active={activeMonth === 'all'}
                    onClick={() => onChangeMonth('all')}
                    label="All"
                />
                {MONTHS.map((m) => (
                    <MonthTab
                        key={m}
                        active={activeMonth === m}
                        onClick={() => onChangeMonth(m)}
                        label={m}
                    />
                ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F0EBE3] px-6 py-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                        {loading ? 'ENTRIES — loading…' : entriesLabel}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#88501E]"
                    >
                        <Plus className="w-3 h-3" />
                        Add Forecast Entry
                    </button>
                </div>

                {loading ? (
                    <div className="h-[200px] animate-pulse bg-white" />
                ) : entries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-white">
                                <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 w-[110px]">Date</th>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3 text-right w-[140px]">Value</th>
                                    <th className="px-6 py-3 text-right w-[70px]">Prob.</th>
                                    <th className="px-6 py-3 w-[160px]">Salesperson</th>
                                    <th className="px-6 py-3 w-[130px]">Stage</th>
                                    <th className="px-6 py-3 w-[110px]">Follow-up</th>
                                    <th className="px-6 py-3">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0EBE3]">
                                {entries.map((e) => {
                                    const category = getCategory(e);
                                    const catStyle =
                                        CATEGORY_STYLES[category.variant] ??
                                        CATEGORY_STYLES.early;
                                    const dot = getDotColor(e.stage);

                                    return (
                                        <tr
                                            key={e.id}
                                            className="align-top hover:bg-[#FDFBF7] transition"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${dot} shrink-0`}
                                                    />
                                                    <span
                                                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${catStyle}`}
                                                    >
                                                        {category.label}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                {fmtDate(e.createdAt)}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {e.client}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">{e.item}</td>

                                            <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                                                {formatMoney(e.value, filters.currency, {
                                                    rate: filters.rate,
                                                })}
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                {e.probability}%
                                            </td>

                                            <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                                {e.owner || '—'}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${STAGE_STYLES[e.stage]}`}
                                                >
                                                    {STAGE_LABELS[e.stage]}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                {getFollowUpDate(e)}
                                            </td>

                                            <td className="px-6 py-4 text-slate-500 leading-snug max-w-[220px]">
                                                {e.note || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-[11px] italic text-slate-400">
                        No entries in this scope.
                    </div>
                )}
            </div>

            {addOpen && (
                <AddForecastModal
                    onClose={() => setAddOpen(false)}
                    onSaved={() => {
                        setAddOpen(false);
                        load();
                    }}
                    defaultOwner={filters.owner || ''}
                />
            )}
        </>
    );
}