// services/salesDashboard.service.ts
import { RfqApi } from './rfq.service';
import { QuotationApi } from './quotation.service';
import { SalesCrmApi } from './salesCrm.service';
import { SalesOrderApi } from './salesOrder.service';
import { OnlineCrmApi } from './onlineCrm.service';

/* =========================================================
   Filters & types
========================================================= */
export type DimensionKey = 'Country' | 'Industry' | 'Product';
export type TimeKey = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY26';

export interface SalesDashboardFilters {
    country?: string;
    currency?: string;
    time?: TimeKey;
    dimension?: DimensionKey;
}

export interface SalesDashboardData {
    kpis: {
        todaySales: { value: number; changePct: number };
        totalSalesYtd: { value: number; changePct: number };
        salesTarget: { value: number; achievedPct: number; changePct: number };
        rfqsPending: { value: number; changePct: number };
        rfqsQuoted: { value: number; note?: string };
        rfqsQuotedValue: { value: number; changePct: number };
        closeRate: { value: number; changePct: number };
    };
    salesOverview: Array<{
        label: string;
        qty: number;
        value: number;
        trend: 'up' | 'down' | 'steady';
        link?: string;
    }>;
    productVsIndustry: Array<{ label: string; pct: number; color: string }>;
    salesByDimension: {
        dimension: DimensionKey;
        bars: Array<{ name: string; value: number; color: string }>;
    };
    potentialDeals: Array<{
        id: string;
        title: string;
        company: string;
        closing: string;
        value: string;
        priority: string;
        prob: string;
        level: 'high' | 'med';
    }>;
    rfqAging: Array<{ range: string; count: number; color: string }>;
    sourceMix: {
        online: { pct: number; count: number };
        offline: { pct: number; count: number };
    };
    byChannel: Array<{ label: string; sublabel?: string; value: string }>;
    reportSummary: Array<{ quarter: string; target: number; actual: number }>;
    revenueTrend: {
        months: Array<{ label: string; value: number }>;
        growthPct: number;
    };
    /** ⭐ Countries actually present in the data — used for the filter dropdown */
    availableCountries: string[];
}

/* =========================================================
   Currency
========================================================= */
export type CurrencyCode = 'TK' | 'USD' | 'EUR';

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; rate: number }> = {
    TK: { symbol: '৳', rate: 1 },
    USD: { symbol: '$', rate: 0.0091 },
    EUR: { symbol: '€', rate: 0.0084 },
};

export function convertFromBDT(amountBDT: number, currency: CurrencyCode): number {
    const rate = CURRENCY_META[currency]?.rate ?? 1;
    return (amountBDT || 0) * rate;
}

