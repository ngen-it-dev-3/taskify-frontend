// services/salesCrm.service.ts
import api from '@/lib/axios';

const API_BASE = '/sales-crm';

// ============================================================
// TYPES
// ============================================================
export type ForecastStage =
    | 'query'
    | 'rfq'
    | 'quotation'
    | 'negotiation'
    | 'won'
    | 'lost';

export type ForecastSource =
    | 'online'
    | 'offline'
    | 'quotation-builder'
    | 'tender'
    | 'referral';

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
// API
// ============================================================
export const SalesCrmApi = {
    // ---- Entries CRUD ----
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

    // ---- Aggregations ----
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
        params: ForecastListParams & { by?: 'country' | 'stage' | 'source' | 'owner' } = {}
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

    // ---- NEW: update stage only (for drag or quick actions) ----
    async updateStage(id: string, stage: ForecastStage): Promise<ForecastEntry> {
        const res = await api.patch(`${API_BASE}/entries/${id}`, { stage });
        return res.data.data as ForecastEntry;
    },

    // ---- NEW: distinct list of owners present in the DB ----
    async owners(): Promise<string[]> {
        const res = await api.get(`${API_BASE}/entries`, {
            params: { limit: 500 },
        });
        const items = (res.data?.data || []) as ForecastEntry[];
        const set = new Set<string>();
        items.forEach((e) => {
            if (e.owner && e.owner.trim()) set.add(e.owner.trim());
        });
        return Array.from(set).sort();
    },


};

