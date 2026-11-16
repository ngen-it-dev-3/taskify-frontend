// services/quotation.service.ts

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1') +
  '/crm/quotation';

// ============================================================
// TYPES
// ============================================================
export type QuotationStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'sent'
  | 'won'
  | 'lost'
  | 'expired';

export interface QuotationLine {
  id: string;
  sl: number | '-';
  name: string;
  qty: number;
  principalCost: number;
  weightKg: number;
  discountPct: number;
  type?: 'item' | 'fixed';
  spec?: string;
  source1?: { name: string; price: string };
  source2?: { name: string; price: string };
  source3?: { name: string; price: string };
}

export interface QuotationClient {
  company: string;
  contactName: string;
  designation?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country: string;
  zipCode?: string;
}

export interface QuotationRates {
  principalDiscountPct: number;
  officePct: number;
  profitPct: number;
  othersPct: number;
  taxPct: number;
}

export interface Quotation {
  id: string;
  pqNumber: string;
  quotationNumber?: string;
  status: QuotationStatus;
  stage: string;
  rfqId: string;
  rfqNumber: string;
  client: QuotationClient;
  clientType: 'existing' | 'new';
  territory: string;
  crmManager: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  vatEnabled: boolean;
  discountEnabled: boolean;
  pqrNumber: string;
  billToCompany?: string;
  billToContactName?: string;
  billToContactRole?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  pqDate?: string;
  rfqRefOverride?: string;
  lines: QuotationLine[];
  rates: QuotationRates;
  logistics: {
    totalWeight: number;
    totalDimension: string;
    clientAskedFor: string;
    productType: string;
  };
  terms: { label: string; value: string }[];
  totals: {
    costOfGoods: number;
    officeExpenses: number;
    commissionOthers: number;
    netProfit: number;
    taxVatGst: number;
    subTotal: number;
    grandTotal: number;
    customerPrice: number;
    totalWeight: number;
  };
  sentAt?: string;
  approvedAt?: string;
  closedAt?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationPayload {
  rfqId: string;
  client?: Partial<QuotationClient>;
  lines?: QuotationLine[];
  rates?: Partial<QuotationRates>;
  terms?: { label: string; value: string }[];
  logistics?: any;
  pqrNumber?: string;
  crmManager?: string;
  territory?: string;
  clientType?: 'existing' | 'new';
  currency?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  vatEnabled?: boolean;
  discountEnabled?: boolean;
  stage?: string;
  pqNumber?: string;
  quotationNumber?: string;
  billToCompany?: string;
  billToContactName?: string;
  billToContactRole?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  pqDate?: string;
  rfqRefOverride?: string;
}

export interface UpdateQuotationPayload {
  client?: Partial<QuotationClient>;
  lines?: QuotationLine[];
  rates?: Partial<QuotationRates>;
  terms?: { label: string; value: string }[];
  logistics?: any;
  crmManager?: string;
  clientType?: 'existing' | 'new';
  vatEnabled?: boolean;
  discountEnabled?: boolean;
  stage?: string;
  // ⭐ NEW
  pqNumber?: string;
  quotationNumber?: string;
  billToCompany?: string;
  billToContactName?: string;
  billToContactRole?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  pqDate?: string;
  rfqRefOverride?: string;
}

export interface QuotationStats {
  drafts: number;
  sent: number;
  won: number;
  lost: number;
  awaiting: number;
}

// ============================================================
// FETCH HELPER
// ============================================================
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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

// ============================================================
// PUBLIC API
// ============================================================
export const QuotationApi = {
  // ---- List ----
  async list(params: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const res = await request<any>(`?${qs.toString()}`);
    return {
      items: (res.data ?? []) as Quotation[],
      total: res.meta?.total ?? 0,
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? 20,
      totalPages: res.meta?.totalPages ?? 0,
    };
  },

  // ---- Get one ----
  async get(id: string): Promise<Quotation> {
    const res = await request<Quotation>(`/${id}`);
    return res.data;
  },

  // ---- Get by RFQ ----
  async getByRfqId(rfqId: string): Promise<Quotation | null> {
    const res = await request<Quotation | null>(`/by-rfq/${rfqId}`);
    return res.data;
  },

  // ---- Create ----
  async create(payload: CreateQuotationPayload): Promise<Quotation> {
    const res = await request<Quotation>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ---- Update ----
  async update(id: string, payload: UpdateQuotationPayload): Promise<Quotation> {
    const res = await request<Quotation>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ---- Send (with optional PDF attachment) ----
  async send(id: string, withAttachment: boolean = false): Promise<Quotation> {
    const res = await request<Quotation>(`/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ withAttachment }),
    });
    return res.data;
  },

  // ---- Approve ----
  async approve(id: string): Promise<Quotation> {
    const res = await request<Quotation>(`/${id}/approve`, { method: 'POST' });
    return res.data;
  },

  // ---- Mark outcome ----
  async markOutcome(id: string, outcome: 'won' | 'lost'): Promise<Quotation> {
    const res = await request<Quotation>(`/${id}/mark-outcome`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    });
    return res.data;
  },

  // ---- Delete ----
  async remove(id: string): Promise<{ id: string }> {
    const res = await request<{ id: string }>(`/${id}`, { method: 'DELETE' });
    return res.data;
  },

  // ---- Stats ----
  async stats(): Promise<QuotationStats> {
    const res = await request<QuotationStats>('/stats');
    return res.data;
  },
};