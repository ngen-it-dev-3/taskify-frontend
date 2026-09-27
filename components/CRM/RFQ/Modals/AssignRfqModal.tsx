'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, UserCheck, ChevronDown, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { RFQItem } from '../types';
import { useSalespeople } from '@/hooks/crm/useSalespeople';

interface Props {
  rfq: RFQItem;
  onClose: () => void;
  onConfirm: (payload: {
    assignedTo: string;
    assignedToEmail?: string;
    priority: string;
    notes: string;
  }) => Promise<void> | void;
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AssignRfqModal({ rfq, onClose, onConfirm }: Props) {
  // ---- Users (cached) ----
  const { users, loading: loadingUsers, error: usersError } = useSalespeople();

  // ---- Form ----
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // ---- Preselect current assignee once users load ----
  useEffect(() => {
    if (!users.length || assignedTo) return;
    const current = users.find(
      (u) =>
        u.fullName === rfq.salesman ||
        u.fullName === rfq.assignedTo ||
        u.email === rfq.salesman
    );
    setAssignedTo(current?.fullName || users[0]?.fullName || '');
  }, [users, rfq.salesman, rfq.assignedTo, assignedTo]);

  // ---- ESC to close ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  // ---- Click outside ----
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      !submitting
    ) {
      onClose();
    }
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo || submitting) return;

    const selected = users.find((u) => u.fullName === assignedTo);
    setSubmitting(true);
    setSubmitError(null);

    try {
      await onConfirm({
        assignedTo,
        assignedToEmail: selected?.email,
        priority,
        notes,
      });

      // Show success state
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to assign RFQ');
      setSubmitting(false);
    }
  };

  // Pretty role label
  const roleLabel = (role: string) =>
    role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  // ---- Success view ----
  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-[#EBE6DF] p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#0F2D4A]">
            Assignment Confirmed
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            <strong className="text-slate-700">{assignedTo}</strong> has been
            assigned to this RFQ.
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            📧 Notification email sent
          </p>
        </div>
      </div>
    );
  }

  // ---- Main form view ----
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
    >
      <div
        ref={panelRef}
        className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#EBE6DF] relative animate-in zoom-in-95 duration-200"
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-start justify-between p-5 border-b border-[#F0EBE3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8F1E5] text-[#A06126] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#A06126] uppercase">
                Assign Representative
              </span>
              <h3
                id="assign-modal-title"
                className="text-sm font-serif font-bold text-[#0F2D4A] mt-0.5"
              >
                {rfq.company}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-700 transition disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------- Meta strip ---------- */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-mono">RFQ# {rfq.rfqNumber}</span>
          <span className="text-slate-300">·</span>
          <span>{rfq.country}</span>
          <span className="text-slate-300">·</span>
          <span className="text-rose-600 font-semibold">
            ⏰ {rfq.agingDays}d aging
          </span>
        </div>

        {/* ---------- Body ---------- */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Error banner */}
          {submitError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Assigned To */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">
              Assigned Salesmanager <span className="text-rose-500">*</span>
            </label>

            {loadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading users…
              </div>
            ) : usersError ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                <AlertCircle className="w-3.5 h-3.5" />
                {usersError}
              </div>
            ) : users.length === 0 ? (
              <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                No active users found.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={submitting}
                  className="w-full appearance-none bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg pl-3 pr-8 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName} — {roleLabel(u.role)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {!loadingUsers && !usersError && users.length > 0 && (
              <p className="text-[10.5px] text-slate-400 mt-1">
                {users.length} user{users.length !== 1 ? 's' : ''} available ·
                Email will be sent automatically
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((p) => {
                const active = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    disabled={submitting}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                      active
                        ? 'border-[#A06126] bg-[#F9F1E2] text-[#A06126]'
                        : 'border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50'
                    } disabled:opacity-60`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">
              Notes / Priority Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              maxLength={500}
              placeholder="e.g. Client requested pricing by Friday. Include volume discount for 50+ units."
              className="w-full bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg p-2.5 text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60"
            />
            <div className="text-right text-[10px] text-slate-400 mt-1">
              {notes.length}/500
            </div>
          </div>

          {/* ---------- Footer ---------- */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EBE3]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2DBD1] text-slate-600 font-medium hover:bg-slate-50 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || loadingUsers || !!usersError || users.length === 0
              }
              className="px-4 py-1.5 rounded-lg bg-[#A06126] text-white font-semibold hover:bg-[#88501E] transition disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Assigning…
                </>
              ) : (
                'Confirm Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}