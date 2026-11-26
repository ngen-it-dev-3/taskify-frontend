// components/orders/UpdateStepModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { FulfillmentStep } from "@/types/orders/types";

interface UpdateStepModalProps {
  isOpen: boolean;
  step: FulfillmentStep | null;
  onClose: () => void;
  onConfirm: (payload: { dateCompleted: string; documentReference: string }) => void;
}

export default function UpdateStepModal({
  isOpen,
  step,
  onClose,
  onConfirm,
}: UpdateStepModalProps) {
  const [dateCompleted, setDateCompleted] = useState("");
  const [documentReference, setDocumentReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDateCompleted("");
      setDocumentReference("");
      setError("");
    }
  }, [isOpen, step]);

  if (!isOpen || !step) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateCompleted.trim() || !documentReference.trim()) {
      setError("Please fill in both Date Completed and Document Reference.");
      return;
    }

    onConfirm({
      dateCompleted: dateCompleted.trim(),
      documentReference: documentReference.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-[540px] bg-white rounded-md border border-[#e5dfd3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#181612]">
              Update Step — {step.title}
            </h3>
            <p className="text-[12px] text-[#6f6960] mt-1">
              Mark this step complete with the supporting document reference. This becomes part of the order&apos;s permanent record.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded bg-[#f4f1ea] hover:bg-[#e8e3d7] text-[#4a453e] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                DATE COMPLETED *
              </label>
              <input
                type="text"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
                placeholder="DD Mon YYYY"
                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                DOCUMENT REFERENCE *
              </label>
              <input
                type="text"
                value={documentReference}
                onChange={(e) => setDocumentReference(e.target.value)}
                placeholder="e.g. Invoice INV-2026-0088, or Bank"
                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded border border-[#d6cfc2] text-[12px] font-medium text-[#4a453e] hover:bg-[#f7f4ed] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#8a5a14] hover:bg-[#734a0f] text-white text-[12px] font-semibold transition-colors cursor-pointer"
            >
              Mark Step Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}