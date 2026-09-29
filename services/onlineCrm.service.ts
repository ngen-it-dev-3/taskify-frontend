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
  month?: number | string;
  year?: number | string;
  dateFrom?: string;
  dateTo?: string;
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
// API CLIENT
// ============================================================
export const OnlineCrmApi = {
  // ---- Queries CRUD ----
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

  // ---- Aggregations ----
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
};