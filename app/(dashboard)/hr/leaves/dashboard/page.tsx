// app/hr/leaves/my/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Eye,
  Loader2,
  FileText,
  Trash2,
  Ban,
  PieChart,
  Home,
  ChevronRight as ChevronRightIcon,
  Star,
  Heart,
  Sun,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LeaveEligibilityModal from "@/components/HR/LeaveEligibilityModal";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LeaveRequest {
  _id: string;
  type: "sick" | "casual" | "earned";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  employeeName?: string;
  employeeEmail?: string;
}

interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
  percentage: number;
}

type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

const leaveTypeLabels: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
};

const leaveTypeColors: Record<string, string> = {
  sick: "bg-rose-100 text-rose-700 border-rose-200",
  casual: "bg-emerald-100 text-emerald-700 border-emerald-200",
  earned: "bg-green-100 text-green-700 border-green-200",
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
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
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

// ⭐ ফিক্সড বেস ব্যালেন্স (আপনি যা চেয়েছেন)
const MAX_LEAVE_BALANCES: Record<string, number> = {
  sick: 10,
  casual: 8,
  earned: 6,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyLeavesPage() {
  const { user, isAuthenticated } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
    }
  }, [isAuthenticated]);

  // ============================================================================
  // ⭐ DATA FETCHING & BALANCE CALCULATION (FIXED)
  // ============================================================================

  const calculateBalances = (requests: LeaveRequest[]): LeaveBalance[] => {
    const leaveTypes = Object.keys(MAX_LEAVE_BALANCES);

    return leaveTypes.map((type) => {
      // ১. মোট ছুটি (সবসময় ফিক্সড ১০, ৮, ৬ থাকবে)
      const totalAllowed = MAX_LEAVE_BALANCES[type];

      // ২. ব্যবহৃত ছুটি (Approved)
      const used = requests
        .filter((r) => r.type === type && r.status === "approved")
        .reduce((sum, r) => sum + (r.totalDays || 0), 0);

      // ৩. পেন্ডিং ছুটি
      const pending = requests
        .filter((r) => r.type === type && r.status === "pending")
        .reduce((sum, r) => sum + (r.totalDays || 0), 0);

      // ৪. অবশিষ্ট ছুটি (Total - Used)
      const remaining = Math.max(0, totalAllowed - used);

      // ৫. শতাংশ (প্রোগ্রেস বারের জন্য)
      const percentage = totalAllowed > 0 ? (used / totalAllowed) * 100 : 0;

      return {
        leaveType: type,
        total: totalAllowed,
        used: used,
        pending: pending,
        remaining: remaining,
        percentage: percentage,
      };
    });
  };

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const leavesResponse = await api.get("/leaves/my-leaves");
      let requests: LeaveRequest[] = [];

      if (leavesResponse.data.success) {
        requests = leavesResponse.data.data || [];
        setLeaveRequests(requests);
      }

      const calculatedBalances = calculateBalances(requests);
      setLeaveBalances(calculatedBalances);

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load leave data");
      setLeaveRequests([]);
      setLeaveBalances(calculateBalances([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getRemainingBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.remaining || 0;
  };

  const getDefaultBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.total || MAX_LEAVE_BALANCES[leaveType] || 0;
  };

  const getUsedBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.used || 0;
  };

  const getLeaveTypeLabel = (type: string) => leaveTypeLabels[type] || type;
  const getStatusLabel = (status: string) => statusLabels[status] || status;
  const getStatusColor = (status: string) => statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  const getStatusIcon = (status: string) => statusIcons[status] || Clock;
  const getLeaveTypeColor = (type: string) => leaveTypeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  const getLeaveTypeIcon = (type: string) => leaveTypeIcons[type] || Calendar;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;
    try {
      const response = await api.delete(`/leaves/${selectedLeave._id}`);
      if (response.data.success) {
        toast.success("Leave request deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedLeave(null);
        fetchLeaveData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete leave");
    }
  };

  // ============================================================================
  // MEMOIZED DATA
  // ============================================================================

  const filteredLeaves = useMemo(() => {
    let filtered = [...leaveRequests];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((leave) =>
        leave.reason?.toLowerCase().includes(search) ||
        leave.type?.toLowerCase().includes(search) ||
        leave.employeeName?.toLowerCase().includes(search)
      );
    }
    if (filterStatus !== "all") filtered = filtered.filter((leave) => leave.status === filterStatus);
    if (filterType !== "all") filtered = filtered.filter((leave) => leave.type === filterType);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaveRequests, searchTerm, filterStatus, filterType]);

  const stats = useMemo(() => {
    return {
      total: leaveRequests.length,
      pending: leaveRequests.filter((l) => l.status === "pending").length,
      approved: leaveRequests.filter((l) => l.status === "approved").length,
      rejected: leaveRequests.filter((l) => l.status === "rejected").length,
      cancelled: leaveRequests.filter((l) => l.status === "cancelled").length,
    };
  }, [leaveRequests]);

  const balanceCards = useMemo(() => {
    if (!Array.isArray(leaveBalances) || leaveBalances.length === 0) {
      return calculateBalances(leaveRequests);
    }
    return leaveBalances;
  }, [leaveBalances, leaveRequests]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm mb-6 text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-900 transition flex items-center gap-1"><Home size={14} />Dashboard</Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <Link href="/hr" className="hover:text-gray-900 transition">HR</Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <span className="text-gray-900 font-medium">My Leaves</span>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" />
              My Leaves
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your leave requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchLeaveData()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2 shadow-sm">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wide">Total Requests</p></div>
              <div className="p-1.5 bg-gray-50 rounded-md"><FileText className="w-4 h-4 text-gray-500" /></div>
            </div>
          </div>
          <div className="bg-[#FFF9E6] rounded-xl p-4 border border-[#FDE68A] shadow-sm">
            <div className="flex justify-between items-start">
              <div><p className="text-2xl font-bold text-amber-700">{stats.pending}</p><p className="text-[10px] text-amber-600 font-medium mt-1 uppercase tracking-wide">Pending</p></div>
              <div className="p-1.5 bg-amber-100 rounded-md"><Clock className="w-4 h-4 text-amber-600" /></div>
            </div>
          </div>
          <div className="bg-[#ECFDF5] rounded-xl p-4 border border-[#A7F3D0] shadow-sm">
            <div className="flex justify-between items-start">
              <div><p className="text-2xl font-bold text-emerald-700">{stats.approved}</p><p className="text-[10px] text-emerald-600 font-medium mt-1 uppercase tracking-wide">Approved</p></div>
              <div className="p-1.5 bg-emerald-100 rounded-md"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-[#FEF2F2] rounded-xl p-4 border border-[#FECACA] shadow-sm">
            <div className="flex justify-between items-start">
              <div><p className="text-2xl font-bold text-rose-700">{stats.rejected}</p><p className="text-[10px] text-rose-600 font-medium mt-1 uppercase tracking-wide">Rejected</p></div>
              <div className="p-1.5 bg-rose-100 rounded-md"><XCircle className="w-4 h-4 text-rose-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div><p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p><p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wide">Cancelled</p></div>
              <div className="p-1.5 bg-gray-50 rounded-md"><Ban className="w-4 h-4 text-gray-500" /></div>
            </div>
          </div>
        </div>

        {/* LEAVE BALANCES */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-green-500" />
              Leave Balances (Accrued)
              <span className="text-xs font-normal text-gray-400 ml-2">
                (Sick: 1/36d, Casual: 1/45d, Earned: 1/60d)
              </span>
            </h3>
            <button
              onClick={() => setShowEligibilityModal(true)}
              className="text-xs font-semibold text-[#A06126] hover:bg-[#A06126]/10 px-3 py-1.5 rounded-md border border-[#A06126]/30 transition-colors flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              View Eligibility Schedule
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {balanceCards.map((balance) => {
              const Icon = getLeaveTypeIcon(balance.leaveType);
              const label = getLeaveTypeLabel(balance.leaveType);
              const isLow = balance.remaining < balance.total * 0.2;
              const isCritical = balance.remaining === 0 && balance.total > 0;

              return (
                <motion.div key={balance.leaveType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all relative">
                  {isCritical && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
                  {isLow && !isCritical && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-green-500"}`} />
                    <span className="text-[10px] font-medium text-gray-500 uppercase truncate">{label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-800"}`}>{balance.remaining}</span>
                    <span className="text-[10px] text-gray-400">/ {balance.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div className={`h-1 rounded-full transition-all ${isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-green-500"}`} style={{ width: balance.total > 0 ? `${Math.min(100, (balance.used / balance.total) * 100)}%` : "0%" }} />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[9px] text-gray-400"><span className="text-blue-500">Used:</span> {balance.used}</p>
                    {balance.pending > 0 && <p className="text-[9px] text-amber-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{balance.pending} pending</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="bg-white rounded-t-xl border border-gray-200 p-4 border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search leaves by name, reason, or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-colors outline-none text-gray-900" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none min-w-[120px] text-gray-700">
              <option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none min-w-[120px] text-gray-700">
              <option value="all">All Types</option>
              {Object.entries(leaveTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white shrink-0">
              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"><LayoutGrid className="w-4 h-4" /></button>
              <button className="p-1.5 text-green-600 bg-green-50 rounded transition-colors"><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-b-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center"><input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" /></th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => {
                    const TypeIcon = getLeaveTypeIcon(leave.type);
                    const typeColor = getLeaveTypeColor(leave.type);
                    const StatusIcon = getStatusIcon(leave.status);
                    const statusColor = getStatusColor(leave.status);
                    return (
                      <tr key={leave._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 text-center"><input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">{getInitials(leave.employeeName || user?.fullName || "U")}</div>
                            <div><p className="text-sm font-medium text-gray-900">{leave.employeeName || user?.fullName || "Unknown"}</p><p className="text-xs text-gray-500">{leave.employeeEmail || user?.email || "N/A"}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${typeColor}`}><TypeIcon className="w-3 h-3" />{getLeaveTypeLabel(leave.type)}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700"><CalendarIcon className="w-4 h-4 text-gray-400" />{leave.totalDays || 0} days</div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border ${statusColor}`}><StatusIcon className="w-3 h-3" />{getStatusLabel(leave.status)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(leave.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {leave.status === "pending" && (
                              <button onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete Request"><Trash2 className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => { }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Calendar className="w-8 h-8 text-gray-300" /></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No leave requests found</h3>
                        <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <div>Showing <span className="font-medium text-gray-900">{filteredLeaves.length}</span> of <span className="font-medium text-gray-900">{leaveRequests.length}</span> requests</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> pending</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> rejected</span>
            </div>
          </div>
        </div>

      </div>

      {/* ⭐ Leave Eligibility Modal */}
      <LeaveEligibilityModal
        isOpen={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
      />

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLeave && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4"><div className="p-2.5 bg-rose-100 rounded-xl text-rose-600"><Trash2 className="w-6 h-6" /></div><h2 className="text-xl font-bold text-gray-900">Delete Leave Request</h2></div>
                <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete this leave request? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={handleDeleteLeave} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium shadow-sm">Delete</button>
                  <button onClick={() => { setShowDeleteConfirm(false); setSelectedLeave(null); }} className="flex-1 text-gray-600 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}