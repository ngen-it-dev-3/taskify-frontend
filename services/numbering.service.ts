// services/numbering.service.ts

const API_BASE =
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1') +
    '/numbering-settings';

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('token') ||
        null
    );
}

export interface QuoteScheme {
    rfqPrefix: string;
    quotationPrefix: string;
    yearSegment: 'auto' | 'yy' | 'yyyy' | 'none';
    nextSeq: number;
    padding: number;
    resetCycle: 'never' | 'yearly' | 'monthly';
}

export interface PqScheme {
    countryCode: string;
    regionCode: string;
    entityCode: string;
    docTypeCode: string;
    useTodayDate: boolean;
    manualDate: string;
    nextSeq: number;
    padding: number;
    resetCycle: 'never' | 'yearly' | 'monthly';
}

export type NumberingSettings = QuoteScheme | PqScheme;
export type NumberingScope = 'quote' | 'pq';

async function request<T>(
    path: string,
    options: RequestInit = {},
    withAuth: boolean = false
): Promise<any> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (withAuth) {
        const token = getAuthToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = json?.message || `Request failed (${res.status})`;
        const err: any = new Error(msg);
        err.status = res.status;
        err.errors = json?.errors;
        throw err;
    }
    return json;
}

export const NumberingApi = {
    async get(scope: NumberingScope): Promise<NumberingSettings> {
        const res = await request<NumberingSettings>(`?scope=${scope}`);
        return res.data;
    },

    async update(
        scope: NumberingScope,
        payload: Partial<NumberingSettings>
    ): Promise<NumberingSettings> {
        const res = await request<NumberingSettings>(
            '',
            { method: 'PATCH', body: JSON.stringify({ scope, ...payload }) },
            true
        );
        return res.data;
    },

    async preview(scope: NumberingScope): Promise<{ number: string; seq: number }> {
        const res = await request<{ number: string; seq: number }>('/preview', {
            method: 'POST',
            body: JSON.stringify({ scope }),
        });
        return res.data;
    },

    async generateNext(
        scope: NumberingScope
    ): Promise<{ number: string; seq: number; scope: NumberingScope }> {
        const res = await request<{ number: string; seq: number; scope: NumberingScope }>(
            `/generate-next?scope=${scope}`,
            { method: 'POST' }
        );
        return res.data;
    },
};