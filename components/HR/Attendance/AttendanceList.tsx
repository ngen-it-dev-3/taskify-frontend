// components/HR/Attendance/AttendanceList.tsx
"use client";

import { AttendanceRecord, AttendanceStats } from "@/app/(dashboard)/hr/attendance/dashboard/page";
import {
  Timer,
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserX,
  AlertTriangle,
} from "lucide-react";

interface Props {
  filteredRecords: AttendanceRecord[];
  records: AttendanceRecord[];
  stats: AttendanceStats;
  viewMode: "grid" | "table";
  onView: (r: AttendanceRecord) => void;
}

type StatusConfig = {
  label: string;
  pill: string;
  dot: string;
  icon: any;
};

const STATUS_META: Record<string, StatusConfig> = {
  present: {
    label: "Present",
    pill: "bg-emerald-50 text-[#107E57] border-emerald-200",
    dot: "bg-[#107E57]",
    icon: CheckCircle,
  },
  late: {
    label: "Late",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: AlertCircle,
  },
  "double-late": {
    label: "Double Late",
    pill: "bg-[#FAF8F4] text-[#8B5A2B] border-[#A06126]/35",
    dot: "bg-[#A06126]",
    icon: AlertTriangle,
  },
  "half-day": {
    label: "Half Day",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: Clock,
  },
  "on-leave": {
    label: "On Leave",
    pill: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    icon: UserX,
  },
  absent: {
    label: "Absent",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

const getInitials = (name?: string | null): string => {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getEmpId = (eid: any): string => {
  if (!eid) return "N/A";
  if (typeof eid === "object") {
    return String(eid.employeeId || eid._id || "N/A");
  }
  return String(eid);
};

const getEmpName = (r: AttendanceRecord): string => {
  if (
    r?.employeeId &&
    typeof r.employeeId === "object" &&
    r.employeeId.fullName?.trim()
  ) {
    return r.employeeId.fullName.trim();
  }
  return r?.employeeName?.trim() || "Unknown Employee";
};

const getEmpEmail = (r: AttendanceRecord): string => {
  if (
    r?.employeeId &&
    typeof r.employeeId === "object" &&
    r.employeeId.email?.trim()
  ) {
    return r.employeeId.email.trim();
  }
  return r?.employeeEmail?.trim() || "—";
};

const renderAttendanceDetailBadge = (statusKey: string) => {
  switch (statusKey) {
    case "late":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <AlertCircle className="w-2.5 h-2.5" /> Single Late
        </span>
      );
    case "double-late":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#FAF8F4] text-[#8B5A2B] border border-[#A06126]/35 whitespace-nowrap">
          <AlertTriangle className="w-2.5 h-2.5 text-[#A06126]" /> Double Late
        </span>
      );
    case "half-day":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <Clock className="w-2.5 h-2.5" /> Half Day
        </span>
      );
    default:
      return <span className="text-[11px] font-medium text-gray-400">—</span>;
  }
};

