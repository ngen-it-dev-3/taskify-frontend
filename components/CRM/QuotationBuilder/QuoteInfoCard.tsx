'use client';

import React from 'react';
import { Settings, MessageCircle, Loader2 } from 'lucide-react';
import type { QuotationMeta } from './types';
import Link from 'next/link';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
  onSaveDraft?: () => void;
  onGenerateQuote?: () => void;
  onDiscuss?: () => void;
  generating?: boolean;         // ⭐ NEW — controls loader + disable
  savingDraft?: boolean;        // ⭐ optional — same for Save Draft
}

export default function QuoteInfoCard({
  meta,
  onChange,
  onSaveDraft,
  onGenerateQuote,
  onDiscuss,
  generating = false,
  savingDraft = false,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs">
      {/* ---------- TOP ROW ---------- */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4 flex-wrap">
        {/* Left block */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#EEF4FB] text-[#1F3864] font-semibold font-mono tracking-tight">
              {meta.rfqNumber}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 transition"
            >
              <Settings className="w-3 h-3" />
              <span className="font-medium">Numbering Settings</span>
            </button>
          </div>

          <h2 className="text-[20px] font-serif font-bold text-[#0F2D4A] tracking-tight mt-3">
            {meta.title}
          </h2>
        </div>

        {/* Right block — action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-center">
          <Link
            href="/team-chat"
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-slate-700 text-xs font-semibold hover:bg-slate-50 rounded-lg transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#A06126]" />
            Discuss
          </Link>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={generating || savingDraft}
            className="px-4 py-2 rounded-lg border border-[#E2DBD1] bg-white text-[#0F2D4A] text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </button>

          {/* ⭐ Generate Quote button with loader + disabled state */}
          <button
            type="button"
            onClick={onGenerateQuote}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A06126] hover:bg-[#88501E] text-white text-xs font-semibold transition shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              'Generate Quote & Push to Forecast'
            )}
          </button>
        </div>
      </div>

      {/* ---------- BOTTOM ROW ---------- */}
      <div className="px-5 pb-4 flex flex-wrap items-center gap-x-10 gap-y-2">
        <MetaItem label="TERRITORY" value={meta.territory} />
        <MetaItem label="CRM MANAGER" value={meta.crmManager} />
        <MetaItem label="STAGE" value={meta.stage} />
        <MetaItem label="CURRENCY" value={meta.currency} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- */
function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="text-[12.5px] font-semibold text-[#0F2D4A] mt-0.5">
        {value}
      </div>
    </div>
  );
}