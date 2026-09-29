// app/(dashboard)/sales-crm/components/FilterBar.tsx
'use client';

import React from 'react';
import { MapPin, User } from 'lucide-react';
import { REGIONS } from './constants';

export interface SalesFilters {
  region: string;   // 'All Regions' | one of REGIONS
  owner: string;    // '' = all, else salesperson name
}

interface Props {
  value: SalesFilters;
  onChange: (v: SalesFilters) => void;
}

export function FilterBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EBE6DF] bg-white px-4 py-3">
      {/* Region */}
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Region
        </span>
        <select
          value={value.region}
          onChange={(e) => onChange({ ...value, region: e.target.value })}
          className="rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Salesperson
        </span>
        <input
          value={value.owner}
          onChange={(e) => onChange({ ...value, owner: e.target.value })}
          placeholder="Any (or type a name)"
          className="w-40 rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
      </div>

      {/* Clear */}
      {(value.region !== 'All Regions' || value.owner) && (
        <button
          onClick={() => onChange({ region: 'All Regions', owner: '' })}
          className="ml-auto text-[10px] font-semibold text-[#A06126] hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}