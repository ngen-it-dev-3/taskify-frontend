// services/salesCrm.service.ts
import api from '@/lib/axios';
import { RfqApi, type RFQItem } from './rfq.service';
import { QuotationApi, type Quotation } from './quotation.service';
import { tenderApi, type Tender } from '@/lib/api/tender.api';

const API_BASE = '/sales-crm';

// ============================================================
// TYPES
// ============================================================
export type ForecastStage =
    | 'query' | 'rfq' | 'quotation' | 'negotiation' | 'won' | 'lost';

export type ForecastSource =
    | 'online' | 'offline' | 'quotation-builder' | 'tender' | 'referral';

export type ForecastMonth =
    | 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun'
    | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

export interface ForecastEntry {
    id: string;
    client: string;
    item: string;
    value: number;
    probability: number;
    weightedValue: number;
    month: ForecastMonth;
    stage: ForecastStage;
    source: ForecastSource;
    note: string;
    country: string;
    region: string;
    owner: string;
    quotationId: string | null;
    rfqId: string | null;
    rfqNumber: string;
    pqNumber: string;
    deliveredAt: string | null;
    invoicedAt: string | null;
    executedAt: string | null;
    closedAt: string | null;
    monthlyTarget: number;
    createdAt: string;
    updatedAt: string;
}

export interface ForecastListParams {
    month?: string;
    stage?: string;
    source?: string;
    owner?: string;
    country?: string;
    region?: string;
    territory?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface CreateForecastPayload {
    client: string;
    item?: string;
    value?: number;
    probability?: number;
    month?: ForecastMonth;
    stage?: ForecastStage;
    source?: ForecastSource;
    note?: string;
    country?: string;
    region?: string;
    territory?: string;
    owner?: string;
    monthlyTarget?: number;
}

export interface PipelineData {
    stages: ForecastStage[];
    columns: Record<ForecastStage, ForecastEntry[]>;
    totals: Record<ForecastStage, number>;
}

export interface ForecastKpis {
    quoted: number;
    closedWon: number;
    weighted: number;
    lost: number;
    winRate: number;
    counts: { won: number; lost: number; total: number };
}

export interface ForecastTrendPoint {
    key: string;
    label: string;
    month: ForecastMonth;
    closed: number;
    open: number;
    noActivity: boolean;
}

export interface BreakdownEntry {
    key: string;
    value: number;
    pct: number;
}

export interface BreakdownData {
    total: number;
    by: string;
    entries: BreakdownEntry[];
}

export interface SalespersonEntry {
    id: string;
    client: string;
    stage: ForecastStage;
    value: number;
}

export interface SalespersonData {
    name: string;
    total: number;
    count: number;
    entries: SalespersonEntry[];
}

export interface BySalespersonData {
    total: number;
    count: number;
    people: SalespersonData[];
}

export interface SalesReportEntry {
    id: string;
    pqNumber: string;
    owner: string;
    client: string;
    item: string;
    value: number;
    stage: ForecastStage;
    deliveredAt: string | null;
    invoicedAt: string | null;
    executedAt: string | null;
}

export interface SalesReportMonth {
    month: ForecastMonth;
    target: number;
    achieved: number;
    entries: SalesReportEntry[];
}

export interface SalesReportData {
    fiscalYear: string;
    months: SalesReportMonth[];
    totalTarget: number;
    totalAchieved: number;
    achievementPct: number;
}

// ============================================================
// ⭐ UNIFIED PIPELINE TYPES
// ============================================================
export type UnifiedSource = 'rfq' | 'quotation' | 'forecast' | 'tender';

export interface UnifiedCard {
    id: string;
    source: UnifiedSource;
    stage: ForecastStage;
    client: string;
    item: string;
    value: number;
    probability: number;
    country: string;
    owner: string;
    rfqNumber: string;
    rfqId: string | null;
    pqNumber: string;
    quotationId: string | null;
    raw: RFQItem | Quotation | ForecastEntry | Tender;
}

export interface UnifiedPipelineData {
    stages: ForecastStage[];
    columns: Record<ForecastStage, UnifiedCard[]>;
    totals: Record<ForecastStage, number>;
    counts: Record<ForecastStage, number>;
}

// ============================================================
// ⭐ OWNER HELPERS
// ============================================================

/**
 * Extract a displayable owner name from any of these shapes:
 *   - "John Doe"            (plain string)
 *   - { fullName: "John" }  (user object)
 *   - { name: "John" }      (user object, alternate)
 *   - null / undefined / ""
 */
function extractOwnerName(v: any): string {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'object') {
        return String(
            v.fullName || v.name || v.email || ''
        ).trim();
    }
    return '';
}

