'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { QuotationLineItem } from '../types';

interface Props {
    lines: QuotationLineItem[];
    autoEditLineId?: string | null;
    onAutoEditConsumed?: () => void;
    onUpdateLine?: (id: string, patch: Partial<QuotationLineItem>) => void;
    onRemoveLine?: (id: string) => void;
    onAddLine?: () => void;
}

type EditDraft = {
    name: string;                                    // ⭐ now editable
    source1: { name: string; price: string };
    source2: { name: string; price: string };
    source3: { name: string; price: string };
};

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

    // Only products (skip fixed rows + hide blank rows)
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
            name: target.name === 'New Item' ? '' : target.name,   // ⭐ prefill for editing
            source1: {
                name: target.source1?.name || '',
                price: target.source1?.price || '',
            },
            source2: {
                name: target.source2?.name || '',
                price: target.source2?.price || '',
            },
            source3: {
                name: target.source3?.name || '',
                price: target.source3?.price || '',
            },
        });

        onAutoEditConsumed?.();
    }, [autoEditLineId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ⭐ Enter edit mode for a row
    const startEdit = (l: QuotationLineItem) => {
        setEditingId(l.id);
        setDraft({
            name: l.name === 'New Item' ? '' : l.name,
            source1: {
                name: l.source1?.name || '',
                price: l.source1?.price || '',
            },
            source2: {
                name: l.source2?.name || '',
                price: l.source2?.price || '',
            },
            source3: {
                name: l.source3?.name || '',
                price: l.source3?.price || '',
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
        const finalName = clean(draft.name) || 'New Item';   // ⭐ fallback if empty

        onUpdateLine?.(editingId, {
            name: finalName,                                  // ⭐ name now saved
            source1: {
                name: clean(draft.source1.name),
                price: clean(draft.source1.price),
            },
            source2: {
                name: clean(draft.source2.name),
                price: clean(draft.source2.price),
            },
            source3: {
                name: clean(draft.source3.name),
                price: clean(draft.source3.price),
            },
        });

        setEditingId(null);
        setDraft(null);
    };

    const updateDraft = (
        key: 'source1' | 'source2' | 'source3',
        field: 'name' | 'price',
        value: string
    ) => {
        if (!draft) return;
        setDraft({
            ...draft,
            [key]: { ...draft[key], [field]: value },
        });
    };

    return (
        <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#F0EBE3]">
                        <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left">
                            <th className="px-5 py-3 w-12">SI</th>
                            <th className="px-5 py-3 min-w-[220px]">Item</th>
                            <th className="px-5 py-3 min-w-[180px]">Source 1</th>
                            <th className="px-5 py-3 w-28 text-right">Price</th>
                            <th className="px-5 py-3 min-w-[180px]">Source 2</th>
                            <th className="px-5 py-3 w-28 text-right">Price</th>
                            <th className="px-5 py-3 min-w-[180px]">Source 3</th>
                            <th className="px-5 py-3 w-28 text-right">Price</th>
                            <th className="px-5 py-3 w-32 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {displayLines.map((l, i) => {
                            const isEditing = editingId === l.id;

                            // ================= EDIT MODE ROW =================
                            if (isEditing && draft) {
                                return (
                                    <tr key={l.id} className="bg-[#FAF6EE]/70">
                                        <td className="px-5 py-3 font-mono text-slate-500">
                                            {i + 1}
                                        </td>

                                        {/* ⭐ Item name — now editable */}
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.name}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, name: e.target.value })
                                                }
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
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source1.name}
                                                onChange={(e) =>
                                                    updateDraft('source1', 'name', e.target.value)
                                                }
                                                placeholder="Supplier name…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source1.price}
                                                onChange={(e) =>
                                                    updateDraft('source1', 'price', e.target.value)
                                                }
                                                placeholder="$0.00"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>

                                        {/* Source 2 */}
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source2.name}
                                                onChange={(e) =>
                                                    updateDraft('source2', 'name', e.target.value)
                                                }
                                                placeholder="Supplier name…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source2.price}
                                                onChange={(e) =>
                                                    updateDraft('source2', 'price', e.target.value)
                                                }
                                                placeholder="$0.00"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>

                                        {/* Source 3 */}
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source3.name}
                                                onChange={(e) =>
                                                    updateDraft('source3', 'name', e.target.value)
                                                }
                                                placeholder="Supplier name…"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                value={draft.source3.price}
                                                onChange={(e) =>
                                                    updateDraft('source3', 'price', e.target.value)
                                                }
                                                placeholder="$0.00"
                                                className="w-full bg-white border border-[#A06126] rounded px-2 py-1.5 text-[12px] text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>

                                        {/* Save / Cancel */}
                                        <td className="px-3 py-3 text-center whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={saveEdit}
                                                className="w-7 h-7 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white inline-flex items-center justify-center mr-1 transition"
                                                title="Save"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="w-7 h-7 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center transition"
                                                title="Cancel"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }

                            // ================= VIEW MODE ROW =================
                            return (
                                <tr key={l.id} className="hover:bg-[#FDFBF7] group">
                                    <td className="px-5 py-3 font-mono text-slate-500">{i + 1}</td>
                                    <td className="px-5 py-3 font-medium text-slate-800">{l.name}</td>

                                    {/* Source 1 */}
                                    <td className="px-5 py-3">
                                        {l.source1?.name ? (
                                            <span className="text-slate-700">{l.source1.name}</span>
                                        ) : (
                                            <span className="italic text-rose-500">
                                                No Source Available
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono">
                                        {l.source1?.price || 'N/A'}
                                    </td>

                                    {/* Source 2 */}
                                    <td className="px-5 py-3">
                                        {l.source2?.name ? (
                                            <span className="text-slate-700">{l.source2.name}</span>
                                        ) : (
                                            <span className="italic text-rose-500">
                                                No Source Available
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono">
                                        {l.source2?.price || 'N/A'}
                                    </td>

                                    {/* Source 3 */}
                                    <td className="px-5 py-3">
                                        {l.source3?.name ? (
                                            <span className="text-slate-700">{l.source3.name}</span>
                                        ) : (
                                            <span className="italic text-rose-500">
                                                No Source Available
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono">
                                        {l.source3?.price || 'N/A'}
                                    </td>

                                    {/* Action — Edit + Delete */}
                                    <td className="px-5 py-3 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(l)}
                                                className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-slate-50 inline-flex items-center justify-center text-slate-600 transition"
                                                title="Edit sources"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveLine?.(l.id)}
                                                className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 transition"
                                                title="Remove this item"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {displayLines.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="py-8 text-center text-slate-400 italic text-[12px]"
                                >
                                    No items yet — click "+ Add Item" below
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* + Add Item */}
            <button
                type="button"
                onClick={onAddLine}
                className="w-full text-left px-5 py-3 text-[12px] font-semibold text-[#A06126] hover:bg-[#FDFBF7] transition border-t border-[#F0EBE3]"
            >
                + Add Item
            </button>
        </div>
    );
}