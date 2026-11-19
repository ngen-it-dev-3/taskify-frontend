"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/90",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/90",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200/90",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const leaveTypeLabels: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
};

interface LeaveRequest {
  _id: string;
  type: "sick" | "casual" | "earned";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

const formatDate = (d: string) =>
  !d ? "N/A" : new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

/* ---------- Detail Modal ---------- */
export function LeaveDetailModal({
  leave,
  onClose,
}: {
  leave: LeaveRequest | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {leave && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-2xl border border-stone-200 max-w-md w-full shadow-xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                <h2 className="text-lg font-bold text-stone-900">Leave Request Details</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[leave.status]}`}>
                  {statusLabels[leave.status]}
                </span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-stone-400 font-medium">Type</span>
                  <span className="font-semibold text-stone-800">{leaveTypeLabels[leave.type]}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-stone-400 font-medium">Duration</span>
                  <span className="font-semibold text-stone-800">
                    {leave.totalDays} days ({formatDate(leave.startDate)} – {formatDate(leave.endDate)})
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-stone-400 font-medium block mb-1">Reason</span>
                  <p className="text-stone-700 bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/70 text-xs leading-relaxed">
                    {leave.reason || "No reason specified."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Delete Confirm Modal ---------- */
export function DeleteLeaveModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-2xl border border-stone-200 max-w-md w-full shadow-xl"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-50 border border-rose-200/70 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-stone-900">Delete Leave Request</h2>
              </div>
              <p className="text-stone-600 mb-6 text-sm leading-relaxed">
                Are you sure you want to delete this leave request? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 text-stone-700 px-4 py-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}