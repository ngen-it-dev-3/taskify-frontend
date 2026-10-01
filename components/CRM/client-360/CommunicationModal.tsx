// app/(dashboard)/crm/client-360/components/CommunicationModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Client360Api, type CommEntry } from '@/services/client360.service';
import { inputCls, selectCls } from './constants';

interface Props {
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}

const KINDS: { value: CommEntry['kind']; label: string }[] = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'site-visit', label: 'Site Visit' },
  { value: 'note', label: 'Note' },
  { value: 'other', label: 'Other' },
];

export function CommunicationModal({ clientId, onClose, onSaved }: Props) {
  const [kind, setKind] = useState<CommEntry['kind']>('call');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [at, setAt] = useState(new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!summary.trim()) {
      toast.error('Summary is required');
      return;
    }

    try {
      setSaving(true);

      await Client360Api.addCommunication(clientId, {
        kind,
        summary: summary.trim(),
        body: body.trim(),
        at: at ? new Date(at).toISOString() : new Date().toISOString(),
      });

      toast.success('Communication logged');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to log');
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
        className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              Log Communication
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Add a new entry to this client's communication log.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Type
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as CommEntry['kind'])}
                className={selectCls}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Summary <span className="text-rose-500">*</span>
            </label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Follow-up on Acronis Backup Spares"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Details
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Optional longer notes..."
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

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
            {saving ? 'Saving…' : 'Log Communication'}
          </button>
        </div>
      </div>
    </div>
  );
}