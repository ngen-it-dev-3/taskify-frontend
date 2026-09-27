'use client';

import React, { useMemo } from 'react';
import { Search, ChevronDown, Archive, ListFilter, XCircle } from 'lucide-react';
import type { FilterState, RFQItem, RFQViewMode } from './types';

interface Props {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  rfqs: RFQItem[];
  activeCount?: number;
  archivedCount?: number;
  lostCount?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function FilterToolbar({
  filters,
  onChange,
  rfqs,
  activeCount,
  archivedCount,
  lostCount,
}: Props) {
  const { countryFilter, salesmanFilter, companySearch, viewMode } = filters;

  const countries = useMemo(
    () => Array.from(new Set(rfqs.map((r) => r.country).filter(Boolean))).sort(),
    [rfqs]
  );
  const salesmen = useMemo(
    () => Array.from(new Set(rfqs.map((r) => r.salesman).filter(Boolean))).sort(),
    [rfqs]
  );

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y + 1, y, y - 1, y - 2].map(String);
  }, []);

  const yearValue = filters.year ?? '';
  const monthValue = filters.month ?? '';

  const viewModes: {
    v: RFQViewMode;
    l: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
      {
        v: 'active',
        l: 'Active',
        count: activeCount ?? 0,
        icon: <ListFilter className="w-3.5 h-3.5" />,
      },
      {
        v: 'archived',
        l: 'Archived',
        count: archivedCount ?? 0,
        icon: <Archive className="w-3.5 h-3.5" />,
      },
      {
        v: 'lost',
        l: 'Lost',
        count: lostCount ?? 0,
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
    ];

  return (
    <div className="bg-white rounded-xl p-4 border border-[#EBE6DF] shadow-2xs mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* ⭐ 3-way segmented toggle */}
        <div className="inline-flex items-center rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] p-0.5">
          {viewModes.map((m) => {
            const active = viewMode === m.v;
            return (
              <button
                key={m.v}
                onClick={() => onChange({ viewMode: m.v })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${active
                    ? m.v === 'active'
                      ? 'bg-emerald-600 text-white'
                      : m.v === 'archived'
                        ? 'bg-[#A06126] text-white'
                        : 'bg-rose-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title={`${m.l} (${m.count})`}
              >
                {m.icon}
                <span>{m.l}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[10px] font-bold ${active
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-700'
                    }`}
                >
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* (Removed "Showing: ..." pill — kept view clean) */}

        <SelectBox
          value={countryFilter}
          onChange={(v) => onChange({ countryFilter: v })}
          options={[
            { v: '0', l: 'All Countries' },
            ...countries.map((c) => ({ v: c, l: c })),
          ]}
        />

        <SelectBox
          value={salesmanFilter}
          onChange={(v) => onChange({ salesmanFilter: v })}
          options={[
            { v: '0', l: 'All Salesmanagers' },
            ...salesmen.map((s) => ({ v: s, l: s })),
          ]}
        />

        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={companySearch}
            onChange={(e) => onChange({ companySearch: e.target.value })}
            placeholder="Search company or RFQ #…"
            className="w-full bg-[#FDFBF7] border border-[#E2DBD1] text-xs rounded-lg pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
          />
        </div>

        <SelectBox
          value={yearValue}
          onChange={(v) => onChange({ year: v })}
          options={[
            { v: '', l: 'All Years' },
            ...years.map((y) => ({ v: y, l: y })),
          ]}
        />

        <SelectBox
          value={monthValue}
          onChange={(v) => onChange({ month: v })}
          options={[
            { v: '', l: 'All Months' },
            ...MONTHS.map((m) => ({ v: m, l: m })),
          ]}
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
        <span className="hover:text-[#A06126] cursor-pointer">Sales CRM</span>
        <span className="text-slate-300">|</span>
        <span className="hover:text-[#A06126] cursor-pointer">Online CRM</span>
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}