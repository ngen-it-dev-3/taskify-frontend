// components/CRM/quotation-builder/QuoteInfoCard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Settings, MessageCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { QuotationMeta } from './types';
import Link from 'next/link';
import { NumberingApi } from '@/services/numbering.service';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
  onSaveDraft?: () => void;
  onGenerateQuote?: () => void;
  onDiscuss?: () => void;
  generating?: boolean;
  savingDraft?: boolean;
}

type DocType = 'quote' | 'pq';

/* -----------------------------------------------------------
   Country presets
----------------------------------------------------------- */
const COUNTRY_CODES = [
  { code: 'NG', label: 'NG — Nigeria' },
  { code: 'SG', label: 'SG — Singapore' },
  { code: 'EU', label: 'EU — Europe' },
  { code: 'BD', label: 'BD — Bangladesh' },
  { code: 'US', label: 'US — United States' },
  { code: 'GB', label: 'GB — United Kingdom' },
  { code: 'IN', label: 'IN — India' },
  { code: 'AE', label: 'AE — UAE' },
  { code: 'ZA', label: 'ZA — South Africa' },
  { code: 'KE', label: 'KE — Kenya' },
  { code: 'GH', label: 'GH — Ghana' },
  { code: 'other', label: 'Other (type manually)…' },
];

/* -----------------------------------------------------------
   ⭐ Region / Branch presets
----------------------------------------------------------- */
const REGION_CODES = [
  { code: 'BD', label: 'BD — Bangladesh' },
  { code: 'SG', label: 'SG — Singapore' },
  { code: 'EU', label: 'EU — Europe' },
  { code: 'NG', label: 'NG — Nigeria' },
  { code: 'IN', label: 'IN — India' },
  { code: 'AE', label: 'AE — UAE' },
  { code: 'UK', label: 'UK — United Kingdom' },
  { code: 'US', label: 'US — United States' },
  { code: 'other', label: 'Other (type manually)…' },
];

/* -----------------------------------------------------------
   Date conversion helpers
   Stored format:  YYMMDD      ("261008")
   Display format: DD/MM/YYYY  ("08/10/2026")
----------------------------------------------------------- */

/** "261008" → "08/10/2026" */
function formatDdMmYyyy(yyMmDd: string): string {
  const digits = (yyMmDd || '').replace(/\D/g, '');
  if (digits.length !== 6) return '';
  const yy = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  return `${dd}/${mm}/20${yy}`;
}

/** "08/10/2026" or "08102026" → "261008" */
function ddmmyyyyToYyMmDd(input: string): string {
  const d = (input || '').replace(/\D/g, '').slice(0, 8);
  if (d.length !== 8) return '';
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yy = d.slice(6, 8);
  return `${yy}${mm}${dd}`;
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
  const [numberingOpen, setNumberingOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#EEF4FB] text-[#1F3864] font-semibold font-mono tracking-tight">
                {meta.pqNumber || meta.quotationNumber || meta.rfqNumber || 'RFQ-…'}
              </span>
              <button
                type="button"
                onClick={() => setNumberingOpen(true)}
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

        <div className="px-5 pb-4 flex flex-wrap items-center gap-x-10 gap-y-2">
          <MetaItem label="TERRITORY" value={meta.territory} />
          <MetaItem label="CRM MANAGER" value={meta.crmManager} />
          <MetaItem label="STAGE" value={meta.stage} />
          <MetaItem label="CURRENCY" value={meta.currency} />
        </div>
      </div>

      {numberingOpen && (
        <NumberingSettingsModal onClose={() => setNumberingOpen(false)} />
      )}
    </>
  );
}

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

