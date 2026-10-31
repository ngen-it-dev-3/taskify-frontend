'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { QuotationLineItem, QuotationSourceData } from '../types';
import SourceDetailsModal from './SourceDetailsModal';

interface Props {
    lines: QuotationLineItem[];
    autoEditLineId?: string | null;
    onAutoEditConsumed?: () => void;
    onUpdateLine?: (id: string, patch: Partial<QuotationLineItem>) => void;
    onRemoveLine?: (id: string) => void;
    onAddLine?: () => void;
}

// Extended type to match what we need for the form
type SourceData = {
    name: string;
    price: string;
    currency?: string;
    targetCurrency?: string;
    exchangeRate?: string;
    address?: string;
    email?: string;
    phone?: string;
    reference?: string;
    category?: string;
    documents?: string[];
};

type EditDraft = {
    name: string;
    source1: SourceData;
    source2: SourceData;
    source3: SourceData;
};

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'SGD'];

export default function SourceTab({
    lines,
    autoEditLineId,
    onAutoEditConsumed,
    onUpdateLine,
    onRemoveLine,
    onAddLine,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<EditDraft | null>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [activeModalSource, setActiveModalSource] = useState<{
        lineId: string;
        sourceKey: 'source1' | 'source2' | 'source3';
        data: QuotationSourceData;
    } | null>(null);

    const displayLines = lines.filter(
        (l) => l.type !== 'fixed' && l.name.trim() !== ''
    );

    // ⭐ Auto-enter edit mode when parent signals a new line
    useEffect(() => {
        if (!autoEditLineId) return;
        const target = lines.find((l) => l.id === autoEditLineId);
        if (!target) return;

        setEditingId(autoEditLineId);
        setDraft({
            name: target.name === 'New Item' ? '' : target.name,
            source1: {
                name: target.source1?.name || '',
                price: target.source1?.price || '',
                currency: target.source1?.currency || 'BDT',
                targetCurrency: target.source1?.targetCurrency || 'BDT',
                exchangeRate: target.source1?.exchangeRate?.toString() || '1',
                address: target.source1?.address || '',
                email: target.source1?.email || '',
                phone: target.source1?.phone || '',
                reference: target.source1?.reference || '',
                category: target.source1?.category || '',
                documents: target.source1?.documents || [],
            },
            source2: {
                name: target.source2?.name || '',
                price: target.source2?.price || '',
                currency: target.source2?.currency || 'BDT',
                targetCurrency: target.source2?.targetCurrency || 'BDT',
                exchangeRate: target.source2?.exchangeRate?.toString() || '1',
                address: target.source2?.address || '',
                email: target.source2?.email || '',
                phone: target.source2?.phone || '',
                reference: target.source2?.reference || '',
                category: target.source2?.category || '',
                documents: target.source2?.documents || [],
            },
            source3: {
                name: target.source3?.name || '',
                price: target.source3?.price || '',
                currency: target.source3?.currency || 'BDT',
                targetCurrency: target.source3?.targetCurrency || 'BDT',
                exchangeRate: target.source3?.exchangeRate?.toString() || '1',
                address: target.source3?.address || '',
                email: target.source3?.email || '',
                phone: target.source3?.phone || '',
                reference: target.source3?.reference || '',
                category: target.source3?.category || '',
                documents: target.source3?.documents || [],
            },
        });

        onAutoEditConsumed?.();
    }, [autoEditLineId]); // eslint-disable-line react-hooks/exhaustive-deps

    const startEdit = (l: QuotationLineItem) => {
        setEditingId(l.id);
        setDraft({
            name: l.name === 'New Item' ? '' : l.name,
            source1: {
                name: l.source1?.name || '',
                price: l.source1?.price || '',
                currency: l.source1?.currency || 'BDT',
                targetCurrency: l.source1?.targetCurrency || 'BDT',
                exchangeRate: l.source1?.exchangeRate?.toString() || '1',
                address: l.source1?.address || '',
                email: l.source1?.email || '',
                phone: l.source1?.phone || '',
                reference: l.source1?.reference || '',
                category: l.source1?.category || '',
                documents: l.source1?.documents || [],
            },
            source2: {
                name: l.source2?.name || '',
                price: l.source2?.price || '',
                currency: l.source2?.currency || 'BDT',
                targetCurrency: l.source2?.targetCurrency || 'BDT',
                exchangeRate: l.source2?.exchangeRate?.toString() || '1',
                address: l.source2?.address || '',
                email: l.source2?.email || '',
                phone: l.source2?.phone || '',
                reference: l.source2?.reference || '',
                category: l.source2?.category || '',
                documents: l.source2?.documents || [],
            },
            source3: {
                name: l.source3?.name || '',
                price: l.source3?.price || '',
                currency: l.source3?.currency || 'BDT',
                targetCurrency: l.source3?.targetCurrency || 'BDT',
                exchangeRate: l.source3?.exchangeRate?.toString() || '1',
                address: l.source3?.address || '',
                email: l.source3?.email || '',
                phone: l.source3?.phone || '',
                reference: l.source3?.reference || '',
                category: l.source3?.category || '',
                documents: l.source3?.documents || [],
            },
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
    };

    const saveEdit = () => {
        if (!editingId || !draft) return;

        const clean = (v: string) => v.trim();
        const finalName = clean(draft.name) || 'New Item';

        const parseRate = (r?: string) => {
            const parsed = parseFloat(r || '1');
            return isNaN(parsed) ? 1 : parsed;
        };

        onUpdateLine?.(editingId, {
            name: finalName,
            source1: {
                name: clean(draft.source1.name),
                price: clean(draft.source1.price),
                currency: draft.source1.currency,
                targetCurrency: draft.source1.targetCurrency,
                exchangeRate: parseRate(draft.source1.exchangeRate),
                address: draft.source1.address,
                email: draft.source1.email,
                phone: draft.source1.phone,
                reference: draft.source1.reference,
                category: draft.source1.category,
                documents: draft.source1.documents,
            },
            source2: {
                name: clean(draft.source2.name),
                price: clean(draft.source2.price),
                currency: draft.source2.currency,
                targetCurrency: draft.source2.targetCurrency,
                exchangeRate: parseRate(draft.source2.exchangeRate),
                address: draft.source2.address,
                email: draft.source2.email,
                phone: draft.source2.phone,
                reference: draft.source2.reference,
                category: draft.source2.category,
                documents: draft.source2.documents,
            },
            source3: {
                name: clean(draft.source3.name),
                price: clean(draft.source3.price),
                currency: draft.source3.currency,
                targetCurrency: draft.source3.targetCurrency,
                exchangeRate: parseRate(draft.source3.exchangeRate),
                address: draft.source3.address,
                email: draft.source3.email,
                phone: draft.source3.phone,
                reference: draft.source3.reference,
                category: draft.source3.category,
                documents: draft.source3.documents,
            },
        });

        setEditingId(null);
        setDraft(null);
    };

    const updateDraft = (
        key: 'source1' | 'source2' | 'source3',
        field: keyof SourceData,
        value: any
    ) => {
        if (!draft) return;
        setDraft({
            ...draft,
            [key]: { ...draft[key], [field]: value },
        });
    };

    const calcConverted = (
        priceStr: string | number | undefined,
        rateStr: string | number | undefined,
        fromCurrency: string = 'BDT',
        toCurrency: string = 'BDT'
    ) => {
        const price = parseFloat(String(priceStr || '0'));
        const rate = parseFloat(String(rateStr || '1'));

        if (isNaN(price) || price <= 0) return { value: '0.00', symbol: '' };
        const finalRate = isNaN(rate) || rate <= 0 ? 1 : rate;

        let finalValue = 0;
        if (fromCurrency === 'BDT' && toCurrency !== 'BDT') {
            finalValue = price / finalRate;
        } else {
            finalValue = price * finalRate;
        }

        const symbol = toCurrency === 'BDT' ? '৳' : toCurrency === 'USD' ? '$' : toCurrency === 'EUR' ? '€' : '';
        return { value: finalValue.toFixed(2), symbol };
    };

    const openSourceModal = (lineId: string, sourceKey: 'source1' | 'source2' | 'source3', data: any) => {
        if (!data || !data.name) return;
        setActiveModalSource({ lineId, sourceKey, data });
        setModalOpen(true);
    };

    const handleModalSave = (updatedData: QuotationSourceData) => {
        if (!activeModalSource) return;
        const { lineId, sourceKey } = activeModalSource;

        onUpdateLine?.(lineId, {
            [sourceKey]: updatedData
        } as any);

        setModalOpen(false);
        setActiveModalSource(null);
    };

    return (
        <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden relative">
            <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[1400px]">
                    <colgroup>
                        <col className="w-12" />
                        <col className="w-[160px]" />
                        {/* Source 1 Group */}
                        <col className="w-[130px]" />
                        <col className="w-[170px]" />
                        <col className="w-[170px]" />
                        <col className="w-[110px]" />
                        {/* Source 2 Group */}
                        <col className="w-[130px]" />
                        <col className="w-[170px]" />
                        <col className="w-[170px]" />
                        <col className="w-[110px]" />
                        {/* Source 3 Group */}
                        <col className="w-[130px]" />
                        <col className="w-[170px]" />
                        <col className="w-[170px]" />
                        <col className="w-[110px]" />
                        {/* Action */}
                        <col className="w-[80px]" />
                    </colgroup>

                    <thead className="bg-[#FAF8F5] border-b border-[#F0EBE3]">
                        <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left border-b border-[#F0EBE3]">
                            <th rowSpan={2} className="px-3 py-2 align-bottom border-r border-[#F0EBE3]">SI</th>
                            <th rowSpan={2} className="px-3 py-2 align-bottom border-r border-[#F0EBE3]">Item</th>

                            <th colSpan={4} className="px-3 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 1</th>
                            <th colSpan={4} className="px-3 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 2</th>
                            <th colSpan={4} className="px-3 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 3</th>

                            <th rowSpan={2} className="px-3 py-2 align-bottom text-center">Action</th>
                        </tr>
                        <tr className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-left bg-[#FAF8F5]">
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price</th>
                            <th className="px-2 py-2">Conv. Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total</th>

                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price</th>
                            <th className="px-2 py-2">Conv. Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total</th>

                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price</th>
                            <th className="px-2 py-2">Conv. Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {displayLines.map((l, i) => {
                            const isEditing = editingId === l.id;

                            if (isEditing && draft) {
                                const s1 = calcConverted(draft.source1.price, draft.source1.exchangeRate, draft.source1.currency, draft.source1.targetCurrency);
                                const s2 = calcConverted(draft.source2.price, draft.source2.exchangeRate, draft.source2.currency, draft.source2.targetCurrency);
                                const s3 = calcConverted(draft.source3.price, draft.source3.exchangeRate, draft.source3.currency, draft.source3.targetCurrency);

                                return (
                                    <tr key={l.id} className="bg-[#FAF6EE]/70">
                                        <td className="px-3 py-2 font-mono text-slate-500 text-center">{i + 1}</td>
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.name}
                                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                                placeholder="Product name…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>

                                        {/* Source 1 Inputs */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source1.name}
                                                onChange={(e) => updateDraft('source1', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source1.currency}
                                                    onChange={(e) => updateDraft('source1', 'currency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source1.price}
                                                    onChange={(e) => updateDraft('source1', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source1.targetCurrency}
                                                    onChange={(e) => updateDraft('source1', 'targetCurrency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source1.exchangeRate}
                                                    onChange={(e) => updateDraft('source1', 'exchangeRate', e.target.value)}
                                                    placeholder="Rate"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-center font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s1.symbol}{s1.value}
                                        </td>

                                        {/* Source 2 Inputs */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source2.name}
                                                onChange={(e) => updateDraft('source2', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source2.currency}
                                                    onChange={(e) => updateDraft('source2', 'currency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source2.price}
                                                    onChange={(e) => updateDraft('source2', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source2.targetCurrency}
                                                    onChange={(e) => updateDraft('source2', 'targetCurrency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source2.exchangeRate}
                                                    onChange={(e) => updateDraft('source2', 'exchangeRate', e.target.value)}
                                                    placeholder="Rate"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-center font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s2.symbol}{s2.value}
                                        </td>

                                        {/* Source 3 Inputs */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source3.name}
                                                onChange={(e) => updateDraft('source3', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source3.currency}
                                                    onChange={(e) => updateDraft('source3', 'currency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source3.price}
                                                    onChange={(e) => updateDraft('source3', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source3.targetCurrency}
                                                    onChange={(e) => updateDraft('source3', 'targetCurrency', e.target.value)}
                                                    className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] px-1 focus:outline-none cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={draft.source3.exchangeRate}
                                                    onChange={(e) => updateDraft('source3', 'exchangeRate', e.target.value)}
                                                    placeholder="Rate"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-center font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s3.symbol}{s3.value}
                                        </td>

                                        {/* Save / Cancel */}
                                        <td className="px-3 py-2 text-center whitespace-nowrap">
                                            <button type="button" onClick={saveEdit} className="w-7 h-7 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white inline-flex items-center justify-center mr-1 transition" title="Save">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button type="button" onClick={cancelEdit} className="w-7 h-7 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center transition" title="Cancel">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }

                            // View Mode Logic
                            const hasS1 = (l.source1?.name && l.source1.name.trim() !== '') || (l.source1?.price && parseFloat(l.source1.price) > 0);
                            const hasS2 = (l.source2?.name && l.source2.name.trim() !== '') || (l.source2?.price && parseFloat(l.source2.price) > 0);
                            const hasS3 = (l.source3?.name && l.source3.name.trim() !== '') || (l.source3?.price && parseFloat(l.source3.price) > 0);

                            const v1 = calcConverted(l.source1?.price, l.source1?.exchangeRate, l.source1?.currency, l.source1?.targetCurrency);
                            const v2 = calcConverted(l.source2?.price, l.source2?.exchangeRate, l.source2?.currency, l.source2?.targetCurrency);
                            const v3 = calcConverted(l.source3?.price, l.source3?.exchangeRate, l.source3?.currency, l.source3?.targetCurrency);

                            return (
                                <tr key={l.id} className="hover:bg-[#FDFBF7] group">
                                    <td className="px-3 py-2 font-mono text-slate-500 text-center">{i + 1}</td>
                                    <td className="px-3 py-2 font-medium text-slate-800">{l.name}</td>

                                    {/* Source 1 Data */}
                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source1?.name ? (
                                            <button
                                                onClick={() => openSourceModal(l.id, 'source1', l.source1)}
                                                className="text-[#A06126] hover:underline font-semibold text-left"
                                                title="Click to view/edit full source info"
                                            >
                                                {l.source1.name}
                                            </button>
                                        ) : (
                                            <span className="italic text-rose-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source1?.price && parseFloat(l.source1.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source1.currency || 'BDT'}</span>{l.source1.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-[10px] text-slate-500 text-center">
                                        {hasS1 && l.source1?.exchangeRate ? <><span className="font-semibold text-slate-600">{l.source1.targetCurrency || 'BDT'}</span> ৳ {l.source1.exchangeRate}</> : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS1 ? <>{v1.symbol}{v1.value}</> : '0.00'}
                                    </td>

                                    {/* Source 2 Data */}
                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source2?.name ? (
                                            <button
                                                onClick={() => openSourceModal(l.id, 'source2', l.source2)}
                                                className="text-[#A06126] hover:underline font-semibold text-left"
                                                title="Click to view/edit full source info"
                                            >
                                                {l.source2.name}
                                            </button>
                                        ) : (
                                            <span className="italic text-rose-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source2?.price && parseFloat(l.source2.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source2.currency || 'BDT'}</span>{l.source2.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-[10px] text-slate-500 text-center">
                                        {hasS2 && l.source2?.exchangeRate ? <><span className="font-semibold text-slate-600">{l.source2.targetCurrency || 'BDT'}</span> ৳ {l.source2.exchangeRate}</> : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS2 ? <>{v2.symbol}{v2.value}</> : '0.00'}
                                    </td>

                                    {/* Source 3 Data */}
                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source3?.name ? (
                                            <button
                                                onClick={() => openSourceModal(l.id, 'source3', l.source3)}
                                                className="text-[#A06126] hover:underline font-semibold text-left"
                                                title="Click to view/edit full source info"
                                            >
                                                {l.source3.name}
                                            </button>
                                        ) : (
                                            <span className="italic text-rose-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source3?.price && parseFloat(l.source3.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source3.currency || 'BDT'}</span>{l.source3.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-[10px] text-slate-500 text-center">
                                        {hasS3 && l.source3?.exchangeRate ? <><span className="font-semibold text-slate-600">{l.source3.targetCurrency || 'BDT'}</span> @ {l.source3.exchangeRate}</> : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS3 ? <>{v3.symbol}{v3.value}</> : '0.00'}
                                    </td>

                                    {/* Action — Edit + Delete */}
                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button type="button" onClick={() => startEdit(l)} className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-slate-50 inline-flex items-center justify-center text-slate-600 transition" title="Edit sources">
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button type="button" onClick={() => onRemoveLine?.(l.id)} className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 transition" title="Remove this item">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {displayLines.length === 0 && (
                            <tr>
                                <td colSpan={15} className="py-8 text-center text-slate-400 italic text-[12px]">
                                    No items yet — click "+ Add Item" below
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <button type="button" onClick={onAddLine} className="w-full text-left px-5 py-3 text-[12px] font-semibold text-[#A06126] hover:bg-[#FDFBF7] transition border-t border-[#F0EBE3]">
                + Add Item
            </button>

            {/* ⭐ RENDER MODAL */}
            {modalOpen && activeModalSource && (
                <SourceDetailsModal
                    sourceName={activeModalSource.data.name}
                    data={activeModalSource.data}
                    onClose={() => {
                        setModalOpen(false);
                        setActiveModalSource(null);
                    }}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}