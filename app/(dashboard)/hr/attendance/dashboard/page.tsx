"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Home,
  Loader2,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";

import StatsCards from "@/components/HR/Attendance/StatsCards";
import AttendanceCharts from "@/components/HR/Attendance/AttendanceCharts";
import FilterBar from "@/components/HR/Attendance/FilterBar";
import AttendanceList from "@/components/HR/Attendance/AttendanceList";
import DetailModal from "@/components/HR/Attendance/DetailModal";

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeRef {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  employeeId?: string;
}

export type AttendanceStatusType =
  | "present"
  | "absent"
  | "late"
  | "double-late"
  | "half-day"
  | "on-leave";

export interface AttendanceRecord {
  _id: string;
  employeeId: EmployeeRef | string | null | undefined;
  employeeName?: string | null;
  employeeEmail?: string | null;
  employeeDepartment?: string | null;
  employeePosition?: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatusType;
  workingHours: number;
  overtime: number;
  location?: string;
  notes?: string;
}

export interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  doubleLate?: number;
  onLeave: number;
  halfDay: number;
  attendanceRate: number;
  totalWorkingHours: number;
  totalOvertime: number;
}

// ============================================================================
// HELPERS
// ============================================================================

const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatDisplayDate = (d: Date): string =>
  d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const isSameDay = (a: Date, b: Date): boolean => toDateStr(a) === toDateStr(b);

const extractEmployeeId = (emp: AttendanceRecord["employeeId"]): string => {
  if (!emp) return "";
  if (typeof emp === "string") return emp.trim();
  if (typeof emp === "object") {
    return String(emp._id ?? emp.id ?? "").trim();
  }
  return "";
};

const extractEmployeeName = (record: AttendanceRecord): string => {
  if (record?.employeeId && typeof record.employeeId === "object") {
    if (record.employeeId.fullName?.trim()) {
      return record.employeeId.fullName.trim();
    }
  }
  if (record?.employeeName?.trim()) {
    return record.employeeName.trim();
  }
  return "Unknown Employee";
};

const extractEmployeeEmail = (record: AttendanceRecord): string => {
  if (record?.employeeId && typeof record.employeeId === "object") {
    if (record.employeeId.email?.trim()) {
      return record.employeeId.email.trim();
    }
  }
  if (record?.employeeEmail?.trim()) {
    return record.employeeEmail.trim();
  }
  return "";
};

const dataCache = new Map<
  string,
  { records: AttendanceRecord[]; stats: AttendanceStats | null }
