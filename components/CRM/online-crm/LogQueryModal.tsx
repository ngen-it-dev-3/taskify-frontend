// app/(dashboard)/online-crm/components/LogQueryModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  OnlineCrmApi,
  type QuerySource,
  type QueryStage,
} from '@/services/onlineCrm.service';
import {
  ASSIGNEES,
  SOURCES,
  STAGES,
  inputCls,
  selectCls,
} from './constants';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function LogQueryModal({ onClose, onSaved }: Props) {
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [product, setProduct] = useState('');
  const [assigned, setAssigned] = useState<string>('Akramul');
  const [source, setSource] = useState<QuerySource>('Email');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<QueryStage>('To Start');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!company.trim() || !country.trim()) {
      toast.error('Company and Country are required');
      return;
    }

    try {
      setSaving(true);
      await OnlineCrmApi.create({
        company: company.trim(),
        country: country.trim(),
        product: product.trim(),
        assigned,
        source,
        value: value === '' ? null : Number(value),
        stage,
        comments: comments.trim(),
      });
      toast.success('Query logged');
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
        className="w-full max-w-[560px] rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              Log Online Query
            </h2>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Logs a new online-sourced record at the top of the Online CRM log,
              with today's date and 0 days aging.
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
          <Field label="Company" required>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Pubali Bank Limited"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Country" required>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Bangladesh"
              className={inputCls}
            />
          </Field>

          <Field label="Product / Requirement" full>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Kiosk — self-service desk"
              className={inputCls}
            />
          </Field>

          <Field label="Assigned">
            <select
              value={assigned}
              onChange={(e) => setAssigned(e.target.value)}
              className={selectCls}
            >
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as QuerySource)}
              className={selectCls}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Value (optional)">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 680000"
              className={inputCls}
            />
          </Field>
          <Field label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as QueryStage)}
              className={selectCls}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Comments" full>
            <input
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional notes"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : 'Save Query'}
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