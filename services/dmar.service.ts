// services/dmar.service.ts
import api from '@/lib/axios';

const API_BASE = '/dmar';

// ============================================================
// TYPES
// ============================================================
export type ActivityType =
  | 'Visited'
  | 'Called'
  | 'Emailed'
  | 'Posted'
  | 'Social'
  | 'Meeting';

export type ClientType = 'New' | 'Existing';
export type Team = 'Marketing' | 'Sales';
export type ActivityStatus =
  | 'To Start'
  | 'In Progress'
  | 'Quoted'
  | 'Sold'
  | 'Lost'
  | 'Archived';

export interface DmarActivity {
  id: string;
  date: string;
  activityType: ActivityType;
  company: string;
  clientType: ClientType;
  product: string;
  team: Team;
  sector: string;
  area: string;
  value: number | null;
  status: ActivityStatus;
  notes: string;
  followUpDate: string | null;
  attachments: {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;
  }[];
  syncedTaskId: string | null;
  client360Id: string | null;
  crmEntryId: string | null;
  source: string;
  loggedBy: string | null;
  loggedByName: string;
  daysAging: number;
  createdAt: string;
  updatedAt: string;
}

export interface DmarListParams {
  search?: string;
  activityType?: string;
  clientType?: string;
  team?: string;
  sector?: string;
  status?: string;
  loggedBy?: string;
  month?: string | number;
  year?: string | number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateActivityPayload {
  date?: string;
  activityType: ActivityType;
  company: string;
  clientType?: ClientType;
  product?: string;
  team?: Team;
  sector?: string;
  area?: string;
  value?: number | null;
  status?: ActivityStatus;
  notes?: string;
  followUpDate?: string | null;
  attachments?: DmarActivity['attachments'];
}

export interface DmarStats {
  total: number;
  visited: number;
  called: number;
  emailed: number;
  posted: number;
  social: number;
  meeting: number;
  quoted: number;
  sold: number;
  quotedValue: number;
  soldValue: number;
  salesTarget: number;
  dmarTarget: number;
  dmarPct: number;
  salesPct: number;
}

export interface SectorVisitsData {
  team: Team;
  total: number;
  sectors: { sector: string; count: number }[];
}

export interface MonthlyPlanRow {
  key: string;
  planned: number;
  actual: number;
}

export interface MonthlyPlanData {
  year: number;
  month: string;
  rows: MonthlyPlanRow[];
  salesTarget: number;
}

export interface TeamMember {
  id: string;
  name: string;
  profilePhoto: string | null;
}

export interface DmarConstants {
  ACTIVITY_TYPES: string[];
  CLIENT_TYPES: string[];
  TEAMS: string[];
  STATUSES: string[];
  MARKETING_SECTORS: string[];
  SALES_SECTORS: string[];
  ALL_SECTORS: string[];
  PLAN_KEYS: string[];
}

// ============================================================
// API
// ============================================================
export const DmarApi = {
  // ---- Activities ----
  async list(params: DmarListParams = {}) {
    const res = await api.get(`${API_BASE}/activities`, { params });
    return {
      items: (res.data?.data || []) as DmarActivity[],
      total: res.data?.meta?.total || 0,
      page: res.data?.meta?.page || 1,
      limit: res.data?.meta?.limit || 100,
      totalPages: res.data?.meta?.totalPages || 0,
    };
  },

  async getById(id: string): Promise<DmarActivity> {
    const res = await api.get(`${API_BASE}/activities/${id}`);
    return res.data.data as DmarActivity;
  },

  async create(payload: CreateActivityPayload): Promise<DmarActivity> {
    const res = await api.post(`${API_BASE}/activities`, payload);
    return res.data.data as DmarActivity;
  },

  async update(
    id: string,
    payload: Partial<CreateActivityPayload>
  ): Promise<DmarActivity> {
    const res = await api.patch(`${API_BASE}/activities/${id}`, payload);
    return res.data.data as DmarActivity;
  },

  async markSold(id: string): Promise<DmarActivity> {
    const res = await api.patch(`${API_BASE}/activities/${id}/sold`);
    return res.data.data as DmarActivity;
  },

  async remove(id: string): Promise<{ id: string }> {
    const res = await api.delete(`${API_BASE}/activities/${id}`);
    return res.data.data as { id: string };
  },

  // ---- Aggregations ----
  async stats(params: DmarListParams = {}): Promise<DmarStats> {
    const res = await api.get(`${API_BASE}/stats`, { params });
    return res.data.data as DmarStats;
  },

  async sectorVisits(params: DmarListParams = {}): Promise<SectorVisitsData> {
    const res = await api.get(`${API_BASE}/sector-visits`, { params });
    return res.data.data as SectorVisitsData;
  },

  async monthlyPlan(params: DmarListParams = {}): Promise<MonthlyPlanData> {
    const res = await api.get(`${API_BASE}/monthly-plan`, { params });
    return res.data.data as MonthlyPlanData;
  },

  async teamMembers(): Promise<TeamMember[]> {
    const res = await api.get(`${API_BASE}/team-members`);
    return (res.data.data || []) as TeamMember[];
  },

  async constants(): Promise<DmarConstants> {
    const res = await api.get(`${API_BASE}/constants`);
    return res.data.data as DmarConstants;
  },

  // ---- Settings ----
  async upsertSettings(payload: {
    year: number;
    month: string;
    team?: string;
    salesTarget?: number;
    plan?: { key: string; planned: number }[];
  }): Promise<any> {
    const res = await api.put(`${API_BASE}/settings`, payload);
    return res.data.data;
  },
};