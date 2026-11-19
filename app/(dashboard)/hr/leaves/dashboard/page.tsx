"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Eye,
  Loader2,
  Trash2,
  Ban,
  Home,
  ChevronRight as ChevronRightIcon,
  Star,
  Heart,
  Sun,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LeaveEligibilityModal from "@/components/HR/LeaveEligibilityModal";
import {
  LeaveDetailModal,
  DeleteLeaveModal,
} from "@/components/HR/LeaveDetailModal";

// Recharts Imports
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

interface LeaveRequest {
  _id: string;
  type: "sick" | "casual" | "earned";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  employee?: { _id: string; fullName: string; email: string; department?: any }; // Handle populated data
  department?: string;
}

interface EmployeeLeaveSummary {
  key: string;
  name: string;
  email: string;
  department: string;
  sickUsed: number;
  casualUsed: number;
  earnedUsed: number;
  totalUsed: number;
  pendingDays: number;
  totalAllowed: number;
  remaining: number;
}

type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

const MAX_LEAVE_BALANCES: Record<string, number> = {
  sick: 10,
  casual: 8,
  earned: 6,
};

const TOTAL_ANNUAL_QUOTA = Object.values(MAX_LEAVE_BALANCES).reduce(
  (a, b) => a + b,
  0
);

const leaveTypeLabels: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
};

const leaveTypeColors: Record<string, string> = {
  sick: "bg-rose-50 text-rose-700 border-rose-200/80",
  casual: "bg-sky-50 text-sky-700 border-sky-200/80",
  earned: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
};

