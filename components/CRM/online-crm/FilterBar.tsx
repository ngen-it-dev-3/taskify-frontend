// app/(dashboard)/online-crm/components/FilterBar.tsx
'use client';

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

// ⭐ Month options — 'all' shows everything, or pick a specific month
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export interface QueryFilters {
  search: string;
  source: string;              // source channel (Email / Phone / Portal / etc.)
  stage: string;
  country: string;
  originSource: string;        // 'all' | 'online' | 'rfq' | 'tender' | 'quotation'
  month: string;               // 'all' | 'January' | ... | 'December'
  year: string;                // 'all' | '2026' | '2025' ...
}

// ⭐ Default (clean) filter state — also exported so parent can reuse
export const DEFAULT_FILTERS: QueryFilters = {
  search: '',
  source: 'all',
  stage: 'all',
  country: 'all',
  originSource: 'all',
  month: 'all',
  year: 'all',
};

interface Props {
  value: QueryFilters;
  onChange: (v: QueryFilters) => void;
}

const ORIGIN_OPTIONS = [
  { key: 'all', label: 'All Sources' },
  { key: 'online', label: 'Online' },
  { key: 'rfq', label: 'RFQ' },
  { key: 'tender', label: 'Tender' },
  { key: 'quotation', label: 'Quote' },
] as const;

const SOURCE_BADGE_COLORS: Record<string, string> = {
  all: 'data-[on=true]:bg-[#0F2D4A] data-[on=true]:text-white data-[on=true]:border-[#0F2D4A]',
  online:
    'data-[on=true]:bg-[#FFF7E8] data-[on=true]:text-[#A06126] data-[on=true]:border-[#F5D9B8]',
  rfq: 'data-[on=true]:bg-[#EEF4FB] data-[on=true]:text-[#1F3864] data-[on=true]:border-[#D6E3F5]',
  tender:
    'data-[on=true]:bg-[#E8F6F1] data-[on=true]:text-[#0F6B4F] data-[on=true]:border-[#C4E8DA]',
  quotation:
    'data-[on=true]:bg-[#F5EEFF] data-[on=true]:text-[#6B3FB5] data-[on=true]:border-[#E4D5F5]',
};

const COUNTRIES = [
  'Bangladesh',
  'Egypt',
  'Singapore',
  'Middle East',
  'India',
  'Pakistan',
  'Hungary',
  'Nigeria',
];

// ⭐ Year options — current year and the last 4
function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
}

/**
 * ⭐ Detect whether any filter differs from the default.
 * Used to show/hide the Reset button and to highlight active filters.
 */
function hasActiveFilters(f: QueryFilters): boolean {
  return (
    f.search.trim() !== '' ||
    f.source !== 'all' ||
    f.stage !== 'all' ||
    f.country !== 'all' ||
    f.originSource !== 'all' ||
    f.month !== 'all' ||
    f.year !== 'all'
  );
}

export function FilterBar({ value, onChange }: Props) {
  const set = <K extends keyof QueryFilters>(k: K, v: QueryFilters[K]) =>
    onChange({ ...value, [k]: v });

  const yearOptions = getYearOptions();
  const showReset = hasActiveFilters(value);

  // ⭐ Reset all filters to defaults
  const handleReset = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EBE6DF] bg-white px-4 py-3">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search company or RFQ #."
          className="w-full rounded-lg border border-[#E2DBD1] bg-white pl-9 pr-8 py-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
        {value.search && (
          <button
            onClick={() => set('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ⭐ Origin Source pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
          Source
        </span>
        {ORIGIN_OPTIONS.map((opt) => {
          const isActive = value.originSource === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => set('originSource', opt.key)}
              data-on={isActive}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 transition ${SOURCE_BADGE_COLORS[opt.key]}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <select
        value={value.stage}
        onChange={(e) => set('stage', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Stages</option>
        <option value="To Start">To Start</option>
        <option value="Not Quoted">Not Quoted</option>
        <option value="Quoted">Quoted</option>
      </select>

      {/* ⭐ Month filter */}
      <select
        value={value.month}
        onChange={(e) => set('month', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Months</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* ⭐ Year filter */}
      <select
        value={value.year}
        onChange={(e) => set('year', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Years</option>
        {yearOptions.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>

      {/* Country */}
      <select
        value={value.country}
        onChange={(e) => set('country', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Countries</option>
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* ⭐ Reset button — only shows when filters are active */}
      {showReset && (
        <button
          type="button"
          onClick={handleReset}
          title="Clear all filters"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#A06126] hover:bg-[#FFF7E8] hover:border-[#F5D9B8] transition ml-auto"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}