>();

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AttendancePage() {
  const { user } = useAuth();
  const requestSeqRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [focusEmployeeId, setFocusEmployeeId] = useState<string | null>(null);

  const [detail, setDetail] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const isHR = useMemo(() => {
    const hrRoles = ["super_admin", "admin", "hr_manager"];
    return Boolean(user?.role && hrRoles.includes(user.role));
  }, [user?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(
    async (date: Date, force = false) => {
      const seq = ++requestSeqRef.current;
      const dateStr = toDateStr(date);
      const cacheKey = `${isHR ? "hr" : "me"}:${dateStr}`;

      if (!force && dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey)!;
        if (seq === requestSeqRef.current) {
          setRecords(cached.records);
          setStats(cached.stats);
          setLoading(false);
        }
        return;
      }

      try {
        setRefreshing(true);

        const requests: Promise<any>[] = [
          isHR
            ? api.get("/attendance/all", { params: { date: dateStr } })
            : api.get("/attendance/history", {
                params: { startDate: dateStr, endDate: dateStr },
              }),
        ];

        if (isHR) {
          requests.push(api.get("/attendance/stats", { params: { date: dateStr } }));
        }

        const responses = await Promise.allSettled(requests);
        if (seq !== requestSeqRef.current) return;

        let data: AttendanceRecord[] = [];
        let statData: AttendanceStats | null = null;

        const recRes = responses[0];
        if (recRes.status === "fulfilled" && recRes.value?.data?.success) {
          data = Array.isArray(recRes.value.data.data)
            ? recRes.value.data.data.filter(Boolean)
            : [];
        } else {
          const message =
            recRes.status === "rejected"
              ? "Failed to load attendance data"
              : recRes.value?.data?.message || "Unable to load attendance records";
          toast.error(message);
        }

        if (
          isHR &&
          responses[1]?.status === "fulfilled" &&
          (responses[1] as PromiseFulfilledResult<any>).value?.data?.success
        ) {
          statData =
            (responses[1] as PromiseFulfilledResult<any>).value.data.data || null;
        }

        if (!statData) {
          const countByStatus = (status: string) =>
            data.filter((r) => String(r?.status || "").toLowerCase() === status)
              .length;

          const present = countByStatus("present");
          const absent = countByStatus("absent");
          const late = countByStatus("late");
          const doubleLate = countByStatus("double-late");
          const onLeave = countByStatus("on-leave");
          const halfDay = countByStatus("half-day");
          const totalEmployees = data.length;

          statData = {
            totalEmployees,
            present,
            absent,
            late,
            doubleLate,
            onLeave,
            halfDay,
            attendanceRate: totalEmployees
              ? Math.round(
                  ((present + late + doubleLate) / totalEmployees) * 100
                )
              : 0,
            totalWorkingHours: data.reduce(
              (sum, r) => sum + (Number(r?.workingHours) || 0),
              0
            ),
            totalOvertime: data.reduce(
              (sum, r) => sum + (Number(r?.overtime) || 0),
              0
            ),
          };
        }

        dataCache.set(cacheKey, { records: data, stats: statData });
        setRecords(data);
        setStats(statData);
      } catch {
        if (seq === requestSeqRef.current) {
          toast.error("An unexpected error occurred while fetching attendance");
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [isHR]
  );

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    for (const r of records) {
      const dept = r?.employeeDepartment?.trim();
      if (dept) deptSet.add(dept);
    }
    return ["All Departments", ...Array.from(deptSet).sort()];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return records.filter((record) => {
      if (!record) return false;

      const empId = extractEmployeeId(record.employeeId);
      const empName = extractEmployeeName(record).toLowerCase();
      const empEmail = extractEmployeeEmail(record).toLowerCase();
      const empDept = record.employeeDepartment?.trim() || "";
      const recordStatus = String(record.status || "").toLowerCase();

      if (focusEmployeeId && empId !== focusEmployeeId) {
        return false;
      }

      if (
        selectedDepartment !== "All Departments" &&
        empDept !== selectedDepartment
      ) {
        return false;
      }

      if (selectedStatus !== "all" && recordStatus !== selectedStatus) {
        return false;
      }

      if (query) {
        const matchesName = empName.includes(query);
        const matchesEmail = empEmail.includes(query);
        const matchesId = empId.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [records, searchTerm, selectedDepartment, selectedStatus, focusEmployeeId]);

  const navigateDate = useCallback((daysOffset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + daysOffset);
      return next;
    });
  }, []);

  const handleGoToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData(selectedDate, true);
  }, [fetchData, selectedDate]);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedDepartment("All Departments");
    setSelectedStatus("all");
    setFocusEmployeeId(null);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      searchTerm !== "" ||
      selectedStatus !== "all" ||
      selectedDepartment !== "All Departments" ||
      focusEmployeeId !== null,
    [searchTerm, selectedStatus, selectedDepartment, focusEmployeeId]
  );

  const focusedName = useMemo(() => {
    if (!focusEmployeeId) return null;
    const matched = records.find(
      (r) => extractEmployeeId(r?.employeeId) === focusEmployeeId
    );
    return matched ? extractEmployeeName(matched) : null;
  }, [focusEmployeeId, records]);

  const today = useMemo(() => new Date(), []);
  const selectedIsToday = isSameDay(selectedDate, today);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F8F7]">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-[#107E57] mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            Loading attendance data...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[#F6F8F7] font-sans pb-10">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"
          >
            <Link
              href="/dashboard"
              className="hover:text-[#107E57] flex items-center gap-1 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span>Dashboard</span>
            </Link>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" />
            <Link href="/hr" className="hover:text-[#107E57] transition-colors">
              HR &amp; Admin
            </Link>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-800 font-semibold">Attendance</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Attendance Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                <span>
                  Monitor daily attendance, team availability, and work hours.
                </span>
                {refreshing && (
                  <span className="text-xs text-[#107E57] font-medium inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleGoToday}
                disabled={selectedIsToday}
                className="cursor-pointer px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-all text-xs font-semibold flex items-center gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-500" /> Today
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="cursor-pointer px-4 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg transition-all text-xs font-semibold shadow-2xs flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs px-4 py-3 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
            aria-label="Previous Day"
            className="cursor-pointer p-2 bg-[#FAFBFB] border border-gray-200 hover:bg-gray-100/70 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="relative px-5 py-1.5 bg-[#FAFBFB] border border-gray-200/90 rounded-lg text-xs sm:text-sm font-semibold text-gray-800 min-w-[230px] text-center">
            {formatDisplayDate(selectedDate)}
            {selectedIsToday && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-[#107E57] border border-emerald-200 text-[10px] font-bold uppercase rounded-full">
                Today
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigateDate(1)}
            aria-label="Next Day"
            className="cursor-pointer p-2 bg-[#FAFBFB] border border-gray-200 hover:bg-gray-100/70 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Dashboard Sections */}
        <StatsCards stats={stats} />
        <AttendanceCharts stats={stats} records={records} />

        <FilterBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
          departments={departments}
          isHR={isHR}
          focusEmployeeId={focusEmployeeId}
          setFocusEmployeeId={setFocusEmployeeId}
          focusedName={focusedName}
          hasActiveFilters={hasActiveFilters}
          resetFilters={resetFilters}
        />

        <AttendanceList
          filteredRecords={filteredRecords}
          records={records}
          stats={stats}
          viewMode={viewMode}
          onView={setDetail}
        />
      </div>

      <DetailModal detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}