/**
 * Best-effort owner for a Quotation. Tries multiple paths.
 */
function bestQuotationOwner(q: any): string {
    return (
        extractOwnerName(q?.crmManager) ||
        extractOwnerName(q?.createdBy) ||
        extractOwnerName(q?.salesman) ||
        extractOwnerName(q?.assignedTo) ||
        ''
    );
}

/**
 * Best-effort owner for a ForecastEntry.
 */
function bestForecastOwner(f: any): string {
    return (
        extractOwnerName(f?.owner) ||
        extractOwnerName(f?.createdBy) ||
        ''
    );
}

/**
 * Best-effort owner for an RFQ.
 */
function bestRfqOwner(r: any): string {
    const assigned = extractOwnerName(r?.assignedTo);
    if (assigned && assigned !== 'Unassigned') return assigned;
    return extractOwnerName(r?.salesman) || '';
}

// ============================================================
// NORMALIZERS
// ============================================================

function rfqToCard(r: RFQItem): UnifiedCard {
    const stage: ForecastStage = r.stage === 'lost' ? 'lost' : 'query';
    const firstProduct = r.products?.[0];
    const productCount = r.products?.length ?? 0;

    const probability =
        r.stage === 'lost' ? 0 :
            r.stage === 'quoted' ? 40 : 20;

    return {
        id: `rfq-${r.id}`,
        source: 'rfq',
        stage,
        client: r.company || '—',
        item: firstProduct?.name
            ? productCount > 1
                ? `${firstProduct.name} + ${productCount - 1} more`
                : firstProduct.name
            : '—',
        value: 0,
        probability,
        country: r.country || '—',
        owner: bestRfqOwner(r),   // ⭐ improved
        rfqNumber: r.rfqNumber,
        rfqId: r.id,
        pqNumber: '',
        quotationId: null,
        raw: r,
    };
}

function quotationToCard(q: Quotation): UnifiedCard {
    const stage: ForecastStage =
        q.status === 'draft' ? 'quotation' :
            q.status === 'awaiting_approval' ? 'quotation' :
                q.status === 'sent' ? 'negotiation' :
                    q.status === 'won' ? 'won' :
                        q.status === 'lost' ? 'lost' :
                            q.status === 'expired' ? 'lost' :
                                'quotation';

    const probability =
        stage === 'quotation' ? 60 :
            stage === 'negotiation' ? 75 :
                stage === 'won' ? 100 :
                    stage === 'lost' ? 0 : 50;

    const firstLine = q.lines?.[0];
    const lineCount = q.lines?.length ?? 0;

    return {
        id: `quo-${q.id}`,
        source: 'quotation',
        stage,
        client: q.client?.company || '—',
        item: firstLine?.name
            ? lineCount > 1
                ? `${firstLine.name} + ${lineCount - 1} more`
                : firstLine.name
            : '—',
        value: q.totals?.grandTotal || 0,
        probability,
        country: q.client?.country || q.territory || '—',
        owner: bestQuotationOwner(q),   // ⭐ improved
        rfqNumber: q.rfqNumber || '',
        rfqId: q.rfqId || null,
        pqNumber: q.pqNumber || '',
        quotationId: q.id,
        raw: q,
    };
}

function forecastToCard(f: ForecastEntry): UnifiedCard {
    return {
        id: `fc-${f.id}`,
        source: 'forecast',
        stage: f.stage,
        client: f.client || '—',
        item: f.item || '—',
        value: f.value || 0,
        probability: f.probability || 50,
        country: f.country || '—',
        owner: bestForecastOwner(f),   // ⭐ improved
        rfqNumber: f.rfqNumber || '',
        rfqId: f.rfqId || null,
        pqNumber: f.pqNumber || '',
        quotationId: f.quotationId || null,
        raw: f,
    };
}

