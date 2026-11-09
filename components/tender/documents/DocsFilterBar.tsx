// components/tender/documents/DocsFilterBar.tsx
"use client";

import { List, LayoutGrid, Search } from "lucide-react";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

export interface ExperienceFilters {
  sector: string;
  duration: string;
  volume: string;
}

export interface WorkOrderFilters {
  search: string;
  sort: string;
  value: string;
  customers: string[];
  types: string[];
  products: string[];
}

export type DocsViewMode = "grid" | "list";

interface Props {
  value: WorkOrderFilters;
  onChange: (next: WorkOrderFilters) => void;
  view: DocsViewMode;
  onViewChange: (v: DocsViewMode) => void;
  category?: string;
}

const CUSTOMER_TYPES = ["Government", "Autonomous / State-owned", "Educational", "NGO / Development", "MNC", "Financial (private)", "Enterprise (private)", "Telecom", "Other"];
const WORK_TYPES = ["Supply", "Service", "Supply + Service"];
const PRODUCTS = ["Software", "Antivirus", "EDR", "Acronis", "Kiosk", "Radmin", "Printer", "Symantec", "Tenable", "EViews"];

export function DocsFilterBar({ value, onChange, view, onViewChange, category }: Props) {
  const isList = view === "list";
  
  if (category !== "work-orders") return null;

  return (
    <section className="flex flex-col gap-3 mt-4">
      {/* Top Row: Search, Sort, Value */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search client or product (e.g. Tenable)" 
              value={value.search}
              onChange={(e) => onChange({ ...value, search: e.target.value })}
              className="h-9 w-[260px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] focus:border-slate-400 outline-none"
            />
          </div>
          <select 
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <select 
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none"
          >
            <option value="all">Any value</option>
            <option value="1lac">Above 1 Lac</option>
            <option value="10lac">Above 10 Lac</option>
            <option value="50lac">Above 50 Lac</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onViewChange(isList ? "grid" : "list")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold shadow-sm transition hover:bg-slate-50"
          >
            {isList ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            {isList ? "Card view" : "List view"}
          </button>
        </div>
      </div>

      {/* Bottom Row: MultiSelect Filters */}
      <div className="flex items-center gap-2">
        <MultiSelectDropdown
          label="Customer All"
          options={CUSTOMER_TYPES}
          selected={value.customers}
          onChange={(customers) => onChange({ ...value, customers })}
        />
        <MultiSelectDropdown
          label="Type All"
          options={WORK_TYPES}
          selected={value.types}
          onChange={(types) => onChange({ ...value, types })}
        />
        <MultiSelectDropdown
          label="Product All"
          options={PRODUCTS}
          selected={value.products}
          onChange={(products) => onChange({ ...value, products })}
        />
      </div>
    </section>
  );
}