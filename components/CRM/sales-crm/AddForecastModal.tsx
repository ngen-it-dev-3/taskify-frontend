// components/CRM/sales-crm/AddForecastModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SalesCrmApi,
  type ForecastMonth,
  type ForecastStage,
  type ForecastSource,
  type CreateForecastPayload,
} from '@/services/salesCrm.service';
import { MONTHS, inputCls, selectCls } from './constants';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  /** Optional pre-selected owner (from the current filter) */
  defaultOwner?: string;
}

const STAGE_OPTIONS: { key: ForecastStage; label: string }[] = [
  { key: 'query',       label: 'Query' },
  { key: 'rfq',         label: 'RFQ' },
  { key: 'quotation',   label: 'Quotation' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won',         label: 'Won' },
  { key: 'lost',        label: 'Lost' },
];

const SOURCE_OPTIONS: { key: ForecastSource; label: string }[] = [
  { key: 'online',            label: '🌐 Online — web RFQ / tender portal' },
  { key: 'offline',           label: '📧 Offline — email / phone' },
  { key: 'tender',            label: '📑 Tender' },
  { key: 'referral',          label: '🤝 Referral' },
  { key: 'quotation-builder', label: '📄 Quotation Builder' },
];

export function AddForecastModal({ onClose, onSaved, defaultOwner }: Props) {
  const [form, setForm] = useState<CreateForecastPayload>({
    client: '',
    item: '',
    value: 0,
    probability: 76,
    month: MONTHS[new Date().getMonth()],
    stage: 'negotiation',
    source: 'online',
    owner: defaultOwner || '',
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CreateForecastPayload>(
    k: K,
    v: CreateForecastPayload[K]
  ) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.client.trim()) {
      toast.error('Client is required');
      return;
    }

    try {
      setSaving(true);
      await SalesCrmApi.create(form);
      toast.success('Forecast entry saved');
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
        className="w-full max-w-[640px] rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              Add Forecast Entry
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Log a new pipeline entry with value, stage, and owner.
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Client */}
          <Field label="Client" required>
            <input
              value={form.client}
              onChange={(e) => set('client', e.target.value)}
              placeholder="e.g. Sonali Bank PLC"
              className={inputCls}
              autoFocus
            />
          </Field>

          {/* ⭐ Owner */}
          <Field label="Salesperson / Owner" required>
            <input
              value={form.owner || ''}
              onChange={(e) => set('owner', e.target.value)}
              placeholder="e.g. Nahid Hasan"
              className={inputCls}
            />
          </Field>

          {/* Item */}
          <Field label="Item" full>
            <input
              value={form.item}
              onChange={(e) => set('item', e.target.value)}
              placeholder="e.g. Radmin Software"
              className={inputCls}
            />
          </Field>

          {/* Value */}
          <Field label="Value (BDT base)">
            <input
              type="number"
              step="0.01"
              value={form.value || ''}
              onChange={(e) => set('value', Number(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              placeholder="e.g. 350000"
              className={inputCls}
            />
          </Field>

          {/* Probability */}
          <Field label="Probability">
            <select
              value={form.probability}
              onChange={(e) => set('probability', Number(e.target.value))}
              className={selectCls}
            >
              {[10, 25, 50, 60, 70, 76, 85, 95, 100].map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
          </Field>

          {/* Month */}
          <Field label="Month">
            <select
              value={form.month}
              onChange={(e) => set('month', e.target.value as ForecastMonth)}
              className={selectCls}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          {/* Stage */}
          <Field label="Stage">
            <select
              value={form.stage}
              onChange={(e) => set('stage', e.target.value as ForecastStage)}
              className={selectCls}
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Source */}
          <Field label="Source" full>
            <select
              value={form.source}
              onChange={(e) =>
                set('source', e.target.value as ForecastSource)
              }
              className={selectCls}
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Note */}
          <Field label="Note" full>
            <input
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Optional"
              className={inputCls}
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
            {saving ? 'Saving…' : 'Save Entry'}
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
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}