// services/salesOrder.service.ts
import api from '@/lib/axios';

const API_BASE = '/sales-orders';

// ============================================================
// TYPES
// ============================================================
export type SalesOrderStage =
  | 'Order Placed'
  | 'Sourcing'
  | 'Procurement'
  | 'Delivery'
  | 'Invoiced'
  | 'Payment Received';

export type OrderSource = 'quotation' | 'tender' | 'sales-crm' | 'manual';
export type OrderType = 'HW' | 'SW' | 'M' | 'SVC';

export interface SalesOrderClient {
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
}

export interface StageHistory {
  at?: string | null;
  by?: string | null;
  note?: string;
}

export interface PaymentInfo {
  status?: string;
  receivedAt?: string | null;
  method?: string;
  amount?: number;
}

export interface SalesOrder {
  id: string;
  poRef: string;
  orderType: OrderType;
  source: OrderSource;

  quotationId: string | null;
  tenderId: string | null;
  rfqId: string | null;
  forecastEntryId: string | null;
  client360Id: string | null;

  client: SalesOrderClient;
  product: string;
  productSpec: string;
  quantity: number;
  unitPrice: number;
  salesValue: number;

  salesman: string;
  crmManager: string;

  stage: SalesOrderStage;
  stages: Record<string, StageHistory>;

  principal: string;
  procurementStatus: string;
  procurementFileSentAt: string | null;
  procurementRecipients: string[];

  logisticsMode: string;
  customs: string;
  logisticsChecklist: Record<string, string>;

  clientPayment: PaymentInfo;
  principalPayment: PaymentInfo;

  orderedAt: string;
  deliveredAt: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  expectedDeliveryDate: string | null;

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListParams {
  stage?: string;
  source?: string;
  orderType?: string;
  salesman?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface SalesOrderStats {
  totalOrders: number;
  inProgress: number;
  delivered: number;
  paymentPending: number;
}

export interface SalesOrderConstants {
  STAGES: SalesOrderStage[];
  SOURCES: OrderSource[];
  ORDER_TYPES: OrderType[];
}

// ============================================================
// API
// ============================================================
export const SalesOrderApi = {
  async list(params: SalesOrderListParams = {}) {
    const res = await api.get(API_BASE, { params });
    return {
      items: (res.data?.data || []) as SalesOrder[],
      total: res.data?.meta?.total || 0,
      page: res.data?.meta?.page || 1,
      limit: res.data?.meta?.limit || 50,
      totalPages: res.data?.meta?.totalPages || 0,
    };
  },

  async getById(id: string): Promise<SalesOrder> {
    const res = await api.get(`${API_BASE}/${id}`);
    return res.data.data as SalesOrder;
  },

  async create(payload: Partial<SalesOrder>): Promise<SalesOrder> {
    const res = await api.post(API_BASE, payload);
    return res.data.data as SalesOrder;
  },

  async update(id: string, payload: Partial<SalesOrder>): Promise<SalesOrder> {
    const res = await api.patch(`${API_BASE}/${id}`, payload);
    return res.data.data as SalesOrder;
  },

  async advanceStage(
    id: string,
    stage: SalesOrderStage,
    note = ''
  ): Promise<SalesOrder> {
    const res = await api.patch(`${API_BASE}/${id}/stage`, { stage, note });
    return res.data.data as SalesOrder;
  },

  async remove(id: string): Promise<{ id: string }> {
    const res = await api.delete(`${API_BASE}/${id}`);
    return res.data.data as { id: string };
  },

  async stats(params: SalesOrderListParams = {}): Promise<SalesOrderStats> {
    const res = await api.get(`${API_BASE}/stats`, { params });
    return res.data.data as SalesOrderStats;
  },

  async constants(): Promise<SalesOrderConstants> {
    const res = await api.get(`${API_BASE}/constants`);
    return res.data.data as SalesOrderConstants;
  },
};