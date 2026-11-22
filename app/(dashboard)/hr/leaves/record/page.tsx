"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Loader2,
  Check,
  X,
  Ban,
  ChevronRight,
  Star,
  Heart,
  Sun,
  Trash2,
  FileText,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { badgeService } from "@/lib/badgeService";

// ============================================================================
// STRICT TYPES & CONSTANTS
// ============================================================================

export type LeaveType = "sick" | "casual" | "earned" | "half_day";
export type LeaveStatusValue = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveStatusFilter = "all" | LeaveStatusValue;
export type ViewMode = "grid" | "table";
export type DateRangeFilter = "all" | "this-month" | "last-month" | "this-quarter";
export type HalfDaySlot = "first_half" | "second_half";

export interface DepartmentRef {
  _id: string;
  name: string;
  code?: string;
}

export interface EmployeeRef {
  _id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  departmentId?: DepartmentRef | string | null;
  position?: string;
  profilePhoto?: string;
}

export interface ApproverRef {
  _id: string;
  fullName: string;
  email: string;
}

export interface LeaveRequest {
  _id: string;
  employeeId: EmployeeRef | string | null;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay?: boolean;
  halfDayType?: HalfDaySlot | null;
  reason: string;
  status: LeaveStatusValue;
  substituteName?: string;
  notes?: string;
  approvedBy?: ApproverRef | string | null;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface StatItem {
  key: LeaveStatusFilter;
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}

const HR_ROLES = new Set(["super_admin", "admin", "hr_manager"]);

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
  half_day: "Half Day Leave",
};

const LEAVE_TYPE_ICONS: Record<LeaveType, LucideIcon> = {
  sick: Heart,
  casual: Sun,
  earned: Star,
  half_day: Clock,
};

const STATUS_BADGE_STYLES: Record<LeaveStatusValue, string> = {
  pending: "bg-amber-100/70 text-amber-800 border-amber-200",
  approved: "bg-emerald-100/70 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100/70 text-rose-800 border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_ICONS: Record<LeaveStatusValue, LucideIcon> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: Ban,
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiErrorResponse;
  return err?.response?.data?.message || fallback;
}

function getEmployeeField(
  emp: LeaveRequest["employeeId"],
  field: keyof EmployeeRef,
  fallback = "N/A"
): string {
  if (!emp || typeof emp !== "object") return fallback;
  if (field === "departmentId") {
    const dept = emp.departmentId;
    if (dept && typeof dept === "object") return dept.name || fallback;
    return fallback;
  }
  const val = emp[field];
  return typeof val === "string" && val.trim() ? val : fallback;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? "N/A" : DATE_FORMATTER.format(parsed);
}

function formatDuration(leave: LeaveRequest): string {
  if (leave.type === "half_day" || leave.isHalfDay || leave.totalDays === 0.5) {
    const slotLabel =
      leave.halfDayType === "first_half"
        ? "First Half"
        : leave.halfDayType === "second_half"
          ? "Second Half"
          : "Half Day";
    return `0.5 Day (${slotLabel})`;
  }
  return `${leave.totalDays} ${leave.totalDays === 1 ? "Day" : "Days"}`;
}

