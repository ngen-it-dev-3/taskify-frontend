// app/(dashboard)/online-crm/components/FilterBar.tsx
'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { SOURCES } from './constants';

export interface QueryFilters {
  search: string;
  source: string;
  stage: string;
  country: string;
}

interface Props {
  value: QueryFilters;
  onChange: (v: QueryFilters) => void;
}

export function FilterBar({ value, onChange }: Props) {
  const set = <K extends keyof QueryFilters>(k: K, v: QueryFilters[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EBE6DF] bg-white px-4 py-3">
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

      {/* Source */}
      <select
        value={value.source}
        onChange={(e) => set('source', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Queries</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

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

      {/* Country */}
      <select
        value={value.country}
        onChange={(e) => set('country', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Countries</option>
        <option value="Bangladesh">Bangladesh</option>
        <option value="Egypt">Egypt</option>
        <option value="Singapore">Singapore</option>
        <option value="Middle East">Middle East</option>
        <option value="India">India</option>
      </select>
    </div>
  );
}