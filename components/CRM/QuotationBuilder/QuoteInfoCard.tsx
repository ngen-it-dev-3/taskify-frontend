// components/CRM/quotation-builder/QuoteInfoCard.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Settings, MessageCircle, Loader2, X, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { QuotationMeta } from './types';
import Link from 'next/link';
import { NumberingApi } from '@/services/numbering.service';
import { COUNTRIES, CURRENCIES } from './constants';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
  onSaveDraft?: () => void;
  onGenerateQuote?: () => void;
  onDiscuss?: () => void;
  generating?: boolean;
  savingDraft?: boolean;
  onNumberingSaved?: () => void;
}

type DocType = 'quote' | 'pq';

/* -----------------------------------------------------------
   Country presets (for Numbering Modal) — Strictly 5
   ⭐ Labels match constants.ts CURRENCIES[].country exactly
----------------------------------------------------------- */
const COUNTRY_CODES = [
  { code: 'SG', label: 'SG — Singapore' },
  { code: 'GB', label: 'GB — United Kingdom' },
  { code: 'BD', label: 'BD — Bangladesh' },
  { code: 'AE', label: 'AE — Middle East' },
  { code: 'PT', label: 'PT — Portugal' },
  { code: 'other', label: 'Other (type manually)…' },
];

/* -----------------------------------------------------------
   Region / Branch presets (for Numbering Modal) — Strictly 5
----------------------------------------------------------- */
const REGION_CODES = [
  { code: 'SG', label: 'SG — Singapore' },
  { code: 'GB', label: 'GB — United Kingdom' },
  { code: 'BD', label: 'BD — Bangladesh' },
  { code: 'AE', label: 'AE — Middle East' },
  { code: 'PT', label: 'PT — Portugal' },
  { code: 'other', label: 'Other (type manually)…' },
];

/* -----------------------------------------------------------
   Country flags (keep in sync with constants.ts)
----------------------------------------------------------- */
const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: '🇸🇬',
  'United Kingdom': '🇬🇧',
  Bangladesh: '🇧🇩',
  'Middle East': '🇦🇪',
  Portugal: '🇵🇹',
};

