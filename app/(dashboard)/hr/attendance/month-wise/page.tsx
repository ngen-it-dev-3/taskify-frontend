// app/hr/attendance/month-wise/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    User,
    Loader2,
    Home,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    AlertTriangle,
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
    role?: string;
}

interface AttendanceRecord {
    _id: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: "present" | "absent" | "late" | "double-late" | "half-day" | "on-leave";
    workingHours: number;
    overtime: number;
    notes?: string;
    employeeName?: string;
    employeeId?: string | { _id?: string; fullName?: string; employeeId?: string };
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG: Record<
    string,
    { label: string; pill: string; icon: any }
> = {
    present: {
        label: "Present",
        pill: "bg-emerald-50 text-[#107E57] border-emerald-200",
        icon: CheckCircle2,
    },
    late: {
        label: "Single Late",
        pill: "bg-amber-50 text-amber-800 border-amber-200",
        icon: AlertCircle,
    },
    "double-late": {
        label: "Double Late",
        pill: "bg-[#FAF8F4] text-[#8B5A2B] border-[#A06126]/35",
        icon: AlertTriangle,
    },
    "half-day": {
        label: "Half Day",
        pill: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Clock,
    },
    "on-leave": {
        label: "On Leave",
        pill: "bg-purple-50 text-purple-700 border-purple-200",
        icon: CalendarDays,
    },
    absent: {
        label: "Absent",
        pill: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
    },
};

// Helper to extract array from various API response structures
const extractUsersArray = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.employees)) return payload.employees;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    if (Array.isArray(payload?.data?.employees)) return payload.data.employees;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MonthWiseAttendancePage() {
    const { user } = useAuth();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState<string>("");

    const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Fetch All Employees
    useEffect(() => {
        let active = true;

        const fetchEmployees = async () => {
            try {
                setLoadingEmps(true);

                // Try primary endpoint
                let rawList: any[] = [];
                try {
                    const res = await api.get("/users/all");
                    rawList = extractUsersArray(res?.data);
                } catch {
                    // Fallback endpoint if /users/all is not used
                    const fallbackRes = await api.get("/users");
                    rawList = extractUsersArray(fallbackRes?.data);
                }

                const normalized: Employee[] = rawList
                    .filter((u) => u && (u._id || u.id) && u.isActive !== false && u.status !== "inactive")
                    .map((u) => ({
                        _id: String(u._id || u.id),
                        fullName:
                            u.fullName ||
                            u.name ||
                            [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                            u.email ||
                            "Unnamed User",
                        email: u.email,
                        employeeId: u.employeeId || u.empId,
                        role: u.role,
                    }));

                if (!active) return;

                if (normalized.length > 0) {
                    setEmployees(normalized);
                    // Default to first non-super_admin employee if available, otherwise current user / first item
                    const firstStaff = normalized.find((e) => e.role !== "super_admin");
                    const defaultTarget =
                        firstStaff ||
                        normalized.find((e) => String(e._id) === String(user?._id)) ||
                        normalized[0];
                    setSelectedEmpId(String(defaultTarget._id));
                } else if (user?._id) {
                    const selfEmp: Employee = {
                        _id: String(user._id),
                        fullName: user.fullName || "Current User",
                        email: user.email,
                        employeeId: (user as any).employeeId,
                    };
                    setEmployees([selfEmp]);
                    setSelectedEmpId(String(user._id));
                } else {
                    setEmployees([]);
                }
            } catch {
                if (!active) return;
                if (user?._id) {
                    const selfEmp: Employee = {
                        _id: String(user._id),
                        fullName: user.fullName || "Current User",
                        email: user.email,
                        employeeId: (user as any).employeeId,
                    };
                    setEmployees([selfEmp]);
                    setSelectedEmpId(String(user._id));
                } else {
                    setEmployees([]);
                }
            } finally {
                if (active) setLoadingEmps(false);
            }
        };

        fetchEmployees();
        return () => {
            active = false;
        };
    }, [user]);

    // Fetch Attendance Data when employee or month/year changes
    useEffect(() => {
        if (!selectedEmpId) return;
        let active = true;

        const fetchData = async () => {
            try {
                setLoadingData(true);
                const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
                const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
                    lastDay
                ).padStart(2, "0")}`;

                const res = await api.get("/attendance/history", {
                    params: { startDate, endDate, employeeId: selectedEmpId },
                });

                if (!active) return;

                if (res?.data?.success) {
                    const list = Array.isArray(res.data.data) ? res.data.data.filter(Boolean) : [];
                    setAttendanceData(list);
                } else {
                    setAttendanceData([]);
                    toast.error(res?.data?.message || "Failed to load attendance");
                }
            } catch (error: any) {
                if (!active) return;
                setAttendanceData([]);
                toast.error(error?.response?.data?.message || "Failed to load attendance records");
            } finally {
                if (active) setLoadingData(false);
            }
        };

        fetchData();
        return () => {
            active = false;
        };
    }, [selectedEmpId, selectedMonth, selectedYear]);

    const stats = useMemo(() => {
        const safeRows = Array.isArray(attendanceData) ? attendanceData : [];
        const count = (s: string) =>
            safeRows.filter((r) => String(r?.status || "").toLowerCase() === s).length;

        return {
            totalDays: safeRows.length,
            present: count("present"),
            late: count("late") + count("double-late"),
            absent: count("absent"),
            halfDay: count("half-day"),
            totalHours: safeRows.reduce((sum, r) => sum + (Number(r?.workingHours) || 0), 0),
            overtime: safeRows.reduce((sum, r) => sum + (Number(r?.overtime) || 0), 0),
        };
    }, [attendanceData]);

    const selectedEmployee = useMemo(
        () => employees.find((e) => String(e._id) === String(selectedEmpId)),
        [employees, selectedEmpId]
    );

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear((y) => y - 1);
        } else {
            setSelectedMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear((y) => y + 1);
        } else {
            setSelectedMonth((m) => m + 1);
        }
    };

    return (
        <div className="min-h-screen bg-[#F6F8F7] pb-12">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
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
                            <span className="text-gray-300">/</span>
                            <Link href="/hr" className="hover:text-[#107E57] transition-colors">
                                HR &amp; Admin
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-[#8B5A2B] font-semibold">Month-wise Attendance</span>
                        </nav>

                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Monthly Attendance History
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-[#107E57]" />
                            View detailed daily attendance records for any employee in the selected month.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="cursor-pointer print:hidden inline-flex items-center gap-2 px-4 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
                    >
                        <FileText className="w-4 h-4" /> Print Report
                    </button>
                </div>

                {/* Filters & Stats Bar */}
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4 sm:p-5 print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Employee Selector */}
                        <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Select Employee ({employees.length})
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]" />
                                {loadingEmps ? (
                                    <div className="pl-9 text-xs text-gray-400 py-2.5 flex items-center gap-2 bg-[#FAFBFB] border border-gray-200 rounded-lg">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#107E57]" /> Loading employees...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedEmpId}
                                        onChange={(e) => setSelectedEmpId(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-[#FAFBFB] hover:bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] transition-all cursor-pointer"
                                    >
                                        {employees.length === 0 ? (
                                            <option value="">No employees found</option>
                                        ) : (
                                            employees.map((u) => (
                                                <option key={u._id} value={u._id}>
                                                    {u.fullName} {u.employeeId ? `(${u.employeeId})` : ""}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Month / Year Selector */}
                        <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Month &amp; Year
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    aria-label="Previous Month"
                                    className="cursor-pointer p-2 bg-[#FAFBFB] border border-gray-200 rounded-lg hover:bg-gray-100/70 text-gray-700 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 bg-[#FAFBFB] hover:bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] cursor-pointer"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={m} value={i}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-24 px-3 py-2 bg-[#FAFBFB] hover:bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] cursor-pointer"
                                >
                                    {[2024, 2025, 2026, 2027].map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    aria-label="Next Month"
                                    className="cursor-pointer p-2 bg-[#FAFBFB] border border-gray-200 rounded-lg hover:bg-gray-100/70 text-gray-700 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Summary */}
                        <div className="md:col-span-4 bg-[#FAF8F4] border border-[#A06126]/25 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-[#8B5A2B] uppercase tracking-wider">
                                    Total Worked
                                </p>
                                <p className="text-2xl font-bold text-[#107E57] leading-tight mt-0.5 tabular-nums">
                                    {stats.totalHours.toFixed(1)}{" "}
                                    <span className="text-sm font-semibold text-gray-600">Hrs</span>
                                </p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200/70 p-2.5 rounded-lg text-[#107E57]">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F4] border-b border-gray-200/80 px-5 py-3.5 flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-gray-900">
                                {selectedEmployee?.fullName || "Employee"}&apos;s Attendance Sheet
                            </h2>
                            <p className="text-xs text-[#8B5A2B] mt-0.5 tabular-nums">
                                {MONTHS[selectedMonth]} {selectedYear} • {stats.totalDays} Days Recorded
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-gray-600">
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                                const Icon = val.icon;
                                return (
                                    <span key={key} className="flex items-center gap-1">
                                        <Icon size={12} className="text-[#107E57]" />
                                        <span>{val.label}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loadingData ? (
                            <div className="flex flex-col items-center justify-center h-60 text-gray-400 gap-3">
                                <Loader2 className="w-7 h-7 animate-spin text-[#107E57]" />
                                <span className="text-xs font-medium">Loading attendance records...</span>
                            </div>
                        ) : attendanceData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center bg-white">
                                <div className="w-12 h-12 rounded-xl bg-[#FAF8F4] border border-[#A06126]/20 flex items-center justify-center mb-3">
                                    <CalendarDays className="w-6 h-6 text-[#8B5A2B]/70" />
                                </div>
                                <p className="text-sm font-semibold text-gray-800">
                                    No attendance records found
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Try selecting a different month or employee.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-[#FAF8F4]/60 border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2.5">Date</th>
                                        <th className="px-4 py-2.5">Status</th>
                                        <th className="px-4 py-2.5">Check In</th>
                                        <th className="px-4 py-2.5">Check Out</th>
                                        <th className="px-4 py-2.5">Worked Hours</th>
                                        <th className="px-4 py-2.5">Overtime</th>
                                        <th className="px-4 py-2.5 text-right">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 tabular-nums">
                                    {attendanceData.map((record, idx) => {
                                        const statusKey = String(record?.status || "absent").toLowerCase();
                                        const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.absent;
                                        const Icon = config.icon;
                                        const workedVal = Number(record?.workingHours) || 0;
                                        const overtimeVal = Number(record?.overtime) || 0;

                                        return (
                                            <tr
                                                key={record._id || `row-${idx}`}
                                                className="hover:bg-[#FAF8F4]/70 transition-colors"
                                            >
                                                <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                                                    {record?.date
                                                        ? new Date(record.date).toLocaleDateString("en-US", {
                                                            weekday: "short",
                                                            day: "numeric",
                                                            month: "short",
                                                        })
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${config.pill}`}
                                                    >
                                                        <Icon className="w-3 h-3" /> {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                    {record?.checkInTime || "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                    {record?.checkOutTime || "—"}
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                                                    {workedVal.toFixed(1)}h
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-[#A06126] whitespace-nowrap">
                                                    {overtimeVal > 0 ? `+${overtimeVal.toFixed(1)}h` : "—"}
                                                </td>
                                                <td
                                                    className="px-4 py-2.5 text-right text-xs text-gray-400 max-w-[200px] truncate"
                                                    title={record?.notes || ""}
                                                >
                                                    {record?.notes || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="bg-[#FAF8F4] border-t border-gray-200/80 px-5 py-3 flex flex-wrap gap-5 text-xs font-medium text-gray-600 tabular-nums print:flex">
                        <span>
                            Total Present: <b className="text-[#107E57]">{stats.present}</b>
                        </span>
                        <span>
                            Total Late: <b className="text-[#8B5A2B]">{stats.late}</b>
                        </span>
                        <span>
                            Total Absent: <b className="text-rose-700">{stats.absent}</b>
                        </span>
                        <span>
                            Half Days: <b className="text-blue-700">{stats.halfDay}</b>
                        </span>
                        <span>
                            Total OT: <b className="text-[#A06126]">+{stats.overtime.toFixed(1)}h</b>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}