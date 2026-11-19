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
  FileText,
  Calendar,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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

// Reference Saturday Off: 21 Nov 2026 is OFF, 28 Nov 2026 is OPEN (every 2nd Saturday)
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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
              View monthly leave records and alternate Saturday schedules.
            </p>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={fetchAllLeaveData}
              disabled={loadingData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white text-sm font-medium rounded-lg shadow-md shadow-[#A06126]/20 transition-all duration-200"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Filter & Summary Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
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
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] transition-all cursor-pointer"
                  >
                    {employeeOptions.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} {u.employeeId ? `(${u.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Month & Year Select */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Month & Year
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  onClick={handleNextMonth}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="md:col-span-3 bg-gradient-to-br from-[#A06126] to-[#88501E] rounded-xl px-4 py-3 flex items-center justify-between text-white shadow-lg shadow-[#A06126]/20">
              <div>
                <p className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                  Total Approved
                </p>
                <p className="text-2xl font-bold leading-tight mt-1">
                  {totalApprovedDays} <span className="text-base font-normal text-white/80">Days</span>
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar & Details Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
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
                      <div
                        key={day.dateStr}
                        className={`relative h-20 sm:h-24 rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md
                          ${
                            hasLeave && isApproved
                              ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/80"
                              : hasLeave && !isApproved
                              ? "border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/80"
                              : day.isOffDay
                              ? "border-slate-200 bg-slate-50/80"
                              : "border-slate-200 bg-white hover:border-[#A06126]/30 hover:bg-[#A06126]/5"
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
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Details Table */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#A06126]" />
              <h3 className="text-sm font-bold text-slate-900">
                Leave Details <span className="text-slate-400 font-normal">({filteredRecords.length})</span>
              </h3>
            </div>
            
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">No leaves found</p>
                <p className="text-xs text-slate-400 mt-1">
                  No leave records for {selectedEmployee?.fullName || "this employee"} in {MONTHS[selectedMonth]} {selectedYear}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Leave Type</th>
                      <th className="px-5 py-3.5">Duration</th>
                      <th className="px-5 py-3.5">Reason</th>
                      <th className="px-5 py-3.5 text-right">Total Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r._id} className="hover:bg-[#A06126]/5 transition-colors duration-150 group">
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {leaveTypeLabels[r.type] || r.type}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {new Date(r.startDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })} –{" "}
                          {new Date(r.endDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-[250px] truncate" title={r.reason || "No reason provided"}>
                          {r.reason || <span className="text-slate-300 italic">No reason provided</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                          {r.totalDays} <span className="text-xs font-normal text-slate-500">d</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}