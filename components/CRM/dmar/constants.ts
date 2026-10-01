// app/(dashboard)/dmar/components/constants.ts
export {
    type DmarActivity,
    type DmarStats,
    type SectorVisitsData,
    type MonthlyPlanData,
    type TeamMember,
    type ActivityType,
    type ClientType,
    type Team,
    type ActivityStatus,
    type CreateActivityPayload,
} from '@/services/dmar.service';

export const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const ACTIVITY_BADGE_STYLES: Record<string, string> = {
    Visited: 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
    Called: 'bg-orange-50 text-orange-700 border-orange-200',
    Emailed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Posted: 'bg-violet-50 text-violet-700 border-violet-200',
    Social: 'bg-pink-50 text-pink-700 border-pink-200',
    Meeting: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
    'To Start': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-50 text-blue-700',
    Quoted: 'bg-orange-50 text-orange-700',
    Sold: 'bg-emerald-50 text-emerald-700',
    Lost: 'bg-rose-50 text-rose-700',
    Archived: 'bg-slate-100 text-slate-500',
};

export const formatMoney = (n: number | null | undefined): string => {
    if (n === null || n === undefined || n === 0) return '—';
    if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
    return `৳${n.toLocaleString()}`;
};

export const formatFull = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return '—';
    return `৳${n.toLocaleString()}`;
};

export const formatDate = (d: string | null): string => {
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