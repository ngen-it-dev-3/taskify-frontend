// services/rfq.service.ts

import api from '@/lib/axios';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1') +
  '/crm/rfq';

// ============================================================
// TYPES
// ============================================================
export interface RFQProduct {
  name: string;
  qty: number;
  spec?: string;
  sku?: string;
  modelNo?: string;
  brand?: string;
  description?: string;
  additionalInfo?: string;
  files?: string[];
}

export interface RFQClientInfo {
  contactName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  zipCode: string;
  tentativeBudget: string;
  purchaseDate: string;
  designation?: string;
  address?: string;
  city?: string;
}

export interface Salesperson {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: any;
  avatar?: string;
  profilePhoto?: string;
}

export type RFQStage = 'pending' | 'quoted' | 'archived' | 'lost';
export type RFQSource = 'online' | 'manual';
export type RFQPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface RFQItem {
  id: string;
  rfqNumber: string;
  company: string;
  country: string;
  date: string;
  time: string;
  agingDays: number;
  stage: RFQStage;
  priority: RFQPriority;
  source: RFQSource;
  salesman: string;
  assignedTo: string;
  clientInfo: RFQClientInfo;
  products: RFQProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RFQListParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  salesman?: string;
  stage?: RFQStage;
  source?: RFQSource;
  showArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateRFQPayload {
  source?: RFQSource;
  company: string;
  country: string;
  contactName: string;
  email: string;
  phone?: string;
  designation?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  isReseller?: boolean;
  receivedVia?: string;
  assignedTo?: string;
  salesman?: string;
  priority?: RFQPriority;
  products: RFQProduct[];
  projectName?: string;
  tentativeBudget?: string;
  currentProjectStatus?: string;
  tentativePurchaseDate?: string;
  comment?: string;
}

export interface AssignRFQPayload {
  assignedTo: string;
  assignedToEmail?: string;
  priority?: RFQPriority;
  notes?: string;
}

export interface UpdateRFQPayload {
  stage?: RFQStage;
  priority?: RFQPriority;
  assignedTo?: string;
  salesman?: string;
  comment?: string;
  products?: RFQProduct[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { path: string; message: string }[];
}

export interface RFQStats {
  total: number;
  pending: number;
  quoted: number;
  archived: number;
  lost: number;
  // ⭐ NEW — month-over-month tracking
  thisMonth: number;
  lastMonth: number;
  momDelta: number;
  quoteRate: number;
  byCountry: { country: string; count: number; pct: number }[];
  bySalesman: { salesman: string; count: number }[];
  recent: { id: string; company: string; rfqNumber: string; createdAt: string }[];
}

// ============================================================
// UNAUTHENTICATED FETCH HELPER
// Used for public CRM endpoints. The axios `api` instance
// handles authenticated calls (see `salespeople()`).
// ============================================================
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok) {
    const msg = json?.message || `Request failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.errors = json?.errors;
    throw err;
  }

  return json;
}

// ============================================================
// PUBLIC API
// ============================================================
export const RfqApi = {
  // ---- List ----
  async list(params: RFQListParams = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const res = await request<RFQItem[]>(`?${qs.toString()}`);
    return {
      items: res.data ?? [],
      total: res.meta?.total ?? 0,
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? 20,
      totalPages: res.meta?.totalPages ?? 0,
    };
  },

  // ---- Get one ----
  async get(id: string): Promise<RFQItem> {
    const res = await request<RFQItem>(`/${id}`);
    return res.data;
  },

  // ---- Create ----
  async create(payload: CreateRFQPayload): Promise<RFQItem> {
    const res = await request<RFQItem>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ---- Update ----
  async update(id: string, payload: UpdateRFQPayload): Promise<RFQItem> {
    const res = await request<RFQItem>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ---- Assign (also triggers backend emails) ----
  async assign(id: string, payload: AssignRFQPayload): Promise<RFQItem> {
    const res = await request<RFQItem>(`/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ---- Archive / Unarchive ----
  async archive(id: string): Promise<RFQItem> {
    const res = await request<RFQItem>(`/${id}/archive`, { method: 'POST' });
    return res.data;
  },

  async unarchive(id: string): Promise<RFQItem> {
    const res = await request<RFQItem>(`/${id}/unarchive`, { method: 'POST' });
    return res.data;
  },

  // ---- Delete ----
  async remove(id: string): Promise<{ id: string }> {
    const res = await request<{ id: string }>(`/${id}`, { method: 'DELETE' });
    return res.data;
  },

  // ---- Stats ----
  async stats(): Promise<RFQStats> {
    const res = await request<RFQStats>('/stats');
    return res.data;
  },

  // ---- Salespeople (uses authenticated axios instance) ----
  async salespeople(): Promise<Salesperson[]> {
    const res = await api.get('/auth/users/active');
    const json = res.data;

    // Normalize — API may return:
    //   { success, data: [...] }
    //   { success, data: { users: [...] } }
    //   { success, users: [...] }
    const raw: any[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.data?.users)
        ? json.data.users
        : Array.isArray(json?.users)
          ? json.users
          : [];

    return raw.map((u) => ({
      id: String(u._id || u.id),
      fullName: u.fullName || u.name || u.email || 'Unknown',
      email: u.email,
      role: u.role || 'employee',
      department: u.department,
      avatar: u.avatar,
      profilePhoto: u.profilePhoto,
    }));
  },

  // ---- Sync ----
  async sync(): Promise<{ synced: number; message: string }> {
    const res = await request<{ synced: number; message: string }>('/sync', {
      method: 'POST',
    });
    return res.data;
  },

  // ---- Upload product files ----
  async uploadFiles(files: File[]): Promise<{ files: string[] }> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: fd,
      // Do NOT set Content-Type — browser sets multipart boundary
    });
    const json = (await res.json().catch(() => ({}))) as ApiResponse<{
      files: string[];
    }>;
    if (!res.ok) throw new Error(json?.message || 'Upload failed');
    return json.data;
  },
};