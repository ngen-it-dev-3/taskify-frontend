// app/hr/leaves/month-wise/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
  User,
  Loader2,
  Home,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  X,
  FileText,
  UserCircle2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================
interface Employee {
  _id: string;
  fullName: string;
  email?: string;
  employeeId?: string;
}

interface LeaveRequest {
  _id: string;
  employeeId: any;
  employeeName?: string;
  employeeEmail?: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ANCHOR_SAT_OFF_STR = "2026-11-21";
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  maternity: "Maternity",
  paternity: "Paternity",
  bereavement: "Bereavement",
  unpaid: "Unpaid",
  earned: "Earned",
  other: "Other",
};

const toLocalDateStr = (dateInput: string | Date): string => {
  if (!dateInput) return "";
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const isAlternateSaturdayOff = (dateObj: Date): boolean => {
  if (dateObj.getDay() !== 6) return false;
  const [ay, am, ad] = ANCHOR_SAT_OFF_STR.split("-").map(Number);
  const anchorUtc = Date.UTC(ay, am - 1, ad);
  const currentUtc = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.round((currentUtc - anchorUtc) / MS_PER_DAY);
  return Math.abs(diffDays) % 14 === 0;
};

const extractEmpId = (emp: any): string => {
  if (!emp) return "";
  if (typeof emp === "string") return emp.trim();
  if (typeof emp === "object") return String(emp._id || emp.id || emp.userId || "").trim();
  return "";
};

// ============================================================================
// UI COMPONENTS
// ============================================================================
const StatusBadge = ({ status }: { status: string }) => {
  const s = (status || "").toLowerCase();
  const config: Record<string, { icon: any; className: string; label: string }> = {
    approved: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approved" },
    pending: { icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
    rejected: { icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200", label: "Rejected" },
    cancelled: { icon: AlertCircle, className: "bg-slate-100 text-slate-600 border-slate-200", label: "Cancelled" },
  };
  const { icon: Icon, className, label } = config[s] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MonthWiseLeavePage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<Employee[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allLeaveRecords, setAllLeaveRecords] = useState<LeaveRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal state
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    dateLabel: string;
    leaves: LeaveRequest[];
    isOffDay: boolean;
    isOpenSaturday: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await api.get("/leaves/substitutes");
        if (res.data.success) setUsers(res.data.data || []);
      } catch {
        // Fallback handled via employeeOptions
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const fetchAllLeaveData = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await api.get("/leaves/all");
      if (res.data.success) setAllLeaveRecords(res.data.data || []);
    } catch {
      toast.error("Failed to load leave records");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllLeaveData();
  }, [fetchAllLeaveData]);

  // Close modal on Escape
  useEffect(() => {
    if (!selectedDay) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedDay(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedDay]);

  const employeeOptions = useMemo(() => {
    const map = new Map<string, Employee>();
    if (user?._id) {
      map.set(String(user._id), {
        _id: String(user._id),
        fullName: user.fullName || "Current User",
        email: user.email,
        employeeId: (user as any).employeeId,
      });
    }
    users.forEach((u) => {
      if (u._id) map.set(String(u._id), u);
    });
    allLeaveRecords.forEach((leave) => {
      const id = extractEmpId(leave.employeeId);
      if (id && !map.has(id)) {
        const empObj = typeof leave.employeeId === "object" ? leave.employeeId : null;
        map.set(id, {
          _id: id,
          fullName: empObj?.fullName || leave.employeeName || "Unknown",
          email: empObj?.email || leave.employeeEmail,
          employeeId: empObj?.employeeId,
        });
      }
    });
    return Array.from(map.values());
  }, [users, user, allLeaveRecords]);

  useEffect(() => {
    if (!selectedEmployeeId && employeeOptions.length > 0) {
      if (user?._id && employeeOptions.some((e) => e._id === String(user._id))) {
        setSelectedEmployeeId(String(user._id));
      } else {
        setSelectedEmployeeId(employeeOptions[0]._id);
      }
    }
  }, [employeeOptions, selectedEmployeeId, user]);

  const filteredRecords = useMemo(() => {
    if (!selectedEmployeeId || allLeaveRecords.length === 0) return [];
    const monthStartStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthEndStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return allLeaveRecords.filter((leave) => {
      const leaveEmpId = extractEmpId(leave.employeeId);
      const isIdMatch = leaveEmpId === String(selectedEmployeeId).trim();
      const selectedEmp = employeeOptions.find((e) => e._id === selectedEmployeeId);
      const leaveEmail = (typeof leave.employeeId === "object" ? leave.employeeId?.email : "") || leave.employeeEmail || "";
      const isEmailMatch = selectedEmp?.email && leaveEmail && selectedEmp.email.toLowerCase() === leaveEmail.toLowerCase();

      if (!isIdMatch && !isEmailMatch) return false;

      const startStr = toLocalDateStr(leave.startDate);
      const endStr = toLocalDateStr(leave.endDate);
      return startStr && endStr && startStr <= monthEndStr && endStr >= monthStartStr;
    });
  }, [allLeaveRecords, selectedEmployeeId, selectedMonth, selectedYear, employeeOptions]);

  const calendarData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(selectedYear, selectedMonth, i);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

      const leavesOnThisDay = filteredRecords.filter((leave) => {
        const s = (leave.status || "").toLowerCase();
        if (s !== "approved" && s !== "pending") return false;
        const startStr = toLocalDateStr(leave.startDate);
        const endStr = toLocalDateStr(leave.endDate);
        return dateStr >= startStr && dateStr <= endStr;
      });

      const isSatOff = isAlternateSaturdayOff(currentDate);
      const isOpenSaturday = currentDate.getDay() === 6 && !isSatOff;

      days.push({
        date: i,
        dateStr,
        isOffDay: isSatOff,
        isOpenSaturday,
        leaves: leavesOnThisDay,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, filteredRecords]);

  const selectedEmployee = employeeOptions.find((u) => String(u._id) === String(selectedEmployeeId));
  const totalApprovedDays = filteredRecords
    .filter((l) => (l.status || "").toLowerCase() === "approved")
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);
  const totalPendingDays = filteredRecords
    .filter((l) => (l.status || "").toLowerCase() === "pending")
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  const openDayModal = (day: {
    dateStr: string;
    date: number;
    leaves: LeaveRequest[];
    isOffDay: boolean;
    isOpenSaturday: boolean;
  }) => {
    const d = new Date(day.dateStr);
    const dateLabel = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setSelectedDay({
      dateStr: day.dateStr,
      dateLabel,
      leaves: day.leaves,
      isOffDay: day.isOffDay,
      isOpenSaturday: day.isOpenSaturday,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-5 print:border-none print:pb-0">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 print:hidden">
              <Link href="/dashboard" className="hover:text-[#A06126] flex items-center gap-1 transition-colors">
                <Home className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <Link href="/hr" className="hover:text-[#A06126] transition-colors">HR</Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-[#A06126]">Month-wise Leaves</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Employee Leave Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Click any date to view leave details for that day.
            </p>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={fetchAllLeaveData}
              disabled={loadingData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white text-sm font-medium rounded-lg shadow-md shadow-[#A06126]/20 transition-all duration-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Filter & Summary Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:shadow-none print:border-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            {/* Employee Select */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Employee
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A06126] transition-colors" />
                {loadingUsers && employeeOptions.length === 0 ? (
                  <div className="pl-9 text-sm text-slate-400 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#A06126]" /> Loading employees...
                  </div>
                ) : (
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] transition-all cursor-pointer appearance-none"
                  >
                    {employeeOptions.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} {u.employeeId ? `(${u.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Month & Year Select */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Month & Year
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer hover:shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer text-center appearance-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <span className="text-slate-300">/</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer text-center appearance-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer hover:shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="md:col-span-3 grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl px-4 py-3 text-white shadow-lg shadow-emerald-500/20">
                <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  Approved
                </p>
                <p className="text-xl font-bold leading-tight mt-0.5">
                  {totalApprovedDays} <span className="text-xs font-normal text-white/80">Days</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl px-4 py-3 text-white shadow-lg shadow-amber-500/20">
                <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-xl font-bold leading-tight mt-0.5">
                  {totalPendingDays} <span className="text-xs font-normal text-white/80">Days</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedEmployee?.fullName || "Employee"}&apos;s Leave Sheet
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {MONTHS[selectedMonth]} {selectedYear}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-300" /> Approved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-300" /> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" /> Working
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" /> Sat Off
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#A06126]" />
                <span className="text-sm font-medium">Loading calendar data...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarData.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/50" />;

                    const hasLeave = day.leaves.length > 0;
                    const primaryLeave = day.leaves[0];
                    const isApproved = (primaryLeave?.status || "").toLowerCase() === "approved";

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => openDayModal(day)}
                        className={`relative h-20 sm:h-24 rounded-xl border p-2.5 flex flex-col justify-between text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer
                          ${
                            hasLeave && isApproved
                              ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50/90"
                              : hasLeave && !isApproved
                              ? "border-amber-200 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/90"
                              : day.isOffDay
                              ? "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                              : "border-slate-200 bg-white hover:border-[#A06126]/40 hover:bg-[#A06126]/5"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold ${
                              hasLeave ? "text-slate-900" : day.isOffDay ? "text-slate-400" : "text-slate-700"
                            }`}
                          >
                            {day.date}
                          </span>
                          {day.isOffDay && !hasLeave && (
                            <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                              Off
                            </span>
                          )}
                          {day.isOpenSaturday && !hasLeave && (
                            <span className="text-[9px] font-bold uppercase text-[#A06126] bg-[#A06126]/10 px-1.5 py-0.5 rounded">
                              Open
                            </span>
                          )}
                        </div>

                        {hasLeave && primaryLeave && (
                          <div className="flex flex-col gap-1">
                            <div
                              className={`text-[10px] font-bold px-2 py-1 rounded-md truncate border text-center
                                ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }
                              `}
                            >
                              {leaveTypeLabels[primaryLeave.type] || primaryLeave.type}
                            </div>
                            {day.leaves.length > 1 && (
                              <div className="text-[9px] text-center text-slate-500 font-medium">
                                +{day.leaves.length - 1} more
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {filteredRecords.length === 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                    No leaves recorded for {selectedEmployee?.fullName || "this employee"} in {MONTHS[selectedMonth]} {selectedYear}.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:block text-center text-[10px] text-slate-400 mt-4">
          Generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • Leave Management System
        </div>
      </div>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#A06126]/5 to-transparent flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#A06126] mb-1">
                    Leave Details
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedDay.dateLabel}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                {selectedDay.leaves.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="p-3 bg-slate-100 rounded-full mb-3">
                      {selectedDay.isOffDay ? (
                        <Calendar className="w-8 h-8 text-slate-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedDay.isOffDay
                        ? "Saturday Off"
                        : selectedDay.isOpenSaturday
                        ? "Open Saturday (Working Day)"
                        : "No Leaves"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {selectedDay.isOffDay
                        ? "This day is an alternate Saturday off."
                        : selectedDay.isOpenSaturday
                        ? "This is a working Saturday. No leave applications on this day."
                        : "No approved or pending leave applications on this day."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDay.leaves.map((leave) => (
                      <div
                        key={leave._id}
                        className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <UserCircle2 className="w-5 h-5 text-[#A06126]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {leaveTypeLabels[leave.type] || leave.type} Leave
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={leave.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">From</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {new Date(leave.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">To</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {new Date(leave.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {leave.reason && (
                          <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Reason</p>
                            <p className="text-xs text-slate-700 leading-relaxed">{leave.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}