/* -----------------------------------------------------------
   Date conversion helpers
----------------------------------------------------------- */
function formatDdMmYyyy(yyMmDd: string): string {
  const digits = (yyMmDd || '').replace(/\D/g, '');
  if (digits.length !== 6) return '';
  const yy = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  return `${dd}/${mm}/20${yy}`;
}

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
  onNumberingSaved,
}: Props) {
  const [numberingOpen, setNumberingOpen] = useState(false);
  const [territoryOpen, setTerritoryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const territoryRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (territoryRef.current && !territoryRef.current.contains(e.target as Node)) {
        setTerritoryOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when closing, auto-focus when opening
  useEffect(() => {
    if (!territoryOpen) {
      setCountrySearch('');
    } else {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [territoryOpen]);

  // Filter the dynamically generated list from constants.ts
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.trim().toLowerCase())
  );

  const handleTerritoryChange = (newTerritory: string) => {
    const companyName =
      meta.title.split('—')[0].trim() || meta.client?.company || 'Client';
    const newTitle = `${companyName} — ${newTerritory}`;

    // ⭐ Look up the currency directly from your CURRENCIES array
    const currencyData = CURRENCIES.find((c) => c.country === newTerritory);

    const newCurrency = currencyData?.code || meta.currency;
    const newRate = newCurrency === 'BDT' ? 1 : currencyData?.rateToBDT || 1;

    onChange({
      ...meta,
      territory: newTerritory,
      country: newTerritory,
      title: newTitle,
      currency: newCurrency,
      currencySymbol: currencyData?.symbol || meta.currencySymbol,
      exchangeRate: newRate,
    });

    setTerritoryOpen(false);
  };

  const handleCurrencyChange = (newCurrencyCode: string) => {
    const currencyData = CURRENCIES.find((c) => c.code === newCurrencyCode);
    const newRate =
      newCurrencyCode === 'BDT' ? 1 : currencyData?.rateToBDT || 1;

    onChange({
      ...meta,
      currency: newCurrencyCode,
      currencySymbol: currencyData?.symbol || meta.currencySymbol,
      exchangeRate: newRate,
    });

    setCurrencyOpen(false);
  };

  // Deduplicate currencies for the dropdown
  const uniqueCurrencies = Array.from(new Set(CURRENCIES.map((c) => c.code)))
    .map((code) => CURRENCIES.find((c) => c.code === code))
    .filter(Boolean) as typeof CURRENCIES;

  // ⭐ Always derive the symbol from the array to prevent stale state
  const activeCurrency = CURRENCIES.find((c) => c.code === meta.currency);
  const displaySymbol = activeCurrency?.symbol || meta.currencySymbol;

  // Discuss button: prefer handler, fall back to Link
  const DiscussButton = onDiscuss ? (
    <button
      type="button"
      onClick={onDiscuss}
      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-slate-700 text-xs font-semibold hover:bg-slate-50 rounded-lg transition"
    >
      <MessageCircle className="w-3.5 h-3.5 text-[#A06126]" />
      Discuss
    </button>
  ) : (
    <Link
      href="/team-chat"
      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-slate-700 text-xs font-semibold hover:bg-slate-50 rounded-lg transition"
    >
      <MessageCircle className="w-3.5 h-3.5 text-[#A06126]" />
      Discuss
    </Link>
  );

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
            {DiscussButton}

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

        <div className="px-5 pb-4 flex flex-wrap items-center gap-x-8 gap-y-4 relative border-t border-[#F0EBE3] pt-4">
          {/* Clickable Territory Dropdown */}
          <div className="relative" ref={territoryRef}>
            <div
              onClick={() => setTerritoryOpen(!territoryOpen)}
              className="leading-tight cursor-pointer group"
            >
              <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase flex items-center gap-1">
                TERRITORY{' '}
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#A06126]" />
              </div>
              <div className="text-[12.5px] font-semibold text-[#0F2D4A] mt-0.5 group-hover:text-[#A06126] transition flex items-center gap-1.5">
                {meta.territory && COUNTRY_FLAGS[meta.territory] && (
                  <span>{COUNTRY_FLAGS[meta.territory]}</span>
                )}
                <span>{meta.territory || 'Unassigned'}</span>
              </div>
            </div>

            {territoryOpen && (
              <div className="absolute z-20 top-full left-0 mt-1 w-64 bg-white border border-[#EBE6DF] shadow-lg rounded-lg overflow-hidden">
                {/* Search box */}
                <div className="p-2 border-b border-[#EBE6DF] bg-slate-50/60 sticky top-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredCountries.length > 0) {
                          e.preventDefault();
                          handleTerritoryChange(filteredCountries[0]);
                        }
                        if (e.key === 'Escape') setTerritoryOpen(false);
                      }}
                      placeholder="Search country…"
                      className="w-full rounded-md border border-[#E2DBD1] bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                    />
                    {countrySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCountrySearch('');
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {countrySearch && (
                    <div className="mt-1 text-[10px] text-slate-400 px-0.5">
                      {filteredCountries.length} result
                      {filteredCountries.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Filtered list */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => (
                      <div
                        key={c}
                        onClick={() => handleTerritoryChange(c)}
                        className={`px-3 py-2 text-xs cursor-pointer font-medium transition flex items-center gap-2 ${c === meta.territory
                            ? 'bg-[#FFF7E8] text-[#A06126]'
                            : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {COUNTRY_FLAGS[c] && <span>{COUNTRY_FLAGS[c]}</span>}
                        <span>{c}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      No countries match "{countrySearch}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <MetaItem label="Assigned To" value={meta.crmManager} />
          <MetaItem label="STAGE" value={meta.stage} />

          {/* ⭐ Clickable Currency Dropdown */}
          <div className="relative" ref={currencyRef}>
            <div
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="leading-tight cursor-pointer group"
            >
              <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase flex items-center gap-1">
                CURRENCY{' '}
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#A06126]" />
              </div>
              <div className="text-[12.5px] font-semibold text-[#0F2D4A] mt-0.5 group-hover:text-[#A06126] transition">
                {meta.currency} ({displaySymbol})
              </div>
            </div>

            {currencyOpen && (
              <div className="absolute z-20 top-full left-0 mt-1 w-64 bg-white border border-[#EBE6DF] shadow-lg rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {uniqueCurrencies.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => handleCurrencyChange(c.code)}
                      className={`px-3 py-2 text-xs cursor-pointer font-medium transition flex items-center justify-between gap-2 ${c.code === meta.currency
                          ? 'bg-[#FFF7E8] text-[#A06126]'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{c.code}</span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {c.label}
                        </span>
                      </div>
                      <span className="text-slate-500 shrink-0">{c.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ⭐ Client Type, VAT, and Discount Toggles */}
          <div className="flex items-center gap-6 text-[11px] font-medium text-slate-700 bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm ml-auto">
            {/* VAT Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={meta.vatEnabled}
                  onChange={(e) =>
                    onChange({ ...meta, vatEnabled: e.target.checked })
                  }
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#A06126] group-hover:after:shadow-md transition-colors duration-300"></div>
              </div>
              <span className="group-hover:text-slate-900 transition-colors">
                VAT / GST
              </span>
            </label>

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* Discount Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={meta.discountEnabled}
                  onChange={(e) =>
                    onChange({ ...meta, discountEnabled: e.target.checked })
                  }
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#A06126] group-hover:after:shadow-md transition-colors duration-300"></div>
              </div>
              <span className="group-hover:text-slate-900 transition-colors">
                Special Discount
              </span>
            </label>
          </div>
        </div>
      </div>

      {numberingOpen && (
        <NumberingSettingsModal
          onClose={() => setNumberingOpen(false)}
          onSaved={onNumberingSaved}
        />
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

function NumberingSettingsModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
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
    countryCode: 'SG',
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
      onSaved?.();
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
                    updatePq(
                      'entityCode',
                      e.target.value.toUpperCase().slice(0, 12)
                    )
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

              <Field label="Document Type Code">
                <input
                  value={pqState.docTypeCode}
                  onChange={(e) =>
                    updatePq(
                      'docTypeCode',
                      e.target.value.toUpperCase().slice(0, 6)
                    )
                  }
                  className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[12px] text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                />
              </Field>

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
                  onChange={(e) =>
                    updatePq('nextSeq', Number(e.target.value) || 0)
                  }
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