const AttendanceRow = ({
  record,
  onView,
}: {
  record: AttendanceRecord;
  onView: (r: AttendanceRecord) => void;
}) => {
  const statusKey = String(record?.status || "absent").toLowerCase();
  const empName = getEmpName(record);
  const empEmail = getEmpEmail(record);

  const isAbsentOrLeave = statusKey === "absent" || statusKey === "on-leave";
  const workingHoursNum = Number(record?.workingHours ?? 0);
  const overtimeNum = Number(record?.overtime ?? 0);

  return (
    <tr
      onClick={() => onView(record)}
      className="hover:bg-[#FAF8F4]/80 transition-colors cursor-pointer group"
    >
      {/* Employee */}
      <td className="px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#107E57] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {getInitials(empName)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-semibold text-gray-900 text-xs sm:text-[13px] whitespace-nowrap">
              {empName}
            </p>
            <p className="text-[11px] text-gray-400 truncate max-w-[190px]">
              {empEmail}
            </p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-3.5 py-2 leading-tight">
        <p className="text-xs text-gray-700 font-medium whitespace-nowrap">
          {record?.employeeDepartment || "—"}
        </p>
        {record?.employeePosition && (
          <p className="text-[10px] text-[#8B5A2B]/80 whitespace-nowrap">
            {record.employeePosition}
          </p>
        )}
      </td>

      {/* Check In */}
      <td className="px-3.5 py-2 text-xs font-medium text-gray-700 whitespace-nowrap tabular-nums">
        {record?.checkInTime || record?.checkIn || "—"}
      </td>

      {/* Check Out */}
      <td className="px-3.5 py-2 text-xs font-medium text-gray-700 whitespace-nowrap tabular-nums">
        {record?.checkOutTime || record?.checkOut || "—"}
      </td>

      {/* Hours */}
      <td className="px-3.5 py-2 text-xs text-gray-700 whitespace-nowrap tabular-nums">
        {!isAbsentOrLeave ? (
          <span className="font-semibold text-gray-900">
            {(Number.isNaN(workingHoursNum) ? 0 : workingHoursNum).toFixed(1)}h
            {overtimeNum > 0 && (
              <span className="text-[#A06126] font-semibold ml-1">
                (+{overtimeNum.toFixed(1)}h)
              </span>
            )}
          </span>
        ) : (
          "—"
        )}
      </td>

      {/* Status (Present / Absent) */}
      <td className="px-3.5 py-2 whitespace-nowrap">
        {isAbsentOrLeave ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-2.5 h-2.5" />
            {statusKey === "on-leave" ? "On Leave" : "Absent"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border bg-emerald-50 text-[#107E57] border-emerald-200">
            <CheckCircle className="w-2.5 h-2.5" /> Present
          </span>
        )}
      </td>

      {/* Attendance Status (Single Late / Double Late / Half Day) */}
      <td className="px-3.5 py-2 whitespace-nowrap">
        {renderAttendanceDetailBadge(statusKey)}
      </td>

      {/* Actions — Eye button removed; row click handles view */}
      <td className="px-3.5 py-2 text-right whitespace-nowrap">
        <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#107E57] transition-colors">
          View
        </span>
      </td>
    </tr>
  );
};

export default function AttendanceList({
  filteredRecords,
  records,
  stats,
  viewMode,
  onView,
}: Props) {
  const safeFiltered = Array.isArray(filteredRecords)
    ? filteredRecords.filter(Boolean)
    : [];

  if (safeFiltered.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="w-12 h-12 bg-[#FAF8F4] border border-[#A06126]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
          <UserX className="w-6 h-6 text-[#8B5A2B]/60" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          No attendance records
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          No records found matching your filters
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/80 bg-[#FAF8F4]">
                  {[
                    "Employee",
                    "Department",
                    "Check In",
                    "Check Out",
                    "Hours",
                    "Status",
                    "Attendance Status",
                    "Actions",
                  ].map((heading, idx) => (
                    <th
                      key={heading}
                      className={`px-3.5 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                        idx === 7 ? "text-right" : "text-left"
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeFiltered.map((r, index) => (
                  <AttendanceRow
                    key={r._id || `att-row-${index}`}
                    record={r}
                    onView={onView}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 px-3.5 py-2.5 border-t border-gray-200/80 bg-[#FAF8F4]/70">
            <p className="text-xs text-gray-500 tabular-nums">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {safeFiltered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {records?.length ?? 0}
              </span>{" "}
              employees <span className="mx-1.5 text-gray-300">•</span>{" "}
              <Timer className="w-3 h-3 inline text-[#107E57] mr-1" />
              <span className="font-semibold text-gray-800">
                {(stats?.totalWorkingHours ?? 0).toFixed(1)}h
              </span>{" "}
              worked{" "}
              {(stats?.totalOvertime ?? 0) > 0 && (
                <>
                  <span className="mx-1.5 text-gray-300">•</span>
                  <TrendingUp className="w-3 h-3 inline text-[#A06126] mr-1" />
                  <span className="font-semibold text-[#A06126]">
                    +{(stats?.totalOvertime ?? 0).toFixed(1)}h
                  </span>{" "}
                  overtime
                </>
              )}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <span
                  key={key}
                  className="flex items-center gap-1 text-[11px] text-gray-600"
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {safeFiltered.map((r, index) => {
            const statusKey = String(r?.status || "absent").toLowerCase();
            const meta = STATUS_META[statusKey] || STATUS_META.absent;
            const Icon = meta.icon;
            const empName = getEmpName(r);
            const isAbsentOrLeave =
              statusKey === "absent" || statusKey === "on-leave";
            const workingHoursNum = Number(r?.workingHours ?? 0);
            const overtimeNum = Number(r?.overtime ?? 0);

            return (
              <div
                key={r._id || `att-card-${index}`}
                onClick={() => onView(r)}
                className="bg-white rounded-xl shadow-2xs border border-gray-200/80 hover:shadow-sm hover:border-[#107E57]/40 transition-all cursor-pointer p-3.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#107E57] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(empName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                        {empName}
                      </p>
                      <p className="text-[11px] text-[#8B5A2B]/80 truncate">
                        ID: {getEmpId(r?.employeeId)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border inline-flex items-center gap-1 shrink-0 ${meta.pill}`}
                  >
                    {Icon && <Icon className="w-2.5 h-2.5" />} {meta.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs tabular-nums">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Check In</span>
                    <span className="font-medium text-gray-800">
                      {r?.checkInTime || r?.checkIn || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Check Out</span>
                    <span className="font-medium text-gray-800">
                      {r?.checkOutTime || r?.checkOut || "—"}
                    </span>
                  </div>
                  {!isAbsentOrLeave && (
                    <div className="flex items-center justify-between text-gray-500 pt-1.5 border-t border-gray-100">
                      <span>Working Hours</span>
                      <span className="font-semibold text-gray-900">
                        {(Number.isNaN(workingHoursNum)
                          ? 0
                          : workingHoursNum
                        ).toFixed(1)}
                        h
                        {overtimeNum > 0 && (
                          <span className="text-[#A06126] ml-1">
                            (+{overtimeNum.toFixed(1)}h)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {r?.location && (
                  <p className="mt-2.5 pt-1.5 border-t border-gray-100 text-[11px] text-[#8B5A2B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#A06126]" /> {r.location}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}