function tenderToCard(t: Tender): UnifiedCard {
    const stage: ForecastStage =
        t.stage === 'won' ? 'won' :
            t.stage === 'lost' ? 'lost' :
                t.stage === 'submitted' ? 'negotiation' :
                    'query';

    const probability =
        stage === 'won' ? 100 :
            stage === 'lost' ? 0 :
                stage === 'negotiation' ? 60 : 50;

    const value = Number(t.bidValue || t.tentativeBudget || 0);

    const owner =
        extractOwnerName(t.owner) ||
        extractOwnerName(t.responsiblePerson) ||
        extractOwnerName(t.recordedBy) ||
        '';

    return {
        id: `tender-${t._id}`,
        source: 'tender',
        stage,
        client: t.tenderer || '—',
        item: t.title || t.description || '—',
        value,
        probability,
        country: '',
        owner,
        rfqNumber: '',
        rfqId: null,
        pqNumber: '',
        quotationId: null,
        raw: t,
    };
}

// ============================================================
// API
// ============================================================
export const SalesCrmApi = {
    async list(params: ForecastListParams = {}) {
        const res = await api.get(`${API_BASE}/entries`, { params });
        return {
            items: (res.data?.data || []) as ForecastEntry[],
            total: res.data?.meta?.total || 0,
            page: res.data?.meta?.page || 1,
            limit: res.data?.meta?.limit || 100,
            totalPages: res.data?.meta?.totalPages || 0,
        };
    },

    async getById(id: string): Promise<ForecastEntry> {
        const res = await api.get(`${API_BASE}/entries/${id}`);
        return res.data.data as ForecastEntry;
    },

    async create(payload: CreateForecastPayload): Promise<ForecastEntry> {
        const res = await api.post(`${API_BASE}/entries`, payload);
        return res.data.data as ForecastEntry;
    },

    async update(
        id: string,
        payload: Partial<CreateForecastPayload>
    ): Promise<ForecastEntry> {
        const res = await api.patch(`${API_BASE}/entries/${id}`, payload);
        return res.data.data as ForecastEntry;
    },

    async remove(id: string): Promise<{ id: string }> {
        const res = await api.delete(`${API_BASE}/entries/${id}`);
        return res.data.data as { id: string };
    },

    async bulkRemove(ids: string[]): Promise<{ deletedCount: number }> {
        const res = await api.post(`${API_BASE}/entries/bulk-delete`, { ids });
        return res.data.data as { deletedCount: number };
    },

    async pipeline(params: ForecastListParams = {}): Promise<PipelineData> {
        const res = await api.get(`${API_BASE}/pipeline`, { params });
        return res.data.data as PipelineData;
    },

    async forecastKpis(params: ForecastListParams = {}): Promise<ForecastKpis> {
        const res = await api.get(`${API_BASE}/forecast/kpis`, { params });
        return res.data.data as ForecastKpis;
    },

    async forecastTrend(
        params: ForecastListParams = {}
    ): Promise<ForecastTrendPoint[]> {
        const res = await api.get(`${API_BASE}/forecast/trend`, { params });
        return res.data.data as ForecastTrendPoint[];
    },

    async breakdown(
        params: ForecastListParams & {
            by?: 'country' | 'stage' | 'source' | 'owner' | 'territory';
        } = {}
    ): Promise<BreakdownData> {
        const res = await api.get(`${API_BASE}/forecast/breakdown`, { params });
        return res.data.data as BreakdownData;
    },

    async bySalesperson(
        params: ForecastListParams = {}
    ): Promise<BySalespersonData> {
        const res = await api.get(`${API_BASE}/forecast/by-salesperson`, { params });
        return res.data.data as BySalespersonData;
    },

    async salesReport(params: ForecastListParams = {}): Promise<SalesReportData> {
        const res = await api.get(`${API_BASE}/sales-report`, { params });
        return res.data.data as SalesReportData;
    },

    async updateStage(id: string, stage: ForecastStage): Promise<ForecastEntry> {
        const res = await api.patch(`${API_BASE}/entries/${id}`, { stage });
        return res.data.data as ForecastEntry;
    },

    async owners(): Promise<string[]> {
        try {
            const res = await api.get(`${API_BASE}/owners`);
            if (Array.isArray(res.data?.data)) {
                return (res.data.data as string[]).sort();
            }
        } catch { /* fall through */ }
        try {
            const res = await api.get(`${API_BASE}/entries`, { params: { limit: 500 } });
            const items = (res.data?.data || []) as ForecastEntry[];
            const set = new Set<string>();
            items.forEach((e) => {
                if (e.owner && e.owner.trim()) set.add(e.owner.trim());
            });
            return Array.from(set).sort();
        } catch {
            return [];
        }
    },

    // ⭐ UNIFIED PIPELINE
    async unifiedPipeline(
        params: ForecastListParams = {}
    ): Promise<UnifiedPipelineData> {
        const [
            forecastRes, rfqRes, quoteRes, lostRfqRes,
            wonTendersRes, lostTendersRes, submittedTendersRes,
        ] = await Promise.all([
            this.pipeline(params),

            RfqApi.list({
                limit: 50,
                country: params.country || undefined,
                salesman: params.owner || undefined,
                search: params.search || undefined,
            }).catch(() => ({ items: [] as RFQItem[], total: 0, page: 1, limit: 0, totalPages: 0 })),

            QuotationApi.list({
                limit: 50,
                search: params.search || undefined,
            }).catch(() => ({ items: [] as Quotation[], total: 0, page: 1, limit: 0, totalPages: 0 })),

            RfqApi.list({
                limit: 50,
                stage: 'lost',
                country: params.country || undefined,
                salesman: params.owner || undefined,
            }).catch(() => ({ items: [] as RFQItem[], total: 0, page: 1, limit: 0, totalPages: 0 })),

            tenderApi.list({ stage: 'won', limit: 30 })
                .then((r) => ({ data: r.data ?? [] }))
                .catch(() => ({ data: [] as Tender[] })),

            tenderApi.list({ stage: 'lost', limit: 30 })
                .then((r) => ({ data: r.data ?? [] }))
                .catch(() => ({ data: [] as Tender[] })),

            tenderApi.list({ stage: 'submitted', limit: 30 })
                .then((r) => ({ data: r.data ?? [] }))
                .catch(() => ({ data: [] as Tender[] })),
        ]);

        const activeRfqs = rfqRes.items ?? [];
        const lostRfqs = lostRfqRes.items ?? [];
        const quotations = quoteRes.items ?? [];
        const wonTenders = wonTendersRes.data ?? [];
        const lostTenders = lostTendersRes.data ?? [];
        const submittedTenders = submittedTendersRes.data ?? [];

        const allRfqs = [...activeRfqs, ...lostRfqs];
        const allTenders = [...wonTenders, ...lostTenders, ...submittedTenders];

        const rfqCards: UnifiedCard[] = allRfqs
            .filter((r) => r.stage !== 'archived')
            .map(rfqToCard);

        const quotationCards: UnifiedCard[] = quotations
            .filter((q) => q.status !== 'expired')
            .map(quotationToCard);

        const tenderCards: UnifiedCard[] = allTenders.map(tenderToCard);

        const standaloneForecast: UnifiedCard[] = [];
        Object.values(forecastRes.columns).forEach((col) => {
            col.forEach((f) => {
                const hasRfq = f.rfqId && allRfqs.some((r) => r.id === f.rfqId);
                const hasQuote = !!f.quotationId;
                if (!hasRfq && !hasQuote) {
                    standaloneForecast.push(forecastToCard(f));
                }
            });
        });

        const allCards = [
            ...rfqCards, ...quotationCards, ...tenderCards, ...standaloneForecast,
        ];

        const STAGES: ForecastStage[] = [
            'query', 'rfq', 'quotation', 'negotiation', 'won', 'lost',
        ];

        const columns: Record<ForecastStage, UnifiedCard[]> = {
            query: [], rfq: [], quotation: [], negotiation: [], won: [], lost: [],
        };

        allCards.forEach((c) => {
            if (!columns[c.stage]) columns[c.stage] = [];
            columns[c.stage].push(c);
        });

        for (const stage of STAGES) {
            columns[stage].sort((a, b) => {
                const aDate = (a.raw as any).createdAt || '';
                const bDate = (b.raw as any).createdAt || '';
                return bDate.localeCompare(aDate);
            });
        }

        const totals: Record<ForecastStage, number> = {
            query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0,
        };
        const counts: Record<ForecastStage, number> = {
            query: 0, rfq: 0, quotation: 0, negotiation: 0, won: 0, lost: 0,
        };
        for (const stage of STAGES) {
            totals[stage] = columns[stage].reduce((s, c) => s + (c.value || 0), 0);
            counts[stage] = columns[stage].length;
        }

        return { stages: STAGES, columns, totals, counts };
    },
};