"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Search,
  RefreshCw,
  Plus,
  Home,
  ChevronRight,
  FileText,
  PieChart,
  Heart,
  Sun,
  Star,
  LayoutGrid,
  List,
  Trash2,
  Eye,
  Loader2,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ApplyLeaveModal from "@/components/HR/ApplyLeaveModal";

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const DEFAULT_LEAVE_BALANCES: Record<string, number> = {
  sick: 10,
  casual: 8,
  earned: 6,
};

const leaveTypeLabels: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
};

const leaveTypeColors: Record<string, string> = {
  sick: "bg-rose-50 text-rose-600 border-rose-200",
  casual: "bg-sky-50 text-sky-600 border-sky-200",
  earned: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const leaveTypeIcons: Record<string, any> = {
  sick: Heart,
  casual: Sun,
  earned: Star,
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: Ban,
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

interface LeaveRequest {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  employeeName?: string;
  employeeEmail?: string;
  rejectionReason?: string;
  substituteName?: string;
  notes?: string;
  isHalfDay?: boolean;
}

type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";
type ViewMode = "table" | "grid";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyLeavesPage() {
  const { user, isAuthenticated } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Data Fetching ----
  const calculateBalances = (requests: LeaveRequest[]) =>
    Object.keys(DEFAULT_LEAVE_BALANCES).map((type) => {
      const total = DEFAULT_LEAVE_BALANCES[type];
      const used = requests
        .filter((r) => r.type === type && r.status === "approved")
        .reduce((s, r) => s + (r.totalDays || 0), 0);
      const pending = requests
        .filter((r) => r.type === type && r.status === "pending")
        .reduce((s, r) => s + (r.totalDays || 0), 0);
      return {
        leaveType: type,
        total,
        used,
        pending,
        remaining: Math.max(0, total - used),
        percentage: total > 0 ? (used / total) * 100 : 0,
      };
    });

  const fetchLeaveData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      const res = await api.get("/leaves/my-leaves");
      const requests = res.data.success ? res.data.data || [] : [];
      setLeaveRequests(requests);

      try {
        const bal = await api.get("/leaves/balances");
        if (bal.data.success) {
          const b = bal.data.data;
          setLeaveBalances(
            Object.keys(DEFAULT_LEAVE_BALANCES).map((type) => {
              const total = DEFAULT_LEAVE_BALANCES[type];
              const used = b.used?.[type] || 0;
              const pending = requests
                .filter((r: LeaveRequest) => r.type === type && r.status === "pending")
                .reduce((s: number, r: LeaveRequest) => s + (r.totalDays || 0), 0);
              return {
                leaveType: type,
                total,
                used,
                remaining: Math.max(0, total - used),
                pending,
                percentage: total > 0 ? (used / total) * 100 : 0,
              };
            })
          );
        } else {
          setLeaveBalances(calculateBalances(requests));
        }
      } catch {
        setLeaveBalances(calculateBalances(requests));
      }
    } catch (e: any) {
      if (!silent) {
        toast.error(e.response?.data?.message || "Failed to load leave data");
      }
      setLeaveRequests([]);
      setLeaveBalances(calculateBalances([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/leaves/substitutes");
      if (res.data.success) setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
      fetchUsers();
    }
  }, [isAuthenticated]);

  // ---- Handlers ----
  const handleApplyLeave = async (payload: any) => {
    setIsSubmitting(true);
    try {
      const res = await api.post("/leaves", payload);
      if (res.data.success) {
        toast.success("Leave request submitted successfully!");
        setShowApplyModal(false);
        await fetchLeaveData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/leaves/${selectedLeave._id}`);
      if (res.data.success) {
        toast.success("Leave request deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedLeave(null);
        await fetchLeaveData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- Memoized Data ----
  const filteredLeaves = useMemo(() => {
    let f = [...leaveRequests];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      f = f.filter(
        (l) =>
          l.reason?.toLowerCase().includes(s) ||
          l.type?.toLowerCase().includes(s) ||
          l.employeeName?.toLowerCase().includes(s)
      );
    }
    if (filterStatus !== "all") f = f.filter((l) => l.status === filterStatus);
    if (filterType !== "all") f = f.filter((l) => l.type === filterType);
    return f.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [leaveRequests, searchTerm, filterStatus, filterType]);

  const stats = useMemo(() => {
    const approvedDays = leaveRequests
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const pendingDays = leaveRequests
      .filter((l) => l.status === "pending")
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);

    return {
      total: leaveRequests.length,
      pending: leaveRequests.filter((l) => l.status === "pending").length,
      approved: leaveRequests.filter((l) => l.status === "approved").length,
      rejected: leaveRequests.filter((l) => l.status === "rejected").length,
      approvedDays,
      pendingDays,
    };
  }, [leaveRequests]);

  const balanceCards = leaveBalances.length
    ? leaveBalances
    : calculateBalances(leaveRequests);

  const totalRemainingDays = useMemo(
    () => balanceCards.reduce((sum, b) => sum + (b.remaining || 0), 0),
    [balanceCards]
  );

  const getInitials = (n: string) =>
    !n
      ? "?"
      : n
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

  const fmt = (d: string) =>
    !d
      ? "N/A"
      : new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#faf8f4]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#107E57] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Breadcrumb (Matching Orvix Enterprise Style) */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Link
            href="/dashboard"
            className="hover:text-[#107E57] flex items-center gap-1 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-gray-400" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <Link href="/hr" className="hover:text-[#107E57] transition-colors">
            HR & Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-800 font-semibold">My Leaves</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              My Leaves
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Monitor leave consumption, remaining balances, and personal requests.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchLeaveData()}
              disabled={refreshing}
              className="cursor-pointer px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-xs font-semibold flex items-center gap-2 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="cursor-pointer px-4 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg transition-colors text-xs font-semibold shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Apply Leave
            </button>
          </div>
        </div>

        {/* 4 KPI Stat Cards (Exact Screenshot Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Requests */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                TOTAL REQUESTS
              </span>
              <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">Across all leave types</p>
          </div>

          {/* Card 2: Pending Requests */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                PENDING REQUESTS
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {stats.pendingDays} total days requested
            </p>
          </div>

          {/* Card 3: Approved Leaves */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                APPROVED LEAVES
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.approvedDays} total days taken this year
            </p>
          </div>

          {/* Card 4: Available Balance */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                AVAILABLE BALANCE
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#107E57] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#107E57]">{totalRemainingDays}d</p>
            <p className="text-xs text-gray-400 mt-1">Remaining leave quota</p>
          </div>
        </div>

        {/* Leave Balances Breakdown Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#107E57]" />
              <h2 className="text-sm font-bold text-gray-900">
                Leave Quota Breakdown
              </h2>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">
              Annual Policy: Sick 10d • Casual 8d • Earned 6d
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balanceCards.map((b) => {
              const Icon = leaveTypeIcons[b.leaveType] || Calendar;
              const label = leaveTypeLabels[b.leaveType] || b.leaveType;
              const isCritical = b.remaining === 0 && b.total > 0;
              const isLow = !isCritical && b.remaining < b.total * 0.25;

              const barColor =
                b.leaveType === "sick"
                  ? "bg-rose-500"
                  : b.leaveType === "casual"
                  ? "bg-sky-500"
                  : "bg-[#107E57]";

              const badgeColor =
                b.leaveType === "sick"
                  ? "bg-rose-50 text-rose-600"
                  : b.leaveType === "casual"
                  ? "bg-sky-50 text-sky-600"
                  : "bg-emerald-50 text-[#107E57]";

              return (
                <div
                  key={b.leaveType}
                  className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-4"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${badgeColor}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                      {b.remaining}d left
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Used:{" "}
                      <span className="font-bold text-gray-800">{b.used}d</span> /{" "}
                      {b.total}d
                    </p>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {Math.round(b.total > 0 ? (b.used / b.total) * 100 : 0)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : barColor
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          b.total > 0 ? (b.used / b.total) * 100 : 0
                        )}%`,
                      }}
                    />
                  </div>

                  {b.pending > 0 && (
                    <p className="text-[11px] text-amber-600 font-medium mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {b.pending}d pending approval
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Requests Container (Matches Bottom Section in Screenshot) */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-1/2 lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reason or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-gray-900 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] text-xs bg-[#FAFBFB] focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 focus:border-[#107E57] outline-none text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 focus:border-[#107E57] outline-none text-gray-700"
              >
                <option value="all">All Types</option>
                {Object.entries(leaveTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              {/* View Mode Switcher (Table / Grid like in Screenshot) */}
              <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-[#FAFBFB]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`cursor-pointer p-1.5 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-[#107E57] shadow-2xs"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`cursor-pointer p-1.5 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-[#107E57] shadow-2xs"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content: Table or Grid View */}
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-[#FAFBFB]/60">
                    <th className="px-6 py-3.5">EMPLOYEE</th>
                    <th className="px-6 py-3.5">LEAVE TYPE</th>
                    <th className="px-6 py-3.5">DURATION</th>
                    <th className="px-6 py-3.5">STATUS</th>
                    <th className="px-6 py-3.5">CREATED</th>
                    <th className="px-6 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => {
                      const TypeIcon = leaveTypeIcons[leave.type] || Calendar;
                      const StatusIcon = statusIcons[leave.status] || Clock;
                      const empName = leave.employeeName || user?.fullName || "Unknown";
                      const empEmail = leave.employeeEmail || user?.email || "N/A";

                      return (
                        <tr
                          key={leave._id}
                          className="hover:bg-gray-50/70 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                {getInitials(empName)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">
                                  {empName}
                                </p>
                                <p className="text-[11px] text-gray-400">{empEmail}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                leaveTypeColors[leave.type] ||
                                "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              <TypeIcon className="w-3 h-3" />
                              {leaveTypeLabels[leave.type] || leave.type}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                              {leave.totalDays || 0}{" "}
                              {leave.totalDays === 1 ? "day" : "days"}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {fmt(leave.startDate)} – {fmt(leave.endDate)}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                                statusColors[leave.status] ||
                                "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[leave.status] || leave.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-gray-500">
                            {fmt(leave.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setShowViewModal(true);
                                }}
                                className="cursor-pointer p-1.5 text-gray-400 hover:text-[#107E57] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {leave.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedLeave(leave);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="cursor-pointer p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Request"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-[#F6F8F7] rounded-full flex items-center justify-center mb-3">
                            <Calendar className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1">
                            No leave requests found
                          </h3>
                          <p className="text-xs text-gray-400">
                            Try adjusting filters or apply for a new leave.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#FAFBFB]">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => {
                  const TypeIcon = leaveTypeIcons[leave.type] || Calendar;
                  const StatusIcon = statusIcons[leave.status] || Clock;
                  const empName = leave.employeeName || user?.fullName || "Unknown";

                  return (
                    <div
                      key={leave._id}
                      className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              leaveTypeColors[leave.type] ||
                              "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            <TypeIcon className="w-3 h-3" />
                            {leaveTypeLabels[leave.type] || leave.type}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                              statusColors[leave.status]
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusLabels[leave.status] || leave.status}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-gray-900 mb-1">
                          {leave.totalDays || 0} {leave.totalDays === 1 ? "day" : "days"}{" "}
                          <span className="font-normal text-gray-400">
                            ({fmt(leave.startDate)} – {fmt(leave.endDate)})
                          </span>
                        </p>

                        <p className="text-xs text-gray-600 line-clamp-2 mt-2">
                          {leave.reason || "No reason provided."}
                        </p>
                      </div>

                      <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {empName} • {fmt(leave.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowViewModal(true);
                            }}
                            className="cursor-pointer p-1.5 text-gray-400 hover:text-[#107E57] hover:bg-emerald-50 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {leave.status === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowDeleteConfirm(true);
                              }}
                              className="cursor-pointer p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                  No leave requests found.
                </div>
              )}
            </div>
          )}

          {/* Table Footer (Exact Screenshot Footer) */}
          <div className="border-t border-gray-100 px-6 py-3.5 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
            <div>
              Showing{" "}
              <span className="font-semibold text-gray-900">{filteredLeaves.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">{leaveRequests.length}</span>{" "}
              requests
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Rejected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <ApplyLeaveModal
            open={showApplyModal}
            user={user}
            leaveBalances={balanceCards}
            substitutes={users.filter((u) => u._id !== user?._id)}
            isSubmitting={isSubmitting}
            onClose={() => setShowApplyModal(false)}
            onSubmit={handleApplyLeave}
          />
        )}
      </AnimatePresence>

      {/* View Leave Details Modal */}
      <AnimatePresence>
        {showViewModal && selectedLeave && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full shadow-xl p-6"
            >
              <div className="flex justify-between items-start pb-4 mb-5 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#107E57]">
                    Leave Application
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                    Request Details
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLeave(null);
                  }}
                  className="cursor-pointer p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Leave Type
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {leaveTypeLabels[selectedLeave.type] || selectedLeave.type}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                    {statusLabels[selectedLeave.status] || selectedLeave.status}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Date Range
                  </p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {fmt(selectedLeave.startDate)} – {fmt(selectedLeave.endDate)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Duration
                  </p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {selectedLeave.totalDays || 0}{" "}
                    {selectedLeave.totalDays === 1 ? "Day" : "Days"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-3.5 mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Reason
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedLeave.reason || "No reason provided."}
                </p>
              </div>

              {selectedLeave.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-xs text-rose-800">{selectedLeave.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                <span>Applied on {fmt(selectedLeave.createdAt)}</span>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLeave(null);
                  }}
                  className="cursor-pointer px-4 py-1.5 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLeave && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Delete Leave Request
                  </h2>
                  <p className="text-xs text-gray-400">Pending Request</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-xs leading-relaxed">
                Are you sure you want to delete this leave request? This action cannot be
                undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedLeave(null);
                  }}
                  className="cursor-pointer flex-1 text-gray-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteLeave}
                  className="cursor-pointer flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}