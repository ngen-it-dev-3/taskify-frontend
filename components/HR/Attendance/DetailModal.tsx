// components/HR/Attendance/DetailModal.tsx
"use client";

import { AttendanceRecord } from "@/app/(dashboard)/hr/attendance/dashboard/page";
import {
  XCircle,
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  UserX,
  AlertTriangle,
} from "lucide-react";

interface Props {
  detail: AttendanceRecord | null;
  onClose: () => void;
}

type StatusConfig = {
  label: string;
  pill: string;
  icon: any;
};

const STATUS_META: Record<string, StatusConfig> = {
  present: {
    label: "Present",
    pill: "bg-emerald-50 text-[#107E57] border-emerald-200",
    icon: CheckCircle,
  },
  late: {
    label: "Late",
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
    icon: UserX,
  },
  absent: {
    label: "Absent",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
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

const getEmpName = (d: AttendanceRecord): string => {
  if (d?.employeeId && typeof d.employeeId === "object" && d.employeeId.fullName?.trim()) {
    return d.employeeId.fullName.trim();
  }
  return d?.employeeName?.trim() || "Unknown Employee";
};

const getEmpEmail = (d: AttendanceRecord): string => {
  if (d?.employeeId && typeof d.employeeId === "object" && d.employeeId.email?.trim()) {
    return d.employeeId.email.trim();
  }
  return d?.employeeEmail?.trim() || "—";
};

export default function DetailModal({ detail, onClose }: Props) {
  if (!detail) return null;

  const statusKey = String(detail?.status || "absent").toLowerCase();
  const meta = STATUS_META[statusKey] || STATUS_META.absent;
  const Icon = meta.icon;

  const empName = getEmpName(detail);
  const empEmail = getEmpEmail(detail);
  const isAbsentOrLeave = statusKey === "absent" || statusKey === "on-leave";
  const workingHoursNum = Number(detail?.workingHours ?? 0);
  const overtimeNum = Number(detail?.overtime ?? 0);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cream Header */}
        <div className="bg-[#FAF8F4] px-6 py-4 border-b border-gray-200/90 flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#107E57] flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-2xs">
              {getInitials(empName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{empName}</h2>
              <p className="text-xs text-gray-500 truncate">{empEmail}</p>
              <p className="text-[11px] font-medium text-[#8B5A2B] mt-0.5">
                ID: {getEmpId(detail?.employeeId)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors shrink-0"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Status
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${meta.pill}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />} {meta.label}
              </span>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Department
              </h3>
              <p className="text-gray-800 font-medium flex items-center gap-1.5 text-sm">
                <Building2 className="w-4 h-4 text-[#8B5A2B]" />
                {detail?.employeeDepartment || "—"}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Position
              </h3>
              <p className="text-gray-800 font-medium flex items-center gap-1.5 text-sm">
                <Briefcase className="w-4 h-4 text-[#8B5A2B]" />
                {detail?.employeePosition || "—"}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Date
              </h3>
              <p className="text-gray-800 font-medium flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-[#107E57]" />
                {detail?.date
                  ? new Date(detail.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Time & Hours Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF8F4] border border-gray-200/80 rounded-xl tabular-nums">
            <div className="text-center bg-white p-3 rounded-lg border border-gray-200/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Check In
              </p>
              <p className="text-base font-bold text-gray-900">
                {detail?.checkInTime || detail?.checkIn || "—"}
              </p>
            </div>

            <div className="text-center bg-white p-3 rounded-lg border border-gray-200/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Check Out
              </p>
              <p className="text-base font-bold text-gray-900">
                {detail?.checkOutTime || detail?.checkOut || "—"}
              </p>
            </div>

            {!isAbsentOrLeave && (
              <>
                <div className="text-center bg-white p-3 rounded-lg border border-gray-200/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Working Hours
                  </p>
                  <p className="text-base font-bold text-[#107E57]">
                    {(Number.isNaN(workingHoursNum) ? 0 : workingHoursNum).toFixed(1)}h
                  </p>
                </div>

                <div className="text-center bg-white p-3 rounded-lg border border-gray-200/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Overtime
                  </p>
                  <p
                    className={`text-base font-bold ${
                      overtimeNum > 0 ? "text-[#A06126]" : "text-gray-400"
                    }`}
                  >
                    {overtimeNum > 0 ? `+${overtimeNum.toFixed(1)}h` : "0h"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Location */}
          {detail?.location && (
            <div className="flex items-center gap-2 text-xs text-[#8B5A2B] bg-[#FAF8F4]/70 px-3.5 py-2.5 rounded-lg border border-[#A06126]/20">
              <MapPin className="w-4 h-4 text-[#A06126] shrink-0" />
              <span className="font-medium">Source / Location:</span>
              <span className="font-semibold text-gray-800">{detail.location}</span>
            </div>
          )}

          {/* Notes Section */}
          {detail?.notes && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Notes
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 bg-[#FAF8F4] p-3.5 rounded-lg border border-gray-200/80 leading-relaxed">
                {detail.notes}
              </p>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer w-full sm:w-auto px-6 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg transition-colors text-xs font-semibold shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}