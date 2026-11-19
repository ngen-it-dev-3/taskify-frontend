// app/hr/attendance/my/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Home,
  ChevronRight as ChevronRightIcon,
  Info,
  AlertTriangle,
  Activity,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceRecord {
  _id: string;
  employeeId: string | { _id: string; fullName: string };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime?: string;
  checkOutTime?: string;
  status: "present" | "absent" | "late" | "double-late" | "half-day" | "on-leave";
  workingHours: number;
  overtime: number;
  location?: string;
  notes?: string;
}

interface MonthlyStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  doubleLate: number;
  halfDay: number;
  onLeave: number;
  totalWorkingHours: number;
  totalOvertime: number;
  attendanceRate: number;
}

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const STATUS_CONFIG = {
  present: { label: "Present", color: "emerald", icon: CheckCircle },
  absent: { label: "Absent", color: "rose", icon: XCircle },
  late: { label: "Single Late", color: "amber", icon: AlertCircle },
  "double-late": { label: "Double Late", color: "red", icon: AlertTriangle },
  "half-day": { label: "Half Day", color: "blue", icon: Clock },
  "on-leave": { label: "On Leave", color: "purple", icon: Info },
};

const getBadgeClass = (color: string, type: "dot" | "bg" | "text" | "border") => {
  const map: Record<string, Record<string, string>> = {
    emerald: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    rose: {
      dot: "bg-rose-500",
      bg: "bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    amber: {
      dot: "bg-amber-500",
      bg: "bg-amber-50/80",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    red: {
      dot: "bg-red-600",
      bg: "bg-red-50/80",
      text: "text-red-700",
      border: "border-red-200",
    },
    blue: {
      dot: "bg-blue-500",
      bg: "bg-blue-50/80",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    purple: {
      dot: "bg-purple-500",
      bg: "bg-purple-50/80",
      text: "text-purple-700",
      border: "border-purple-200",
    },
  };
  return map[color]?.[type] || "";
};

const normalizeDate = (dateInput: string | Date): string => {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [stats, setStats] = useState<MonthlyStats>({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    doubleLate: 0,
    halfDay: 0,
    onLeave: 0,
    totalWorkingHours: 0,
    totalOvertime: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  const fetchAttendanceData = async () => {
    try {
      if (!refreshing) setLoading(true);
      setRefreshing(true);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(
        year,
        month,
        0
      ).getDate()}`;

      const response = await api.get("/attendance/history", {
        params: { startDate, endDate },
      });

      if (response.data.success) {
        const data = response.data.data || [];
        setAttendanceData(data);
        calculateStats(data, new Date(year, month, 0).getDate());
      } else {
        toast.error(response.data.message || "Failed to load data");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: AttendanceRecord[], totalDays: number) => {
    const count = (s: string) => data.filter((r) => r.status === s).length;
    const presentCount =
      count("present") + count("late") + count("double-late") + count("half-day");

    setStats({
      totalDays,
      present: count("present"),
      absent: count("absent"),
      late: count("late"),
      doubleLate: count("double-late"),
      halfDay: count("half-day"),
      onLeave: count("on-leave"),
      totalWorkingHours: data.reduce((sum, r) => sum + (r.workingHours || 0), 0),
      totalOvertime: data.reduce((sum, r) => sum + (r.overtime || 0), 0),
      attendanceRate: totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0,
    });
  };

  const getCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const currentDayStr = normalizeDate(d);
      const record = attendanceData.find(
        (r) => normalizeDate(r.date) === currentDayStr
      );

      days.push({
        day: i,
        date: d,
        dateStr: currentDayStr,
        record,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, [currentDate, attendanceData]);

  const handleDateClick = (dayObj: any) => {
    if (dayObj.isWeekend) return toast("It's a weekend!", { icon: "🌙" });
    if (!dayObj.record) return toast.error("No attendance record found for this day.");

    setSelectedRecord(dayObj.record);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#faf8f4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#A06126] mb-3" />
        <p className="text-xs font-medium text-gray-500">Loading your attendance...</p>
      </div>
    );
  }

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const todayStr = normalizeDate(new Date());

  return (
    <div className="min-h-screen bg-[#faf8f4] py-5 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-4">
        {/* Classic Breadcrumb & Compact Header */}
        <div className="border-b border-gray-200 pb-3.5">
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-[#A06126] flex items-center gap-1 transition"
            >
              <Home size={12} /> Dashboard
            </Link>
            <ChevronRightIcon size={12} className="text-gray-300" />
            <span className="text-[#A06126]">My Attendance</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-[#A06126]" /> {monthName}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.fullName ? `${user.fullName} • ` : ""}Track your daily presence and working hours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="cursor-pointer px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
              >
                Today
              </button>
              <button
                type="button"
                onClick={fetchAttendanceData}
                disabled={refreshing}
                className="cursor-pointer px-3.5 py-1.5 bg-[#A06126] text-white rounded-md text-xs font-semibold hover:bg-[#88501E] transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { label: "Total Days", val: stats.totalDays, icon: CalendarIcon, accent: "text-gray-600" },
            { label: "Present", val: stats.present, icon: CheckCircle, accent: "text-emerald-600" },
            { label: "Absent", val: stats.absent, icon: XCircle, accent: "text-rose-600" },
            { label: "Late", val: stats.late, icon: AlertCircle, accent: "text-amber-600" },
            { label: "Double Late", val: stats.doubleLate, icon: AlertTriangle, accent: "text-red-600" },
            { label: "Half Day", val: stats.halfDay, icon: Clock, accent: "text-blue-600" },
            { label: "Attendance", val: `${stats.attendanceRate}%`, icon: Activity, highlight: true },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-md p-3 border shadow-2xs flex flex-col justify-between h-20 transition ${
                item.highlight
                  ? "bg-[#A06126] text-white border-[#A06126]"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    item.highlight ? "text-amber-100" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
                <item.icon
                  size={14}
                  className={item.highlight ? "text-amber-100" : item.accent}
                />
              </div>
              <span
                className={`text-lg font-serif font-bold leading-none ${
                  item.highlight ? "text-white" : "text-gray-900"
                }`}
              >
                {item.val}
              </span>
            </div>
          ))}
        </div>

        {/* Compact Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white px-4 py-3 rounded-md border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-[#faf8f4] border border-[#A06126]/20 rounded-md text-[#A06126]">
              <Timer size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Worked Hours
              </p>
              <p className="text-base font-bold text-gray-900">
                {stats.totalWorkingHours.toFixed(1)}h
              </p>
            </div>
          </div>

          <div className="bg-white px-4 py-3 rounded-md border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-amber-50 border border-amber-200/70 rounded-md text-amber-700">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Overtime
              </p>
              <p className="text-base font-bold text-gray-900">
                +{stats.totalOvertime.toFixed(1)}h
              </p>
            </div>
          </div>

          <div className="bg-white px-4 py-3 rounded-md border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-emerald-50 border border-emerald-200/70 rounded-md text-emerald-700">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Efficiency
              </p>
              <p className="text-base font-bold text-gray-900">
                {stats.attendanceRate}% Rate
              </p>
            </div>
          </div>
        </div>

        {/* Compact Classic Calendar Section */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200 overflow-hidden">
          <div className="bg-[#faf8f4] px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                Daily Overview
              </h2>
              <p className="text-[11px] text-gray-500">
                Click any recorded day to view check-in/out details
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                  )
                }
                className="cursor-pointer p-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-gray-700 transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                  )
                }
                className="cursor-pointer p-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-gray-700 transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="p-3.5 sm:p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Compact Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {getCalendarDays.map((dayObj, idx) => {
                if (!dayObj)
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-16 sm:h-20 rounded-md bg-[#faf8f4]/50 border border-transparent"
                    />
                  );

                const isToday = dayObj.dateStr === todayStr;
                const config = dayObj.record ? STATUS_CONFIG[dayObj.record.status] : null;
                const shortTime = dayObj.record?.checkInTime
                  ? dayObj.record.checkInTime.replace(/\s*(AM|PM)/i, "")
                  : "";

                return (
                  <button
                    type="button"
                    key={dayObj.day}
                    onClick={() => handleDateClick(dayObj)}
                    disabled={dayObj.isWeekend}
                    className={`
                      h-16 sm:h-20 rounded-md px-1.5 py-1.5 flex flex-col justify-between relative transition-all text-left
                      ${
                        isToday
                          ? "ring-2 ring-[#A06126] border-[#A06126] bg-[#faf8f4]"
                          : "hover:border-[#A06126]/50"
                      }
                      ${
                        dayObj.isWeekend
                          ? "bg-gray-100/80 border-gray-200/70 text-gray-400 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                      ${
                        config
                          ? `border ${getBadgeClass(config.color, "border")} ${getBadgeClass(
                              config.color,
                              "bg"
                            )}`
                          : !dayObj.isWeekend
                          ? "border border-gray-200 bg-white hover:bg-[#faf8f4]/60"
                          : ""
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "text-[#A06126]"
                            : dayObj.isWeekend
                            ? "text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {dayObj.day}
                      </span>
                      {config && (
                        <span
                          className={`w-2 h-2 rounded-full ${getBadgeClass(
                            config.color,
                            "dot"
                          )}`}
                        />
                      )}
                    </div>

                    {config ? (
                      <div className="w-full flex items-center justify-between gap-1 mt-auto">
                        <config.icon
                          size={12}
                          className={`shrink-0 ${getBadgeClass(config.color, "text")}`}
                        />
                        {shortTime && (
                          <span className="text-[10px] font-bold text-gray-700 truncate">
                            {shortTime}
                          </span>
                        )}
                      </div>
                    ) : (
                      !dayObj.isWeekend && (
                        <span className="text-[10px] text-gray-300 mt-auto">—</span>
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Compact Classic Legend */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-3.5 justify-center">
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-xs ${getBadgeClass(
                      val.color,
                      "dot"
                    )}`}
                  />
                  <span>{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Classic Detail Modal */}
      {showModal && selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-md border border-gray-200 w-full max-w-md shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#faf8f4] px-5 py-3.5 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">
                  Attendance Details
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(selectedRecord.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cursor-pointer p-1 text-gray-400 hover:text-gray-700 rounded transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-5">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xs border mb-4 text-xs font-bold uppercase tracking-wider ${getBadgeClass(
                  STATUS_CONFIG[selectedRecord.status].color,
                  "bg"
                )} ${getBadgeClass(
                  STATUS_CONFIG[selectedRecord.status].color,
                  "text"
                )} ${getBadgeClass(STATUS_CONFIG[selectedRecord.status].color, "border")}`}
              >
                {(() => {
                  const Ico = STATUS_CONFIG[selectedRecord.status].icon;
                  return <Ico size={14} />;
                })()}
                <span>{STATUS_CONFIG[selectedRecord.status].label}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="bg-[#faf8f4] border border-gray-200/80 p-3 rounded-md">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">
                    Check In
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedRecord.checkInTime || "—"}
                  </p>
                </div>
                <div className="bg-[#faf8f4] border border-gray-200/80 p-3 rounded-md">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">
                    Check Out
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedRecord.checkOutTime || "—"}
                  </p>
                </div>
                <div className="bg-[#faf8f4] border border-gray-200/80 p-3 rounded-md">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">
                    Worked
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedRecord.workingHours.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-[#faf8f4] border border-gray-200/80 p-3 rounded-md">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">
                    Overtime
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      selectedRecord.overtime > 0 ? "text-amber-700" : "text-gray-400"
                    }`}
                  >
                    {selectedRecord.overtime > 0
                      ? `+${selectedRecord.overtime.toFixed(1)}h`
                      : "0h"}
                  </p>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-md mb-4 flex gap-2.5">
                  <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cursor-pointer w-full py-2 bg-[#A06126] hover:bg-[#88501E] text-white rounded-md text-xs font-semibold transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}