"use client";

import { AttendanceRecord } from "@/app/(dashboard)/hr/attendance/dashboard/page";
import { Users } from "lucide-react";

interface Props {
  records: AttendanceRecord[];
  focusEmployeeId: string | null;
  onToggleFocus: (id: string) => void;
}

const getInitials = (name?: string | null): string => {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getEmployeeId = (record: AttendanceRecord): string => {
  const emp = record?.employeeId;
  if (!emp) return "";
  if (typeof emp === "string") return emp.trim();
  if (typeof emp === "object") {
    return String(emp._id ?? emp.id ?? "").trim();
  }
  return "";
};

const getEmployeeName = (record: AttendanceRecord): string => {
  if (record?.employeeName?.trim()) return record.employeeName.trim();
  if (record?.employeeId && typeof record.employeeId === "object") {
    return record.employeeId.fullName?.trim() || "Unknown Employee";
  }
  return "Unknown Employee";
};

const getEmployeeEmail = (record: AttendanceRecord): string => {
  if (record?.employeeEmail?.trim()) return record.employeeEmail.trim();
  if (record?.employeeId && typeof record.employeeId === "object") {
    return record.employeeId.email?.trim() || "";
  }
  return "—";
};

const STATUS_META: Record<string, { dot: string; label: string }> = {
  present: { dot: "bg-emerald-500", label: "Present" },
  late: { dot: "bg-amber-500", label: "Late" },
  "half-day": { dot: "bg-blue-500", label: "Half Day" },
  "on-leave": { dot: "bg-purple-500", label: "On Leave" },
  absent: { dot: "bg-rose-500", label: "Absent" },
};

export default function EmployeeSummaryTable({
  records,
  focusEmployeeId,
  onToggleFocus,
}: Props) {
  const safeRecords = Array.isArray(records) ? records.filter(Boolean) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden mb-6">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            Employee Attendance Summary
          </h2>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Click an employee row to filter their record below
        </p>
      </div>

      <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-100">
              {["Employee", "Department", "Check In → Out", "Hours", "Status"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {safeRecords.length > 0 ? (
              safeRecords.map((record, index) => {
                const empId = getEmployeeId(record);
                const empName = getEmployeeName(record);
                const empEmail = getEmployeeEmail(record);
                const active = Boolean(empId && focusEmployeeId === empId);

                const meta = STATUS_META[record.status] || {
                  dot: "bg-gray-400",
                  label: record.status || "Unknown",
                };

                const workingHoursNum = Number(record.workingHours ?? 0);
                const showHours =
                  record.status !== "absent" && record.status !== "on-leave";

                return (
                  <tr
                    key={record._id || empId || `row-${index}`}
                    onClick={() => empId && onToggleFocus(empId)}
                    className={`transition-colors ${
                      empId ? "cursor-pointer" : "cursor-default"
                    } ${active ? "bg-green-50/70" : "hover:bg-gray-50/70"}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {getInitials(empName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            {empName}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">
                            {empEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {record.employeeDepartment?.trim() || "—"}
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {record.checkInTime || record.checkIn || "—"}{" "}
                      <span className="text-gray-300 mx-1">→</span>{" "}
                      {record.checkOutTime || record.checkOut || "—"}
                    </td>

                    <td className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {showHours
                        ? `${(Number.isNaN(workingHoursNum) ? 0 : workingHoursNum).toFixed(1)}h`
                        : "—"}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          active ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-xs text-gray-400"
                >
                  No attendance summary available for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}