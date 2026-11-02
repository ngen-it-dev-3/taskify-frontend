'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Trash2, Check, X, RefreshCw, ArrowUpCircle } from 'lucide-react';
import type { QuotationLineItem, QuotationSourceData, QuotationMeta } from '../types';
import { CURRENCIES } from '../constants';
import SourceDetailsModal from './SourceDetailsModal';
import SelectSourcePriceModal from './SelectSourcePriceModal';

interface Props {
    lines: QuotationLineItem[];
    meta: QuotationMeta & { activeSourceCurrency?: string };
    autoEditLineId?: string | null;
    onAutoEditConsumed?: () => void;
    onUpdateLine?: (id: string, patch: Partial<QuotationLineItem>) => void;
    onRemoveLine?: (id: string) => void;
    onAddLine?: () => void;
    onChangeMeta?: (patch: Partial<QuotationMeta>) => void;
    onSelectSource?: (lineId: string, selectedPrice: number) => void;
}

type SourceData = {
    name: string;
    price: string;
    currency?: string;
    address?: string;
    email?: string;
    phone?: string;
    reference?: string;
    category?: string;
    documents?: string[];
    manualRate?: number;
};

type EditDraft = {
    name: string;
    source1: SourceData;
    source2: SourceData;
    source3: SourceData;
};

