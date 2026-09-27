"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

type Variant = "danger" | "warning" | "info" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Customization (all optional — falls back to delete-task copy) */
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: Variant;
}

const VARIANTS: Record<
  Variant,
  {
    Icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    confirmBg: string;
  }
> = {
  danger: {
    Icon: Trash2,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    confirmBg: "bg-rose-600 hover:bg-rose-700",
  },
  warning: {
    Icon: Archive,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    confirmBg: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    Icon: AlertTriangle,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    confirmBg: "bg-[#A06126] hover:bg-[#88501E]",
  },
  success: {
    Icon: RotateCcw,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    confirmBg: "bg-emerald-600 hover:bg-emerald-700",
  },
};

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Task",
  message = "Are you sure you want to delete this task? This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
  variant = "danger",
}: Props) {
  const v = VARIANTS[variant];
  const Icon = v.Icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
          >
            <div className="p-6 text-center">
              <div
                className={`w-16 h-16 ${v.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <Icon className={`w-8 h-8 ${v.iconColor}`} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 cursor-pointer ${v.confirmBg} text-white rounded-lg transition shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-2`}
                >
                  {loading && (
                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  )}
                  {loading ? "Working…" : confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition disabled:opacity-40"
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