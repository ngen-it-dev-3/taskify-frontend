'use client';

import React from 'react';
import { MessageSquare, FileText } from 'lucide-react';
import type { TopTabKey } from './types';

interface Props {
    topTab: TopTabKey;
    onTabChange: (t: TopTabKey) => void;
    quoteCount: number;
    draftCount: number;
    onSaveDraft: () => void;
    onGenerateQuote: () => void;
}

export default function Header({
    topTab,
    onTabChange,
    quoteCount,
    draftCount,
    onSaveDraft,
    onGenerateQuote,
}: Props) {
    return (
        <>
            {/* ---------- PAGE TITLE ---------- */}
            <div className="mb-6">
                <div className="text-[11px] font-bold tracking-wider text-[#A06126] uppercase">
                    CRM Dashboard
                </div>
                <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
                    Quotation Builder
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Build a quote, track what's already sent, and pick up drafts in progress.
                </p>
            </div>

            {/* ---------- TOP TABS ---------- */}
            <div className="border-b border-[#EBE6DF] mb-6 flex items-center gap-6 text-xs">
                <TopTab
                    active={topTab === 'builder'}
                    onClick={() => onTabChange('builder')}
                    label="Quotation Builder"
                />
                <TopTab
                    active={topTab === 'quotes'}
                    onClick={() => onTabChange('quotes')}
                    label="Quotes"
                    badge={quoteCount}
                />
                <TopTab
                    active={topTab === 'drafts'}
                    onClick={() => onTabChange('drafts')}
                    label="Drafts"
                    badge={draftCount}
                />
            </div>
        </>
    );
}

function TopTab({
    active,
    onClick,
    label,
    badge,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    badge?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 font-semibold relative inline-flex items-center gap-2 transition ${active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            {label}
            {badge !== undefined && (
                <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[10px] font-bold ${active
                            ? 'bg-[#F9F1E2] text-[#A06126]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                >
                    {badge}
                </span>
            )}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
            )}
        </button>
    );
}