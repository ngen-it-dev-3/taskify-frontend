// services/onlineCrm.service.ts
import api from '@/lib/axios';

const API_BASE = '/online-crm';

// ============================================================
// TYPES
// ============================================================
export type QueryStage = 'To Start' | 'Not Quoted' | 'Quoted';
export type QuerySource =
  | 'Email'
  | 'Phone'
  | 'Portal'
  | 'Tender Portal'
  | 'Site Visit';
export type QueryStatus = 'Pending' | 'Quoted' | 'Won' | 'Lost';

export interface CrmUser {
  name: string;
  email: string;
  role: string;
}

export interface DailyVolumeData {
  year: number;
  month: number;         // 0-indexed
  monthName?: string;
  days: number;
  data: number[];
}

export interface OnlineQuery {
  id: string;
  rfqNumber: string;
  date: string;
  company: string;
  country: string;
  product: string;
  productCategory: string;
  assigned: string;
  source: QuerySource;
  value: number | null;
  stage: QueryStage;
  status: QueryStatus;
  comments: string;
  daysAging: number;
  rfqId: string | null;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

export interface OnlineQueryListParams {
  search?: string;
  source?: string;
  stage?: string;
  country?: string;
  assigned?: string;
  status?: string;
  originSource?: string;
  month?: number | string;
  year?: number | string;
  dateFrom?: string;
  dateTo?: string;
  by?: 'country' | 'source' | 'assigned' | 'stage';
  page?: number;
  limit?: number;
}

export interface CreateQueryPayload {
  company: string;
  country: string;
  product?: string;
  productCategory?: string;
  assigned?: string;
  source?: QuerySource;
  value?: number | null;
  stage?: QueryStage;
  status?: QueryStatus;
  comments?: string;
  rfqId?: string;
  date?: string;
}

export interface OnlineCrmStats {
  activeCount: number;
  quotedValueBDT: number;
  quotedValueUSD: number;
  quotedCount: number;
  notQuoted: number;
  overdue: number;
  crmManager: string;
  crmUsers: CrmUser[];        // ⭐ NEW
  crmUsersCount: number;      // ⭐ NEW
  total: number;
}

export interface MonthlyVolumeData {
  year: number;
  months: string[];
  data: number[];
}

export interface CountryEntry {
  country: string;
  count: number;
  pct: number;
}

export interface ByCountryData {
  total: number;
  entries: CountryEntry[];
}

export interface ProductEntry {
  name: string;
  count: number;
}

export interface TopProductsData {
  products: ProductEntry[];
  clients: ProductEntry[];
}

// ============================================================
// UNIFIED TYPES
// ============================================================
export type UnifiedSource = 'rfq' | 'tender' | 'quotation' | 'online';

export interface UnifiedOnlineRow {
  id: string;
  source: UnifiedSource;
  sourceLabel: string;
  rfqNumber: string;
  date: string;
  company: string;
  country: string;
  product: string;
  productCategory: string;
  assigned: string;
  origin: string;
  daysAging: number;
  stage: QueryStage;
  status?: string;
  value: number | null;
  currency: string;
  raw: string;
  createdAt: string;
}

// ============================================================
// API CLIENT
// ============================================================
export const OnlineCrmApi = {
  async list(params: OnlineQueryListParams = {}) {
    const res = await api.get(`${API_BASE}/queries`, { params });
    return {
      items: (res.data?.data || []) as OnlineQuery[],
      total: res.data?.meta?.total || 0,
      page: res.data?.meta?.page || 1,
      limit: res.data?.meta?.limit || 100,
      totalPages: res.data?.meta?.totalPages || 0,
    };
  },
  async unifiedDailyVolume(
    params: OnlineQueryListParams = {}
  ): Promise<DailyVolumeData> {
    const res = await api.get(`${API_BASE}/unified/daily-volume`, { params });
    return res.data.data as DailyVolumeData;
  },

  async getById(id: string): Promise<OnlineQuery> {
    const res = await api.get(`${API_BASE}/queries/${id}`);
    return res.data.data as OnlineQuery;
  },

  async create(payload: CreateQueryPayload): Promise<OnlineQuery> {
    const res = await api.post(`${API_BASE}/queries`, payload);
    return res.data.data as OnlineQuery;
  },

  async update(
    id: string,
    payload: Partial<CreateQueryPayload>
  ): Promise<OnlineQuery> {
    const res = await api.patch(`${API_BASE}/queries/${id}`, payload);
    return res.data.data as OnlineQuery;
  },

  async remove(id: string): Promise<{ id: string }> {
    const res = await api.delete(`${API_BASE}/queries/${id}`);
    return res.data.data as { id: string };
  },

  async bulkRemove(ids: string[]): Promise<{ deletedCount: number }> {
    const res = await api.post(`${API_BASE}/queries/bulk-delete`, { ids });
    return res.data.data as { deletedCount: number };
  },

  async stats(params: OnlineQueryListParams = {}): Promise<OnlineCrmStats> {
    const res = await api.get(`${API_BASE}/stats`, { params });
    return res.data.data as OnlineCrmStats;
  },

  async monthlyVolume(
    params: OnlineQueryListParams = {}
  ): Promise<MonthlyVolumeData> {
    const res = await api.get(`${API_BASE}/monthly-volume`, { params });
    return res.data.data as MonthlyVolumeData;
  },

  async byCountry(
    params: OnlineQueryListParams = {}
  ): Promise<ByCountryData> {
    const res = await api.get(`${API_BASE}/by-country`, { params });
    return res.data.data as ByCountryData;
  },

  async topProducts(
    params: OnlineQueryListParams = {}
  ): Promise<TopProductsData> {
    const res = await api.get(`${API_BASE}/top-products`, { params });
    return res.data.data as TopProductsData;
  },

  async countries(): Promise<string[]> {
    const res = await api.get(`${API_BASE}/countries`);
    return (res.data.data || []) as string[];
  },

  // ============================================================
  // UNIFIED
  // ============================================================

  async unifiedList(params: OnlineQueryListParams = {}) {
    const res = await api.get(`${API_BASE}/unified`, { params });
    return {
      items: (res.data?.data || []) as UnifiedOnlineRow[],
      total: res.data?.meta?.total || 0,
      page: res.data?.meta?.page || 1,
      limit: res.data?.meta?.limit || 200,
      totalPages: res.data?.meta?.totalPages || 0,
    };
  },

  async unifiedStats(
    params: OnlineQueryListParams = {}
  ): Promise<OnlineCrmStats> {
    const res = await api.get(`${API_BASE}/unified/stats`, { params });
    return res.data.data as OnlineCrmStats;
  },

  async unifiedMonthlyVolume(
    params: OnlineQueryListParams = {}
  ): Promise<MonthlyVolumeData> {
    const res = await api.get(`${API_BASE}/unified/monthly-volume`, {
      params,
    });
    return res.data.data as MonthlyVolumeData;
  },

  async unifiedByCountry(
    params: OnlineQueryListParams = {}
  ): Promise<ByCountryData> {
    const res = await api.get(`${API_BASE}/unified/by-country`, { params });
    return res.data.data as ByCountryData;
  },

  async unifiedTopProducts(
    params: OnlineQueryListParams = {}
  ): Promise<TopProductsData> {
    const res = await api.get(`${API_BASE}/unified/top-products`, {
      params,
    });
    return res.data.data as TopProductsData;
  },
};