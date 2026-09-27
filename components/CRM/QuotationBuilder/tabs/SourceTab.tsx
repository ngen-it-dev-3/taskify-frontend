'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { QuotationLineItem } from '../types';

interface Props {
    lines: QuotationLineItem[];
    onRemoveLine?: (id: string) => void;
    onAddLine?: () => void;
}

export default function SourceTab({ lines, onRemoveLine, onAddLine }: Props) {
    // Only products (skip fixed rows + hide blank rows)
    const displayLines = lines.filter(
        (l) => l.type !== 'fixed' && l.name.trim() !== ''
    );

    return (
        <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#F0EBE3]">
                        <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left">
                            <th className="px-5 py-3 w-12">SI</th>
                            <th className="px-5 py-3 min-w-[260px]">Item</th>
                            <th className="px-5 py-3">Source 1</th>
                            <th className="px-5 py-3 w-24 text-right">Price</th>
                            <th className="px-5 py-3">Source 2</th>
                            <th className="px-5 py-3 w-24 text-right">Price</th>
                            <th className="px-5 py-3">Source 3</th>
                            <th className="px-5 py-3 w-24 text-right">Price</th>
                            <th className="px-5 py-3 w-16 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                        {displayLines.map((l, i) => (
                            <tr key={l.id} className="hover:bg-[#FDFBF7] group">
                                <td className="px-5 py-3 font-mono text-slate-500">{i + 1}</td>
                                <td className="px-5 py-3 font-medium text-slate-800">{l.name}</td>

                                {/* Source 1 */}
                                <td className="px-5 py-3">
                                    {l.source1?.name ? (
                                        <span className="text-slate-700">{l.source1.name}</span>
                                    ) : (
                                        <span className="italic text-rose-500">No Source Available</span>
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
                                        <span className="italic text-rose-500">No Source Available</span>
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
                                        <span className="italic text-rose-500">No Source Available</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right font-mono">
                                    {l.source3?.price || 'N/A'}
                                </td>

                                {/* Delete button */}
                                <td className="px-5 py-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLine?.(l.id)}
                                        className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                        title="Remove this item"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {displayLines.length === 0 && (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-400 italic text-[12px]">
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