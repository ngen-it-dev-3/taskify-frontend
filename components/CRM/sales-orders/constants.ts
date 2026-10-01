// components/CRM/sales-orders/constants.ts
export type {
  SalesOrder,
  SalesOrderStage,
  SalesOrderStats,
  SalesOrderClient,
  OrderSource,
  OrderType,
  StageHistory,
  PaymentInfo,
} from '@/services/salesOrder.service';

// ============================================================
// STAGE STYLES
// ============================================================
export const STAGE_STYLES: Record<string, string> = {
  'Order Placed': 'bg-slate-100 text-slate-700 border-slate-200',
  Sourcing: 'bg-[#FFF7E8] text-[#A06126] border-[#F5D9B8]',
  Procurement: 'bg-orange-50 text-orange-700 border-orange-200',
  Delivery: 'bg-[#FFF3D6] text-[#8B6B1E] border-[#F1DFAE]',
  Invoiced: 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
  'Payment Received': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const PAYMENT_STYLES: Record<string, string> = {
  Received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Awaiting Payment': 'bg-orange-50 text-orange-700 border-orange-200',
  'Not Invoiced': 'bg-rose-50 text-rose-700 border-rose-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Required': 'bg-slate-100 text-slate-600 border-slate-200',
};

export const SOURCE_STYLES: Record<string, string> = {
  quotation: 'bg-[#F5EEFF] text-[#6B3FB5] border-[#E4D5F5]',
  tender: 'bg-[#E8F6F1] text-[#0F6B4F] border-[#C4E8DA]',
  'sales-crm': 'bg-[#FFF7E8] text-[#A06126] border-[#F5D9B8]',
  manual: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const SOURCE_LABELS: Record<string, string> = {
  quotation: 'Quote',
  tender: 'Tender',
  'sales-crm': 'Sales CRM',
  manual: 'Manual',
};

// ============================================================
// HELPERS
// ============================================================
export const fmtMoney = (n: number | null | undefined) => {
  if (n === null || n === undefined || n === 0) return '৳0';
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString()}`;
};

export const fmtFull = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '৳0';
  return `৳${n.toLocaleString()}`;
};

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
};

export const fmtDateLong = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const inputCls =
  'w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126]';

export const selectCls = inputCls + ' cursor-pointer';