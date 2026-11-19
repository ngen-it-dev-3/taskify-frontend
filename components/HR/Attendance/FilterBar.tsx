"use client";

import { Search, RefreshCw, LayoutGrid, List, XCircle, Users } from "lucide-react";

interface Props {
  searchInput: string;
  setSearchInput: (v: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (v: "grid" | "table") => void;
  departments: string[];
  isHR: boolean;
  focusEmployeeId: string | null;
  setFocusEmployeeId: (v: string | null) => void;
  focusedName: string | null;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "double-late", label: "Double Late" },
  { value: "half-day", label: "Half Day" },
  { value: "on-leave", label: "On Leave" },
  { value: "absent", label: "Absent" },
];

export default function FilterBar(props: Props) {
  const safeDepartments = Array.isArray(props.departments)
    ? props.departments.filter(Boolean)
    : ["All Departments"];

  return (
    <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]" />
          <input
            type="text"
            placeholder="Search employee, email, or ID..."
            value={props.searchInput}
            onChange={(e) => props.setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white transition-colors text-sm text-gray-800 placeholder:text-gray-400"
          />
        </div>

        {/* Focused Employee Chip */}
        {props.focusedName && (
          <button
            type="button"
            onClick={() => props.setFocusEmployeeId(null)}
            className="cursor-pointer px-3 py-2 bg-[#FAF8F4] border border-[#A06126]/35 text-[#8B5A2B] hover:bg-[#f4efe6] rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors"
            title="Clear focused employee"
          >
            <Users className="w-3.5 h-3.5 text-[#A06126]" />
            <span>{props.focusedName}</span>
            <XCircle className="w-3.5 h-3.5 text-[#A06126]" />
          </button>
        )}

        {/* Department Filter (HR Only) */}
        {props.isHR && (
          <select
            value={props.selectedDepartment}
            onChange={(e) => props.setSelectedDepartment(e.target.value)}
            aria-label="Filter by department"
            className="cursor-pointer px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white text-sm text-gray-700 min-w-[165px] transition-colors"
          >
            {safeDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={props.selectedStatus}
          onChange={(e) => props.setSelectedStatus(e.target.value)}
          aria-label="Filter by status"
          className="cursor-pointer px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white text-sm text-gray-700 min-w-[145px] transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Reset Filters Button */}
        {props.hasActiveFilters && (
          <button
            type="button"
            onClick={props.resetFilters}
            className="cursor-pointer px-3 py-2 text-[#8B5A2B] hover:text-[#6e4620] bg-[#FAF8F4] hover:bg-[#f4efe6] border border-[#A06126]/25 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="Clear filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="lg:hidden">Reset</span>
          </button>
        )}

        {/* Table / Grid View Toggle */}
        <div className="flex gap-1 bg-[#FAF8F4] border border-gray-200/80 rounded-lg p-1 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => props.setViewMode("table")}
            aria-label="Table view"
            title="Table View"
            className={`cursor-pointer p-1.5 rounded-md transition-all ${
              props.viewMode === "table"
                ? "bg-[#107E57] text-white shadow-2xs"
                : "text-gray-500 hover:text-[#8B5A2B] hover:bg-white/70"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => props.setViewMode("grid")}
            aria-label="Grid view"
            title="Grid View"
            className={`cursor-pointer p-1.5 rounded-md transition-all ${
              props.viewMode === "grid"
                ? "bg-[#107E57] text-white shadow-2xs"
                : "text-gray-500 hover:text-[#8B5A2B] hover:bg-white/70"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}