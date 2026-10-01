// app/(dashboard)/dmar/components/FilterBar.tsx
'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import type { TeamMember } from './constants';

export interface DmarFilters {
  search: string;
  activityType: string;
  sector: string;
  clientType: string;
  loggedBy: string;
  dateRange: string;      // 'this-month' | 'last-month' | 'this-year' | 'all'
}

interface Props {
  value: DmarFilters;
  onChange: (v: DmarFilters) => void;
  teamMembers: TeamMember[];
  sectors: string[];
}

const ACTIVITY_TYPES = [
  'Visited', 'Called', 'Emailed', 'Posted', 'Social', 'Meeting',
];

export function FilterBar({ value, onChange, teamMembers, sectors }: Props) {
  const set = <K extends keyof DmarFilters>(k: K, v: DmarFilters[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EBE6DF] bg-white px-4 py-3">
      {/* Activity Type */}
      <select
        value={value.activityType}
        onChange={(e) => set('activityType', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Activities</option>
        {ACTIVITY_TYPES.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Sector */}
      <select
        value={value.sector}
        onChange={(e) => set('sector', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Sectors</option>
        {sectors.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Client Type */}
      <select
        value={value.clientType}
        onChange={(e) => set('clientType', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">New &amp; Existing</option>
        <option value="New">New</option>
        <option value="Existing">Existing</option>
      </select>

      {/* Team Member */}
      <select
        value={value.loggedBy}
        onChange={(e) => set('loggedBy', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="all">All Team Members</option>
        {teamMembers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {/* Date Range */}
      <select
        value={value.dateRange}
        onChange={(e) => set('dateRange', e.target.value)}
        className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      >
        <option value="this-month">This Month</option>
        <option value="last-month">Last Month</option>
        <option value="this-year">This Year</option>
        <option value="all">All Time</option>
      </select>

      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search company…"
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

      {/* FY label */}
      <div className="ml-auto text-[10px] font-semibold text-slate-400">
        FY26 · Team Activity
      </div>
    </div>
  );
}