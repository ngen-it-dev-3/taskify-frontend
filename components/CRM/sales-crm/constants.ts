// app/(dashboard)/sales-crm/components/constants.ts
import type { ForecastStage, ForecastMonth } from '@/services/salesCrm.service';

export const MONTHS: ForecastMonth[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const STAGES: { key: ForecastStage; label: string; color: string }[] = [
    { key: 'query', label: 'Query', color: 'border-slate-200 bg-slate-50' },
    { key: 'rfq', label: 'RFQ', color: 'border-amber-200 bg-amber-50' },
    { key: 'quotation', label: 'Quotation', color: 'border-violet-200 bg-violet-50' },
    { key: 'negotiation', label: 'Negotiation', color: 'border-orange-200 bg-orange-50' },
    { key: 'won', label: 'Won', color: 'border-emerald-200 bg-emerald-50' },
    { key: 'lost', label: 'Lost', color: 'border-rose-200 bg-rose-50' },
];

export const REGIONS = [
    'All Regions',
    'Bangladesh',
    'Singapore',
    'India',
    'Pakistan',
    'Hungary',
    'Nigeria',
    'United Kingdom',
];

export const fmtMoney = (n: number) => {
    if (!n) return '৳0';
    if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;  
    if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;      
    if (n >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
    return `৳${n.toLocaleString()}`;
};

export const fmtFull = (n: number) => `৳${(n || 0).toLocaleString()}`;

export const fmtDate = (d: string | null) =>
    d
        ? new Date(d).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : '—';

export const inputCls =
    'w-full rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126]';

export const selectCls = inputCls + ' cursor-pointer';