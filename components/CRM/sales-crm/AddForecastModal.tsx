// app/(dashboard)/sales-crm/components/AddForecastModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SalesCrmApi,
  type ForecastMonth,
  type ForecastStage,
  type CreateForecastPayload,
} from '@/services/salesCrm.service';
import { MONTHS, inputCls, selectCls } from './constants';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function AddForecastModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreateForecastPayload>({
    client: '',
    item: '',
    value: 0,
    probability: 76,
    month: MONTHS[new Date().getMonth()],
    stage: 'negotiation',
    source: 'online',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[640px] rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
            Add Forecast Entry
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Client" required>
            <input
              value={form.client}
              onChange={(e) => set('client', e.target.value)}
              placeholder="e.g. Sonali Bank PLC"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Item">
            <input
              value={form.item}
              onChange={(e) => set('item', e.target.value)}
              placeholder="e.g. Radmin Software"
              className={inputCls}
            />
          </Field>

          <Field label="Value (৳)">
            <input
              type="number"
              value={form.value || ''}
              onChange={(e) => set('value', Number(e.target.value) || 0)}
              placeholder="e.g. 3,50,000"
              className={inputCls}
            />
          </Field>
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
          <Field label="Stage">
            <select
              value={form.stage}
              onChange={(e) => set('stage', e.target.value as ForecastStage)}
              className={selectCls}
            >
              <option value="query">Query</option>
              <option value="rfq">RFQ</option>
              <option value="quotation">Quotation</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>

          <Field label="Source" full>
            <select
              value={form.source}
              onChange={(e) =>
                set('source', e.target.value as CreateForecastPayload['source'])
              }
              className={selectCls}
            >
              <option value="online">🌐 Online — web RFQ / tender portal</option>
              <option value="offline">📧 Offline — email / phone</option>
              <option value="tender">📑 Tender</option>
              <option value="referral">🤝 Referral</option>
              <option value="quotation-builder">📄 Quotation Builder</option>
            </select>
          </Field>

          <Field label="Note" full>
            <input
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60"
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