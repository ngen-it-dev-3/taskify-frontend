// components/CRM/RFQ/types.ts

// ============================================================
// RE-EXPORT domain types from the service (single source of truth)
// Do NOT redefine them here — the service owns them.
// ============================================================
export type {
  RFQItem,
  RFQProduct,
  RFQClientInfo,
  RFQStage,
  RFQSource,
  RFQPriority,
  RFQListParams,
  RFQStats,
  CreateRFQPayload,
  AssignRFQPayload,
  UpdateRFQPayload,
  Salesperson,
} from '@/services/rfq.service';

// ============================================================
// LOCAL UI-ONLY TYPES
// ============================================================

/** Which view the dashboard is showing */
export type RFQViewMode = 'active' | 'archived' | 'lost';

export interface CountryMetric {
  country: string;
  count: number;
  pct: number;
}

export interface FilterState {
  countryFilter: string;
  salesmanFilter: string;
  companySearch: string;
  /** 3-way view filter: active | archived | lost */
  viewMode: RFQViewMode;
  year?: string;
  month?: string;
}