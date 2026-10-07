// app/(dashboard)/crm/client-360/components/constants.ts
export {
    type Client360,
    type ClientContact,
    type ClientQuote,
    type ClientContract,
    type CommEntry,
    type ClientStats,
    type SectorBreakdown,
    type ClientConstants,
    type Tier,
    type AutoSource,
    type ClientStage,
} from '@/services/client360.service';

// ============================================================
// TIER BADGE STYLES
// ============================================================
export const TIER_STYLES: Record<string, string> = {
    Gold: 'bg-[#FFF3D6] text-[#8B6B1E] border-[#F1DFAE]',
    Silver: 'bg-slate-100 text-slate-700 border-slate-200',
    Bronze: 'bg-[#F7E8DA] text-[#8B5A2B] border-[#EBD3BA]',
};

// ============================================================
// SOURCE BADGE LABELS + COLORS
// ============================================================
export const SOURCE_LABELS: Record<string, string> = {
    tender: 'Tender',
    rfq: 'RFQ',
    quotation: 'Quote',
    'online-crm': 'Online',
    'sales-crm': 'Sales CRM',
    dmar: 'DMAR',
    manual: 'Manual',
    import: 'Import',
};

export const SOURCE_BADGE_STYLES: Record<string, string> = {
    tender: 'bg-[#E8F6F1] text-[#0F6B4F] border-[#C4E8DA]',
    rfq: 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
    quotation: 'bg-[#F5EEFF] text-[#6B3FB5] border-[#E4D5F5]',
    'online-crm': 'bg-[#FFF7E8] text-[#A06126] border-[#F5D9B8]',
    'sales-crm': 'bg-[#FFF7E8] text-[#A06126] border-[#F5D9B8]',
    dmar: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
    manual: 'bg-slate-100 text-slate-600 border-slate-200',
    import: 'bg-slate-100 text-slate-600 border-slate-200',
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

export const fmtMoneyFull = (n: number | null | undefined) => {
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

export const getInitials = (name: string): string => {
    return String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

// ============================================================
// FORM STYLES — used by AddClientModal + other modals
// ============================================================
export const inputCls =
    'w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126]';

export const selectCls = inputCls + ' cursor-pointer';