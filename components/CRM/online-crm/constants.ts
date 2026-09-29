// app/(dashboard)/online-crm/components/constants.ts
export {
  type OnlineQuery,
  type QueryStage,
  type QuerySource,
  type QueryStatus,
} from '@/services/onlineCrm.service';

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const SOURCES = [
  'Email',
  'Phone',
  'Portal',
  'Tender Portal',
  'Site Visit',
] as const;

export const STAGES = ['To Start', 'Not Quoted', 'Quoted'] as const;

export const ASSIGNEES = [
  'Akramul',
  'Nahid',
  'CRM Manager, ME',
  'CRM Manager, SG',
  'Wei Ling Tan',
  'Unassigned',
] as const;

export const fmtMoney = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString()}`;
};

export const fmtFull = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `৳${n.toLocaleString()}`;

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

export const inputCls =
  'w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126]';

export const selectCls = inputCls + ' cursor-pointer';