"use client";

import { memo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { AttendanceRecord, AttendanceStats } from "@/app/(dashboard)/hr/attendance/page";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface BarItem {
  name: string;
  hours: number;
  overtime: number;
}

const getSafeEmployeeName = (r: AttendanceRecord): string => {
  if (r?.employeeId && typeof r.employeeId === "object" && r.employeeId.fullName?.trim()) {
    return r.employeeId.fullName.trim();
  }
  return r?.employeeName?.trim() || "Unknown";
};

// --- Donut Chart Component ---
const DonutChart = memo(function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue: number;
  centerLabel: string;
}) {
  const safeSegments = Array.isArray(segments) ? segments : [];
  const total = safeSegments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const visibleSegments = safeSegments.filter((s) => Number(s.value) > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[190px] h-[190px]">
        <svg viewBox="0 0 190 190" className="w-full h-full -rotate-90">
          <circle
            cx="95"
            cy="95"
            r={radius}
            fill="none"
            stroke="#FAF8F4"
            strokeWidth="22"
          />
          {total > 0 &&
            visibleSegments.map((seg) => {
              const val = Number(seg.value) || 0;
              const fraction = val / total;
              const dashLength = fraction * circumference;
              const currentOffset = accumulatedOffset;
              accumulatedOffset += dashLength;

              return (
                <circle
                  key={seg.label}
                  cx="95"
                  cy="95"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="22"
                  strokeDasharray={`${Math.max(dashLength - 3, 0.5)} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-bold text-gray-900 tabular-nums">
            {centerValue}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B5A2B]">
            {centerLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 flex-wrap justify-center mt-4">
        {visibleSegments.map((seg) => (
          <span
            key={seg.label}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span>
              {seg.label} ({seg.value})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});

// --- Bar Chart Component ---
const HoursBarChart = memo(function HoursBarChart({ bars }: { bars: BarItem[] }) {
  const safeBars = Array.isArray(bars) ? bars : [];
  const maxTotal = Math.max(
    ...safeBars.map((b) => (Number(b.hours) || 0) + (Number(b.overtime) || 0)),
    1
  );

  return (
    <div>
      <div className="flex items-end justify-around gap-3 h-[190px] px-2">
        {safeBars.map((bar) => {
          const hoursNum = Number(bar.hours) || 0;
          const overtimeNum = Number(bar.overtime) || 0;
          const totalH = hoursNum + overtimeNum;
          const hPct = Math.min((hoursNum / maxTotal) * 100, 100);
          const oPct = Math.min((overtimeNum / maxTotal) * 100, 100);

          return (
            <div
              key={`${bar.name}-${totalH}`}
              className="flex flex-col items-center gap-1.5 flex-1 max-w-[72px] h-full justify-end group"
            >
              <span className="text-[11px] font-bold text-[#8B5A2B] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {totalH.toFixed(1)}h
              </span>
              <div
                className="w-8 rounded-t-md overflow-hidden flex flex-col justify-end bg-[#FAF8F4] border border-gray-200/70"
                style={{ height: "150px" }}
              >
                {overtimeNum > 0 && (
                  <div
                    className="w-full bg-[#A06126]"
                    style={{ height: `${oPct}%` }}
                    title={`Overtime: ${overtimeNum.toFixed(1)}h`}
                  />
                )}
                <div
                  className="w-full bg-[#107E57]"
                  style={{ height: `${hPct}%` }}
                  title={`Worked: ${hoursNum.toFixed(1)}h`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-around gap-3 px-2 mt-2 border-t border-gray-200/70 pt-2">
        {safeBars.map((bar, idx) => (
          <p
            key={`${bar.name}-lbl-${idx}`}
            className="flex-1 max-w-[72px] text-center text-[11px] font-medium text-gray-600 truncate"
            title={bar.name}
          >
            {bar.name.split(" ")[0]}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-center gap-5 mt-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#107E57]" /> Worked
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A06126]" /> Overtime
        </span>
      </div>
    </div>
  );
});

// --- Main Charts Wrapper ---
export default function AttendanceCharts({
  stats,
  records,
}: {
  stats: AttendanceStats;
  records: AttendanceRecord[];
}) {
  const safeRecords = Array.isArray(records) ? records.filter(Boolean) : [];

  const donutSegments: DonutSegment[] = [
    { label: "Present", value: Number(stats?.present ?? 0), color: "#107E57" },
    { label: "Late", value: Number(stats?.late ?? 0), color: "#D97706" },
    { label: "Double Late", value: Number(stats?.doubleLate ?? 0), color: "#A06126" },
    { label: "Half Day", value: Number(stats?.halfDay ?? 0), color: "#2563EB" },
    { label: "On Leave", value: Number(stats?.onLeave ?? 0), color: "#7C3AED" },
    { label: "Absent", value: Number(stats?.absent ?? 0), color: "#E11D48" },
  ];

  const topWorkers: BarItem[] = [...safeRecords]
    .filter((r) => (Number(r?.workingHours) || 0) + (Number(r?.overtime) || 0) > 0)
    .sort(
      (a, b) =>
        (Number(b?.workingHours) || 0) +
        (Number(b?.overtime) || 0) -
        ((Number(a?.workingHours) || 0) + (Number(a?.overtime) || 0))
    )
    .slice(0, 5)
    .map((r) => ({
      name: getSafeEmployeeName(r),
      hours: Number(r?.workingHours) || 0,
      overtime: Number(r?.overtime) || 0,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-2xs border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70">
              <BarChart3 className="w-4 h-4 text-[#107E57]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Status Distribution
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#A06126]/20 rounded-md text-[10px] font-semibold text-[#8B5A2B] uppercase tracking-wider">
            Overview
          </span>
        </div>

        <DonutChart
          segments={donutSegments}
          centerValue={Number(stats?.totalEmployees ?? 0)}
          centerLabel="Employees"
        />
      </div>

      <div className="lg:col-span-3 bg-white rounded-xl shadow-2xs border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FAF8F4] border border-[#A06126]/25">
              <TrendingUp className="w-4 h-4 text-[#A06126]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Top Working Hours
            </h2>
          </div>
          <span className="px-2.5 py-1 bg-[#FAF8F4] border border-gray-200/80 rounded-lg text-[11px] font-medium text-gray-600">
            Top 5 Employees
          </span>
        </div>

        {topWorkers.length > 0 ? (
          <HoursBarChart bars={topWorkers} />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
            No working hours recorded yet
          </div>
        )}
      </div>
    </div>
  );
}