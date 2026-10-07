// services/client360.service.ts
import api from '@/lib/axios';

const API_BASE = '/clients';

// ============================================================
// ⭐ IN-MEMORY CACHE — avoids duplicate network calls
// ============================================================
const CACHE_TTL_MS = 30_000; // 30 seconds

type CacheEntry<T> = {
  data: T;
  ts: number;
};

const cache = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();

function cacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix;
  // Stable stringify — sort keys so order doesn't matter
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '' && params[k] !== 'all')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${prefix}?${sorted}`;
}

async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);

  // 1. Return fresh cache immediately
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return hit.data as T;
  }

  // 2. Dedupe concurrent identical requests
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  // 3. Fetch, store in cache, dedupe
  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, ts: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

// ⭐ Allow caller to bust cache (e.g. after a mutation)
export function invalidateClientCache() {
  cache.clear();
}

// ============================================================
// TYPES
// ============================================================
export type Tier = 'Gold' | 'Silver' | 'Bronze';

export type AutoSource =
    | 'tender' | 'rfq' | 'quotation' | 'online-crm'
    | 'sales-crm' | 'dmar' | 'manual' | 'import' | '';

export type ClientStage = 'hot' | 'warm' | 'won' | 'cold';

export interface ClientContact {
    _id?: string;
    name: string;
    designation: string;
    department: string;
    email: string;
    personalEmail: string;
    phone: string;
    personalPhone: string;
    notes: string;
    isDecisionMaker: boolean;
    autoAdded: boolean;
    linkedIn: string;
}

export interface ClientQuote {
    _id?: string;
    quotationId: string | null;
    qtnNumber: string;
    item: string;
    value: number;
    status: string;
    date: string | null;
    lines?: { name: string; qty: number; unitPrice: number }[];
}

export interface ClientContract {
    _id?: string;
    contractId: string | null;
    title: string;
    value: number;
    startDate: string | null;
    endDate: string | null;
    renewalDue: string | null;
    status: string;
}

export interface CommEntry {
    _id?: string;
    kind: 'call' | 'email' | 'meeting' | 'note' | 'site-visit' | 'other';
    summary: string;
    body: string;
    at: string;
    by: string | null;
    linkedTo: string;
}

export interface SourceRefs {
    tenderId: string | null;
    rfqId: string | null;
    quotationIds: string[];
    onlineQueryIds: string[];
    forecastEntryIds: string[];
    dmarActivityIds: string[];
}

export interface Client360 {
    id: string;
    name: string;
    tier: Tier;
    isPartner: boolean;
    sector: string;
    location: string;
    city: string;
    area: string;
    country: string;

    stage: ClientStage;
    assignedRep: string | null;
    team: string;

    lifetimeValue: number;
    ordersFY26: number;
    avgMarginPct: number;
    lastOrderAt: string | null;

    autoAdded: boolean;
    autoAddedFrom: AutoSource;
    sourceRefs: SourceRefs;

    contacts: ClientContact[];
    visitsPerMonth: number;
    lastVisitAt: string | null;
    visitLog: any[];

    nextAction: { label: string; dueAt: string | null; isOverdue: boolean };

    projectIds: string[];
    contactIds: string[];

    quotes: ClientQuote[];
    contracts: ClientContract[];
    communicationLog: CommEntry[];

    notes: string;
    tags: string[];

    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClientListParams {
    search?: string;
    sector?: string;
    tier?: string;
    country?: string;
    stage?: string;
    team?: string;
    assignedRep?: string;
    isPartner?: string;
    autoAdded?: string;
    page?: number;
    limit?: number;
}

export interface ClientStats {
    totalClients: number;
    totalPartners: number;
    totalContacts: number;
    called: number;
    emailed: number;
    presented: number;
    potential: number;
}

export interface SectorBreakdown {
    total: number;
    entries: { sector: string; count: number }[];
}

export interface ClientConstants {
    TIERS: string[];
    SECTORS: string[];
    STAGES: string[];
    AUTO_SOURCES: string[];
}

// ============================================================
// API
// ============================================================
export const Client360Api = {
    async list(params: ClientListParams = {}) {
        const key = cacheKey('client-list', params);
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}`, { params });
            return {
                items: (res.data?.data || []) as Client360[],
                total: res.data?.meta?.total || 0,
                page: res.data?.meta?.page || 1,
                limit: res.data?.meta?.limit || 50,
                totalPages: res.data?.meta?.totalPages || 0,
            };
        });
    },

    async getById(id: string): Promise<Client360> {
        const key = cacheKey('client-by-id', { id });
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}/${id}`);
            return res.data.data as Client360;
        });
    },

    async stats(params: ClientListParams = {}): Promise<ClientStats> {
        const key = cacheKey('client-stats', params);
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}/stats`, { params });
            return res.data.data as ClientStats;
        });
    },

    async sectorBreakdown(
        params: ClientListParams = {}
    ): Promise<SectorBreakdown> {
        const key = cacheKey('client-sector-breakdown', params);
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}/sector-breakdown`, { params });
            return res.data.data as SectorBreakdown;
        });
    },

    async create(payload: Partial<Client360>): Promise<Client360> {
        const res = await api.post(`${API_BASE}`, payload);
        invalidateClientCache();   // ⭐ bust cache after create
        return res.data.data as Client360;
    },

    async update(
        id: string,
        payload: Partial<Client360>
    ): Promise<Client360> {
        const res = await api.patch(`${API_BASE}/${id}`, payload);
        invalidateClientCache();   // ⭐ bust cache after update
        return res.data.data as Client360;
    },

    async remove(id: string): Promise<{ id: string }> {
        const res = await api.delete(`${API_BASE}/${id}`);
        invalidateClientCache();   // ⭐ bust cache after delete
        return res.data.data as { id: string };
    },

    async addContact(
        clientId: string,
        contact: Partial<ClientContact>
    ): Promise<Client360> {
        const res = await api.post(`${API_BASE}/${clientId}/contacts`, contact);
        invalidateClientCache();   // ⭐ bust cache
        return res.data.data as Client360;
    },

    async updateContact(
        clientId: string,
        contactId: string,
        updates: Partial<ClientContact>
    ): Promise<Client360> {
        const res = await api.patch(
            `${API_BASE}/${clientId}/contacts/${contactId}`,
            updates
        );
        invalidateClientCache();   // ⭐ bust cache
        return res.data.data as Client360;
    },

    async deleteContact(
        clientId: string,
        contactId: string
    ): Promise<Client360> {
        const res = await api.delete(
            `${API_BASE}/${clientId}/contacts/${contactId}`
        );
        invalidateClientCache();   // ⭐ bust cache
        return res.data.data as Client360;
    },

    async addCommunication(
        clientId: string,
        entry: Partial<CommEntry>
    ): Promise<Client360> {
        const res = await api.post(`${API_BASE}/${clientId}/communications`, entry);
        invalidateClientCache();   // ⭐ bust cache
        return res.data.data as Client360;
    },

    // ⭐ Live quotations for a client
    async getClientQuotations(clientId: string): Promise<ClientQuote[]> {
        const key = cacheKey('client-quotations', { clientId });
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}/${clientId}/quotations`);
            return (res.data?.data || []) as ClientQuote[];
        });
    },

    async constants(): Promise<ClientConstants> {
        // Constants are static — cache for a long time
        const key = cacheKey('client-constants');
        return withCache(key, async () => {
            const res = await api.get(`${API_BASE}/constants`);
            return res.data.data as ClientConstants;
        });
    },
};