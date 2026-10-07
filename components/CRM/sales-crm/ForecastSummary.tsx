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

const MONTH_FULL: Record<string, string> = {
    Jan: 'January',
    Feb: 'February',
    Mar: 'March',
    Apr: 'April',
    May: 'May',
    Jun: 'June',
    Jul: 'July',
    Aug: 'August',
    Sep: 'September',
    Oct: 'October',
    Nov: 'November',
    Dec: 'December',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ForecastSummary({ filters, activeMonth }: Props) {
    const [kpis, setKpis] = useState<ForecastKpis | null>(null);
    const [trend, setTrend] = useState<ForecastTrendPoint[]>([]);
    const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
    const [salespeople, setSalespeople] = useState<BySalespersonData | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedPoint, setSelectedPoint] = useState<ForecastTrendPoint | null>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    // ============================================================
    // LOAD DATA
    // ============================================================
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
        setSelectedPoint(null);
        setHoveredKey(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMonth, filters.region, filters.territory, filters.owner]);

    // ============================================================
    // ⭐ AUTO-SELECT TODAY (or current month for "All" view)
    // ============================================================
    useEffect(() => {
        if (trend.length === 0) return;
        if (selectedPoint) return;   // user already picked something

        const now = new Date();
        const todayDay = String(now.getDate()).padStart(2, '0');
        const todayMonthShort = MONTH_SHORT[now.getMonth()];

        const isDaily = activeMonth !== 'all' || trend.length > 12;

        let match: ForecastTrendPoint | undefined;

        if (isDaily) {
            // ⭐ ONLY auto-select today when the chart is showing the CURRENT month.
            const isCurrentMonth =
                activeMonth !== 'all'
                    ? activeMonth === todayMonthShort
                    : trend.length > 12 &&
                    trend.some((t) => t.month === todayMonthShort);

            if (isCurrentMonth) {
                match = trend.find((t) => t.label === todayDay);
                if (!match) {
                    match = trend.find(
                        (t) => String(Number(t.label)) === String(now.getDate())
                    );
                }
            }
            // else → no auto-select — user is viewing a historical month
        } else {
            // Monthly mode — auto-select the current month only if it's in the data
            match = trend.find((t) => t.label === todayMonthShort);
        }

        if (match) setSelectedPoint(match);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trend, activeMonth]);   // ⭐ include activeMonth

    const maxTrend = Math.max(1, ...trend.map((t) => Math.max(t.closed, t.open)));

    // ============================================================
    // SKELETON
    // ============================================================
    if (loading || !kpis) {
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="h-[280px] animate-pulse rounded-xl bg-white border border-[#EBE6DF] col-span-3" />
                    <div className="h-[280px] animate-pulse rounded-xl bg-white border border-[#EBE6DF]" />
                    <div className="h-[280px] animate-pulse rounded-xl bg-white border border-[#EBE6DF]" />
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

    // ============================================================
    // ⭐ MODE DETECTION — Data shape wins over activeMonth
    // ============================================================
    const isDailyMode = activeMonth !== 'all' || trend.length > 12;

    const monthLabel =
        activeMonth !== 'all'
            ? MONTH_FULL[activeMonth] || activeMonth
            : MONTH_FULL[MONTH_SHORT[new Date().getMonth()]];

    const chartTitle = isDailyMode
        ? `Daily Forecast Trend — ${monthLabel}`
        : 'Monthly Forecast Trend';

    const trendCountLabel = isDailyMode
        ? `${trend.length} days`
        : `${trend.length} months`;

    // ============================================================
    // ACTIVE POINT + CAPTION
    // ============================================================
    const activePoint = selectedPoint
        ? selectedPoint
        : hoveredKey
            ? trend.find((t) => t.key === hoveredKey) || null
            : null;

    const activeLabel = activePoint
        ? isDailyMode
            ? `${activeMonth !== 'all' ? activeMonth : MONTH_SHORT[new Date().getMonth()]} ${activePoint.label}`
            : activePoint.label
        : '';

    const activeIsEmpty = activePoint
        ? !activePoint.closed && !activePoint.open
        : false;

    const captionNode = (() => {
        if (!activePoint) {
            return (
                <span className="text-slate-400">
                    {isDailyMode
                        ? 'Hover or click a day to see its totals'
                        : 'Hover or click a month to see its totals'}
                </span>
            );
        }

        if (activeIsEmpty) {
            return (
                <span className="text-slate-500">
                    <span className="font-semibold text-[#0F2D4A]">
                        {activeLabel}:
                    </span>{' '}
                    <span className="italic text-slate-400">
                        No data recorded
                    </span>
                </span>
            );
        }

        const total = activePoint.closed + activePoint.open;

        return (
            <span className="text-slate-700">
                <span className="font-semibold text-[#0F2D4A]">
                    {activeLabel}:
                </span>{' '}
                <span className="font-mono font-bold text-[#0F2D4A]">
                    {formatMoney(total, filters.currency, { rate: filters.rate })}
                </span>{' '}
                <span className="text-slate-500">
                    {isDailyMode
                        ? 'in sales this day'
                        : 'in quoted pipeline this month'}
                </span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {formatMoney(activePoint.closed, filters.currency, {
                        rate: filters.rate,
                    })}
                </span>
                <span className="inline-flex items-center gap-1 ml-2 text-[#A06126]">
                    <span className="w-2 h-2 rounded-full bg-[#A06126]" />
                    {formatMoney(activePoint.open, filters.currency, {
                        rate: filters.rate,
                    })}
                </span>
            </span>
        );
    })();

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* ============================================================
                    TREND CHART
                   ============================================================ */}
                <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs col-span-3">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                            {chartTitle}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400">
                            {trendCountLabel}
                        </span>
                    </div>

                    {/* ⭐ Active pill — shows selected/hovered day's value */}
                    <div className="mb-2 flex items-center gap-2 min-h-[22px]">
                        {activePoint ? (
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 ${activeIsEmpty
                                    ? 'bg-slate-100 text-slate-500 ring-slate-200'
                                    : 'bg-[#FFF7E8] text-[#A06126] ring-[#F5D9B8]'
                                    }`}
                            >
                                <span className="uppercase">{activeLabel}</span>
                                {!activeIsEmpty && (
                                    <>
                                        <span className="opacity-40">·</span>
                                        <span className="font-mono">
                                            {formatMoney(
                                                activePoint.closed + activePoint.open,
                                                filters.currency,
                                                { rate: filters.rate }
                                            )}
                                        </span>
                                    </>
                                )}
                                {activeIsEmpty && (
                                    <span className="italic font-medium">No data</span>
                                )}
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400 italic">
                                Select a bar to see details
                            </span>
                        )}
                    </div>

                    {/* ⭐ Grid-based bar chart */}
                    <div
                        className={`grid items-end pb-1 ${isDailyMode ? 'gap-[3px]' : 'gap-[7px]'
                            }`}
                        style={{
                            gridTemplateColumns: `repeat(${Math.max(
                                trend.length,
                                1
                            )}, minmax(0, 1fr))`,
                            height: 180,
                        }}
                    >
                        {trend.map((t) => {
                            const totalH = Math.max(t.closed, t.open);
                            const closedPct =
                                totalH > 0 ? (t.closed / maxTrend) * 100 : 0;
                            const openPct =
                                totalH > 0 ? (t.open / maxTrend) * 100 : 0;

                            const BAR_MAX = 140;
                            const openHeightPx =
                                openPct > 0
                                    ? Math.max(4, (openPct / 100) * BAR_MAX)
                                    : 0;
                            const closedHeightPx =
                                closedPct > 0
                                    ? Math.max(4, (closedPct / 100) * BAR_MAX)
                                    : 0;

                            const isSelected = selectedPoint?.key === t.key;
                            const isHovered = hoveredKey === t.key;
                            const isEmpty = !t.closed && !t.open;
                            const isActive = isSelected || isHovered;

                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() =>
                                        setSelectedPoint(isSelected ? null : t)
                                    }
                                    onMouseEnter={() => setHoveredKey(t.key)}
                                    onMouseLeave={() => setHoveredKey(null)}
                                    className={`flex flex-col items-center rounded-sm transition cursor-pointer ${isSelected
                                        ? 'bg-[#FFF7E8] ring-1 ring-[#A06126]/40'
                                        : isHovered
                                            ? 'bg-slate-50'
                                            : ''
                                        }`}
                                    title={
                                        isEmpty
                                            ? `${t.label}: No data`
                                            : `${t.label}: ${formatMoney(
                                                t.closed + t.open,
                                                filters.currency,
                                                { rate: filters.rate }
                                            )}`
                                    }
                                >
                                    {/* Bar wrapper — fixed pixel height */}
                                    <div
                                        className="w-full flex flex-col justify-end items-center"
                                        style={{ height: BAR_MAX }}
                                    >
                                        {isEmpty ? (
                                            <div className="w-full flex flex-col items-center pb-0.5">
                                                <span className="text-[7px] text-slate-300 leading-none">
                                                    —
                                                </span>
                                                <div
                                                    className="w-full rounded-t bg-slate-200"
                                                    style={{ height: 3 }}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                {openHeightPx > 0 && (
                                                    <div
                                                        className="w-full rounded-t bg-[#A06126]"
                                                        style={{
                                                            height: openHeightPx,
                                                        }}
                                                    />
                                                )}
                                                {closedHeightPx > 0 && (
                                                    <div
                                                        className="w-full rounded-t bg-emerald-600"
                                                        style={{
                                                            height: closedHeightPx,
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Label — pill style when active */}
                                    <span
                                        className={`mt-1 text-[8px] font-semibold leading-none transition ${isActive
                                            ? 'px-1.5 py-0.5 rounded-full bg-[#A06126] text-white'
                                            : 'text-slate-500'
                                            }`}
                                    >
                                        {t.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Caption */}
                    <div className="mt-3 text-[11px] leading-relaxed min-h-[20px]">
                        {captionNode}
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#F0EBE3] pt-3 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Closed
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#A06126]" /> Open
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> No data
                        </span>
                    </div>
                </div>

                {/* ============================================================
                    BREAKDOWN
                   ============================================================ */}
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
                            <option value="stage">By Brand</option>
                            <option value="source">By Category</option>
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
                                            <span className="text-slate-400">
                                                ({b.pct}%)
                                            </span>
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

                {/* ============================================================
                    BY SALESPERSON
                   ============================================================ */}
                <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs overflow-auto h-[350px]">
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
                                                {p.count} entr
                                                {p.count === 1 ? 'y' : 'ies'}
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

            {/* ============================================================
                KPI Cards
               ============================================================ */}
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