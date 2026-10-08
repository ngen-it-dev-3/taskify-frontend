// components/CRM/quotation-builder/types.ts

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
  source1?: { name: string; price: string };
  source2?: { name: string; price: string };
  source3?: { name: string; price: string };
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