function matchesDateRange(createdAt: string, range: DateRangeFilter): boolean {
  if (range === "all") return true;
  const target = new Date(createdAt).getTime();
  if (Number.isNaN(target)) return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (range === "this-month") {
    return target >= new Date(year, month, 1).getTime();
  }
  if (range === "last-month") {
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    return target >= start && target <= end;
  }
  if (range === "this-quarter") {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    return target >= new Date(year, quarterStartMonth, 1).getTime();
  }
  return true;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function LeavePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf8f4] px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="container mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-36 bg-slate-200 rounded" />
          <div className="h-7 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-80 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 bg-white rounded-xl border border-slate-200 p-4"
            />
          ))}
        </div>
        <div className="h-14 bg-white rounded-xl border border-slate-200" />
        <div className="h-80 bg-white rounded-xl border border-slate-200" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveRecordPage(): React.JSX.Element {
  const { user, isAuthenticated } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const [filterStatus, setFilterStatus] = useState<LeaveStatusFilter>("all");
  const [filterType, setFilterType] = useState<"all" | LeaveType>("all");
  const [filterDateRange, setFilterDateRange] = useState<DateRangeFilter>("all");

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [statusAction, setStatusAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const isHR = useMemo(
    () => Boolean(user?.role && HR_ROLES.has(user.role)),
    [user?.role]
  );

  const fetchLeaveData = useCallback(async (isManualRefresh = false): Promise<void> => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }
      const res = await api.get<ApiListResponse<LeaveRequest>>("/leaves/all");
      if (res.data?.success) {
        const records = Array.isArray(res.data.data) ? res.data.data : [];
        setLeaveRequests(records);

        const pendingCount = records.reduce(
          (acc, item) => (item.status === "pending" ? acc + 1 : acc),
          0
        );
        badgeService.setBadge("pendingLeaves", pendingCount);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load leave records"));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchLeaveData(false);
    } else {
      setInitialLoading(false);
    }
  }, [isAuthenticated, fetchLeaveData]);

  useEffect(() => {
    const anyModalOpen = showViewModal || showStatusModal || showDeleteConfirm;
    if (!anyModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submittingAction) {
        setShowViewModal(false);
        setShowStatusModal(false);
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showViewModal, showStatusModal, showDeleteConfirm, submittingAction]);

  const openStatusModal = useCallback(
    (leave: LeaveRequest, action: "approved" | "rejected"): void => {
      setSelectedLeave(leave);
      setStatusAction(action);
      setRejectionReason("");
      setShowStatusModal(true);
    },
    []
  );

  const openViewModal = useCallback((leave: LeaveRequest): void => {
    setSelectedLeave(leave);
    setShowViewModal(true);
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected"
  ): Promise<void> => {
    const trimmedReason = rejectionReason.trim();
    if (status === "rejected" && !trimmedReason) {
      toast.error("Rejection reason is required.");
      return;
    }

    try {
      setSubmittingAction(true);
      await api.patch(`/leaves/${id}/status`, {
        status,
        ...(status === "rejected" ? { rejectionReason: trimmedReason } : {}),
      });
      toast.success(`Leave ${status} successfully!`);
      setShowStatusModal(false);
      setShowViewModal(false);
      setRejectionReason("");
      await fetchLeaveData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update status"));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedLeave) return;
    try {
      setSubmittingAction(true);
      await api.delete(`/leaves/${selectedLeave._id}`);
      toast.success("Leave request deleted");
      setShowDeleteConfirm(false);
      setSelectedLeave(null);
      await fetchLeaveData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete leave request"));
    } finally {
      setSubmittingAction(false);
    }
  };

  const statsCards = useMemo<StatItem[]>(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const item of leaveRequests) {
      if (item.status === "pending") pending += 1;
      else if (item.status === "approved") approved += 1;
      else if (item.status === "rejected") rejected += 1;
    }

    return [
      {
        key: "all",
        label: "Total",
        value: leaveRequests.length,
        icon: FileText,
        colorClass: "text-slate-600",
      },
      {
        key: "pending",
        label: "Pending",
        value: pending,
        icon: Clock,
        colorClass: "text-amber-600",
      },
      {
        key: "approved",
        label: "Approved",
        value: approved,
        icon: CheckCircle,
        colorClass: "text-emerald-600",
      },
      {
        key: "rejected",
        label: "Rejected",
        value: rejected,
        icon: XCircle,
        colorClass: "text-rose-600",
      },
    ];
  }, [leaveRequests]);

  const filteredLeaves = useMemo<LeaveRequest[]>(() => {
    return leaveRequests
      .filter((leave) => {
        if (filterStatus !== "all" && leave.status !== filterStatus) {
          return false;
        }
        if (filterType !== "all" && leave.type !== filterType) {
          return false;
        }
        if (!matchesDateRange(leave.createdAt, filterDateRange)) {
          return false;
        }
        if (deferredSearch) {
          const empName = getEmployeeField(leave.employeeId, "fullName", "").toLowerCase();
          const empEmail = getEmployeeField(leave.employeeId, "email", "").toLowerCase();
          const reason = (leave.reason || "").toLowerCase();
          if (
            !empName.includes(deferredSearch) &&
            !empEmail.includes(deferredSearch) &&
            !reason.includes(deferredSearch)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [leaveRequests, filterStatus, filterType, filterDateRange, deferredSearch]);

  if (initialLoading) {
    return <LeavePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] font-sans pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
          >
            <Link href="/dashboard" className="hover:text-[#A06126] transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <Link href="/hr" className="hover:text-[#A06126] transition-colors">
              HR
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#A06126]">Leave Record</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Leave Records
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage, approve, and track employee leave requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchLeaveData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsCards.map((stat) => {
            const IconComponent = stat.icon;
            const isActiveFilter = filterStatus === stat.key;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => setFilterStatus(stat.key)}
                className={`text-left bg-white rounded-xl border p-4 flex flex-col justify-between transition shadow-sm hover:shadow-md ${isActiveFilter
                    ? "border-[#A06126] ring-2 ring-[#A06126]/15"
                    : "border-slate-200"
                  }`}
              >
                <div className="flex justify-between items-start w-full">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <IconComponent className={`w-4 h-4 ${stat.colorClass}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stat.value}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as LeaveStatusFilter)
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              aria-label="Filter by leave type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | LeaveType)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]"
            >
              <option value="all">All Types</option>
              {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              aria-label="Filter by date range"
              value={filterDateRange}
              onChange={(e) =>
                setFilterDateRange(e.target.value as DateRangeFilter)
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#A06126]"
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
            </select>

            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 ml-auto md:ml-0">
              <button
                type="button"
                aria-label="Table view"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition ${viewMode === "table"
                    ? "bg-white shadow-sm text-[#A06126]"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition ${viewMode === "grid"
                    ? "bg-white shadow-sm text-[#A06126]"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table / Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => {
                      const TypeIcon = LEAVE_TYPE_ICONS[leave.type] || Calendar;
                      const StatusIcon = STATUS_ICONS[leave.status] || Clock;
                      const empName = getEmployeeField(
                        leave.employeeId,
                        "fullName",
                        "Unknown"
                      );
                      const empEmail = getEmployeeField(
                        leave.employeeId,
                        "email",
                        "N/A"
                      );
                      const isPending = leave.status === "pending";

                      return (
                        <tr
                          key={leave._id}
                          onClick={() => openViewModal(leave)}
                          className="hover:bg-slate-50/80 transition group cursor-pointer"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold border border-[#A06126]/20 shrink-0">
                                {getInitials(empName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {empName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {empEmail}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                              <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                              {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                            </span>
                          </td>

                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDuration(leave)}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatDate(leave.startDate)}
                              {formatDate(leave.startDate) !==
                                formatDate(leave.endDate)
                                ? ` - ${formatDate(leave.endDate)}`
                                : ""}
                            </p>
                          </td>

                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_STYLES[leave.status]
                                }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {leave.status}
                            </span>
                          </td>

                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-1.5 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
                              {isHR && isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusModal(leave, "approved");
                                    }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusModal(leave, "rejected");
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {isHR && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLeave(leave);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {/* Eye button removed - row click handles view */}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500 text-sm"
                      >
                        No leave records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => {
                  const TypeIcon = LEAVE_TYPE_ICONS[leave.type] || Calendar;
                  const empName = getEmployeeField(
                    leave.employeeId,
                    "fullName",
                    "Unknown"
                  );
                  const deptName = getEmployeeField(
                    leave.employeeId,
                    "departmentId",
                    "Unassigned"
                  );
                  const isPending = leave.status === "pending";

                  return (
                    <div
                      key={leave._id}
                      onClick={() => openViewModal(leave)}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-xs font-bold border border-[#A06126]/20 shrink-0">
                              {getInitials(empName)}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {empName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {deptName}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border shrink-0 ${STATUS_BADGE_STYLES[leave.status]
                              }`}
                          >
                            {leave.status}
                          </span>
                        </div>

                        <div className="space-y-2 mt-4">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                            {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(leave.startDate)} -{" "}
                            {formatDate(leave.endDate)} ({formatDuration(leave)})
                          </p>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2 mt-3">
                            &ldquo;{leave.reason || "No reason provided"}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                        {isHR && isPending && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStatusModal(leave, "approved");
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStatusModal(leave, "rejected");
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isHR && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeave(leave);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-10 text-center text-slate-500 text-sm">
                  No leave records found matching your filters.
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 px-5 py-3.5 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-900">{filteredLeaves.length}</strong>{" "}
              of{" "}
              <strong className="text-slate-900">{leaveRequests.length}</strong>{" "}
              records
            </span>
          </div>
        </div>
      </div>

      {/* 1. VIEW DETAILS MODAL */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Leave Request Details
                </h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  REF: #{selectedLeave._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#A06126]/10 text-[#A06126] flex items-center justify-center text-lg font-bold border border-[#A06126]/20 shrink-0">
                  {getInitials(
                    getEmployeeField(selectedLeave.employeeId, "fullName", "Unknown")
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {getEmployeeField(selectedLeave.employeeId, "fullName", "Unknown")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {getEmployeeField(selectedLeave.employeeId, "email", "N/A")} • ID:{" "}
                    {getEmployeeField(selectedLeave.employeeId, "employeeId", "N/A")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Leave Type
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {LEAVE_TYPE_LABELS[selectedLeave.type] || selectedLeave.type}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Duration
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {formatDuration(selectedLeave)}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Start Date
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {formatDate(selectedLeave.startDate)}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    End Date
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {formatDate(selectedLeave.endDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Reason
                </p>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedLeave.reason || "No reason provided."}
                </p>
              </div>

              {selectedLeave.rejectionReason && (
                <div>
                  <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-100">
                    {selectedLeave.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              {isHR && selectedLeave.status === "pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    openStatusModal(selectedLeave, "approved");
                  }}
                  className="px-4 py-2 bg-[#A06126] hover:bg-[#88501E] text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Take Action
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. APPROVE / REJECT MODAL */}
      {showStatusModal && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {statusAction === "approved" ? "Approve Request" : "Reject Request"}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to {statusAction} this leave request?
            </p>

            {statusAction === "rejected" && (
              <div className="mb-5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Why is this rejected?"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-sm p-3 text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:border-[#A06126] focus:ring-1 focus:ring-[#A06126] bg-slate-50"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => void handleUpdateStatus(selectedLeave._id, statusAction)}
                className={`flex-1 px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 ${statusAction === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                  }`}
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Delete Leave Record?
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => void handleDelete()}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-rose-700 disabled:opacity-50"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}