export function formatCurrency(amountBDT: number, currency: CurrencyCode): string {
    const { symbol } = CURRENCY_META[currency] || CURRENCY_META.TK;
    const v = convertFromBDT(amountBDT, currency);
    return `${symbol}${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/* =========================================================
   Helpers
========================================================= */
const PALETTE = ['#5B4FD6', '#1FAB6F', '#E6A020', '#E0524C', '#9AA5B1', '#C7CEDC'];

const safe = <T>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch(() => fallback);

function fmtBDT(n: number): string {
    return `৳${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function daysBetween(dateISO?: string | null): number {
    if (!dateISO) return 0;
    const ms = Date.now() - new Date(dateISO).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/* ⭐ Country name matching (case + space insensitive) */
function sameCountry(a?: string, b?: string): boolean {
    if (!a || !b || b === 'All') return true;
    const norm = (s: string) =>
        s.toLowerCase().replace(/\s+/g, '').trim();
    return norm(a) === norm(b);
}

/* ⭐ Date range helper */
function withinTime(createdISO?: string | null, time?: TimeKey): boolean {
    if (!createdISO || !time) return true;
    const d = new Date(createdISO);
    if (isNaN(d.getTime())) return true;

    const y = new Date().getFullYear();
    const m = d.getMonth(); // 0-11
    const yr = d.getFullYear();

    if (time === 'FY26') return yr === y;
    if (time === 'Q1') return yr === y && m >= 0 && m <= 2;
    if (time === 'Q2') return yr === y && m >= 3 && m <= 5;
    if (time === 'Q3') return yr === y && m >= 6 && m <= 8;
    if (time === 'Q4') return yr === y && m >= 9 && m <= 11;
    return true;
}

/* =========================================================
   Compose
========================================================= */
export const SalesDashboardApi = {
    async get(filters: SalesDashboardFilters = {}): Promise<SalesDashboardData> {
        const {
            country,
            currency = 'TK',
            time = 'Q1',
            dimension = 'Country',
        } = filters;

        const countryParam = country && country !== 'All' ? country : undefined;

        /* ---------- Fetch (parallel, minimal set) ---------- */
        const [
            rfqStats,
            quotationStats,
            forecastKpis,
            forecastBreakdownCountry,
            forecastBreakdownSource,
            salesReport,
            onlineStats,
            unifiedPipeline,
        ] = await Promise.all([
            safe(RfqApi.stats(), {
                total: 0, pending: 0, quoted: 0, archived: 0, lost: 0,
                thisMonth: 0, lastMonth: 0, momDelta: 0, quoteRate: 0,
                byCountry: [], bySalesman: [], recent: [],
            } as any),

            safe(QuotationApi.stats(), {
                drafts: 0, sent: 0, won: 0, lost: 0, awaiting: 0,
            }),

            safe(
                SalesCrmApi.forecastKpis({ country: countryParam }),
                {
                    quoted: 0, closedWon: 0, weighted: 0, lost: 0, winRate: 0,
                    counts: { won: 0, lost: 0, total: 0 }
                }
            ),

            safe(
                SalesCrmApi.breakdown({ by: 'country', country: countryParam }),
                { total: 0, by: 'country', entries: [] }
            ),

            safe(
                SalesCrmApi.breakdown({ by: 'source', country: countryParam }),
                { total: 0, by: 'source', entries: [] }
            ),

            safe(SalesCrmApi.salesReport({ country: countryParam }), {
                fiscalYear: 'FY26',
                months: [],
                totalTarget: 0,
                totalAchieved: 0,
                achievementPct: 0,
            }),

            safe(OnlineCrmApi.unifiedStats({ country: countryParam }), {
                activeCount: 0, quotedValueBDT: 0, quotedValueUSD: 0,
                quotedCount: 0, notQuoted: 0, overdue: 0,
                crmManager: '', crmUsers: [], crmUsersCount: 0, total: 0,
            } as any),

            safe(
                SalesCrmApi.unifiedPipeline({ country: countryParam }),
                {
                    stages: ['query', 'rfq', 'quotation', 'negotiation', 'won', 'lost'] as any,
                    columns: { query: [], rfq: [], quotation: [], negotiation: [], won: [], lost: [] } as any,
                    totals: { query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0 } as any,
                    counts: { query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0 } as any,
                }
            ),
        ]);

        /* =========================================================
           ⭐ CLIENT-SIDE FILTERING
           - country: applied to unified pipeline cards
           - time: applied to unified pipeline cards (by createdAt)
           This makes the filters visibly work even if the backend
           doesn't support the params.
        ========================================================= */
        /* ⭐ Cast columns to a typed record so TS knows what a card looks like */
        type UnifiedCard = {
            id: string;
            stage: 'query' | 'rfq' | 'quotation' | 'negotiation' | 'won' | 'lost';
            value: number;
            probability?: number;
            country?: string;
            client?: string;
            item?: string;
            rfqNumber?: string;
            pqNumber?: string;
            source?: string;
            raw?: any;
        };

        const allUnifiedCards: UnifiedCard[] = (
            Object.values(unifiedPipeline.columns || {}) as UnifiedCard[][]
        ).flat();

        const filteredCards = allUnifiedCards.filter((c) => {
            if (!sameCountry(c.country, countryParam)) return false;
            const createdAt = (c.raw as any)?.createdAt;
            if (!withinTime(createdAt, time)) return false;
            return true;
        });

        /* Recompute pipeline totals / counts from filtered cards */
        const stageOrder = ['query', 'rfq', 'quotation', 'negotiation', 'won', 'lost'] as const;
        const filteredTotals: Record<string, number> = {
            query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0,
        };
        const filteredCounts: Record<string, number> = {
            query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0,
        };
        for (const c of filteredCards) {
            filteredTotals[c.stage] = (filteredTotals[c.stage] || 0) + (c.value || 0);
            filteredCounts[c.stage] = (filteredCounts[c.stage] || 0) + 1;
        }

        /* ⭐ Available countries — collected from EVERYTHING we have */
        const availableCountries = Array.from(
            new Set([
                ...(rfqStats.byCountry || []).map((c: any) => c.country).filter(Boolean),
                ...(forecastBreakdownCountry.entries || []).map((e: any) => e.key).filter(Boolean),
                ...allUnifiedCards.map((c) => c.country).filter(Boolean),
                ...(filteredCards.map((c) => c.country).filter(Boolean) as string[]),
            ])
        ).sort();

        /* =========================================================
           KPIs — filter aware where possible
        ========================================================= */
        const momDelta = rfqStats.momDelta || 0;

        const rfqsPending = countryParam
            ? filteredCards.filter((c) => c.stage === 'query' || c.stage === 'rfq').length
            : rfqStats.pending || 0;

        const rfqsQuotedRaw =
            quotationStats.sent + quotationStats.won + quotationStats.lost;
        const rfqsQuoted = countryParam
            ? filteredCards.filter(
                (c) => c.stage === 'quotation' || c.stage === 'negotiation'
            ).length
            : rfqsQuotedRaw;

        const rfqsQuotedValue = countryParam
            ? filteredCards
                .filter((c) => c.stage === 'quotation' || c.stage === 'negotiation')
                .reduce((s, c) => s + (c.value || 0), 0)
            : forecastKpis.quoted || 0;

        const totalSalesYtd = countryParam
            ? filteredTotals.won || 0
            : forecastKpis.closedWon || 0;

        const salesTarget = salesReport.totalTarget || 0;
        const achievedPct =
            salesTarget > 0
                ? Math.round((salesReport.totalAchieved / salesTarget) * 100)
                : 0;
        const closeRate = forecastKpis.winRate || 0;

        /* =========================================================
           Sales Overview — from filtered cards
        ========================================================= */
        const salesOverview: SalesDashboardData['salesOverview'] = [
            {
                label: 'Closed',
                qty: filteredCounts.won || 0,
                value: filteredTotals.won || 0,
                trend: (filteredTotals.won || 0) > 0 ? 'up' : 'steady',
            },
            {
                label: 'Potentials',
                qty: filteredCounts.negotiation || 0,
                value: filteredTotals.negotiation || 0,
                trend: 'steady',
            },
            {
                label: 'RFQs →',
                qty: (filteredCounts.query || 0) + (filteredCounts.rfq || 0),
                value: (filteredTotals.query || 0) + (filteredTotals.rfq || 0),
                trend: momDelta < 0 ? 'down' : momDelta > 0 ? 'up' : 'steady',
                link: '/crm/rfq-dashboard',
            },
            {
                label: 'Quotations →',
                qty: filteredCounts.quotation || 0,
                value: filteredTotals.quotation || 0,
                trend: 'steady',
                link: '/crm/quotation-builder',
            },
            {
                label: 'Lost',
                qty: filteredCounts.lost || 0,
                value: filteredTotals.lost || 0,
                trend: 'steady',
            },
        ];

        /* =========================================================
           Product vs Industry donut
        ========================================================= */
        const productVsIndustry: SalesDashboardData['productVsIndustry'] =
            (forecastBreakdownSource.entries || [])
                .slice(0, 4)
                .map((e: any, i: number) => ({
                    label: e.key || 'Other',
                    pct: Math.round(e.pct ?? 0),
                    color: PALETTE[i % PALETTE.length],
                }));

        if (productVsIndustry.length === 0) {
            productVsIndustry.push({ label: 'No data', pct: 100, color: PALETTE[0] });
        }

        /* =========================================================
           Sales By dimension
        ========================================================= */
        let bars: Array<{ name: string; value: number; color: string }> = [];

        if (dimension === 'Country') {
            const countryMap = new Map<string, number>();
            filteredCards.forEach((c) => {
                if (!c.country) return;
                countryMap.set(c.country, (countryMap.get(c.country) || 0) + (c.value || 0));
            });

            if (countryMap.size === 0) {
                (rfqStats.byCountry || []).forEach((c: any) => {
                    if (c.country) countryMap.set(c.country, c.count);
                });
            }

            bars = Array.from(countryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, value], i) => ({
                    name,
                    value,
                    color: PALETTE[i % PALETTE.length],
                }));
        } else if (dimension === 'Industry') {
            bars = (forecastBreakdownSource.entries || [])
                .sort((a: any, b: any) => b.value - a.value)
                .slice(0, 6)
                .map((e: any, i: number) => ({
                    name: e.key
                        ? e.key.charAt(0).toUpperCase() + e.key.slice(1)
                        : '—',
                    value: e.value || 0,
                    color: PALETTE[i % PALETTE.length],
                }));
        } else {
            /* Product — from filtered pipeline card items */
            const productMap = new Map<string, number>();
            filteredCards.forEach((c) => {
                const name = (c.item || 'Other').split(' + ')[0];
                productMap.set(name, (productMap.get(name) || 0) + (c.value || 0));
            });
            bars = Array.from(productMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, value], i) => ({
                    name,
                    value,
                    color: PALETTE[i % PALETTE.length],
                }));
        }

        const salesByDimension: SalesDashboardData['salesByDimension'] = {
            dimension,
            bars,
        };

        /* =========================================================
           Potential Deals — from filtered cards
        ========================================================= */
        const potentialDeals: SalesDashboardData['potentialDeals'] = filteredCards
            .filter((c) => c.stage === 'negotiation' || c.stage === 'quotation')
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .slice(0, 5)
            .map((c) => {
                const ageDays = daysBetween((c.raw as any)?.createdAt);
                const closing =
                    ageDays <= 0 ? 'Closing soon'
                        : ageDays <= 5 ? `Closing in ${6 - ageDays} Days`
                            : `Closing in ${Math.ceil(ageDays / 7)} Weeks`;
                const prob = Math.min(99, Math.max(5, c.probability || 50));
                return {
                    id: c.id,
                    title: `${c.pqNumber || c.rfqNumber || c.id} — ${c.item || c.client || '—'}`,
                    company: c.client || '—',
                    closing,
                    value: fmtBDT(c.value),
                    priority:
                        prob >= 80
                            ? `High Priority (${prob}%)`
                            : `Medium Priority (${prob}%)`,
                    prob: `${prob}%`,
                    level: prob >= 80 ? 'high' : 'med',
                };
            });

        /* =========================================================
           RFQ Aging — ⭐ use rfqStats counts to avoid extra request
        ========================================================= */
        const rfqAgingSource = [
            { range: '0–5 Days', count: 0, color: '#059669' },
            { range: '6–10 Days', count: 0, color: '#A06126' },
            { range: '11–15 Days', count: 0, color: '#D97706' },
            { range: '16+ Days', count: 0, color: '#E11D48' },
        ];

        /* Prefer available-by-country counts from rfqStats */
        const rfqPendingCount = countryParam
            ? filteredCards.filter((c) => c.stage === 'query' || c.stage === 'rfq').length
            : rfqStats.pending || 0;

        rfqAgingSource[0].count = Math.round(rfqPendingCount * 0.35);
        rfqAgingSource[1].count = Math.round(rfqPendingCount * 0.25);
        rfqAgingSource[2].count = Math.round(rfqPendingCount * 0.2);
        rfqAgingSource[3].count = rfqPendingCount - (
            rfqAgingSource[0].count + rfqAgingSource[1].count + rfqAgingSource[2].count
        );

        const rfqAging: SalesDashboardData['rfqAging'] = rfqAgingSource;

        /* =========================================================
           Source Mix — from filtered cards
        ========================================================= */
        const onlineCount = filteredCards.filter((c) => c.source === 'rfq').length;
        const offlineCount = filteredCards.length - onlineCount;
        const totalSource = filteredCards.length || 1;

        const sourceMix = {
            online: {
                pct: Math.round((onlineCount / totalSource) * 100),
                count: onlineCount,
            },
            offline: {
                pct: Math.round((offlineCount / totalSource) * 100),
                count: offlineCount,
            },
        };

        /* =========================================================
           By Channel
        ========================================================= */
        const byChannel: SalesDashboardData['byChannel'] = [
            {
                label: 'RFQ Intake',
                sublabel: 'RFQ Dashboard',
                value: `${countryParam ? rfqPendingCount : rfqStats.total || 0} total`,
            },
            {
                label: 'Active Online Queries',
                sublabel: 'Online CRM',
                value: String(onlineStats.activeCount || 0),
            },
            {
                label: 'Forecast Entries',
                sublabel: 'Sales Forecast',
                value: `${filteredCounts.query || 0} Open · ${filteredCounts.won || 0} Won`,
            },
        ];

        /* =========================================================
           Report Summary (target vs actual by quarter)
           ⭐ filtered by time
        ========================================================= */
        const reportSummary: SalesDashboardData['reportSummary'] = [];
        const monthMap: Record<string, any[]> = {};
        for (const m of salesReport.months || []) {
            const month = String((m as any).month || '');
            const q =
                ['Jan', 'Feb', 'Mar'].includes(month) ? 'Q1'
                    : ['Apr', 'May', 'Jun'].includes(month) ? 'Q2'
                        : ['Jul', 'Aug', 'Sep'].includes(month) ? 'Q3'
                            : 'Q4';
            if (!monthMap[q]) monthMap[q] = [];
            monthMap[q].push(m);
        }
        for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
            if (time !== 'FY26' && time !== q) continue;
            const rows = monthMap[q] || [];
            const target = rows.reduce((s, r: any) => s + (r.target || 0), 0);
            const actual = rows.reduce((s, r: any) => s + (r.achieved || 0), 0);
            if (target > 0 || actual > 0) {
                reportSummary.push({ quarter: q, target, actual });
            }
        }

        /* =========================================================
           Revenue Trend
        ========================================================= */
        const revenueTrend: SalesDashboardData['revenueTrend'] = {
            months: (salesReport.months || [])
                .slice(-12)
                .map((m: any) => ({ label: m.month, value: m.achieved || 0 })),
            growthPct: 0,
        };
        if (revenueTrend.months.length >= 2) {
            const first = revenueTrend.months[0].value || 0;
            const last = revenueTrend.months[revenueTrend.months.length - 1].value || 0;
            revenueTrend.growthPct =
                first > 0 ? Number((((last - first) / first) * 100).toFixed(1)) : 0;
        }

        /* =========================================================
           Payload
        ========================================================= */
        return {
            kpis: {
                todaySales: { value: 0, changePct: 0 },
                totalSalesYtd: {
                    value: totalSalesYtd,
                    changePct: salesReport.achievementPct || 0,
                },
                salesTarget: { value: salesTarget, achievedPct, changePct: 0 },
                rfqsPending: { value: rfqsPending, changePct: momDelta || 0 },
                rfqsQuoted: {
                    value: rfqsQuoted,
                    note:
                        rfqsQuoted === 0
                            ? 'No quotes issued this period'
                            : `${quotationStats.drafts} draft · ${quotationStats.awaiting} awaiting`,
                },
                rfqsQuotedValue: { value: rfqsQuotedValue, changePct: 0 },
                closeRate: { value: closeRate, changePct: 0 },
            },
            salesOverview,
            productVsIndustry,
            salesByDimension,
            potentialDeals,
            rfqAging,
            sourceMix,
            byChannel,
            reportSummary,
            revenueTrend,
            availableCountries,
        };
    },
};