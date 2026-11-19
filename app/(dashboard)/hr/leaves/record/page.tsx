// app/hr/leaves/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Loader2,
  Check,
  X,
  Ban,
  UsersRound,
  CalendarDays,
  ChevronRight as ChevronRightIcon,
  Star,
  Clock8,
  CalendarClock,
  Heart,
  Baby,
  Sun,
  CloudRain,
  Trash2,
  FileText,
  MoreHorizontal
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { badgeService } from "@/lib/badgeService";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    departmentId?: { _id: string; name: string; code: string } | string;
    position?: string;
    profilePhoto?: string;
  };
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  substituteName?: string;
  notes?: string;
  approvedBy?: { _id: string; fullName: string; email: string };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isHalfDay: boolean;
  rejectionReason?: string;
}

type ViewMode = "grid" | "table";
type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave", sick: "Sick Leave", casual: "Casual Leave",
  maternity: "Maternity Leave", paternity: "Paternity Leave", bereavement: "Bereavement Leave",
  unpaid: "Unpaid Leave", earned: "Earned Leave", other: "Other Leave",
};

const leaveTypeIcons: Record<string, any> = {
  annual: CalendarDays, sick: Heart, casual: Sun, maternity: Baby,
  paternity: Baby, bereavement: CloudRain, unpaid: Clock8, earned: Star, other: CalendarClock,
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100/60 text-amber-700 border-amber-200",
  approved: "bg-emerald-100/60 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100/60 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusIcons: Record<string, any> = {
  pending: Clock, approved: CheckCircle, rejected: XCircle, cancelled: Ban,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveRecordPage() {
  const { user, isAuthenticated } = useAuth();

  // Data State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "this-month" | "last-month" | "this-quarter">("all");
  
  // Modals State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusAction, setStatusAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const isHR = useMemo(() => ["super_admin", "admin", "hr_manager"].includes(user?.role || ""), [user]);

  // ============================================================================
  // FETCH DATA
  // ============================================================================
  const fetchLeaveData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      const res = await api.get("/leaves/all");
      if (res.data.success) {
        const data = res.data.data || [];
        setLeaveRequests(data);
        badgeService.setBadge("pendingLeaves", data.filter((l: LeaveRequest) => l.status === "pending").length);
      }
    } catch (error: any) {
      if (!silent) toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchLeaveData();
  }, [isAuthenticated, fetchLeaveData]);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) return toast.error("Rejection reason is required.");
    try {
      setSubmittingAction(true);
      await api.patch(`/leaves/${id}/status`, { status, ...(status === "rejected" && { rejectionReason: rejectionReason.trim() }) });
      toast.success(`Leave ${status} successfully!`);
      setShowStatusModal(false);
      setShowViewModal(false);
      await fetchLeaveData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLeave) return;
    try {
      setSubmittingAction(true);
      await api.delete(`/leaves/${selectedLeave._id}`);
      toast.success("Leave request deleted");
      setShowDeleteConfirm(false);
      await fetchLeaveData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setSubmittingAction(false);
    }
  };

  // ============================================================================
  // HELPERS & FILTERS
  // ============================================================================
  const getEmployeeName = (emp: any) => typeof emp === 'object' ? emp?.fullName : "Unknown";
  const getEmployeeEmail = (emp: any) => typeof emp === 'object' ? emp?.email : "N/A";
  const getEmployeeId = (emp: any) => typeof emp === 'object' ? emp?.employeeId : "N/A";
  const getDepartmentName = (emp: any) => typeof emp?.departmentId === 'object' ? emp.departmentId?.name : "N/A";
  
  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A";

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((leave) => {
      const empName = getEmployeeName(leave.employeeId).toLowerCase();
      const empEmail = getEmployeeEmail(leave.employeeId).toLowerCase();
      const matchesSearch = !searchTerm || empName.includes(searchTerm.toLowerCase()) || empEmail.includes(searchTerm.toLowerCase()) || leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || leave.status === filterStatus;
      const matchesType = filterType === "all" || leave.type === filterType;
      
      // Date Range Filter
      let matchesDate = true;
      if (filterDateRange !== "all") {
        const now = new Date();
        const leaveDate = new Date(leave.createdAt);
        if (filterDateRange === "this-month") matchesDate = leaveDate >= new Date(now.getFullYear(), now.getMonth(), 1);
        else if (filterDateRange === "last-month") matchesDate = leaveDate >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && leaveDate <= new Date(now.getFullYear(), now.getMonth(), 0);
        else if (filterDateRange === "this-quarter") matchesDate = leaveDate >= new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      }
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaveRequests, searchTerm, filterStatus, filterType, filterDateRange]);

  const statsCards = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((l) => l.status === "pending").length;
    const approved = leaveRequests.filter((l) => l.status === "approved").length;
    const rejected = leaveRequests.filter((l) => l.status === "rejected").length;
    const cancelled = leaveRequests.filter((l) => l.status === "cancelled").length;
    return [
      { label: "Total", value: total, icon: FileText, color: "text-slate-600" },
      { label: "Pending", value: pending, icon: Clock, color: "text-amber-600" },
      { label: "Approved", value: approved, icon: CheckCircle, color: "text-emerald-600" },
      { label: "Rejected", value: rejected, icon: XCircle, color: "text-rose-600" },
      { label: "Cancelled", value: cancelled, icon: Ban, color: "text-slate-400" },
    ];
  }, [leaveRequests]);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#faf8f4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#A06126] mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading leave records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] font-sans pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Link href="/dashboard" className="hover:text-[#A06126]">Dashboard</Link>
            <ChevronRightIcon size={12} />
            <Link href="/hr" className="hover:text-[#A06126]">HR</Link>
            <ChevronRightIcon size={12} />
            <span className="text-[#A06126]">Leave Record</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Records</h1>
              <p className="text-sm text-slate-500 mt-1">Manage, approve, and track employee leave requests.</p>
            </div>
            <button
              onClick={() => fetchLeaveData()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statsCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] transition"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]">
              <option value="all">All Types</option>
              {Object.entries(leaveTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]">
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 ml-auto md:ml-0">
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition ${viewMode === "table" ? "bg-white shadow-sm text-[#A06126]" : "text-slate-400 hover:text-slate-600"}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm text-[#A06126]" : "text-slate-400 hover:text-slate-600"}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Data Table / Grid Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.length > 0 ? filteredLeaves.map((leave) => {
                    const TypeIcon = leaveTypeIcons[leave.type] || Calendar;
                    const StatusIcon = statusIcons[leave.status] || Clock;
                    const isPending = leave.status === "pending";
                    return (
                      <tr key={leave._id} className="hover:bg-slate-50/80 transition group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold border border-[#A06126]/20">
                              {getInitials(getEmployeeName(leave.employeeId))}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{getEmployeeName(leave.employeeId)}</p>
                              <p className="text-[11px] text-slate-500">{getEmployeeEmail(leave.employeeId)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                            {leaveTypeLabels[leave.type] || leave.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-800">{leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColors[leave.status]}`}>
                            <StatusIcon className="w-3 h-3" /> {leave.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isPending && (
                              <>
                                <button onClick={() => { setSelectedLeave(leave); setStatusAction("approved"); setShowStatusModal(true); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="Approve"><Check className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedLeave(leave); setStatusAction("rejected"); setShowStatusModal(true); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition" title="Reject"><X className="w-4 h-4" /></button>
                              </>
                            )}
                            {isHR && (
                              <button onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }} className="p-1.5 text-slate-400 hover:text-[#A06126] hover:bg-[#A06126]/10 rounded-md transition" title="View"><Eye className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
              {filteredLeaves.length > 0 ? filteredLeaves.map((leave) => {
                const TypeIcon = leaveTypeIcons[leave.type] || Calendar;
                return (
                  <div key={leave._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold border border-[#A06126]/20">
                            {getInitials(getEmployeeName(leave.employeeId))}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{getEmployeeName(leave.employeeId)}</p>
                            <p className="text-[10px] text-slate-500">{getDepartmentName(leave.employeeId)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${statusColors[leave.status]}`}>{leave.status}</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"><TypeIcon className="w-3.5 h-3.5 text-slate-500" /> {leaveTypeLabels[leave.type]}</p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-600"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.totalDays} days)</p>
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2 mt-3">"{leave.reason}"</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <button onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }} className="text-xs font-semibold text-slate-500 hover:text-[#A06126]">View Details</button>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-10 text-center text-slate-500">No records found.</div>
              )}
            </div>
          )}
          
          {/* Footer */}
          <div className="border-t border-slate-200 px-5 py-3.5 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900">{filteredLeaves.length}</strong> of <strong className="text-slate-900">{leaveRequests.length}</strong> records</span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. View Details */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Leave Request Details</h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">REF: #{selectedLeave._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-lg font-bold border border-[#A06126]/20">
                  {getInitials(getEmployeeName(selectedLeave.employeeId))}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{getEmployeeName(selectedLeave.employeeId)}</h3>
                  <p className="text-xs text-slate-500">{getEmployeeEmail(selectedLeave.employeeId)} • ID: {getEmployeeId(selectedLeave.employeeId)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Leave Type</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{leaveTypeLabels[selectedLeave.type]}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Duration</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{selectedLeave.totalDays} Days</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Start Date</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">End Date</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(selectedLeave.endDate)}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reason</p>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedLeave.reason || "No reason provided."}</p>
              </div>
              {selectedLeave.rejectionReason && (
                <div>
                  <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-100">{selectedLeave.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100">Close</button>
              {selectedLeave.status === "pending" && (
                <button onClick={() => { setShowViewModal(false); setStatusAction("approved"); setShowStatusModal(true); }} className="px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white rounded-lg text-xs font-semibold shadow-sm">Take Action</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Status Modal */}
      {showStatusModal && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{statusAction === "approved" ? "Approve Request" : "Reject Request"}</h2>
            <p className="text-xs text-slate-500 mb-5">Are you sure you want to {statusAction} this leave request?</p>
            {statusAction === "rejected" && (
              <div className="mb-5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Rejection Reason</label>
                <textarea rows={3} placeholder="Why is this rejected?" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-[#A06126] focus:ring-1 focus:ring-[#A06126] bg-slate-50" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleUpdateStatus(selectedLeave._id, statusAction)} disabled={submittingAction} className={`flex-1 px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 ${statusAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Modal */}
      {showDeleteConfirm && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Delete Leave Record?</h2>
            <p className="text-xs text-slate-500 mb-6">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={submittingAction} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-rose-700">
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}