export default function SourceTab({
    lines,
    meta,
    autoEditLineId,
    onAutoEditConsumed,
    onUpdateLine,
    onRemoveLine,
    onAddLine,
    onChangeMeta,
    onSelectSource,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<EditDraft | null>(null);
    const [syncingKey, setSyncingKey] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeModalSource, setActiveModalSource] = useState<{
        lineId: string;
        sourceKey: 'source1' | 'source2' | 'source3';
        data: QuotationSourceData;
    } | null>(null);

    const [selectingLine, setSelectingLine] = useState<QuotationLineItem | null>(null);

    // Ref to track if a save is currently in progress to prevent double-saves
    const isSavingRef = useRef(false);

    const displayLines = lines.filter(
        (l) => l.type !== 'fixed' && l.name.trim() !== ''
    );

    const toSourceData = (s?: QuotationSourceData, defaultCurrency?: string): SourceData => ({
        name: s?.name || '',
        price: s?.price || '',
        currency: s?.currency || defaultCurrency || 'BDT',
        address: s?.address || '',
        email: s?.email || '',
        phone: s?.phone || '',
        reference: s?.reference || '',
        category: s?.category || '',
        documents: s?.documents || [],
        manualRate: (s as any)?.manualRate || undefined,
    });

    const territoryCurrency = meta.currency || 'BDT';

    // Auto-edit on new line creation
    useEffect(() => {
        if (!autoEditLineId) return;
        const target = lines.find((l) => l.id === autoEditLineId);
        if (!target) return;

        setEditingId(autoEditLineId);
        setDraft({
            name: target.name === 'New Item' ? '' : target.name,
            source1: toSourceData(target.source1, territoryCurrency),
            source2: toSourceData(target.source2, territoryCurrency),
            source3: toSourceData(target.source3, territoryCurrency),
        });

        onAutoEditConsumed?.();
    }, [autoEditLineId, territoryCurrency, lines]);

    // ⭐ Start editing when a row is clicked
    const startEdit = (l: QuotationLineItem) => {
        if (editingId === l.id) return; // Already editing this row
        setEditingId(l.id);
        setIsDirty(false);
        setDraft({
            name: l.name === 'New Item' ? '' : l.name,
            source1: toSourceData(l.source1, territoryCurrency),
            source2: toSourceData(l.source2, territoryCurrency),
            source3: toSourceData(l.source3, territoryCurrency),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
        setIsDirty(false);
    };

    const saveEdit = () => {
        if (!editingId || !draft || isSavingRef.current) return;
        isSavingRef.current = true;

        const clean = (v: string) => v.trim();
        const finalName = clean(draft.name) || 'New Item';

        const buildSource = (s: SourceData) => ({
            name: clean(s.name),
            price: clean(s.price),
            currency: s.currency || territoryCurrency,
            targetCurrency: territoryCurrency,
            address: s.address,
            email: s.email,
            phone: s.phone,
            reference: s.reference,
            category: s.category as any,
            documents: s.documents,
            manualRate: s.manualRate,
        });

        onUpdateLine?.(editingId, {
            name: finalName,
            source1: buildSource(draft.source1),
            source2: buildSource(draft.source2),
            source3: buildSource(draft.source3),
        });

        setEditingId(null);
        setDraft(null);
        setIsDirty(false);

        // Release lock after a brief tick
        setTimeout(() => {
            isSavingRef.current = false;
        }, 100);
    };

    const handleRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
        // 1. If it's not dirty, don't save.
        if (!isDirty) return;

        // 2. If the newly focused element is still INSIDE the same row, don't save.
        const currentRow = e.currentTarget;
        const nextFocused = e.relatedTarget as HTMLElement;
        if (nextFocused && currentRow.contains(nextFocused)) {
            return;
        }

        // 3. Add a tiny delay to ensure state is settled
        setTimeout(() => {
            saveEdit();
        }, 50);
    };

    const updateDraft = (
        key: 'source1' | 'source2' | 'source3',
        field: keyof SourceData,
        value: any
    ) => {
        if (!draft) return;
        setIsDirty(true);
        const updatedSource = { ...draft[key], [field]: value };
        if (field === 'currency') {
            updatedSource.manualRate = undefined;
        }

        setDraft({
            ...draft,
            [key]: updatedSource,
        });
    };

    const handleSyncSource = async (currencyCode: string, sourceKey: 'source1' | 'source2' | 'source3') => {
        if (!draft) return;
        if (currencyCode === territoryCurrency) {
            alert(`Source currency is already ${territoryCurrency}. No conversion needed.`);
            return;
        }

        setSyncingKey(sourceKey);
        try {
            const res = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            const liveRate = data.rates[territoryCurrency];
            if (!liveRate) throw new Error('Rate not found');

            setDraft({
                ...draft,
                [sourceKey]: {
                    ...draft[sourceKey],
                    manualRate: Number(liveRate.toFixed(4))
                }
            });

        } catch (error) {
            console.error(error);
            alert(`Could not fetch live rate for ${currencyCode} to ${territoryCurrency}`);
        } finally {
            setSyncingKey(null);
        }
    };

        const calcConverted = (priceStr: string | number | undefined, fromCurrency: string = 'BDT', manualRate?: number) => {
        const price = parseFloat(String(priceStr || '0'));
        if (isNaN(price) || price <= 0) return { value: 0, symbol: '' };

        const targetCurrencyData = CURRENCIES.find(c => c.code === territoryCurrency);
        const symbol = targetCurrencyData?.symbol || territoryCurrency;

        // If the currency is already the same as the territory, no conversion needed
        if (fromCurrency === territoryCurrency) {
            return { value: price, symbol };
        }

        // ⭐ If the user clicked Sync or typed a manual rate, use that
        if (manualRate && manualRate > 0) {
            const finalValue = price * manualRate;
            return { value: finalValue, symbol };
        }

        // ⭐ If no manual rate is provided, return 0 (prevents auto-calculation)
        return { value: 0, symbol };
    };

    const openSourceModal = (e: React.MouseEvent, lineId: string, sourceKey: 'source1' | 'source2' | 'source3', data: any) => {
        e.stopPropagation(); // Prevent triggering the row click
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
                <table className="w-full text-xs min-w-[1500px]">
                    <colgroup>
                        <col className="w-[40px]" />
                        <col className="w-[160px]" />

                        <col className="w-[120px]" />
                        <col className="w-[180px]" />
                        <col className="w-[80px]" />
                        <col className="w-[90px]" />

                        <col className="w-[120px]" />
                        <col className="w-[180px]" />
                        <col className="w-[80px]" />
                        <col className="w-[90px]" />

                        <col className="w-[120px]" />
                        <col className="w-[180px]" />
                        <col className="w-[80px]" />
                        <col className="w-[90px]" />

                        <col className="w-[100px]" />
                    </colgroup>

                    <thead className="bg-[#FAF8F5] border-b border-[#F0EBE3]">
                        <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left border-b border-[#F0EBE3]">
                            <th rowSpan={2} className="px-2 py-2 align-bottom border-r border-[#F0EBE3]">SI</th>
                            <th rowSpan={2} className="px-2 py-2 align-bottom border-r border-[#F0EBE3]">Item</th>
                            <th colSpan={4} className="px-2 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 1</th>
                            <th colSpan={4} className="px-2 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 2</th>
                            <th colSpan={4} className="px-2 py-2 text-center border-r border-[#F0EBE3] bg-[#F5F1EA] text-[#A06126]">Source 3</th>
                            <th rowSpan={2} className="px-2 py-2 align-bottom text-center">Action</th>
                        </tr>
                        <tr className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-left bg-[#FAF8F5]">
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price (Orig.)</th>
                            <th className="px-2 py-2 text-center text-[#A06126]">Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total ({territoryCurrency})</th>

                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price (Orig.)</th>
                            <th className="px-2 py-2 text-center text-[#A06126]">Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total ({territoryCurrency})</th>

                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Price (Orig.)</th>
                            <th className="px-2 py-2 text-center text-[#A06126]">Rate</th>
                            <th className="px-2 py-2 text-right border-r border-[#F0EBE3]">Total ({territoryCurrency})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {displayLines.map((l, i) => {
                            const isEditing = editingId === l.id;

                            if (isEditing && draft) {
                                const s1 = calcConverted(draft.source1.price, draft.source1.currency, draft.source1.manualRate);
                                const s2 = calcConverted(draft.source2.price, draft.source2.currency, draft.source2.manualRate);
                                const s3 = calcConverted(draft.source3.price, draft.source3.currency, draft.source3.manualRate);

                                return (
                                    // ⭐ Added onBlur to the row
                                    <tr
                                        key={l.id}
                                        className="bg-[#FAF6EE]/70"
                                        onBlur={handleRowBlur}
                                    >
                                        <td className="px-2 py-2 font-mono text-slate-500 text-center">{i + 1}</td>
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

                                        {/* Source 1 */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source1.name}
                                                onChange={(e) => updateDraft('source1', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1">
                                                <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                    <select
                                                        value={draft.source2.currency}
                                                        onChange={(e) => updateDraft('source2', 'currency', e.target.value)}
                                                        className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] w-[50px] px-1 focus:outline-none cursor-pointer"
                                                    >
                                                        {CURRENCIES.map((c, idx) => (
                                                            <option key={`${c.code}-${c.country}-${idx}`} value={c.code}>
                                                                {c.code} {c.code === 'USD' && c.country !== 'United States' ? `(${c.country})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={draft.source1.price}
                                                        onChange={(e) => updateDraft('source1', 'price', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSyncSource(draft.source1.currency || 'BDT', 'source1')}
                                                    disabled={syncingKey === 'source1'}
                                                    className="w-7 shrink-0 bg-[#F9F1E2] hover:bg-[#F0E6D2] border border-[#A06126] rounded text-[#A06126] flex items-center justify-center transition"
                                                    title={`Sync 1 ${draft.source1.currency} to ${territoryCurrency}`}
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${syncingKey === 'source1' ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={draft.source1.manualRate || ''}
                                                onChange={(e) => updateDraft('source1', 'manualRate', Number(e.target.value) || undefined)}
                                                placeholder="Rate"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-center font-mono text-[#A06126] focus:outline-none"
                                                title={`1 ${draft.source1.currency} = ? ${territoryCurrency}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s1.symbol}{s1.value.toFixed(2)}
                                        </td>

                                        {/* Source 2 */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source2.name}
                                                onChange={(e) => updateDraft('source2', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1">
                                                <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                    <select
                                                        value={draft.source2.currency}
                                                        onChange={(e) => updateDraft('source2', 'currency', e.target.value)}
                                                        className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] w-[50px] px-1 focus:outline-none cursor-pointer"
                                                    >
                                                        {CURRENCIES.map((c, idx) => (
                                                            <option key={`${c.code}-${c.country}-${idx}`} value={c.code}>
                                                                {c.code} {c.code === 'USD' && c.country !== 'United States' ? `(${c.country})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={draft.source2.price}
                                                        onChange={(e) => updateDraft('source2', 'price', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSyncSource(draft.source2.currency || 'BDT', 'source2')}
                                                    disabled={syncingKey === 'source2'}
                                                    className="w-7 shrink-0 bg-[#F9F1E2] hover:bg-[#F0E6D2] border border-[#A06126] rounded text-[#A06126] flex items-center justify-center transition"
                                                    title={`Sync 1 ${draft.source2.currency} to ${territoryCurrency}`}
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${syncingKey === 'source2' ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={draft.source2.manualRate || ''}
                                                onChange={(e) => updateDraft('source2', 'manualRate', Number(e.target.value) || undefined)}
                                                placeholder="Rate"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-center font-mono text-[#A06126] focus:outline-none"
                                                title={`1 ${draft.source2.currency} = ? ${territoryCurrency}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s2.symbol}{s2.value.toFixed(2)}
                                        </td>

                                        {/* Source 3 */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source3.name}
                                                onChange={(e) => updateDraft('source3', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1">
                                                <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                    <select
                                                        value={draft.source3.currency}
                                                        onChange={(e) => updateDraft('source3', 'currency', e.target.value)}
                                                        className="bg-slate-50 text-[11px] font-medium border-r border-[#A06126] w-[50px] px-1 focus:outline-none cursor-pointer"
                                                    >
                                                        {CURRENCIES.map((c, idx) => (
                                                            <option key={`${c.code}-${c.country}-${idx}`} value={c.code}>
                                                                {c.code} {c.code === 'USD' && c.country !== 'United States' ? `(${c.country})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={draft.source3.price}
                                                        onChange={(e) => updateDraft('source3', 'price', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSyncSource(draft.source3.currency || 'BDT', 'source3')}
                                                    disabled={syncingKey === 'source3'}
                                                    className="w-7 shrink-0 bg-[#F9F1E2] hover:bg-[#F0E6D2] border border-[#A06126] rounded text-[#A06126] flex items-center justify-center transition"
                                                    title={`Sync 1 ${draft.source3.currency} to ${territoryCurrency}`}
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${syncingKey === 'source3' ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={draft.source3.manualRate || ''}
                                                onChange={(e) => updateDraft('source3', 'manualRate', Number(e.target.value) || undefined)}
                                                placeholder="Rate"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-center font-mono text-[#A06126] focus:outline-none"
                                                title={`1 ${draft.source3.currency} = ? ${territoryCurrency}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-[#0F2D4A] font-semibold border-r border-[#F0EBE3]">
                                            {s3.symbol}{s3.value.toFixed(2)}
                                        </td>

                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            <button type="button" onClick={saveEdit} className="w-7 h-7 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white inline-flex items-center justify-center mr-1 transition" title="Save">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button type="button" onClick={cancelEdit} className="w-7 h-7 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center transition" title="Cancel">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectingLine(l)}
                                                className="w-7 h-7 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center transition ml-1"
                                                title="Select which price to send to Cost of Goods"
                                            >
                                                <ArrowUpCircle className="w-3.5 h-3.5 text-[#A06126]" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }

                            // Read-only view
                            const hasS1 = (l.source1?.name && l.source1.name.trim() !== '') || (l.source1?.price && parseFloat(l.source1.price) > 0);
                            const hasS2 = (l.source2?.name && l.source2.name.trim() !== '') || (l.source2?.price && parseFloat(l.source2.price) > 0);
                            const hasS3 = (l.source3?.name && l.source3.name.trim() !== '') || (l.source3?.price && parseFloat(l.source3.price) > 0);

                            const v1 = calcConverted(l.source1?.price, l.source1?.currency, (l.source1 as any)?.manualRate);
                            const v2 = calcConverted(l.source2?.price, l.source2?.currency, (l.source2 as any)?.manualRate);
                            const v3 = calcConverted(l.source3?.price, l.source3?.currency, (l.source3 as any)?.manualRate);

                            return (
                                // ⭐ Click anywhere on the row to edit
                                <tr
                                    key={l.id}
                                    className="hover:bg-[#FDFBF7] cursor-pointer group transition-colors"
                                    onClick={() => startEdit(l)}
                                >
                                    <td className="px-2 py-2 font-mono text-slate-500 text-center">{i + 1}</td>
                                    <td className="px-2 py-2 font-medium text-slate-800">{l.name}</td>

                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source1?.name ? (
                                            <button onClick={(e) => openSourceModal(e, l.id, 'source1', l.source1)} className="text-[#A06126] hover:underline font-semibold text-left">
                                                {l.source1.name}
                                            </button>
                                        ) : <span className="italic text-rose-400">None</span>}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source1?.price && parseFloat(l.source1.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source1.currency || 'BDT'}</span>{l.source1.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-center font-mono text-slate-500">
                                        {(l.source1 as any)?.manualRate || '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS1 ? <>{v1.symbol}{v1.value.toFixed(2)}</> : '0.00'}
                                    </td>

                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source2?.name ? (
                                            <button onClick={(e) => openSourceModal(e, l.id, 'source2', l.source2)} className="text-[#A06126] hover:underline font-semibold text-left">
                                                {l.source2.name}
                                            </button>
                                        ) : <span className="italic text-rose-400">None</span>}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source2?.price && parseFloat(l.source2.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source2.currency || 'BDT'}</span>{l.source2.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-center font-mono text-slate-500">
                                        {(l.source2 as any)?.manualRate || '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS2 ? <>{v2.symbol}{v2.value.toFixed(2)}</> : '0.00'}
                                    </td>

                                    <td className="px-2 py-2 text-slate-700">
                                        {l.source3?.name ? (
                                            <button onClick={(e) => openSourceModal(e, l.id, 'source3', l.source3)} className="text-[#A06126] hover:underline font-semibold text-left">
                                                {l.source3.name}
                                            </button>
                                        ) : <span className="italic text-rose-400">None</span>}
                                    </td>
                                    <td className="px-2 py-2 font-mono text-slate-600">
                                        {l.source3?.price && parseFloat(l.source3.price) > 0
                                            ? <><span className="text-[10px] font-bold text-slate-400 mr-1">{l.source3.currency || 'BDT'}</span>{l.source3.price}</>
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-center font-mono text-slate-500">
                                        {(l.source3 as any)?.manualRate || '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS3 ? <>{v3.symbol}{v3.value.toFixed(2)}</> : '0.00'}
                                    </td>

                                    <td className="px-2 py-2 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveLine?.(l.id); }} className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 transition" title="Remove this item">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectingLine(l); }}
                                                className="w-7 h-7 rounded border border-[#A06126] bg-[#F9F1E2] hover:bg-[#F0E6D2] inline-flex items-center justify-center text-[#A06126] transition ml-1"
                                                title="Send price to Cost of Good"
                                            >
                                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={onAddLine} className="w-full text-left px-5 py-3 text-[12px] font-semibold text-[#A06126] hover:bg-[#FDFBF7] transition border-t border-[#F0EBE3]">
                + Add Item
            </button>
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

            {/* Modal for Selecting Source Price */}
            {selectingLine && (
                <SelectSourcePriceModal
                    line={selectingLine}
                    meta={meta}
                    onClose={() => setSelectingLine(null)}
                    onSelect={(price) => {
                        if (onSelectSource) {
                            onSelectSource(selectingLine.id, price);
                        }
                        setSelectingLine(null);
                    }}
                />
            )}
        </div>
    );
}