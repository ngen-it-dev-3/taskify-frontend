"use client";

import { AttendanceStats } from "@/app/(dashboard)/hr/attendance/dashboard/page";
import { Users, CheckCircle, UserX, Activity } from "lucide-react";

interface Props {
  stats: AttendanceStats;
}

export default function StatsCards({ stats }: Props) {
  const totalEmployees = Number(stats?.totalEmployees ?? 0);
  const present = Number(stats?.present ?? 0);
  const late = Number(stats?.late ?? 0);
  const doubleLate = Number(stats?.doubleLate ?? 0);
  const halfDay = Number(stats?.halfDay ?? 0);
  const absent = Number(stats?.absent ?? 0);
  const onLeave = Number(stats?.onLeave ?? 0);
  const attendanceRate = Number(stats?.attendanceRate ?? 0);
  const totalWorkingHours = Number(stats?.totalWorkingHours ?? 0);
  const totalOvertime = Number(stats?.totalOvertime ?? 0);

  const totalPresentToday = present + late + doubleLate + halfDay;
  const totalLateCount = late + doubleLate;
  const totalAwayToday = absent + onLeave;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Staff — Emerald + Warm Brown Subtle Accent */}
      <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-5 hover:border-[#A06126]/35 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
            Total Staff Tracked
          </p>
          <div className="p-2 rounded-lg bg-[#FAF8F4] border border-[#A06126]/20">
            <Users className="w-4 h-4 text-[#8B5A2B]" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {totalEmployees}
        </p>
        <p className="text-xs text-[#8B5A2B]/80 font-medium mt-1.5">
          Across all departments
        </p>
      </div>

      {/* Present Today — Orvix Emerald Green */}
      <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-5 hover:border-[#107E57]/40 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
            Present Today
          </p>
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/70">
            <CheckCircle className="w-4 h-4 text-[#107E57]" />
          </div>
        </div>
        <p className="text-3xl font-bold text-[#107E57] tabular-nums">
          {totalPresentToday}
        </p>
        <p className="text-xs text-[#A06126] font-medium mt-1.5">
          {totalLateCount} arrived late
          {doubleLate > 0 ? ` (${doubleLate} double late)` : ""}
        </p>
      </div>

      {/* Away — Brown & Rose Balanced */}
      <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-5 hover:border-rose-200 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
            Away
          </p>
          <div className="p-2 rounded-lg bg-[#FAF8F4] border border-rose-200/70">
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-rose-600 tabular-nums">
          {totalAwayToday}
        </p>
        <p className="text-xs text-gray-500 mt-1.5">
          <span className="text-rose-600 font-medium">{absent} absent</span> •{" "}
          <span className="text-[#8B5A2B] font-medium">{onLeave} on leave</span>
        </p>
      </div>

      {/* Attendance Rate — Orvix Emerald Green + Warm Brown OT */}
      <div className="relative overflow-hidden bg-white rounded-xl shadow-2xs border border-[#107E57]/25 p-5 hover:border-[#107E57]/45 hover:shadow-sm transition-all">
        <div className="relative flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
            Attendance Rate
          </p>
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/70">
            <Activity className="w-4 h-4 text-[#107E57]" />
          </div>
        </div>
        <p className="relative text-3xl font-bold text-[#107E57] tabular-nums">
          {attendanceRate}%
        </p>
        <p className="relative text-xs text-gray-500 mt-1.5 tabular-nums">
          {totalWorkingHours.toFixed(1)}h worked •{" "}
          <span className="text-[#A06126] font-semibold">
            +{totalOvertime.toFixed(1)}h OT
          </span>
        </p>
      </div>
    </div>
  );
}