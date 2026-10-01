// app/(dashboard)/crm/sales-leaderboard/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Medal,
    Award,
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    Target,
    DollarSign,
    Percent,
    ChevronDown,
    Sparkles,
    RefreshCw,
    Briefcase,
    Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SalesCrmApi,
    type ForecastMonth,
} from '@/services/salesCrm.service';

// ============================================================
// TYPES
// ============================================================
type DealEntry = {
    id: string;
    client: string;
    item: string;
    stage: string;
    value: number;
    probability: number;
    month: string;
    createdAt: string;
};

type LeaderboardEntry = {
    name: string;
    total: number;
    wonValue: number;
    openValue: number;
    lostValue: number;
    weighted: number;
    count: number;
    wonCount: number;
    lostCount: number;
    openCount: number;
    winRate: number;
    avgDealSize: number;
    entries?: DealEntry[];
};

type LeaderboardData = {
    total: number;
    count: number;
    won: number;
    lost: number;
    open: number;
    winRate: number;
    people: LeaderboardEntry[];
};

type RangeOption = 'this-month' | 'this-quarter' | 'this-year' | 'all' | 'custom-month';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// ============================================================
// HELPERS
// ============================================================
function formatMoney(
    amount: number,
    currency = 'BDT',
    opts: { compact?: boolean } = {}
): string {
    if (!Number.isFinite(amount)) return '—';
    const symbols: Record<string, string> = {
        BDT: '৳',
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹',
    };
    const sym = symbols[currency] || currency + ' ';
    if (opts.compact && Math.abs(amount) >= 1000) {
        const units = [
            { v: 1e9, s: 'B' },
            { v: 1e6, s: 'M' },
            { v: 1e3, s: 'K' },
        ];
        for (const u of units) {
            if (Math.abs(amount) >= u.v) {
                return `${sym}${(amount / u.v).toFixed(2)}${u.s}`;
            }
        }
    }
    return sym + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name: string): string {
    const palette = [
        'from-amber-500 to-amber-700 text-white',
        'from-emerald-500 to-teal-700 text-white',
        'from-violet-500 to-indigo-700 text-white',
        'from-blue-500 to-cyan-700 text-white',
        'from-rose-500 to-pink-700 text-white',
        'from-indigo-500 to-purple-800 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SalesLeaderboardPage() {
    const [range, setRange] = useState<RangeOption>('this-year');
    const [customMonth, setCustomMonth] = useState<ForecastMonth>(
        MONTHS[new Date().getMonth()]
    );
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

    const params = useMemo(() => {
        const p: Record<string, string> = {};
        if (range === 'this-month') {
            p.month = MONTHS[new Date().getMonth()];
        } else if (range === 'custom-month') {
            p.month = customMonth;
        }
        return p;
    }, [range, customMonth]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await SalesCrmApi.bySalesperson(params);
            setData(res as unknown as LeaderboardData);
        } catch (e: any) {
            setError(e?.message || 'Failed to load leaderboard');
            toast.error(e?.message || 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const people = data?.people ?? [];
    const topThree = people.slice(0, 3);
    const maxWonValue = Math.max(1, ...people.map((p) => p.wonValue || 0));

    return (
        <main className="min-h-screen bg-[#FBFBFA] pb-24 text-slate-900 selection:bg-amber-100">
            <div className="mx-auto container space-y-8 p-6 lg:p-10">

                {/* HEADER SECTION */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60 mb-2">
                            <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                            Real-time Performance
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Sales Leaderboard
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Tracking won revenue, win ratios, and deal velocity across the sales team.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing…' : 'Sync Data'}
                    </motion.button>
                </header>

                {/* CONTROLS BAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-2 backdrop-blur-md shadow-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'this-month', label: 'This Month' },
                            { id: 'this-quarter', label: 'This Quarter' },
                            { id: 'this-year', label: 'This Year' },
                            { id: 'all', label: 'All Time' },
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRange(r.id as RangeOption)}
                                className={`relative h-8 rounded-lg px-3.5 text-xs font-semibold transition-all duration-200 ${range === r.id
                                        ? 'text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                    }`}
                            >
                                {range === r.id && (
                                    <motion.div
                                        layoutId="activeRangePill"
                                        className="absolute inset-0 rounded-lg bg-[#0F2D4A]"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{r.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pr-1">
                        <span className="text-[11px] font-medium text-slate-400">Filter by</span>
                        <select
                            value={range === 'custom-month' ? customMonth : ''}
                            onChange={(e) => {
                                setCustomMonth(e.target.value as ForecastMonth);
                                setRange('custom-month');
                            }}
                            className="h-8 rounded-lg border border-slate-200/80 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                        >
                            <option value="" disabled>Specific Month</option>
                            {MONTHS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* METRICS ROW */}
                {data && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                            label="Won Revenue"
                            value={formatMoney(data.won, 'BDT', { compact: true })}
                            accent="emerald"
                        />
                        <StatCard
                            icon={<Target className="w-4 h-4 text-amber-600" />}
                            label="Active Pipeline"
                            value={formatMoney(data.open, 'BDT', { compact: true })}
                            accent="amber"
                        />
                        <StatCard
                            icon={<Percent className="w-4 h-4 text-indigo-600" />}
                            label="Win Rate"
                            value={`${data.winRate}%`}
                            accent="indigo"
                        />
                        <StatCard
                            icon={<Users className="w-4 h-4 text-slate-600" />}
                            label="Sales Reps"
                            value={String(people.length)}
                            sub={`${data.count} deals analyzed`}
                            accent="slate"
                        />
                    </div>
                )}

                {/* DYNAMIC LEADERBOARD VIEW */}
                {loading && !data ? (
                    <LeaderboardSkeleton />
                ) : error ? (
                    <ErrorState message={error} onRetry={load} />
                ) : people.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-10">
                        {/* OLYMPIC PODIUM STAGE (Rank 2 -> Rank 1 -> Rank 3) */}
                        {topThree.length >= 2 && (
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">
                                    Top Performers
                                </div>
                                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                    {/* Rank 2 (Left) */}
                                    <div className="order-2 md:order-1">
                                        <PodiumCard rank={2} person={topThree[1]} maxWonValue={maxWonValue} />
                                    </div>
                                    {/* Rank 1 (Elevated Center) */}
                                    <div className="order-1 md:order-2 md:-translate-y-4">
                                        <PodiumCard rank={1} person={topThree[0]} maxWonValue={maxWonValue} />
                                    </div>
                                    {/* Rank 3 (Right) */}
                                    {topThree[2] && (
                                        <div className="order-3">
                                            <PodiumCard rank={3} person={topThree[2]} maxWonValue={maxWonValue} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* FULL RANKINGS INTERACTIVE TABLE */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Leaderboard Rankings
                                    </h3>
                                    <p className="text-xs text-slate-400">Click a row to drill down into active deals</p>
                                </div>
                                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200/50">
                                    {people.length} reps ranked
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3.5 w-16">Rank</th>
                                            <th className="px-5 py-3.5">Representative</th>
                                            <th className="px-5 py-3.5 text-right">Won Rev</th>
                                            <th className="px-5 py-3.5 text-right">Pipeline</th>
                                            <th className="px-5 py-3.5 text-right">Total</th>
                                            <th className="px-5 py-3.5 text-center">Deals (W/L)</th>
                                            <th className="px-5 py-3.5 text-right">Win Rate</th>
                                            <th className="px-5 py-3.5 text-right">Avg Size</th>
                                            <th className="px-5 py-3.5 w-36">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {people.map((p, i) => {
                                            const isExpanded = expandedPerson === p.name;
                                            return (
                                                <React.Fragment key={p.name}>
                                                    <motion.tr
                                                        layout
                                                        onClick={() => setExpandedPerson(isExpanded ? null : p.name)}
                                                        className={`group cursor-pointer transition-colors duration-150 ${isExpanded ? 'bg-amber-50/30' : 'hover:bg-slate-50/70'
                                                            }`}
                                                    >
                                                        <td className="px-5 py-4">
                                                            <RankBadge rank={i + 1} />
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-[11px] font-bold shadow-xs ${avatarColor(
                                                                        p.name
                                                                    )}`}
                                                                >
                                                                    {getInitials(p.name)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                                                                        {p.name}
                                                                        <ChevronDown
                                                                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-700' : ''
                                                                                }`}
                                                                        />
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400">
                                                                        {p.count} total records
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-mono font-bold text-emerald-600">
                                                            {formatMoney(p.wonValue, 'BDT', { compact: true })}
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-mono font-medium text-amber-700">
                                                            {formatMoney(p.openValue, 'BDT', { compact: true })}
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-mono font-semibold text-slate-900">
                                                            {formatMoney(p.total, 'BDT', { compact: true })}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className="font-mono text-emerald-600 font-medium">
                                                                {p.wonCount}
                                                            </span>
                                                            <span className="text-slate-300 mx-1">/</span>
                                                            <span className="font-mono text-rose-500 font-medium">
                                                                {p.lostCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <WinRatePill rate={p.winRate} />
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-mono text-slate-600">
                                                            {formatMoney(p.avgDealSize, 'BDT', { compact: true })}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(p.wonValue / maxWonValue) * 100}%` }}
                                                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                                                                />
                                                            </div>
                                                        </td>
                                                    </motion.tr>

                                                    {/* ACCORDION DEAL DRILL-DOWN */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={9} className="bg-slate-50/50 p-0 border-b border-slate-100">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        transition={{ duration: 0.25 }}
                                                                        className="px-8 py-5"
                                                                    >
                                                                        <div className="mb-3 flex items-center justify-between">
                                                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                                                Active Opportunities & Recent Deals ({p.entries?.length || 0})
                                                                            </h4>
                                                                        </div>
                                                                        {p.entries && p.entries.length > 0 ? (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                {p.entries.map((deal) => (
                                                                                    <div
                                                                                        key={deal.id}
                                                                                        className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs"
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                                            <span className="font-semibold text-slate-800 text-xs truncate">
                                                                                                {deal.client}
                                                                                            </span>
                                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm capitalize ${deal.stage === 'won'
                                                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                                                    : deal.stage === 'lost'
                                                                                                        ? 'bg-rose-50 text-rose-700'
                                                                                                        : 'bg-amber-50 text-amber-800'
                                                                                                }`}>
                                                                                                {deal.stage}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="text-[11px] text-slate-500 truncate mb-2">{deal.item}</p>
                                                                                        <div className="flex items-center justify-between text-[11px]">
                                                                                            <span className="font-mono font-bold text-slate-900">
                                                                                                {formatMoney(deal.value, 'BDT', { compact: true })}
                                                                                            </span>
                                                                                            <span className="text-slate-400 flex items-center gap-1">
                                                                                                <Calendar className="w-3 h-3" />
                                                                                                {deal.month}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 italic">No detailed records found for this timeframe.</p>
                                                                        )}
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent: 'emerald' | 'amber' | 'indigo' | 'slate';
}) {
    const accentColors = {
        emerald: 'bg-emerald-50 border-emerald-100',
        amber: 'bg-amber-50 border-amber-100',
        indigo: 'bg-indigo-50 border-indigo-100',
        slate: 'bg-slate-50 border-slate-100',
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${accentColors[accent]}`}>
                    {icon}
                </div>
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </span>
                    <div className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </div>
                </div>
            </div>
            {sub && <div className="mt-2 text-[11px] text-slate-400">{sub}</div>}
        </motion.div>
    );
}

function PodiumCard({
    rank,
    person,
    maxWonValue,
}: {
    rank: number;
    person: LeaderboardEntry;
    maxWonValue: number;
}) {
    const configs = {
        1: {
            border: 'border-amber-300/80 ring-4 ring-amber-100/50',
            bg: 'bg-gradient-to-b from-amber-50/70 via-white to-white',
            badge: 'bg-amber-500 text-white',
            icon: <Trophy className="w-5 h-5 text-amber-500" />,
            medal: '🥇',
            height: 'md:min-h-[290px]',
        },
        2: {
            border: 'border-slate-200/80',
            bg: 'bg-gradient-to-b from-slate-50/80 via-white to-white',
            badge: 'bg-slate-400 text-white',
            icon: <Medal className="w-5 h-5 text-slate-400" />,
            medal: '🥈',
            height: 'md:min-h-[260px]',
        },
        3: {
            border: 'border-orange-200/80',
            bg: 'bg-gradient-to-b from-orange-50/60 via-white to-white',
            badge: 'bg-orange-400 text-white',
            icon: <Award className="w-5 h-5 text-orange-400" />,
            medal: '🥉',
            height: 'md:min-h-[240px]',
        },
    }[rank] || {
        border: 'border-slate-200',
        bg: 'bg-white',
        badge: 'bg-slate-300 text-white',
        icon: null,
        medal: '',
        height: 'min-h-[200px]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: rank * 0.1 }}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-xs ${configs.border} ${configs.bg} ${configs.height}`}
        >
            <div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl filter drop-shadow-xs">{configs.medal}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Rank #{rank}
                    </span>
                </div>

                <div className="flex items-center gap-3.5 mb-5">
                    <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-sm font-bold shadow-sm ${avatarColor(
                            person.name
                        )}`}
                    >
                        {getInitials(person.name)}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{person.name}</h4>
                        <p className="text-[11px] text-slate-400">{person.wonCount} won deals</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Won Volume
                    </span>
                    <span className="font-mono text-lg font-bold text-emerald-600">
                        {formatMoney(person.wonValue, 'BDT', { compact: true })}
                    </span>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Win Rate</span>
                        <span className="text-slate-900 font-bold">{person.winRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(person.wonValue / maxWonValue) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-700 text-[11px] font-bold border border-amber-300">
                1
            </span>
        );
    }
    if (rank === 2) {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/50 text-slate-600 text-[11px] font-bold border border-slate-300">
                2
            </span>
        );
    }
    if (rank === 3) {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-200/40 text-orange-700 text-[11px] font-bold border border-orange-300">
                3
            </span>
        );
    }
    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 text-xs font-medium">
            {rank}
        </span>
    );
}

function WinRatePill({ rate }: { rate: number }) {
    const cls =
        rate >= 70
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
            : rate >= 40
                ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                : rate > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                    : 'bg-slate-100 text-slate-500 border-slate-200';

    const Icon = rate >= 70 ? TrendingUp : rate > 0 ? Minus : TrendingDown;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}
        >
            <Icon className="w-2.5 h-2.5" />
            {rate}%
        </span>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-slate-100" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-2xl bg-white border border-slate-100" />
                ))}
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-100" />
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-10 text-center">
            <p className="text-sm font-semibold text-rose-700 mb-1">Failed to load leaderboard data</p>
            <p className="text-xs text-rose-500 mb-4">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-9 items-center rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
            >
                Try Again
            </button>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-700">No sales closed in this period</p>
            <p className="mt-1 text-xs text-slate-400">
                Switch the timeframe tab or check the Deals pipeline.
            </p>
        </div>
    );
}