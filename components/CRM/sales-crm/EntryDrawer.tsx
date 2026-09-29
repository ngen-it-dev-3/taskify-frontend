// app/(dashboard)/sales-crm/components/EntryDrawer.tsx
'use client';

import React, { useState } from 'react';
import {
    X,
    Trash2,
    Save,
    ExternalLink,
    Building2,
    User,
    Calendar,
    CircleDollarSign,
    Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SalesCrmApi,
    type ForecastEntry,
    type ForecastStage,
    type ForecastMonth,
} from '@/services/salesCrm.service';
import {
    MONTHS,
    inputCls,
    selectCls,
    fmtFull,
    fmtDate,
} from './constants';
import { confirmToast } from '@/lib/confirmToast';

interface Props {
    entry: ForecastEntry;
    onClose: () => void;
    onChanged: () => void;
}

const STAGE_OPTIONS: { key: ForecastStage; label: string }[] = [
    { key: 'query', label: 'Query' },
    { key: 'rfq', label: 'RFQ' },
    { key: 'quotation', label: 'Quotation' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
];

export function EntryDrawer({ entry, onClose, onChanged }: Props) {
    const [form, setForm] = useState({
        client: entry.client ?? '',
        item: entry.item ?? '',
        value: entry.value ?? 0,
        probability: entry.probability ?? 50,
        month: entry.month ?? MONTHS[new Date().getMonth()],
        stage: entry.stage ?? 'query',
        note: entry.note ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const handleSave = async () => {
        try {
            setSaving(true);
            await SalesCrmApi.update(entry.id, form);
            toast.success('Entry updated');
            onChanged();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        confirmToast({
            title: `Delete "${entry.client}"?`,
            description: 'This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                const loadingId = toast.loading('Deleting…');
                try {
                    await SalesCrmApi.remove(entry.id);
                    toast.success('Entry deleted', { id: loadingId });
                    onChanged();
                } catch (e: any) {
                    toast.error(e.message || 'Delete failed', { id: loadingId });
                }
            },
        });
    };

    // Open the source quotation in the builder
    const handleOpenSource = () => {
        if (entry.rfqId) {
            window.open(`/crm/quotation-builder/${entry.rfqId}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#F0EBE3] px-6 py-5">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A06126] mb-1">
                            Forecast Entry
                        </div>
                        <h2 className="font-serif text-lg font-bold text-[#0F2D4A]">
                            {entry.client}
                        </h2>
                        {entry.pqNumber && (
                            <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                                {entry.pqNumber}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <MetaItem
                            icon={<CircleDollarSign className="w-3 h-3" />}
                            label="Value"
                            value={fmtFull(entry.value)}
                        />
                        <MetaItem
                            icon={<Tag className="w-3 h-3" />}
                            label="Probability"
                            value={`${entry.probability}%`}
                        />
                        <MetaItem
                            icon={<User className="w-3 h-3" />}
                            label="Owner"
                            value={entry.owner || '—'}
                        />
                        <MetaItem
                            icon={<Calendar className="w-3 h-3" />}
                            label="Updated"
                            value={fmtDate(entry.updatedAt)}
                        />
                    </div>

                    {/* Editable fields */}
                    <div className="border-t border-[#F0EBE3] pt-4 space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Edit
                        </div>

                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Client
                            </label>
                            <input
                                value={form.client}
                                onChange={(e) => set('client', e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Item
                            </label>
                            <input
                                value={form.item}
                                onChange={(e) => set('item', e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Value (৳)
                                </label>
                                <input
                                    type="number"
                                    value={form.value || ''}
                                    onChange={(e) => set('value', Number(e.target.value) || 0)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Probability
                                </label>
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
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Month
                                </label>
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
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Stage
                                </label>
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
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Note
                            </label>
                            <input
                                value={form.note}
                                onChange={(e) => set('note', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Source link */}
                    {entry.rfqId && (
                        <button
                            onClick={handleOpenSource}
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open source quotation
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-[#F0EBE3] px-6 py-4">
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-5 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </aside>
        </div>
    );
}

function MetaItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-[#F0EBE3] bg-[#FDFBF7] px-3 py-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {icon}
                {label}
            </div>
            <div className="mt-0.5 text-[12px] font-semibold text-slate-800">
                {value}
            </div>
        </div>
    );
}