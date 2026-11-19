"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, User, Calendar, AlertTriangle, UserPlus, Phone, FileSignature,
  Check, Loader2,
} from "lucide-react";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "earned", label: "Earned Leave" },
];

const leaveTypeLabels: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
};

const DEFAULT_LEAVE_BALANCES: Record<string, number> = {
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
  open,
  user,
  leaveBalances,
  substitutes,
  isSubmitting,
  onClose,
  onSubmit,
}: ApplyLeaveModalProps) {
  const [form, setForm] = useState({
    type: "sick",
    startDate: "",
    endDate: "",
    isHalfDay: false,
    halfDayType: "first_half",
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

  const getBalance = (type: string) =>
    leaveBalances.find((b) => b.leaveType === type);

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = Math.abs(
      new Date(end).getTime() - new Date(start).getTime()
    );
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calcDays(form.startDate, form.endDate);
  const remaining = getBalance(form.type)?.remaining ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      isHalfDay: form.isHalfDay,
      halfDayType: form.halfDayType,
      isPreviousDayOff: form.isPreviousDayOff,
      isNextDayOff: form.isNextDayOff,
      isGovernmentHoliday: form.isGovernmentHoliday,
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
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Apply for Leave</h2>
            <p className="text-xs text-gray-500">Submit a new leave request</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Personal Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-green-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee Name</label>
                <input type="text" value={user?.fullName || ""} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <input type="text" value={user?.departmentId?.name || "Not Assigned"} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <input type="text" value={user?.role?.replace(/_/g, " ").toUpperCase() || ""} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm" />
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" /> Leave Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100"
                  required
                >
                  {LEAVE_TYPES.map((t) => {
                    const b = getBalance(t.value);
                    return (
                      <option key={t.value} value={t.value}>
                        {t.label} ({b?.remaining ?? DEFAULT_LEAVE_BALANCES[t.value]} of {b?.total ?? DEFAULT_LEAVE_BALANCES[t.value]} left)
                      </option>
                    );
                  })}
                </select>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-500">Balance:</span>
                  <span className="font-medium text-gray-700">{remaining} remaining</span>
                  {remaining === 0 && <span className="text-rose-600 font-medium">(No balance left!)</span>}
                  {remaining > 0 && remaining < 3 && <span className="text-amber-600 font-medium">(Low balance!)</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Half Day</label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isHalfDay} onChange={(e) => setForm({ ...form, isHalfDay: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    <span className="text-sm text-gray-700">Half Day</span>
                  </label>
                  {form.isHalfDay && (
                    <select value={form.halfDayType} onChange={(e) => setForm({ ...form, halfDayType: e.target.value })} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm">
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date <span className="text-rose-500">*</span></label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date <span className="text-rose-500">*</span></label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
            </div>
            {totalDays > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Days:</span>
                  <span className="font-semibold text-green-700">{totalDays} days</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Remaining after request:</span>
                  <span className={`font-semibold ${remaining - totalDays < 0 ? "text-rose-600" : remaining - totalDays < 3 ? "text-amber-600" : "text-emerald-600"}`}>
                    {remaining - totalDays} days
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Holiday & Off Days */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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
                    <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Holiday Note</label>
                <input type="text" value={form.holidayNote} onChange={(e) => setForm({ ...form, holidayNote: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" placeholder="Specify holiday details" />
              </div>
            </div>
          </div>

          {/* Substitute */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserPlus size={14} className="text-blue-500" /> Substitute / Backup
            </h3>
            <select value={form.substituteId} onChange={(e) => setForm({ ...form, substituteId: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="">Select a substitute</option>
              {substitutes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.email}) - {s.departmentId?.name || "No Dept"}
                </option>
              ))}
            </select>
          </div>

          {/* Contact & Details */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Phone size={14} className="text-green-500" /> Contact & Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-rose-500">*</span></label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none" placeholder="Please provide a reason..." required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Additional Details</label>
                <textarea value={form.additionalDetails} onChange={(e) => setForm({ ...form, additionalDetails: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact During Leave</label>
                <input type="text" value={form.contactDuringLeave} onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" placeholder="Phone or email" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Emergency Contact Name</label>
                  <input type="text" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Emergency Contact Phone</label>
                  <input type="text" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileSignature size={14} className="text-green-500" /> Signature
            </h3>
            <input type="text" value={form.signatureText} onChange={(e) => setForm({ ...form, signatureText: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" placeholder="Type your full name as signature" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Submit Request</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition font-medium">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}