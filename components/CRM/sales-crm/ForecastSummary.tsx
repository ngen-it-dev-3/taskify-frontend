// components/CRM/sales-crm/ForecastSummary.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SalesCrmApi,
    type ForecastKpis,
    type ForecastTrendPoint,
    type BreakdownData,
    type BySalespersonData,
    type ForecastMonth,
} from '@/services/salesCrm.service';
import { formatMoney } from './constants';
import { KpiCard } from './KpiCard';
import type { SalesFilters } from './FilterBar';

interface Props {
    filters: SalesFilters;
    activeMonth: ForecastMonth | 'all';
}

export function ForecastSummary({ filters, activeMonth }: Props) {
    const [kpis, setKpis] = useState<ForecastKpis | null>(null);
    const [trend, setTrend] = useState<ForecastTrendPoint[]>([]);
    const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
    const [salespeople, setSalespeople] = useState<BySalespersonData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const base: Record<string, string> = {};
            if (filters.region !== 'All Regions') base.country = filters.region;
            if (filters.territory !== 'All Territories') base.territory = filters.territory;
            if (filters.owner) base.owner = filters.owner;
            if (activeMonth !== 'all') base.month = activeMonth;

            const [k, t, b, s] = await Promise.all([
                SalesCrmApi.forecastKpis(base),
                SalesCrmApi.forecastTrend(base),
                SalesCrmApi.breakdown({ ...base, by: 'country' }),
                SalesCrmApi.bySalesperson(base),
            ]);
            setKpis(k);
            setTrend(t);
            setBreakdown(b);
            setSalespeople(s);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load forecast summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMonth, filters.region, filters.territory, filters.owner]);

    const maxTrend = Math.max(1, ...trend.map((t) => Math.max(t.closed, t.open)));

    // ---------- SKELETON ----------
    if (loading || !kpis) {
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[280px] animate-pulse rounded-xl bg-white border border-[#EBE6DF]"
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[90px] animate-pulse rounded-xl bg-white border border-[#EBE6DF]"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* 3-Column Row — Trend | Breakdown | By Salesperson */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Trend Chart */}
                <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                            {activeMonth === 'all'
                                ? 'Monthly Forecast Trend'
                                : `Daily Forecast Trend — ${activeMonth}`}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400">
                            {trend.length} {activeMonth === 'all' ? 'mo' : 'days'}
                        </span>
                    </div>

                    <div
                        className="overflow-x-auto overflow-y-hidden pb-1"
                        style={{ height: 200 }}
                    >
                        <div
                            className={`flex items-end h-full ${
                                activeMonth === 'all' ? 'gap-1' : 'gap-[3px]'
                            }`}
                        >
                            {trend.map((t) => {
                                const totalH = Math.max(t.closed, t.open);
                                const closedPct =
                                    totalH > 0 ? (t.closed / maxTrend) * 100 : 0;
                                const openPct =
                                    totalH > 0 ? (t.open / maxTrend) * 100 : 0;

                                const openHeight =
                                    openPct > 0 ? Math.max(2, openPct) : 0;
                                const closedHeight =
                                    closedPct > 0 ? Math.max(2, closedPct) : 0;

                                return (
                                    <div
                                        key={t.key}
                                        className="flex flex-col items-center shrink-0"
                                        style={{
                                            width: activeMonth === 'all' ? 22 : 14,
                                            height: '100%',
                                        }}
                                    >
                                        <div
                                            className="relative w-full flex flex-col justify-end"
                                            style={{ height: 165 }}
                                        >
                                            <div
                                                className="w-full rounded-t bg-[#A06126]"
                                                style={{ height: `${openHeight}%` }}
                                                title={`${t.label} · Open: ${formatMoney(
                                                    t.open,
                                                    filters.currency,
                                                    { rate: filters.rate }
                                                )}`}
                                            />
                                            <div
                                                className="w-full rounded-t bg-emerald-600"
                                                style={{ height: `${closedHeight}%` }}
                                                title={`${t.label} · Closed: ${formatMoney(
                                                    t.closed,
                                                    filters.currency,
                                                    { rate: filters.rate }
                                                )}`}
                                            />
                                            {t.noActivity && (
                                                <div
                                                    className="w-full rounded-t bg-slate-200"
                                                    style={{ height: 3 }}
                                                />
                                            )}
                                        </div>

                                        <span className="mt-1 text-[8px] font-semibold text-slate-500 leading-none">
                                            {t.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#F0EBE3] pt-3 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Closed
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#A06126]" /> Open
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> None
                        </span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                            Breakdown
                        </h3>
                        <select
                            className="rounded border border-[#E2DBD1] bg-[#FDFBF7] px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none"
                            defaultValue="country"
                        >
                            <option value="country">By Country</option>
                            <option value="stage">By Stage</option>
                            <option value="source">By Source</option>
                        </select>
                    </div>

                    {breakdown && breakdown.entries.length > 0 ? (
                        <div className="space-y-3">
                            {breakdown.entries.map((b) => (
                                <div key={b.key}>
                                    <div className="mb-1 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-700 font-medium">
                                            {b.key}
                                        </span>
                                        <span className="font-mono text-slate-800 font-semibold">
                                            {formatMoney(b.value, filters.currency, {
                                                rate: filters.rate,
                                            })}{' '}
                                            <span className="text-slate-400">({b.pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#635BFF]"
                                            style={{ width: `${b.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-[11px] italic text-slate-400">
                            No pipeline value in scope for this selection.
                        </p>
                    )}
                </div>

                {/* By Salesperson */}
                <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                        By Salesperson
                    </h3>

                    {salespeople && salespeople.people.length > 0 ? (
                        <>
                            <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
                                <div>
                                    <div className="text-[12px] font-semibold text-slate-800">
                                        All Salespeople
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {salespeople.count} entr
                                        {salespeople.count === 1 ? 'y' : 'ies'} in scope
                                    </div>
                                </div>
                                <span className="font-mono text-[13px] font-bold text-slate-800">
                                    {formatMoney(salespeople.total, filters.currency, {
                                        rate: filters.rate,
                                    })}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {salespeople.people.map((p) => (
                                    <div
                                        key={p.name}
                                        className="flex items-center justify-between rounded border border-[#F0EBE3] px-3 py-2 hover:bg-[#FDFBF7] transition cursor-pointer"
                                    >
                                        <div>
                                            <div className="text-[12px] font-semibold text-slate-800">
                                                {p.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {p.count} entr{p.count === 1 ? 'y' : 'ies'}
                                            </div>
                                        </div>
                                        <span className="font-mono text-[12px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                            {formatMoney(p.total, filters.currency, {
                                                rate: filters.rate,
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="py-8 text-center text-[11px] italic text-slate-400">
                            No forecast entries in scope.
                        </p>
                    )}
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard
                    icon={<span>📄</span>}
                    label="Quoted"
                    sub="All open + closed quotes"
                    value={formatMoney(kpis.quoted, filters.currency, { rate: filters.rate })}
                />
                <KpiCard
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    label="Closed (Won)"
                    sub="This year"
                    value={formatMoney(kpis.closedWon, filters.currency, { rate: filters.rate })}
                    valueClass="text-emerald-700"
                />
                <KpiCard
                    icon={<TrendingUp className="w-4 h-4 text-violet-600" />}
                    label="Forecast (Weighted)"
                    sub="Probability-adjusted"
                    value={formatMoney(kpis.weighted, filters.currency, { rate: filters.rate })}
                />
                <KpiCard
                    icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                    label="Lost"
                    sub="This year"
                    value={formatMoney(kpis.lost, filters.currency, { rate: filters.rate })}
                    valueClass="text-rose-600"
                />
                <KpiCard
                    icon={<TrendingUp className="w-4 h-4 text-[#A06126]" />}
                    label="Win Rate"
                    sub="FY26 close rate"
                    value={`${kpis.winRate}%`}
                    trend={kpis.winRate > 0 ? 'up' : 'flat'}
                />
            </div>
        </div>
    );
}