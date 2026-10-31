// components/CRM/quotation-builder/types.ts

// ⭐ NEW: Create a dedicated interface for the sources
export interface QuotationSourceData {
  name: string;
  price: string;
  currency?: string;
  targetCurrency?: string;
  exchangeRate?: number | string;
  address?: string;
  email?: string;
  phone?: string;
  reference?: string;
  category?: 'principle' | 'reseller' | '';
  documents?: string[];
}

export interface QuotationLineItem {
  id: string;
  sl: number | '-';
  name: string;
  qty: number;
  principalCost: number;
  weightKg: number;
  discountPct: number;
  type?: 'item' | 'fixed';
  spec?: string;

  // ⭐ UPDATED: Use the new interface here
  source1?: QuotationSourceData;
  source2?: QuotationSourceData;
  source3?: QuotationSourceData;
}

export interface QuotationRates {
  principalDiscountPct: number;
  officePct: number;
  profitPct: number;
  othersPct: number;
  taxPct: number;
}

export interface QuotationClientInfo {
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

export interface QuotationMeta {
  rfqNumber: string;
  title: string;
  territory: string;
  crmManager: string;
  stage: string;

  currency: string;
  currencySymbol: string;
  baseCurrency: string;
  baseCurrencySymbol: string;
  exchangeRate: number;

  clientType: 'existing' | 'new';
  country: string;
  vatEnabled: boolean;
  discountEnabled: boolean;
  client: QuotationClientInfo;
  pqNumber: string;
  pqrNumber: string;

  // ⭐ Numbering-service generated quote number (e.g. RFQ-2026-66666)
  quotationNumber?: string;

  // ⭐ Editable Preview fields
  billToCompany?: string;
  billToContactName?: string;
  billToContactRole?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  pqDate?: string;
  rfqRefOverride?: string;
}

export interface LogisticsInfo {
  totalWeight: number;
  totalDimension: string;
  clientAskedFor: string;
  productType: string;
}

export interface CostBreakdown {
  costOfGoods: number;
  remittanceOfficeExp: number;
  customsFreight: number;
  commissionOthers: number;
  netProfit: number;
  taxVatGst: number;
  subTotal: number;
  discountTotal: number;
  customerPrice: number;
  grandTotal: number;
  totalWeight: number;
}

export type QuotationTabKey = 'quotation' | 'cog' | 'source';
export type TopTabKey = 'builder' | 'quotes' | 'drafts';