function NumberingSettingsModal({ onClose }: { onClose: () => void }) {
  const [docType, setDocType] = useState<DocType>('quote');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [quoteState, setQuoteState] = useState({
    rfqPrefix: 'RFQ',
    quotationPrefix: 'QTN',
    yearSegment: 'auto' as 'auto' | 'yy' | 'yyyy' | 'none',
    nextSeq: 143,
    padding: 4,
    resetCycle: 'never' as 'never' | 'yearly' | 'monthly',
  });

  const [pqState, setPqState] = useState({
    countryCode: 'NG',
    regionCode: 'BD',
    entityCode: 'EGCB',
    docTypeCode: 'RV',
    useTodayDate: true,
    manualDate: '',
    nextSeq: 1,
    padding: 4,
    resetCycle: 'never' as 'never' | 'yearly' | 'monthly',
  });

  const isQuote = docType === 'quote';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const scope = docType === 'pq' ? 'pq' : 'quote';
        const data = await NumberingApi.get(scope);
        if (cancelled || !data) return;
        if (scope === 'quote') setQuoteState((s) => ({ ...s, ...(data as any) }));
        else setPqState((s) => ({ ...s, ...(data as any) }));
      } catch (e: any) {
        toast.error(e.message || 'Could not load numbering settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docType]);

  const updateQuote = <K extends keyof typeof quoteState>(
    key: K,
    value: (typeof quoteState)[K]
  ) => setQuoteState((s) => ({ ...s, [key]: value }));

  const updatePq = <K extends keyof typeof pqState>(
    key: K,
    value: (typeof pqState)[K]
  ) => setPqState((s) => ({ ...s, [key]: value }));

  /* ---------- Quotation preview ---------- */
  const year = new Date().getFullYear();
  const quoteYearPart =
    quoteState.yearSegment === 'none'
      ? ''
      : quoteState.yearSegment === 'yy'
        ? String(year).slice(-2)
        : String(year);
  const quotePadded = String(quoteState.nextSeq || 0).padStart(
    Math.max(1, Number(quoteState.padding) || 4),
    '0'
  );
  const quotePreview = [quoteState.rfqPrefix, quoteYearPart, quotePadded]
    .filter(Boolean)
    .join('-');

  /* ---------- PQ preview ---------- */
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayYyMmDd = `${yy}${mm}${dd}`;
  const todayDdMmYyyy = `${dd}/${mm}/${yyyy}`;

  const pqDatePart = pqState.useTodayDate
    ? todayYyMmDd
    : (pqState.manualDate || todayYyMmDd).replace(/[^\d]/g, '').slice(0, 6);

  const pqPadded = String(pqState.nextSeq || 0).padStart(
    Math.max(1, Number(pqState.padding) || 4),
    '0'
  );

  const pqPreview = `${pqState.countryCode}-${pqState.regionCode}/${pqState.entityCode}/${pqState.docTypeCode}/${pqDatePart}-${pqPadded}`;

  const isPresetCountry = COUNTRY_CODES.some(
    (c) => c.code === pqState.countryCode
  );
  const isPresetRegion = REGION_CODES.some(
    (c) => c.code === pqState.regionCode
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const scope = isQuote ? 'quote' : 'pq';
      const payload = isQuote ? quoteState : pqState;
      await NumberingApi.update(scope, payload as any);
      toast.success(
        isQuote
          ? 'Quotation numbering settings saved'
          : 'PQ numbering settings saved'
      );
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#0F2D4A]">
              {isQuote
                ? 'RFQ / Quotation Numbering Settings'
                : 'PQ / Purchase Order Numbering Settings'}
            </h2>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed max-w-[520px]">
              {isQuote
                ? 'Restricted to Super Admin (Management / CEO) — this controls how every future RFQ and Quotation number is generated system-wide.'
                : 'Restricted to Super Admin (Management / CEO) — this controls how every future PQ and Purchase Order number is generated system-wide.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 inline-flex rounded-lg border border-[#E2DBD1] bg-slate-50 p-0.5">
          {(['quote', 'pq'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocType(t)}
              className={`px-4 py-1.5 text-[11px] font-semibold rounded-md transition ${docType === t
                ? 'bg-white text-[#0F2D4A] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t === 'quote' ? 'Quotation' : 'Purchase Quotation'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading settings…
          </div>
        ) : isQuote ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="RFQ Prefix">
                <input
                  value={quoteState.rfqPrefix}
                  onChange={(e) =>
                    updateQuote('rfqPrefix', e.target.value.toUpperCase())
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>
              <Field label="Quotation Prefix">
                <input
                  value={quoteState.quotationPrefix}
                  onChange={(e) =>
                    updateQuote('quotationPrefix', e.target.value.toUpperCase())
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Year Segment">
                <select
                  value={quoteState.yearSegment}
                  onChange={(e) =>
                    updateQuote(
                      'yearSegment',
                      e.target.value as typeof quoteState.yearSegment
                    )
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                >
                  <option value="auto">Auto (current year)</option>
                  <option value="yy">2-digit year (26)</option>
                  <option value="yyyy">4-digit year (2026)</option>
                  <option value="none">No year segment</option>
                </select>
              </Field>
              <Field label="Next Sequence Number">
                <input
                  type="number"
                  value={quoteState.nextSeq}
                  onChange={(e) =>
                    updateQuote('nextSeq', Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Sequence Digits (Padding)">
                <input
                  type="number"
                  value={quoteState.padding}
                  onChange={(e) =>
                    updateQuote('padding', Number(e.target.value) || 4)
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>
              <Field label="Reset Sequence">
                <div className="inline-flex w-full rounded-lg border border-[#E2DBD1] bg-slate-50 p-0.5">
                  {(
                    [
                      { v: 'never', l: 'Never' },
                      { v: 'yearly', l: 'Yearly' },
                      { v: 'monthly', l: 'Monthly' },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => updateQuote('resetCycle', o.v)}
                      className={`flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition ${quoteState.resetCycle === o.v
                        ? 'bg-white text-[#0F2D4A] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-5 rounded-xl border border-[#F5D9B8] bg-[#FFF7E8] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
                Live Preview — Next RFQ Number
              </div>
              <div className="font-mono text-[15px] font-bold text-[#0F2D4A]">
                {quotePreview}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Country Code">
                <select
                  value={isPresetCountry ? pqState.countryCode : 'other'}
                  onChange={(e) => {
                    const v = e.target.value;
                    updatePq('countryCode', v === 'other' ? '' : v);
                  }}
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {!isPresetCountry && (
                  <input
                    autoFocus
                    value={pqState.countryCode}
                    onChange={(e) =>
                      updatePq(
                        'countryCode',
                        e.target.value.toUpperCase().slice(0, 4)
                      )
                    }
                    placeholder="Type code (e.g. CH)"
                    className="mt-2 w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                  />
                )}
              </Field>

              {/* ⭐ Region / Branch — now a dropdown with "Other" */}
              <Field label="Region / Branch Code">
                <select
                  value={isPresetRegion ? pqState.regionCode : 'other'}
                  onChange={(e) => {
                    const v = e.target.value;
                    updatePq('regionCode', v === 'other' ? '' : v);
                  }}
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                >
                  {REGION_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {!isPresetRegion && (
                  <input
                    autoFocus
                    value={pqState.regionCode}
                    onChange={(e) =>
                      updatePq(
                        'regionCode',
                        e.target.value.toUpperCase().slice(0, 6)
                      )
                    }
                    placeholder="Type code (e.g. CH)"
                    className="mt-2 w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                  />
                )}
              </Field>

              <Field label="Entity / Company Code">
                <input
                  value={pqState.entityCode}
                  onChange={(e) =>
                    updatePq('entityCode', e.target.value.toUpperCase().slice(0, 12))
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Document Type Code">
                <input
                  value={pqState.docTypeCode}
                  onChange={(e) =>
                    updatePq('docTypeCode', e.target.value.toUpperCase().slice(0, 6))
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              {/* Date Segment — DD/MM/YYYY display, YYMMDD storage */}
              <Field label="Date (DD/MM/YYYY)">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      pqState.useTodayDate
                        ? todayDdMmYyyy
                        : formatDdMmYyyy(pqState.manualDate)
                    }
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/[^\d]/g, '')
                        .slice(0, 8);
                      updatePq('manualDate', ddmmyyyyToYyMmDd(digits));
                    }}
                    disabled={pqState.useTodayDate}
                    placeholder="DD/MM/YYYY"
                    className="flex-1 rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => updatePq('useTodayDate', !pqState.useTodayDate)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${pqState.useTodayDate
                      ? 'border-[#A06126] bg-[#FFF7E8] text-[#A06126]'
                      : 'border-[#E2DBD1] bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    {pqState.useTodayDate ? 'Auto (Today)' : 'Manual'}
                  </button>
                </div>
              </Field>

              <Field label="Next Serial Number">
                <input
                  type="number"
                  value={pqState.nextSeq}
                  onChange={(e) => updatePq('nextSeq', Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Serial Digits (Padding)">
                <input
                  type="number"
                  value={pqState.padding}
                  onChange={(e) =>
                    updatePq('padding', Number(e.target.value) || 4)
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Reset Serial">
                <div className="inline-flex w-full rounded-lg border border-[#E2DBD1] bg-slate-50 p-0.5">
                  {(
                    [
                      { v: 'never', l: 'Never' },
                      { v: 'yearly', l: 'Yearly' },
                      { v: 'monthly', l: 'Monthly' },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => updatePq('resetCycle', o.v)}
                      className={`flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition ${pqState.resetCycle === o.v
                        ? 'bg-white text-[#0F2D4A] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-5 rounded-xl border border-[#F5D9B8] bg-[#FFF7E8] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
                Live Preview — Next PQ Number
              </div>
              <div className="font-mono text-[15px] font-bold text-[#0F2D4A] break-all">
                {pqPreview}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E2DBD1] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Saving…' : 'Save Numbering Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}