"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, User, Calendar, AlertTriangle, UserPlus, Phone, FileSignature,
  Check, Loader2, Clock
} from "lucide-react";
import toast from "react-hot-toast";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave", countable: true },
  { value: "casual", label: "Casual Leave", countable: true },
  { value: "earned", label: "Earned Leave", countable: true },
  { value: "half_day", label: "Half Day Leave", countable: false }, // ✅ Uncountable
];

const DEFAULT_BALANCES: Record<string, number> = {
  sick: 10,
  casual: 8,
  earned: 6,
};

interface ApplyLeaveModalProps {
  open: boolean;
  user: any;
  leaveBalances: any[];
  substitutes: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}

export default function ApplyLeaveModal({
  open, user, leaveBalances, substitutes, isSubmitting, onClose, onSubmit,
}: ApplyLeaveModalProps) {

  const [form, setForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    halfDayType: "first_half" as "first_half" | "second_half",
    isPreviousDayOff: false,
    isNextDayOff: false,
    isGovernmentHoliday: false,
    holidayNote: "",
    substituteId: "",
    reason: "",
    additionalDetails: "",
    contactDuringLeave: "",
    emergencyContact: { name: "", phone: "", relation: "" },
    signatureText: "",
  });

  if (!open) return null;

  const isHalfDay = form.type === "half_day";

  const getBalance = (type: string) =>
    leaveBalances.find((b) => b.leaveType === type);

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = isHalfDay ? 0.5 : calcDays(form.startDate, form.endDate);
  const remaining = getBalance(form.type)?.remaining ?? DEFAULT_BALANCES[form.type] ?? 0;

  // Leave Type পরিবর্তনের লজিক
  const handleTypeChange = (selectedType: string) => {
    setForm((prev) => ({
      ...prev,
      type: selectedType,
      // Half day হলে endDate অটোমেটিক startDate এর সমান হয়ে যাবে
      endDate: selectedType === "half_day" ? prev.startDate : prev.endDate,
    }));
  };

  // Start Date পরিবর্তনের লজিক
  const handleStartDateChange = (date: string) => {
    setForm((prev) => ({
      ...prev,
      startDate: date,
      endDate: prev.type === "half_day" ? date : prev.endDate,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) {
      toast.error("Please select a leave type first!");
      return;
    }

    onSubmit({
      ...form,
      endDate: isHalfDay ? form.startDate : form.endDate,
      isHalfDay,
      halfDayType: isHalfDay ? form.halfDayType : null,
      totalDays,
      holidayNote: form.holidayNote || undefined,
      substituteId: form.substituteId || undefined,
      contactDuringLeave: form.contactDuringLeave || undefined,
      emergencyContact: {
        name: form.emergencyContact.name || undefined,
        phone: form.emergencyContact.phone || undefined,
        relation: form.emergencyContact.relation || undefined,
      },
      additionalDetails: form.additionalDetails || undefined,
      signatureText: form.signatureText || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Apply for Leave</h2>
            <p className="text-xs text-gray-500">Submit a new leave request</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Personal Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-emerald-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Employee Name</label>
                <input type="text" value={user?.fullName || ""} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                <input type="text" value={user?.departmentId?.name || "Not Assigned"} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <input type="text" value={user?.role?.replace(/_/g, " ").toUpperCase() || ""} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-600" /> Leave Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEAVE TYPE SELECT */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  required
                >
                  <option value="" disabled hidden>Select leave type...</option>
                  {LEAVE_TYPES.map((t) => {
                    const b = getBalance(t.value);
                    const left = b?.remaining ?? DEFAULT_BALANCES[t.value];
                    return (
                      <option key={t.value} value={t.value}>
                        {t.countable ? `${t.label} (${left} left)` : `${t.label} (Uncountable)`}
                      </option>
                    );
                  })}
                </select>

                {/* Balance / Status Display */}
                {form.type && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {isHalfDay ? (
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        <Clock size={12} /> Flexible / No balance deduction
                      </span>
                    ) : (
                      <>
                        <span className="text-gray-500">Balance:</span>
                        <span className={`font-semibold ${remaining <= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {remaining} days remaining
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* HALF DAY SHIFT SELECTOR (Only shows when Half Day is selected) */}
              {isHalfDay ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Half Day Slot <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "first_half", label: "First Half" },
                      { value: "second_half", label: "Second Half" },
                    ].map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setForm({ ...form, halfDayType: slot.value as any })}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${form.halfDayType === slot.value
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="hidden md:block" />
              )}

              {/* DATES */}
              <div className={isHalfDay ? "md:col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {isHalfDay ? "Leave Date" : "Start Date"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  required
                />
              </div>

              {!isHalfDay && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    required
                  />
                </div>
              )}
            </div>

            {/* Duration Preview */}
            {form.startDate && (isHalfDay || form.endDate) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center"
              >
                <span className="text-xs font-medium text-emerald-800">Total Duration:</span>
                <span className="text-sm font-bold text-emerald-700">
                  {isHalfDay
                    ? `0.5 Day (${form.halfDayType === "first_half" ? "First Half" : "Second Half"})`
                    : `${totalDays} Full ${totalDays === 1 ? "Day" : "Days"}`}
                </span>
              </motion.div>
            )}
          </div>

          {/* Holiday & Off Days */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Holiday & Off Days
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "isPreviousDayOff", label: "Previous Day Off" },
                { key: "isNextDayOff", label: "Next Day Off" },
                { key: "isGovernmentHoliday", label: "Government Holiday" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Holiday Note</label>
                <input type="text" value={form.holidayNote} onChange={(e) => setForm({ ...form, holidayNote: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none" placeholder="Specify details..." />
              </div>
            </div>
          </div>

          {/* Substitute */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserPlus size={14} className="text-blue-500" /> Substitute / Backup
            </h3>
            <select value={form.substituteId} onChange={(e) => setForm({ ...form, substituteId: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none">
              <option value="">Select a substitute (Optional)</option>
              {substitutes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.departmentId?.name || "No Dept"})
                </option>
              ))}
            </select>
          </div>

          {/* Contact & Reason */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Phone size={14} className="text-emerald-600" /> Contact & Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Reason <span className="text-rose-500">*</span></label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:border-emerald-500 outline-none" placeholder="Why are you taking leave?" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Emergency Contact Name</label>
                  <input type="text" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Emergency Phone</label>
                  <input type="text" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileSignature size={14} className="text-emerald-600" /> Digital Signature
            </h3>
            <input type="text" value={form.signatureText} onChange={(e) => setForm({ ...form, signatureText: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" placeholder="Type your full name to sign" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Submit Request</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl transition-all font-semibold text-sm">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}