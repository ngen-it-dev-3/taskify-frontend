'use client';

import React from 'react';
import { X, Check, ArrowUpCircle } from 'lucide-react';
import type { QuotationLineItem, QuotationMeta } from '../types';
import { CURRENCIES } from '../constants';

interface Props {
    line: QuotationLineItem;
    meta: QuotationMeta;
    onClose: () => void;
    onSelect: (price: number) => void;
}

export default function SelectSourcePriceModal({ line, meta, onClose, onSelect }: Props) {
    const territoryCurrency = meta.currency || 'BDT';
    const symbol = CURRENCIES.find(c => c.code === territoryCurrency)?.symbol || territoryCurrency;

    // Helper to calculate the final converted price based on manual rate or fallback
    const calcConverted = (priceStr: string | number | undefined, fromCurrency: string = 'BDT', manualRate?: number) => {
        const price = parseFloat(String(priceStr || '0'));
        if (isNaN(price) || price <= 0) return 0;

        if (fromCurrency === territoryCurrency) return price;

        if (manualRate && manualRate > 0) {
            return price * manualRate;
        }

        const sourceCurrencyData = CURRENCIES.find(c => c.code === fromCurrency);
        const sourceRateToBDT = sourceCurrencyData?.rateToBDT || 1;
        const bdtAmount = price * sourceRateToBDT;
        const targetRateToBDT = CURRENCIES.find(c => c.code === territoryCurrency)?.rateToBDT || 1;
        
        return bdtAmount / targetRateToBDT;
    };

    const s1Price = calcConverted(line.source1?.price, line.source1?.currency, (line.source1 as any)?.manualRate);
    const s2Price = calcConverted(line.source2?.price, line.source2?.currency, (line.source2 as any)?.manualRate);
    const s3Price = calcConverted(line.source3?.price, line.source3?.currency, (line.source3 as any)?.manualRate);

    const hasS1 = s1Price > 0;
    const hasS2 = s2Price > 0;
    const hasS3 = s3Price > 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-[#FAF8F5]">
                    <div>
                        <h3 className="text-sm font-bold text-[#0F2D4A]">Select Price for Cost of Good</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{line.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-6 space-y-3">
                    <p className="text-xs text-slate-600 mb-4">
                        Choose which calculated source price should be used as the Principal Cost in the Cost of Good table.
                    </p>

                    {!hasS1 && !hasS2 && !hasS3 && (
                        <div className="text-center py-6 text-rose-500 text-xs font-medium">
                            No valid prices found in any source for this item.
                        </div>
                    )}

                    {/* Option 1 */}
                    {hasS1 && (
                        <button
                            onClick={() => onSelect(s1Price)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-[#E2DBD1] hover:border-[#A06126] hover:bg-[#FDFBF7] transition text-left group"
                        >
                            <div>
                                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                    <ArrowUpCircle className="w-4 h-4 text-[#A06126]" />
                                    Source 1: {line.source1?.name || 'Supplier'}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 ml-6">
                                    {line.source1?.currency} {line.source1?.price} 
                                    {(line.source1 as any)?.manualRate ? ` (Rate: ${(line.source1 as any).manualRate})` : ''}
                                </div>
                            </div>
                            <div className="font-mono font-bold text-[#0F2D4A] text-lg group-hover:text-[#A06126] transition">
                                {symbol}{s1Price.toFixed(2)}
                            </div>
                        </button>
                    )}

                    {/* Option 2 */}
                    {hasS2 && (
                        <button
                            onClick={() => onSelect(s2Price)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-[#E2DBD1] hover:border-[#A06126] hover:bg-[#FDFBF7] transition text-left group"
                        >
                            <div>
                                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                    <ArrowUpCircle className="w-4 h-4 text-[#A06126]" />
                                    Source 2: {line.source2?.name || 'Supplier'}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 ml-6">
                                    {line.source2?.currency} {line.source2?.price} 
                                    {(line.source2 as any)?.manualRate ? ` (Rate: ${(line.source2 as any).manualRate})` : ''}
                                </div>
                            </div>
                            <div className="font-mono font-bold text-[#0F2D4A] text-lg group-hover:text-[#A06126] transition">
                                {symbol}{s2Price.toFixed(2)}
                            </div>
                        </button>
                    )}

                    {/* Option 3 */}
                    {hasS3 && (
                        <button
                            onClick={() => onSelect(s3Price)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-[#E2DBD1] hover:border-[#A06126] hover:bg-[#FDFBF7] transition text-left group"
                        >
                            <div>
                                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                    <ArrowUpCircle className="w-4 h-4 text-[#A06126]" />
                                    Source 3: {line.source3?.name || 'Supplier'}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 ml-6">
                                    {line.source3?.currency} {line.source3?.price} 
                                    {(line.source3 as any)?.manualRate ? ` (Rate: ${(line.source3 as any).manualRate})` : ''}
                                </div>
                            </div>
                            <div className="font-mono font-bold text-[#0F2D4A] text-lg group-hover:text-[#A06126] transition">
                                {symbol}{s3Price.toFixed(2)}
                            </div>
                        </button>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}