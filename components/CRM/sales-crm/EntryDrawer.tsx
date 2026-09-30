// components/CRM/sales-crm/EntryDrawer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    X,
    Trash2,
    Save,
    ExternalLink,
    User,
    Calendar,
    CircleDollarSign,
    Tag,
    AlertTriangle,
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
    formatMoney,
    fmtDate,
} from './constants';
import { confirmToast } from '@/lib/confirmToast';

interface Props {
    entry: ForecastEntry;
    currency: string;
    rate: number;
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

/** ₹10 Crore threshold — anything above this is suspicious */
const LARGE_VALUE_THRESHOLD = 100_000_000;

/** Format a base (BDT) amount in BDT compact form (৳3.50L, ৳3.50Cr, ৳3.50B) */
function formatBDT(value: number): string {
    const n = value || 0;
    if (n >= 1_000_000_000) return `৳${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)}Cr`;
    if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)}L`;
    if (n >= 1_000) return `৳${(n / 1_000).toFixed(2)}k`;
    return `৳${n.toLocaleString()}`;
}

export function EntryDrawer({
    entry,
    currency,
    rate,
    onClose,
    onChanged,
}: Props) {
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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

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

    const handleOpenSource = () => {
        if (entry.rfqId) {
            window.open(`/crm/quotation-builder/${entry.rfqId}`, '_blank');
        }
    };

    // ⭐ Computed
    const isLargeValue = form.value > LARGE_VALUE_THRESHOLD;
    const bdtCompact = formatBDT(form.value);
    const displayPreview = formatMoney(form.value, currency, { rate });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#F0EBE3] px-7 py-5">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A06126] mb-1">
                            Forecast Entry
                        </div>
                        <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
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
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-4">
                        <MetaItem
                            icon={<CircleDollarSign className="w-3 h-3" />}
                            label="Value"
                            value={formatMoney(entry.value, currency, { rate })}
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
                    <div className="border-t border-[#F0EBE3] pt-5 space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Edit
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        </div>

                        {/* ---------- VALUE + PROBABILITY ---------- */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Value with safeguards */}
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Value (BDT base)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.value || ''}
                                    onChange={(e) => set('value', Number(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    className={
                                        inputCls +
                                        (isLargeValue
                                            ? ' border-amber-400 ring-1 ring-amber-300'
                                            : '')
                                    }
                                    placeholder="0"
                                />

                                {/* ⭐ Show both BDT compact form and foreign display */}
                                <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                                    <span className="font-mono text-slate-500">
                                        {bdtCompact}
                                    </span>
                                    <span className="text-slate-400">
                                        → {displayPreview}
                                    </span>
                                </div>

                                {/* ⭐ Warning for suspiciously large values */}
                                {isLargeValue && (
                                    <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
                                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                                        <span className="text-[10px] text-amber-700 leading-snug">
                                            Value exceeds <strong>৳10 Crore</strong>. Did you enter too
                                            many zeros?
                                        </span>
                                    </div>
                                )}
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

                        {/* ---------- MONTH + STAGE ---------- */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Month
                                </label>
                                <select
                                    value={form.month}
                                    onChange={(e) =>
                                        set('month', e.target.value as ForecastMonth)
                                    }
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
                                    onChange={(e) =>
                                        set('stage', e.target.value as ForecastStage)
                                    }
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

                        {/* ---------- NOTE ---------- */}
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Note
                            </label>
                            <textarea
                                value={form.note}
                                onChange={(e) => set('note', e.target.value)}
                                rows={3}
                                placeholder="Add a note…"
                                className={inputCls + ' resize-none'}
                            />
                        </div>
                    </div>

                    {/* Source link */}
                    {entry.rfqId && (
                        <button
                            onClick={handleOpenSource}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open source quotation
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-[#F0EBE3] px-7 py-4">
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
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
                </div>
            </div>
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
            <div className="mt-0.5 text-[12px] font-semibold text-slate-800 truncate">
                {value}
            </div>
        </div>
    );
}