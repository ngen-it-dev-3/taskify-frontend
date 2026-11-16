// app/hr/leaves/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Loader2,
  UserCheck,
  FileText,
  Check,
  X,
  MessageSquare,
  Ban,
  UserPlus,
  UsersRound,
  Filter as FilterIcon,
  CalendarDays,
  Home,
  ChevronRight as ChevronRightIcon,
  Star,
  Clock8,
  CalendarClock,
  Heart,
  Baby,
  Sun,
  CloudRain,
  Trash2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
    departmentId?:
    | {
      _id: string;
      name: string;
      code: string;
    }
    | string;
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
  approvedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isHalfDay: boolean;
  rejectionReason?: string;
}

type ViewMode = "grid" | "table";
type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  casual: "Casual Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  bereavement: "Bereavement Leave",
  unpaid: "Unpaid Leave",
  earned: "Earned Leave",
  other: "Other Leave",
};

const leaveTypeIcons: Record<string, any> = {
  annual: CalendarDays,
  sick: Heart,
  casual: Sun,
  maternity: Baby,
  paternity: Baby,
  bereavement: CloudRain,
  unpaid: Clock8,
  earned: Star,
  other: CalendarClock,
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: Ban,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveRecordPage() {
  const { user, isAuthenticated } = useAuth();

  // State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table"); // ⭐ Default is Table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<
    "all" | "this-month" | "last-month" | "this-quarter"
  >("all");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [statusAction, setStatusAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");

  const [isHR, setIsHR] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user) {
      const hrRoles = ["super_admin", "admin", "hr_manager"];
      setIsHR(hrRoles.includes(user.role));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
    }
  }, [isAuthenticated]);

  const fetchLeaveData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      const leavesResponse = await api.get("/leaves/all");
      let data: LeaveRequest[] = [];

      if (leavesResponse.data.success) {
        data = leavesResponse.data.data || [];
        setLeaveRequests(data);

        const pendingCount = data.filter((l: LeaveRequest) => l.status === "pending").length;
        badgeService.setBadge("pendingLeaves", pendingCount);
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.response?.data?.message || "Failed to load leave data");
      }
      setLeaveRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleUpdateStatus = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      const payload: any = { status };
      if (status === "rejected" && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }

      const response = await api.patch(`/leaves/${leaveId}/status`, payload);
      if (response.data.success) {
        toast.success(`Leave ${status} successfully!`);
        setShowStatusModal(false);
        setSelectedLeave(null);
        setRejectionReason("");
        await fetchLeaveData();
        badgeService.decrementBadge("pendingLeaves");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update leave status");
    }
  };

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;

    try {
      const response = await api.delete(`/leaves/${selectedLeave._id}`);
      if (response.data.success) {
        toast.success("Leave request deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedLeave(null);
        await fetchLeaveData();
        if (selectedLeave.status === "pending") {
          badgeService.decrementBadge("pendingLeaves");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete leave");
    }
  };

  const handleBulkStatusUpdate = async (status: "approved" | "rejected") => {
    if (selectedLeaves.length === 0) {
      toast.error("Please select at least one leave request");
      return;
    }

    try {
      const promises = selectedLeaves.map((id) =>
        api.patch(`/leaves/${id}/status`, { status })
      );
      await Promise.all(promises);

      toast.success(`${selectedLeaves.length} leave requests ${status}!`);
      setSelectedLeaves([]);
      setShowBulkAction(false);
      await fetchLeaveData();
      badgeService.decrementBadge("pendingLeaves", selectedLeaves.length);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update leaves");
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const toggleSelectLeave = (leaveId: string) => {
    setSelectedLeaves((prev) =>
      prev.includes(leaveId) ? prev.filter((id) => id !== leaveId) : [...prev, leaveId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeaves.length === filteredLeaves.length) {
      setSelectedLeaves([]);
    } else {
      setSelectedLeaves(filteredLeaves.map((l) => l._id));
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEmployeeName = (employee: any): string => {
    if (!employee) return "Unknown";
    if (typeof employee === "object" && employee.fullName) return employee.fullName;
    return "Unknown";
  };

  const getEmployeeEmail = (employee: any): string => {
    if (!employee) return "";
    if (typeof employee === "object" && employee.email) return employee.email;
    return "";
  };

  const getEmployeeId = (employee: any): string => {
    if (!employee) return "N/A";
    if (typeof employee === "object" && employee.employeeId) return employee.employeeId;
    return "N/A";
  };

  const getDepartmentName = (employee: any): string => {
    if (!employee || typeof employee !== "object") return "";
    if (employee.departmentId && typeof employee.departmentId === "object") {
      return employee.departmentId.name || "";
    }
    return "";
  };

  const getStatusColor = (status: string) => statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  const getStatusIcon = (status: string) => statusIcons[status] || Clock;
  const getLeaveTypeIcon = (type: string) => leaveTypeIcons[type] || Calendar;
  const getLeaveTypeLabel = (type: string) => leaveTypeLabels[type] || type;

  // ============================================================================
  // FILTERING & STATS
  // ============================================================================

  const filteredLeaves = useMemo(() => {
    let filtered = [...leaveRequests];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((leave) => {
        const employeeName = getEmployeeName(leave.employeeId).toLowerCase();
        const reason = leave.reason?.toLowerCase() || "";
        const leaveType = leave.type?.toLowerCase() || "";
        const employeeEmail = getEmployeeEmail(leave.employeeId).toLowerCase();

        return (
          employeeName.includes(search) ||
          reason.includes(search) ||
          leaveType.includes(search) ||
          employeeEmail.includes(search)
        );
      });
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((leave) => leave.type === filterType);
    }

    if (filterDateRange !== "all") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

      filtered = filtered.filter((leave) => {
        const leaveDate = new Date(leave.createdAt);
        if (filterDateRange === "this-month") return leaveDate >= startOfMonth;
        if (filterDateRange === "last-month") return leaveDate >= startOfLastMonth && leaveDate <= endOfLastMonth;
        if (filterDateRange === "this-quarter") return leaveDate >= startOfQuarter;
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaveRequests, searchTerm, filterStatus, filterType, filterDateRange]);

  const statsCards = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((l) => l.status === "pending").length;
    const approved = leaveRequests.filter((l) => l.status === "approved").length;
    const rejected = leaveRequests.filter((l) => l.status === "rejected").length;
    const cancelled = leaveRequests.filter((l) => l.status === "cancelled").length;

    return [
      { label: "Total Requests", value: total, icon: FileText, color: "text-gray-700", bg: "bg-gray-50" },
      { label: "Pending", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Approved", value: approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Rejected", value: rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
      { label: "Cancelled", value: cancelled, icon: Ban, color: "text-gray-600", bg: "bg-gray-50" },
    ];
  }, [leaveRequests]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#faf8f4]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A06126] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading leave records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">
          <Link href="/dashboard" className="hover:text-[#A06126] transition">Dashboard</Link>
          <ChevronRightIcon size={12} className="text-gray-300" />
          <Link href="/hr" className="hover:text-[#A06126] transition">HR</Link>
          <ChevronRightIcon size={12} className="text-gray-300" />
          <span className="text-[#A06126]">Leave Record</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-3">
              Leave Record
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and approve all employee leave requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedLeaves.length > 0 && (
              <button
                onClick={() => setShowBulkAction(true)}
                className="cursor-pointer px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white rounded-md transition-all text-xs font-semibold shadow-sm flex items-center gap-2"
              >
                <UsersRound className="w-4 h-4" />
                Bulk Action ({selectedLeaves.length})
              </button>
            )}
            <button
              onClick={() => fetchLeaveData()}
              disabled={refreshing}
              className="cursor-pointer px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-all text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards (Classic Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {statsCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-md border border-gray-200 shadow-sm p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-serif font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-t-md border border-gray-200 p-4 border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, reason, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-black w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126] bg-gray-50 hover:bg-white transition-colors text-sm outline-none"
            />
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)}
              className="text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#A06126] bg-gray-50 text-sm outline-none"
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
              className="text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#A06126] bg-gray-50 text-sm outline-none"
            >
              <option value="all">All Types</option>
              {Object.entries(leaveTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1 bg-white shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-[#A06126]/10 text-[#A06126]" : "text-gray-400 hover:bg-gray-100"}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[#A06126]/10 text-[#A06126]" : "text-gray-400 hover:bg-gray-100"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-md border border-gray-200 shadow-sm overflow-hidden">

          {viewMode === "table" ? (
            /* ================= TABLE VIEW ================= */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeaves.length === filteredLeaves.length && filteredLeaves.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[#A06126] focus:ring-[#A06126]"
                      />
                    </th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => {
                      const TypeIcon = getLeaveTypeIcon(leave.type);
                      const StatusIcon = getStatusIcon(leave.status);
                      const statusColor = getStatusColor(leave.status);
                      const isPending = leave.status === "pending";
                      const employeeName = getEmployeeName(leave.employeeId);
                      const employeeEmail = getEmployeeEmail(leave.employeeId);

                      return (
                        <tr key={leave._id} className="hover:bg-[#A06126]/5 transition-colors group">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLeaves.includes(leave._id)}
                              onChange={() => toggleSelectLeave(leave._id)}
                              className="rounded border-gray-300 text-[#A06126] focus:ring-[#A06126]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold shrink-0 border border-[#A06126]/20">
                                {getInitials(employeeName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{employeeName}</p>
                                <p className="text-[11px] text-gray-500">{employeeEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200">
                              <TypeIcon className="w-3 h-3 text-gray-500" />
                              {getLeaveTypeLabel(leave.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {leave.totalDays || 0} days
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${statusColor}`}>
                              <StatusIcon className="w-3 h-3" />
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {formatDate(leave.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => { setSelectedLeave(leave); setStatusAction("approved"); setShowStatusModal(true); }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="Approve"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setSelectedLeave(leave); setStatusAction("rejected"); setShowStatusModal(true); }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* ⭐ DELETE BUTTON (Only for HR/Admin) */}
                              {isHR && (
                                <button
                                  onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }}
                                className="p-1.5 text-gray-400 hover:text-[#A06126] hover:bg-[#A06126]/10 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">No leave records found matching your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ================= GRID VIEW ================= */
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => {
                  const TypeIcon = getLeaveTypeIcon(leave.type);
                  const StatusIcon = getStatusIcon(leave.status);
                  const statusColor = getStatusColor(leave.status);
                  const isPending = leave.status === "pending";

                  return (
                    <div key={leave._id} className="bg-white rounded-md border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(getEmployeeName(leave.employeeId))}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{getEmployeeName(leave.employeeId)}</p>
                              <p className="text-[10px] text-gray-500">{getEmployeeId(leave.employeeId)}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${statusColor}`}>
                            {leave.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                            <TypeIcon className="w-3.5 h-3.5 text-gray-400" />
                            {getLeaveTypeLabel(leave.type)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.totalDays} days)
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-2">{leave.reason}</p>
                          {leave.rejectionReason && (
                            <p className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 mt-2">
                              Rejection: {leave.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => { setSelectedLeave(leave); setStatusAction("approved"); setShowStatusModal(true); }}
                                className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setSelectedLeave(leave); setStatusAction("rejected"); setShowStatusModal(true); }}
                                className="px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {isHR && (
                            <button
                              onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }}
                            className="p-1 text-gray-400 hover:text-[#A06126] rounded"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No leave records found matching your filters.</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
            <div>
              Showing <span className="font-semibold text-gray-900">{filteredLeaves.length}</span> of <span className="font-semibold text-gray-900">{leaveRequests.length}</span> requests
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> pending</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> approved</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLeave && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg border border-gray-200 max-w-sm w-full shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-100 rounded-md text-rose-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Delete Record
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to permanently delete the leave request for <strong>{getEmployeeName(selectedLeave.employeeId)}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteLeave}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-semibold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setSelectedLeave(null); }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Modal (Approve/Reject) */}
      {showStatusModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-md ${statusAction === "approved" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {statusAction === "approved" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {statusAction === "approved" ? "Approve" : "Reject"} Request
                </h2>
              </div>

              <div className="bg-gray-50 rounded-md p-3 mb-4 border border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {getEmployeeName(selectedLeave.employeeId)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getLeaveTypeLabel(selectedLeave.type)} ({formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)})
                </p>
              </div>

              {statusAction === "rejected" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#A06126] bg-gray-50 text-sm resize-none outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleUpdateStatus(selectedLeave._id, statusAction)}
                  className={`flex-1 px-4 py-2 text-white rounded-md transition-colors text-sm font-semibold ${statusAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setShowStatusModal(false); setSelectedLeave(null); setRejectionReason(""); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Leave Details Modal */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Leave Request Details</h2>
                  <p className="text-xs text-gray-500 mt-1">Ref: #{selectedLeave._id.slice(-6).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedLeave(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-md border border-gray-100 p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-lg font-bold shrink-0 border border-[#A06126]/20">
                  {getInitials(getEmployeeName(selectedLeave.employeeId))}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getEmployeeName(selectedLeave.employeeId)}</h3>
                  <p className="text-xs text-gray-500">{getEmployeeEmail(selectedLeave.employeeId)} • {getEmployeeId(selectedLeave.employeeId)}</p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-md p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Leave Type</p>
                  <p className="text-sm font-semibold text-gray-800">{getLeaveTypeLabel(selectedLeave.type)}</p>
                </div>
                <div className="border border-gray-200 rounded-md p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedLeave.totalDays || 0} Days</p>
                </div>
                <div className="border border-gray-200 rounded-md p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div className="border border-gray-200 rounded-md p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedLeave.endDate)}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-3 mb-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Reason</p>
                <p className="text-sm text-gray-800">{selectedLeave.reason || "No reason provided."}</p>
              </div>

              {selectedLeave.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-6">
                  <p className="text-[10px] text-rose-700 uppercase tracking-wider font-semibold mb-1">Rejection Reason</p>
                  <p className="text-sm text-rose-800">{selectedLeave.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 pt-4 border-t border-gray-100">
                <span>Created: {formatDateTime(selectedLeave.createdAt)}</span>
                <span>Updated: {formatDateTime(selectedLeave.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-sm w-full shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Bulk Action</h2>
            <p className="text-sm text-gray-600 mb-6">
              You have selected <strong>{selectedLeaves.length}</strong> requests. What would you like to do?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleBulkStatusUpdate("approved")}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Approve All
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("rejected")}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Reject All
              </button>
              <button
                onClick={() => { setSelectedLeaves([]); setShowBulkAction(false); }}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}