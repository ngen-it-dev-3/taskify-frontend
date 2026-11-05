'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Trash2, Check, X, ArrowUpCircle } from 'lucide-react';
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
    const [isDirty, setIsDirty] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeModalSource, setActiveModalSource] = useState<{
        lineId: string;
        sourceKey: 'source1' | 'source2' | 'source3';
        data: QuotationSourceData;
    } | null>(null);

    const [selectingLine, setSelectingLine] = useState<QuotationLineItem | null>(null);

    const isSavingRef = useRef(false);
    const fetchedRatesCache = useRef<Record<string, number>>({});

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
    const targetCurrencyData = CURRENCIES.find(c => c.code === territoryCurrency);
    const targetSymbol = targetCurrencyData?.symbol || territoryCurrency;

    const fetchLiveRate = async (fromCode: string, toCode: string) => {
        if (fromCode === toCode) return 1;

        const cacheKey = `${fromCode}_${toCode}`;
        if (fetchedRatesCache.current[cacheKey]) {
            return fetchedRatesCache.current[cacheKey];
        }

        try {
            const res = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            const rate = data.rates[toCode];
            if (!rate) throw new Error('Rate not found');

            fetchedRatesCache.current[cacheKey] = rate;
            return rate;
        } catch (error) {
            console.error("Rate fetch failed:", error);
            return null;
        }
    };

    // ⭐ Auto-fetch new rates when top header currency changes 
    // (Works in BOTH Edit mode and Read-only mode)
    useEffect(() => {
        let isMounted = true;

        const autoUpdateAllRates = async () => {
            const updatedLinesPromises = lines.map(async (line) => {
                if (line.type === 'fixed' || !line.name.trim()) return null;

                let hasChanges = false;
                const newSource1 = { ...line.source1 };
                const newSource2 = { ...line.source2 };
                const newSource3 = { ...line.source3 };

                const processSource = async (source: any) => {
                    if (!source || !source.price || parseFloat(source.price) <= 0) return;
                    const srcCurr = source.currency || 'BDT';

                    if (srcCurr !== territoryCurrency) {
                        // Fetch the new rate if it's missing or if we are forcing an update
                        const rate = await fetchLiveRate(srcCurr, territoryCurrency);
                        if (rate && source.manualRate !== Number(rate.toFixed(4))) {
                            source.manualRate = Number(rate.toFixed(4));
                            hasChanges = true;
                        }
                    } else {
                        if (source.manualRate) {
                            source.manualRate = undefined;
                            hasChanges = true;
                        }
                    }
                };

                await processSource(newSource1);
                await processSource(newSource2);
                await processSource(newSource3);

                if (hasChanges) {
                    return {
                        id: line.id,
                        patch: {
                            source1: newSource1,
                            source2: newSource2,
                            source3: newSource3
                        }
                    };
                }
                return null;
            });

            const results = await Promise.all(updatedLinesPromises);

            if (isMounted && onUpdateLine) {
                results.forEach(res => {
                    if (res) onUpdateLine(res.id, res.patch);
                });
            }
        };

        autoUpdateAllRates();

        // Also update the current draft if we are in edit mode
        if (draft) {
            const updateDraftRates = async () => {
                let needsUpdate = false;
                const newDraft = { ...draft };

                const processDraftSource = async (key: 'source1' | 'source2' | 'source3') => {
                    const sourceCurr = newDraft[key].currency || 'BDT';
                    if (sourceCurr !== territoryCurrency) {
                        const rate = await fetchLiveRate(sourceCurr, territoryCurrency);
                        if (rate && newDraft[key].manualRate !== Number(rate.toFixed(4))) {
                            newDraft[key].manualRate = Number(rate.toFixed(4));
                            needsUpdate = true;
                        }
                    } else if (newDraft[key].manualRate) {
                        newDraft[key].manualRate = undefined;
                        needsUpdate = true;
                    }
                };

                await processDraftSource('source1');
                await processDraftSource('source2');
                await processDraftSource('source3');

                if (needsUpdate && isMounted) {
                    setDraft(newDraft);
                    setIsDirty(true);
                }
            };
            updateDraftRates();
        }

        return () => { isMounted = false; };
    }, [territoryCurrency, lines.length]); // Triggers when top currency changes

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

    const startEdit = (l: QuotationLineItem) => {
        if (editingId === l.id) return;
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

        setTimeout(() => {
            isSavingRef.current = false;
        }, 100);
    };

    const handleRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
        if (!isDirty) return;
        const currentRow = e.currentTarget;
        const nextFocused = e.relatedTarget as HTMLElement;
        if (nextFocused && currentRow.contains(nextFocused)) return;

        setTimeout(() => saveEdit(), 50);
    };

    const handleUpdateSource = async (
        key: 'source1' | 'source2' | 'source3',
        field: keyof SourceData,
        value: any
    ) => {
        if (!draft) return;
        setIsDirty(true);

        let updatedSource = { ...draft[key], [field]: value };

        if (field === 'currency') {
            updatedSource.manualRate = undefined;
            const newCurr = value;

            if (newCurr !== territoryCurrency) {
                const rate = await fetchLiveRate(newCurr, territoryCurrency);
                if (rate) {
                    updatedSource.manualRate = Number(rate.toFixed(4));
                }
            }
        }

        if (field === 'price' && value && !updatedSource.manualRate) {
            const curr = updatedSource.currency || 'BDT';
            if (curr !== territoryCurrency) {
                const rate = await fetchLiveRate(curr, territoryCurrency);
                if (rate) {
                    updatedSource.manualRate = Number(rate.toFixed(4));
                }
            }
        }

        setDraft({
            ...draft,
            [key]: updatedSource,
        });
    };

    const handleTotalBlur = (
        key: 'source1' | 'source2' | 'source3',
        newTotal: string
    ) => {
        if (!draft) return;
        const totalNum = parseFloat(newTotal);
        const priceNum = parseFloat(draft[key].price);

        if (!isNaN(totalNum) && !isNaN(priceNum) && priceNum > 0) {
            const newRate = totalNum / priceNum;
            setDraft(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [key]: { ...prev[key], manualRate: Number(newRate.toFixed(4)) }
                }
            });
            setIsDirty(true);
        }
    };

    const calcConverted = (priceStr: string | number | undefined, fromCurrency: string = 'BDT', manualRate?: number) => {
        const price = parseFloat(String(priceStr || '0'));
        if (isNaN(price) || price <= 0) return { value: 0, symbol: targetSymbol };

        if (fromCurrency === territoryCurrency) {
            return { value: price, symbol: targetSymbol };
        }

        if (manualRate && manualRate > 0) {
            return { value: price * manualRate, symbol: targetSymbol };
        }

        return { value: 0, symbol: targetSymbol };
    };

    const openSourceModal = (e: React.MouseEvent, lineId: string, sourceKey: 'source1' | 'source2' | 'source3', data: any) => {
        e.stopPropagation();
        if (!data || !data.name) return;
        setActiveModalSource({ lineId, sourceKey, data });
        setModalOpen(true);
    };

    const handleModalSave = (updatedData: QuotationSourceData) => {
        if (!activeModalSource) return;
        const { lineId, sourceKey } = activeModalSource;

        onUpdateLine?.(lineId, { [sourceKey]: updatedData } as any);
        setModalOpen(false);
        setActiveModalSource(null);
    };

    const RateInput = ({ sourceKey, value }: { sourceKey: 'source1' | 'source2' | 'source3', value: number | undefined }) => (
        <input
            type="number"
            step="0.0001"
            value={value || ''}
            onChange={(e) => handleUpdateSource(sourceKey, 'manualRate', Number(e.target.value) || undefined)}
            onBlur={(e) => {
                const val = Number(e.target.value);
                if (val) handleTotalBlur(sourceKey, String((parseFloat(draft?.[sourceKey].price || '0') * val)));
            }}
            placeholder="Rate"
            className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-center font-mono text-[#A06126] focus:outline-none"
            title={`1 ${draft?.[sourceKey].currency} = ? ${territoryCurrency}`}
        />
    );

    const TotalInput = ({ sourceKey, calculated }: { sourceKey: 'source1' | 'source2' | 'source3', calculated: any }) => {
        const [localTotal, setLocalTotal] = useState(calculated.value ? calculated.value.toFixed(2) : '');

        useEffect(() => {
            setLocalTotal(calculated.value ? calculated.value.toFixed(2) : '');
        }, [calculated.value]);

        return (
            <div className="relative">
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{targetSymbol}</span>
                <input
                    type="number"
                    value={localTotal}
                    onChange={(e) => setLocalTotal(e.target.value)}
                    onBlur={(e) => {
                        if (e.target.value !== (calculated.value ? calculated.value.toFixed(2) : '')) {
                            handleTotalBlur(sourceKey, e.target.value);
                        }
                    }}
                    className="w-full bg-white border border-transparent hover:border-[#A06126] focus:border-[#A06126] rounded px-1 pl-5 py-1 text-right font-mono font-semibold text-[#0F2D4A] focus:outline-none transition-colors"
                    title="Type a target total to reverse-calculate the rate"
                />
            </div>
        );
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
                                    <tr key={l.id} className="bg-[#FAF6EE]/70" onBlur={handleRowBlur}>
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

                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source1.name}
                                                onChange={(e) => handleUpdateSource('source1', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source1.currency}
                                                    onChange={(e) => handleUpdateSource('source1', 'currency', e.target.value)}
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
                                                    onChange={(e) => handleUpdateSource('source1', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <RateInput sourceKey="source1" value={draft.source1.manualRate} />
                                        </td>
                                        <td className="px-2 py-2 text-right border-r border-[#F0EBE3]">
                                            <TotalInput sourceKey="source1" calculated={s1} />
                                        </td>

                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source2.name}
                                                onChange={(e) => handleUpdateSource('source2', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source2.currency}
                                                    onChange={(e) => handleUpdateSource('source2', 'currency', e.target.value)}
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
                                                    onChange={(e) => handleUpdateSource('source2', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <RateInput sourceKey="source2" value={draft.source2.manualRate} />
                                        </td>
                                        <td className="px-2 py-2 text-right border-r border-[#F0EBE3]">
                                            <TotalInput sourceKey="source2" calculated={s2} />
                                        </td>

                                        <td className="px-2 py-2">
                                            <input
                                                value={draft.source3.name}
                                                onChange={(e) => handleUpdateSource('source3', 'name', e.target.value)}
                                                placeholder="Supplier…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px]"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-1 rounded border border-[#A06126] overflow-hidden bg-white">
                                                <select
                                                    value={draft.source3.currency}
                                                    onChange={(e) => handleUpdateSource('source3', 'currency', e.target.value)}
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
                                                    onChange={(e) => handleUpdateSource('source3', 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full min-w-0 px-2 py-1.5 text-[12px] text-right font-mono focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <RateInput sourceKey="source3" value={draft.source3.manualRate} />
                                        </td>
                                        <td className="px-2 py-2 text-right border-r border-[#F0EBE3]">
                                            <TotalInput sourceKey="source3" calculated={s3} />
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

                            const hasS1 = (l.source1?.name && l.source1.name.trim() !== '') || (l.source1?.price && parseFloat(l.source1.price) > 0);
                            const hasS2 = (l.source2?.name && l.source2.name.trim() !== '') || (l.source2?.price && parseFloat(l.source2.price) > 0);
                            const hasS3 = (l.source3?.name && l.source3.name.trim() !== '') || (l.source3?.price && parseFloat(l.source3.price) > 0);

                            const v1 = calcConverted(l.source1?.price, l.source1?.currency, (l.source1 as any)?.manualRate);
                            const v2 = calcConverted(l.source2?.price, l.source2?.currency, (l.source2 as any)?.manualRate);
                            const v3 = calcConverted(l.source3?.price, l.source3?.currency, (l.source3 as any)?.manualRate);

                            return (
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
                                        {hasS1 ? ((l.source1 as any)?.manualRate || '—') : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS1 ? <>{v1.symbol}{v1.value.toFixed(2)}</> : `${targetSymbol}0.00`}
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
                                        {hasS2 ? ((l.source2 as any)?.manualRate || '—') : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS2 ? <>{v2.symbol}{v2.value.toFixed(2)}</> : `${targetSymbol}0.00`}
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
                                        {hasS3 ? ((l.source3 as any)?.manualRate || '—') : '—'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-mono font-bold text-[#0F2D4A] border-r border-[#F0EBE3]">
                                        {hasS3 ? <>{v3.symbol}{v3.value.toFixed(2)}</> : `${targetSymbol}0.00`}
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