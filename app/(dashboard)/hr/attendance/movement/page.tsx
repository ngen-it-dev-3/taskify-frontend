"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Route,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Building2,
  Eye,
  XCircle,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES & STATIC DATA
// ============================================================================

type MovementStatus = "completed" | "in-transit" | "scheduled" | "returned";

interface MovementRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  returnTime: string;
  duration: string;
  status: MovementStatus;
  notes: string;
}

const STATIC_MOVEMENTS: MovementRecord[] = [
  {
    id: "MOV-1041",
    employeeName: "Sazeduzzaman Saju",
    employeeCode: "EMP-014",
    department: "Engineering & Frontend",
    purpose: "Client Site Deployment & UI Review",
    fromLocation: "NGen IT HQ, Mohammadpur",
    toLocation: "Banani Client Office, Dhaka",
    departureTime: "10:15 AM",
    returnTime: "01:30 PM",
    duration: "3.2h",
    status: "completed",
    notes: "Verified production build and biometric sync dashboard with client team.",
  },
  {
    id: "MOV-1042",
    employeeName: "Ekramul Haque",
    employeeCode: "EMP-019",
    department: "Hardware & Logistics",
    purpose: "Biometric & Network Device Inspection",
    fromLocation: "Mahfuza Tower, Adabor",
    toLocation: "Gulshan-2 Warehouse",
    departureTime: "01:45 PM",
    returnTime: "—",
    duration: "In Progress",
    status: "in-transit",
    notes: "Checking ZKTeco terminal cabling and rack power backup.",
  },
  {
    id: "MOV-1043",
    employeeName: "Shazidul Alam",
    employeeCode: "EMP-023",
    department: "Infrastructure & Ops",
    purpose: "Server Rack Audit & Vendor Handover",
    fromLocation: "Ring Road Office, Dhaka",
    toLocation: "Kawran Bazar Tech Hub",
    departureTime: "09:30 AM",
    returnTime: "12:10 PM",
    duration: "2.7h",
    status: "returned",
    notes: "Collected hardware inventory sheet and signed delivery challan.",
  },
  {
    id: "MOV-1044",
    employeeName: "Nusrat Jahan",
    employeeCode: "EMP-028",
    department: "HR & Admin",
    purpose: "Bank & Statutory Compliance Visit",
    fromLocation: "NGen IT HQ, Mohammadpur",
    toLocation: "Motijheel Commercial Area",
    departureTime: "04:00 PM",
    returnTime: "—",
    duration: "Scheduled",
    status: "scheduled",
    notes: "Afternoon document submission and branch officer meeting.",
  },
  {
    id: "MOV-1045",
    employeeName: "Tanvir Ahmed",
    employeeCode: "EMP-031",
    department: "CRM & Sales",
    purpose: "Enterprise RFQ Presentation",
    fromLocation: "Mahfuza Tower, Adabor",
    toLocation: "Dhanmondi Corporate Center",
    departureTime: "11:00 AM",
    returnTime: "02:05 PM",
    duration: "3.1h",
    status: "completed",
    notes: "Submitted technical quotation and gathered client feedback.",
  },
];

const STATUS_META: Record<
  MovementStatus,
  { label: string; pill: string; icon: React.ComponentType<{ className?: string }> }
