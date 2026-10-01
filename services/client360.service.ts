// services/client360.service.ts
import api from '@/lib/axios';

const API_BASE = '/clients';

// ============================================================
// TYPES
// ============================================================
export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Standard';

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
        const res = await api.get(`${API_BASE}`, { params });
        return {
            items: (res.data?.data || []) as Client360[],
            total: res.data?.meta?.total || 0,
            page: res.data?.meta?.page || 1,
            limit: res.data?.meta?.limit || 50,
            totalPages: res.data?.meta?.totalPages || 0,
        };
    },

    async getById(id: string): Promise<Client360> {
        const res = await api.get(`${API_BASE}/${id}`);
        return res.data.data as Client360;
    },

    async stats(params: ClientListParams = {}): Promise<ClientStats> {
        const res = await api.get(`${API_BASE}/stats`, { params });
        return res.data.data as ClientStats;
    },

    async sectorBreakdown(
        params: ClientListParams = {}
    ): Promise<SectorBreakdown> {
        const res = await api.get(`${API_BASE}/sector-breakdown`, { params });
        return res.data.data as SectorBreakdown;
    },

    async create(payload: Partial<Client360>): Promise<Client360> {
        const res = await api.post(`${API_BASE}`, payload);
        return res.data.data as Client360;
    },

    async update(
        id: string,
        payload: Partial<Client360>
    ): Promise<Client360> {
        const res = await api.patch(`${API_BASE}/${id}`, payload);
        return res.data.data as Client360;
    },

    async remove(id: string): Promise<{ id: string }> {
        const res = await api.delete(`${API_BASE}/${id}`);
        return res.data.data as { id: string };
    },

    async addContact(
        clientId: string,
        contact: Partial<ClientContact>
    ): Promise<Client360> {
        const res = await api.post(`${API_BASE}/${clientId}/contacts`, contact);
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
        return res.data.data as Client360;
    },

    async deleteContact(
        clientId: string,
        contactId: string
    ): Promise<Client360> {
        const res = await api.delete(
            `${API_BASE}/${clientId}/contacts/${contactId}`
        );
        return res.data.data as Client360;
    },

    async addCommunication(
        clientId: string,
        entry: Partial<CommEntry>
    ): Promise<Client360> {
        const res = await api.post(`${API_BASE}/${clientId}/communications`, entry);
        return res.data.data as Client360;
    },

    // ⭐ Live quotations for a client
    async getClientQuotations(clientId: string): Promise<ClientQuote[]> {
        const res = await api.get(`${API_BASE}/${clientId}/quotations`);
        return (res.data?.data || []) as ClientQuote[];
    },

    async constants(): Promise<ClientConstants> {
        const res = await api.get(`${API_BASE}/constants`);
        return res.data.data as ClientConstants;
    },
};