const leaveTypeIcons: Record<string, any> = {
  sick: Heart,
  casual: Sun,
  earned: Star,
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/90",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/90",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200/90",
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

const COLORS = {
  sick: "#f43f5e",
  casual: "#0ea5e9",
  earned: "#059669",
};

export default function LeaveManagementDashboardPage() {
  const { user, isAuthenticated } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedEmployeeKey, setSelectedEmployeeKey] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [detailLeave, setDetailLeave] = useState<LeaveRequest | null>(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      let requests: LeaveRequest[] = [];
      try {
        const allRes = await api.get("/leaves");
        if (allRes.data?.success) {
          requests = allRes.data.data || [];
        }
      } catch {
        const myRes = await api.get("/leaves/my-leaves");
        if (myRes.data?.success) {
          requests = myRes.data.data || [];
        }
      }
      setLeaveRequests(requests);

      try {
        const userRes = await api.get("/auth/users");
        if (userRes.data?.success) {
          setAllEmployees(userRes.data.data || []);
        }
      } catch (err) {
        console.warn("Could not fetch total employees list", err);
      }

    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------------- Helpers ---------------- */
  const getLeaveTypeLabel = (t: string) => leaveTypeLabels[t] || t;
  const getStatusLabel = (s: string) => statusLabels[s] || s;
  const getStatusColor = (s: string) => statusColors[s] || "bg-slate-100 text-slate-700 border-slate-200";
  const getStatusIcon = (s: string) => statusIcons[s] || Clock;
  const getLeaveTypeColor = (t: string) => leaveTypeColors[t] || "bg-slate-100 text-slate-700 border-slate-200";
  const getLeaveTypeIcon = (t: string) => leaveTypeIcons[t] || Calendar;

  const formatDate = (d: string) =>
    !d ? "N/A" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const getInitials = (n: string) =>
    !n ? "?" : n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;
    try {
      const res = await api.delete(`/leaves/${selectedLeave._id}`);
      if (res.data.success) {
        toast.success("Leave request deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedLeave(null);
        fetchDashboardData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete leave");
    }
  };

  /* ---------------- Employee-wise Analytics (ROBUST FIX) ---------------- */
  const employeeSummaries = useMemo<EmployeeLeaveSummary[]>(() => {
    const map = new Map<string, EmployeeLeaveSummary>();
    const normalize = (str: string) => (str || "").trim().toLowerCase();

    // ১. প্রথমে লিভ রিকোয়ার্ডগুলো প্রসেস করি (এটাই মূল ডেটা)
    leaveRequests.forEach((req) => {
      const rawEmpId = req.employeeId || req.employee?._id;

      // 👇 Populated Object বা String থেকে সঠিক ID বের করা
      const empIdStr = typeof rawEmpId === 'object' && rawEmpId !== null
        ? String((rawEmpId as any)._id)
        : String(rawEmpId || "");

      const empEmail = req.employeeEmail || req.employee?.email || "";
      const empName = req.employeeName || req.employee?.fullName || "Unknown Employee";

      // যেকোনো একটি ইউনিক আইডেন্টিফায়ার খুঁজি
      const empKey = empIdStr || empEmail || empName;

      if (!empKey || empKey === "undefined" || empKey === "unknown") return;

      // যদি এই এমপ্লয়ি আগে থেকে ম্যাপে না থাকে, তবে নতুন এড করি
      if (!map.has(empKey)) {
        map.set(empKey, {
          key: empKey,
          name: empName,
          email: empEmail || "N/A",
          department: req.department || (req as any).departmentId?.name || "General",
          sickUsed: 0, casualUsed: 0, earnedUsed: 0, totalUsed: 0, pendingDays: 0,
          totalAllowed: TOTAL_ANNUAL_QUOTA, remaining: TOTAL_ANNUAL_QUOTA,
        });
      }

      const entry = map.get(empKey)!;
      const days = req.totalDays || 0;

      // লিভ টাইপ অনুযায়ী ডেটা যোগ করি (শুধু Approved হলে)
      if (req.status === "approved") {
        if (req.type === "sick") entry.sickUsed += days;
        if (req.type === "casual") entry.casualUsed += days;
        if (req.type === "earned") entry.earnedUsed += days;
        entry.totalUsed += days;
      }
      // পেন্ডিং লিভ আলাদা করে রাখি
      else if (req.status === "pending") {
        entry.pendingDays += days;
      }

      entry.remaining = Math.max(0, entry.totalAllowed - entry.totalUsed);
    });

    // ২. এবার allEmployees লিস্ট চেক করি। যাদের কোনো লিভ নেই, তাদের 0 দিয়ে ম্যাপে অ্যাড করি
    allEmployees.forEach((emp) => {
      const empId = String(emp._id);
      const empEmail = emp.email || "";
      const empName = emp.fullName || emp.name || "Unknown Employee";

      // চেক করি এই এমপ্লয়ি ইতিমধ্যে লিভ ডেটা থেকে ম্যাপে অ্যাড হয়েছে কিনা
      let exists = map.has(empId) || map.has(empEmail) || map.has(empName);

      if (!exists) {
        for (const [mKey, mVal] of map.entries()) {
          if (
            (normalize(mKey) === normalize(empId)) ||
            (normalize(mVal.email) === normalize(empEmail)) ||
            (normalize(mVal.name) === normalize(empName))
          ) {
            exists = true;
            break;
          }
        }
      }

      // যদি লিভ ডেটাতে না থাকে, তবে 0 ডিফল্ট দিয়ে অ্যাড করি
      if (!exists) {
        map.set(empId, {
          key: empId,
          name: empName,
          email: empEmail || "N/A",
          department: emp.department?.name || emp.department || "General",
          sickUsed: 0, casualUsed: 0, earnedUsed: 0, totalUsed: 0, pendingDays: 0,
          totalAllowed: TOTAL_ANNUAL_QUOTA, remaining: TOTAL_ANNUAL_QUOTA,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalUsed - a.totalUsed);
  }, [leaveRequests, allEmployees]);

  /* ---------------- Overall Analytics ---------------- */
  const analytics = useMemo(() => {
    const approvedLeaves = leaveRequests.filter((l) => l.status === "approved");
    const totalApprovedDays = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const totalPendingDays = leaveRequests.filter((l) => l.status === "pending").reduce((sum, l) => sum + (l.totalDays || 0), 0);

    const sickDays = approvedLeaves.filter((l) => l.type === "sick").reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const casualDays = approvedLeaves.filter((l) => l.type === "casual").reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const earnedDays = approvedLeaves.filter((l) => l.type === "earned").reduce((sum, l) => sum + (l.totalDays || 0), 0);

    const totalEmployeeCount = allEmployees.length > 0 ? allEmployees.length : employeeSummaries.length;

    return {
      totalRequests: leaveRequests.length,
      pendingCount: leaveRequests.filter((l) => l.status === "pending").length,
      approvedCount: approvedLeaves.length,
      rejectedCount: leaveRequests.filter((l) => l.status === "rejected").length,
      totalApprovedDays,
      totalPendingDays,
      sickDays,
      casualDays,
      earnedDays,
      totalEmployeeCount,
    };
  }, [leaveRequests, employeeSummaries, allEmployees]);

  const pieChartData = [
    { name: "Sick Leave", value: analytics.sickDays, color: COLORS.sick },
    { name: "Casual Leave", value: analytics.casualDays, color: COLORS.casual },
    { name: "Earned Leave", value: analytics.earnedDays, color: COLORS.earned },
  ].filter(item => item.value > 0);

  const barChartData = employeeSummaries.slice(0, 5).map(emp => ({
    name: emp.name.split(' ')[0],
    Sick: emp.sickUsed,
    Casual: emp.casualUsed,
    Earned: emp.earnedUsed,
  }));

  /* ---------------- Filtered Requests ---------------- */
  const filteredLeaves = useMemo(() => {
    let f = [...leaveRequests];

    if (selectedEmployeeKey !== "all") {
      f = f.filter((l) => {
        const empKey = l.employeeId || l.employee?._id || l.employeeEmail || l.employee?.email || l.employeeName || l.employee?.fullName;
        return empKey === selectedEmployeeKey;
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      f = f.filter(
        (l) => l.reason?.toLowerCase().includes(s) ||
          l.type?.toLowerCase().includes(s) ||
          (l.employeeName || l.employee?.fullName)?.toLowerCase().includes(s) ||
          (l.employeeEmail || l.employee?.email)?.toLowerCase().includes(s)
      );
    }

    if (filterStatus !== "all") f = f.filter((l) => l.status === filterStatus);
    if (filterType !== "all") f = f.filter((l) => l.type === filterType);

    return f.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaveRequests, selectedEmployeeKey, searchTerm, filterStatus, filterType]); // ✅ user ডিপেন্ডেন্সি সরানো হয়েছে

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] bg-[#FAF9F6]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-700 mb-4" />
        <p className="text-sm font-medium text-stone-600 animate-pulse">Aggregating leave analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-stone-500">
          <Link href="/dashboard" className="hover:text-stone-900 transition-colors flex items-center gap-1.5 font-medium">
            <Home size={13} className="text-stone-400" /> Dashboard
          </Link>
          <ChevronRightIcon size={13} className="text-stone-300" />
          <Link href="/hr" className="hover:text-stone-900 transition-colors font-medium">HR & Admin</Link>
          <ChevronRightIcon size={13} className="text-stone-300" />
          <span className="text-stone-900 font-semibold">Leave Dashboard</span>
        </motion.div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">Leave Management</h1>
            <p className="text-sm text-stone-500 mt-1">Monitor leave consumption, team availability, and pending approvals.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowEligibilityModal(true)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
              <CalendarIcon className="w-4 h-4 text-stone-500" /> Eligibility
            </button>
            <button onClick={fetchDashboardData} className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Total Staff Tracked</span>
              <div className="p-1.5 bg-stone-100 rounded-lg"><Users className="w-4 h-4 text-stone-600" /></div>
            </div>
            <div className="z-10 mt-4">
              <p className="text-3xl font-bold text-stone-900">{analytics.totalEmployeeCount}</p>
              <p className="text-xs text-stone-500 mt-1">Across all departments</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Pending Requests</span>
              <div className="p-1.5 bg-amber-50 rounded-lg"><Clock className="w-4 h-4 text-amber-600" /></div>
            </div>
            <div className="z-10 mt-4">
              <p className="text-3xl font-bold text-stone-900">{analytics.pendingCount}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">{analytics.totalPendingDays} total days requested</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Approved Leaves</span>
              <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            </div>
            <div className="z-10 mt-4">
              <p className="text-3xl font-bold text-stone-900">{analytics.totalApprovedDays}</p>
              <p className="text-xs text-stone-500 mt-1">Total days taken this year</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0fdf4] rounded-bl-full -z-0 opacity-80 pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Total Employees</span>
              <div className="p-2 bg-[#dcfce7] rounded-xl shadow-sm">
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-3xl font-bold text-emerald-700">{analytics.totalEmployeeCount}</p>
              <p className="text-xs text-stone-500 mt-1">Active employees in system</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm lg:col-span-1">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Leave Type Distribution
            </h3>
            <div className="h-[250px] w-full relative">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => {
                        const raw = Array.isArray(value) ? value[0] : value;
                        const displayValue = raw ?? 0;
                        return [`${displayValue} Days`, 'Taken'];
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e7e5e4',
                        fontSize: '12px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-sm">No approved leaves yet</div>
              )}
              {pieChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-2xl font-bold text-stone-900">{analytics.totalApprovedDays}</span>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold">Total Days</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Top Leave Consumers
              </h3>
              <span className="text-[10px] font-semibold bg-stone-100 text-stone-500 px-2 py-1 rounded-md">Top 5 Employees</span>
            </div>
            <div className="h-[250px] w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                    <RechartsTooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: '12px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Sick" stackId="a" fill={COLORS.sick} radius={[0, 0, 4, 4]} barSize={32} />
                    <Bar dataKey="Casual" stackId="a" fill={COLORS.casual} />
                    <Bar dataKey="Earned" stackId="a" fill={COLORS.earned} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-sm">Not enough data to display chart</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Employee Leave Summary Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-200/80 bg-[#FDFCFA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" /> Employee Leave Summary
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Click an employee row to filter their specific requests below</p>
            </div>
            {selectedEmployeeKey !== "all" && (
              <button onClick={() => setSelectedEmployeeKey("all")} className="text-xs font-semibold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer">
                Clear Selection
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200/80 text-[10px] font-bold text-stone-500 uppercase tracking-[0.08em] z-10">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Sick / Casual / Earned</th>
                  <th className="px-4 py-3.5">Taken (Off)</th>
                  <th className="px-4 py-3.5">Remaining</th>
                  <th className="px-6 py-3.5">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {employeeSummaries.length > 0 ? (
                  employeeSummaries.map((emp) => {
                    const isSelected = selectedEmployeeKey === emp.key;
                    const usagePct = Math.min(100, Math.round((emp.totalUsed / emp.totalAllowed) * 100));

                    return (
                      <tr key={emp.key} onClick={() => setSelectedEmployeeKey(isSelected ? "all" : emp.key)} className={`transition-colors cursor-pointer ${isSelected ? "bg-emerald-50/60" : "hover:bg-stone-50"}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900 text-sm">{emp.name}</p>
                              <p className="text-[11px] text-stone-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-stone-600 font-medium">
                          <span className="text-rose-600 font-bold">{emp.sickUsed}d</span> • <span className="text-sky-600 font-bold">{emp.casualUsed}d</span> • <span className="text-emerald-600 font-bold">{emp.earnedUsed}d</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-md">{emp.totalUsed}d off</span>
                          {emp.pendingDays > 0 && (
                            <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">+{emp.pendingDays}d pending</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">{emp.remaining}d left</span>
                        </td>
                        <td className="px-6 py-4 w-40">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${usagePct > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${usagePct}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-stone-500 w-8 text-right">{usagePct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400 text-sm">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                      No employee leave records available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* All Leave Requests Table / Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-stone-200/80 bg-[#FDFCFA] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Search employee, reason, or leave type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm bg-white transition-all outline-none text-stone-800 placeholder:text-stone-400" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)} className="px-3 py-2.5 border border-stone-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-stone-700 cursor-pointer">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 border border-stone-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-stone-700 cursor-pointer">
                <option value="all">All Types</option>
                {Object.entries(leaveTypeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <div className="flex items-center gap-1 border border-stone-200 rounded-xl p-1 bg-stone-50 shrink-0">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-emerald-700 shadow-sm border border-stone-200/70" : "text-stone-400 hover:text-stone-700"}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white text-emerald-700 shadow-sm border border-stone-200/70" : "text-stone-400 hover:text-stone-700"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {filteredLeaves.length > 0 ? (
              viewMode === "list" ? (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-stone-50/70 border-b border-stone-200/80 text-[10px] font-bold text-stone-500 uppercase tracking-[0.08em]">
                        <th className="px-6 py-3.5">Employee</th>
                        <th className="px-6 py-3.5">Leave Type</th>
                        <th className="px-6 py-3.5">Duration</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Created</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {filteredLeaves.map((leave) => {
                        const TypeIcon = getLeaveTypeIcon(leave.type);
                        const StatusIcon = getStatusIcon(leave.status);
                        const displayName = leave.employeeName || leave.employee?.fullName || "Unknown Employee";
                        const displayEmail = leave.employeeEmail || leave.employee?.email || "N/A";


                        return (
                          <tr key={leave._id} className="hover:bg-stone-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(displayName)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-stone-900">{displayName}</p>
                                  <p className="text-[11px] text-stone-400">{displayEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getLeaveTypeColor(leave.type)}`}>
                                <TypeIcon className="w-3 h-3" /> {getLeaveTypeLabel(leave.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
                                <CalendarIcon className="w-3.5 h-3.5 text-stone-400" /> {leave.totalDays || 0} days
                              </div>
                              <p className="text-[11px] text-stone-400 mt-0.5">{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(leave.status)}`}>
                                <StatusIcon className="w-3 h-3" /> {getStatusLabel(leave.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-stone-500">{formatDate(leave.createdAt)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {leave.status === "pending" && (
                                  <button onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete Request"><Trash2 className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => setDetailLeave(leave)} className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="View Details"><Eye className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-stone-50/50">
                  {filteredLeaves.map((leave) => {
                    const TypeIcon = getLeaveTypeIcon(leave.type);
                    const StatusIcon = getStatusIcon(leave.status);
                    const displayName = leave.employeeName || leave.employee?.fullName || "Employee";
                    return (
                      <div key={leave._id} className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3 group">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getLeaveTypeColor(leave.type)}`}><TypeIcon className="w-3 h-3" /> {getLeaveTypeLabel(leave.type)}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusColor(leave.status)}`}><StatusIcon className="w-3 h-3" /> {getStatusLabel(leave.status)}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{displayName}</p>
                          <p className="text-sm font-bold text-stone-900 mt-1">{leave.totalDays || 0} Days</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</p>
                          <p className="text-xs text-stone-600 mt-2 line-clamp-2 bg-stone-50 p-2 rounded-md border border-stone-100 italic">"{leave.reason || "No reason provided"}"</p>
                        </div>
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                          <span>Applied {formatDate(leave.createdAt)}</span>
                          <div className="flex items-center gap-1">
                            {leave.status === "pending" && (
                              <button onClick={() => { setSelectedLeave(leave); setShowDeleteConfirm(true); }} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => setDetailLeave(leave)} className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors" title="Details"><Eye className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-20 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-stone-200/70"><Search className="w-8 h-8 text-stone-300" /></div>
                <h3 className="text-base font-bold text-stone-900 mb-1">No leave requests found</h3>
                <p className="text-sm text-stone-500">Try adjusting your search or filter criteria.</p>
                <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterType("all"); setSelectedEmployeeKey("all"); }} className="mt-4 px-4 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors">Clear all filters</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t border-stone-200/80 px-6 py-3.5 bg-[#FDFCFA] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
            <div>
              Showing <span className="font-semibold text-stone-900">{filteredLeaves.length}</span> of <span className="font-semibold text-stone-900">{leaveRequests.length}</span> requests
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Pending</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Rejected</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <LeaveEligibilityModal isOpen={showEligibilityModal} onClose={() => setShowEligibilityModal(false)} />
      <LeaveDetailModal leave={detailLeave} onClose={() => setDetailLeave(null)} />
      <DeleteLeaveModal open={showDeleteConfirm} onCancel={() => { setShowDeleteConfirm(false); setSelectedLeave(null); }} onConfirm={handleDeleteLeave} />
    </div>
  );
}