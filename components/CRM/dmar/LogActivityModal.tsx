// app/(dashboard)/dmar/components/LogActivityModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DmarApi,
  type ActivityType,
  type ClientType,
  type Team,
  type ActivityStatus,
  type DmarActivity,
  type DmarConstants,
} from '@/services/dmar.service';
import { inputCls, selectCls } from './constants';

interface Props {
  constants: DmarConstants | null;
  /** When present → edit mode */
  initial?: DmarActivity | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LogActivityModal({ constants, initial, onClose, onSaved }: Props) {
  const isEdit = !!initial;

  const [activityType, setActivityType] = useState<ActivityType>(
    (initial?.activityType as ActivityType) ?? 'Visited'
  );
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [company, setCompany] = useState(initial?.company ?? '');
  const [clientType, setClientType] = useState<ClientType>(
    (initial?.clientType as ClientType) ?? 'New'
  );
  const [product, setProduct] = useState(initial?.product ?? '');
  const [team, setTeam] = useState<Team>(
    (initial?.team as Team) ?? 'Marketing'
  );
  const [sector, setSector] = useState(initial?.sector ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [value, setValue] = useState(
    initial?.value != null ? String(initial.value) : ''
  );
  const [status, setStatus] = useState<ActivityStatus>(
    (initial?.status as ActivityStatus) ?? 'To Start'
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [followUp, setFollowUp] = useState(
    initial?.followUpDate
      ? new Date(initial.followUpDate).toISOString().slice(0, 10)
      : ''
  );
  const [saving, setSaving] = useState(false);

  // Sector list adapts to the selected team
  const sectorList =
    team === 'Sales'
      ? constants?.SALES_SECTORS ?? []
      : constants?.MARKETING_SECTORS ?? [];

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!activityType) {
      toast.error('Activity type is required');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        activityType,
        company: company.trim(),
        clientType,
        product: product.trim(),
        team,
        sector,
        area: area.trim(),
        value: value === '' ? null : Number(value),
        status,
        notes: notes.trim(),
        followUpDate: followUp || null,
        date: date ? new Date(date).toISOString() : undefined,
      };

      if (isEdit && initial?.id) {
        await DmarApi.update(initial.id, payload);
        toast.success('Activity updated');
      } else {
        await DmarApi.create(payload);
        toast.success('Activity logged');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              {isEdit ? 'Edit Marketing Activity' : 'Log Marketing Activity'}
            </h2>
            <p className="mt-1 max-w-lg text-[11px] text-slate-500 leading-relaxed">
              Saved here, reflected in DMAR filters, and logged to My Tasks
              automatically. New companies are added to Client 360.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Activity Type" required>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className={selectCls}
            >
              {(constants?.ACTIVITY_TYPES || [
                'Visited', 'Called', 'Emailed', 'Posted', 'Social', 'Meeting',
              ]).map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Company Name" required>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Renata Limited"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Client Type">
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as ClientType)}
              className={selectCls}
            >
              <option value="New">New</option>
              <option value="Existing">Existing</option>
            </select>
          </Field>

          <Field label="Product / Solution" full>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Flow Meter"
              className={inputCls}
            />
          </Field>

          <Field label="Team">
            <select
              value={team}
              onChange={(e) => {
                setTeam(e.target.value as Team);
                setSector('');   // reset sector when team changes
              }}
              className={selectCls}
            >
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
            </select>
          </Field>
          <Field label="Sector">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className={selectCls}
            >
              <option value="">Select sector</option>
              {sectorList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Area">
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Motijheel"
              className={inputCls}
            />
          </Field>
          <Field label="Tentative Value (৳)">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <Field label="Current Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
              className={selectCls}
            >
              {(constants?.STATUSES || [
                'To Start', 'In Progress', 'Quoted', 'Sold', 'Lost', 'Archived',
              ]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Follow-up Date">
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Notes" full>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes about the activity"
              className={inputCls + ' resize-none'}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2DBD1] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Activity'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}