> = {
  completed: {
    label: "Completed",
    pill: "bg-emerald-50 text-[#107E57] border-emerald-200",
    icon: CheckCircle2,
  },
  "in-transit": {
    label: "In Transit",
    pill: "bg-[#FAF8F4] text-[#8B5A2B] border-[#A06126]/35",
    icon: Navigation,
  },
  scheduled: {
    label: "Scheduled",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  returned: {
    label: "Returned",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    icon: MapPin,
  },
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MovementRecordPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMovement, setSelectedMovement] = useState<MovementRecord | null>(null);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return STATIC_MOVEMENTS.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeCode.toLowerCase().includes(q) ||
        item.toLocation.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q)
      );
    });
  }, [search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: STATIC_MOVEMENTS.length,
      completed: STATIC_MOVEMENTS.filter((m) => m.status === "completed" || m.status === "returned").length,
      active: STATIC_MOVEMENTS.filter((m) => m.status === "in-transit").length,
      scheduled: STATIC_MOVEMENTS.filter((m) => m.status === "scheduled").length,
    };
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] pb-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200/90 pb-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2"
            >
              <Link
                href="/dashboard"
                className="hover:text-[#107E57] flex items-center gap-1 transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-gray-400" /> Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <Link href="/hr" className="hover:text-[#107E57] transition-colors">
                HR &amp; Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-[#8B5A2B] font-semibold">Movement Record</span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Route className="w-6 h-6 text-[#107E57]" /> Movement Record
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Track outdoor visits, field movements, and return logs across teams.
            </p>
          </div>

          <span className="px-3 py-1.5 bg-[#FAF8F4] border border-[#A06126]/30 text-[#8B5A2B] rounded-lg text-xs font-semibold">
            Thursday, Nov 19, 2026
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total Movements
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
              {summary.total}
            </p>
            <p className="text-xs text-[#8B5A2B] font-medium mt-1">Today&apos;s outdoor log</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Completed / Returned
            </p>
            <p className="text-2xl font-bold text-[#107E57] mt-1 tabular-nums">
              {summary.completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">Checked back in</p>
          </div>

          <div className="bg-white rounded-xl border border-[#A06126]/25 shadow-2xs p-4 bg-[#FAF8F4]/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B5A2B]">
              In Transit
            </p>
            <p className="text-2xl font-bold text-[#A06126] mt-1 tabular-nums">
              {summary.active}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently outside</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Scheduled
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
              {summary.scheduled}
            </p>
            <p className="text-xs text-gray-500 mt-1">Upcoming movements</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8B5A2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, ID, destination, or purpose..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAFBFB] hover:bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by movement status"
              className="cursor-pointer px-3.5 py-2 bg-[#FAFBFB] hover:bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57]"
            >
              <option value="all">All Statuses</option>
              <option value="in-transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="returned">Returned</option>
              <option value="scheduled">Scheduled</option>
            </select>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="cursor-pointer px-3 py-2 bg-[#FAF8F4] hover:bg-[#f4efe6] border border-[#A06126]/25 text-[#8B5A2B] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Compact Movement Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF8F4] border-b border-gray-200/80 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-3.5 py-2.5">Employee</th>
                  <th className="px-3.5 py-2.5">Destination &amp; Purpose</th>
                  <th className="px-3.5 py-2.5">Out</th>
                  <th className="px-3.5 py-2.5">In</th>
                  <th className="px-3.5 py-2.5">Duration</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm tabular-nums">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-xs">
                      No movement records match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => {
                    const meta = STATUS_META[row.status];
                    const Icon = meta.icon;
                    return (
                      <tr key={row.id} className="hover:bg-[#FAF8F4]/75 transition-colors">
                        <td className="px-3.5 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#107E57] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {getInitials(row.employeeName)}
                            </div>
                            <div className="leading-tight">
                              <p className="font-semibold text-gray-900 text-xs sm:text-[13px] whitespace-nowrap">
                                {row.employeeName}
                              </p>
                              <p className="text-[11px] text-[#8B5A2B]/80">
                                {row.employeeCode} • {row.department}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3.5 py-2 leading-tight">
                          <p className="font-medium text-gray-800 text-xs flex items-center gap-1 whitespace-nowrap">
                            <MapPin className="w-3 h-3 text-[#A06126] shrink-0" />
                            {row.toLocation}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                            {row.purpose}
                          </p>
                        </td>

                        <td className="px-3.5 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">
                          {row.departureTime}
                        </td>

                        <td className="px-3.5 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">
                          {row.returnTime}
                        </td>

                        <td className="px-3.5 py-2 text-xs font-semibold text-[#107E57] whitespace-nowrap">
                          {row.duration}
                        </td>

                        <td className="px-3.5 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${meta.pill}`}
                          >
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        </td>

                        <td className="px-3.5 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedMovement(row)}
                            title="View Movement Details"
                            className="cursor-pointer p-1 text-gray-400 hover:text-[#107E57] hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#FAF8F4]/70 border-t border-gray-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <b className="text-gray-800">{filteredList.length}</b> of{" "}
              <b className="text-gray-800">{STATIC_MOVEMENTS.length}</b> movement entries
            </span>
            <span className="text-[11px] text-[#8B5A2B] font-medium">
              Orvix Enterprise • Field &amp; Movement Log
            </span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMovement && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setSelectedMovement(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 max-w-lg w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#FAF8F4] px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B5A2B]">
                  {selectedMovement.id} • {selectedMovement.employeeCode}
                </p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">
                  {selectedMovement.employeeName}
                </h2>
                <p className="text-xs text-gray-500">{selectedMovement.department}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                className="cursor-pointer p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF8F4] p-3.5 rounded-lg border border-gray-200/80">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">From</p>
                  <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#8B5A2B]" />
                    {selectedMovement.fromLocation}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">To</p>
                  <p className="font-semibold text-[#107E57] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#107E57]" />
                    {selectedMovement.toLocation}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Purpose &amp; Notes
                </p>
                <p className="font-semibold text-gray-900">{selectedMovement.purpose}</p>
                <p className="text-xs text-gray-600 bg-[#FAF8F4]/70 p-3 rounded-lg border border-gray-200/70 mt-1.5">
                  {selectedMovement.notes}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="cursor-pointer px-5 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}