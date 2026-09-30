// components/CRM/sales-crm/FilterBar.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import {
  MapPin,
  Building2,
  User,
  Coins,
  TrendingUp,
  Filter,
} from 'lucide-react';
import {
  REGIONS,
  TERRITORIES_BY_REGION,
  CURRENCIES,
  REGION_DEFAULT_CURRENCY,
  TERRITORY_DEFAULT_CURRENCY,
  getDefaultRate,
} from './constants';
import type { UnifiedSource } from '@/services/salesCrm.service';

export interface SalesFilters {
  region: string;
  territory: string;
  owner: string;
  currency: string;
  rate: number;
  sources: UnifiedSource[];   // ⭐ NEW — empty = all
}

interface Props {
  value: SalesFilters;
  onChange: (v: SalesFilters) => void;
}

// ⭐ Source badge options shown in the filter bar
const SOURCE_OPTIONS: { key: UnifiedSource; label: string; color: string }[] = [
  {
    key: 'rfq',
    label: 'RFQ',
    color: 'data-[on=true]:bg-[#EEF4FB] data-[on=true]:text-[#1F3864] data-[on=true]:border-[#D6E3F5]',
  },
  {
    key: 'quotation',
    label: 'Quote',
    color: 'data-[on=true]:bg-[#F5EEFF] data-[on=true]:text-[#6B3FB5] data-[on=true]:border-[#E4D5F5]',
  },
  {
    key: 'forecast',
    label: 'Forecast',
    color: 'data-[on=true]:bg-[#FFF7E8] data-[on=true]:text-[#A06126] data-[on=true]:border-[#F5D9B8]',
  },
  {
    key: 'tender',
    label: 'Tender',
    color: 'data-[on=true]:bg-[#E8F6F1] data-[on=true]:text-[#0F6B4F] data-[on=true]:border-[#C4E8DA]',
  },
];

export function FilterBar({ value, onChange }: Props) {
  const territories =
    TERRITORIES_BY_REGION[value.region] || TERRITORIES_BY_REGION['All Regions'];

  const manualCurrencyRef = useRef(false);
  const manualRateRef = useRef(false);

  useEffect(() => {
    if (manualCurrencyRef.current) return;

    const fromTerritory = TERRITORY_DEFAULT_CURRENCY[value.territory];
    const fromRegion = REGION_DEFAULT_CURRENCY[value.region];
    const target = fromTerritory || fromRegion || 'BDT';

    if (target !== value.currency) {
      manualRateRef.current = false;
      const defaultRate = getDefaultRate(target);
      onChange({ ...value, currency: target, rate: defaultRate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.region, value.territory]);

  useEffect(() => {
    if (manualRateRef.current) return;
    const defaultRate = getDefaultRate(value.currency);
    if (defaultRate !== value.rate) {
      onChange({ ...value, rate: defaultRate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.currency]);

  const handleRegionChange = (region: string) => {
    manualCurrencyRef.current = false;
    manualRateRef.current = false;
    onChange({ ...value, region, territory: 'All Territories' });
  };

  const handleTerritoryChange = (territory: string) => {
    manualCurrencyRef.current = false;
    manualRateRef.current = false;
    onChange({ ...value, territory });
  };

  const handleCurrencyChange = (currency: string) => {
    manualCurrencyRef.current = true;
    manualRateRef.current = false;
    const defaultRate = getDefaultRate(currency);
    onChange({ ...value, currency, rate: defaultRate });
  };

  const handleRateChange = (raw: string) => {
    manualRateRef.current = true;

    if (raw === '') {
      onChange({ ...value, rate: 0 });
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) return;

    onChange({ ...value, rate: num });
  };

  const handleRateBlur = () => {
    if (!value.rate || value.rate <= 0) {
      const fallback = getDefaultRate(value.currency);
      onChange({ ...value, rate: fallback });
    }
  };

  // ⭐ Toggle one source on/off in the filter
  const handleToggleSource = (key: UnifiedSource) => {
    const current = value.sources || [];
    const next = current.includes(key)
      ? current.filter((s) => s !== key)
      : [...current, key];
    onChange({ ...value, sources: next });
  };

  const handleClearSources = () => {
    onChange({ ...value, sources: [] });
  };

  const handleClear = () => {
    manualCurrencyRef.current = false;
    manualRateRef.current = false;
    onChange({
      region: 'All Regions',
      territory: 'All Territories',
      owner: '',
      currency: 'BDT',
      rate: 1,
      sources: [],           // ⭐ NEW — show all sources
    });
  };

  const hasActiveFilter =
    value.region !== 'All Regions' ||
    value.territory !== 'All Territories' ||
    value.owner !== '' ||
    value.currency !== 'BDT' ||
    value.rate !== 1 ||
    (value.sources && value.sources.length > 0);

  const currencyMeta = CURRENCIES[value.currency] || CURRENCIES.BDT;
  const defaultRate = getDefaultRate(value.currency);

  const displayRate =
    value.rate === 0 ? '' : Number(value.rate.toFixed(6));

  const activeSources = value.sources || [];
  const sourcesAllOn = activeSources.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EBE6DF] bg-white px-4 py-3">
      {/* Region */}
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Region
        </span>
        <select
          value={value.region}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] cursor-pointer"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Territory */}
      <div className="flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Territory
        </span>
        <select
          value={value.territory}
          onChange={(e) => handleTerritoryChange(e.target.value)}
          className="rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] cursor-pointer"
        >
          {territories.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Currency */}
      <div className="flex items-center gap-2">
        <Coins className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Currency
        </span>
        <select
          value={value.currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] cursor-pointer"
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
      </div>

      {/* Rate */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
          1 BDT =
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayRate}
          onChange={(e) => handleRateChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={handleRateBlur}
          placeholder={String(defaultRate)}
          className="w-24 rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {currencyMeta.code}
        </span>
        {value.rate > 0 && Math.abs(value.rate - defaultRate) > 1e-9 && (
          <button
            type="button"
            onClick={() => {
              manualRateRef.current = false;
              onChange({ ...value, rate: defaultRate });
            }}
            className="text-[9px] font-semibold text-[#A06126] hover:underline"
            title={`Reset to default (${defaultRate})`}
          >
            reset
          </button>
        )}
      </div>

      {/* Salesperson */}
      <div className="flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Salesperson
        </span>
        <input
          value={value.owner}
          onChange={(e) => onChange({ ...value, owner: e.target.value })}
          placeholder="Any (or type a name)"
          className="w-40 rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-2.5 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
      </div>

      {/* ⭐ Source badge filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Source
        </span>

        <div className="flex items-center gap-1.5">
          {/* "All" pill — active when no source is selected */}
          <button
            type="button"
            onClick={handleClearSources}
            data-on={sourcesAllOn}
            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E2DBD1] bg-white text-slate-500 hover:bg-slate-50 data-[on=true]:bg-[#0F2D4A] data-[on=true]:text-white data-[on=true]:border-[#0F2D4A] transition"
            title="Show all sources"
          >
            All
          </button>

          {/* Per-source toggle pills */}
          {SOURCE_OPTIONS.map((opt) => {
            const on = activeSources.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleToggleSource(opt.key)}
                data-on={on}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E2DBD1] bg-white text-slate-500 hover:bg-slate-50 transition ${opt.color}`}
                title={`Toggle ${opt.label}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilter && (
        <button
          onClick={handleClear}
          className="ml-auto text-[10px] font-semibold text-[#A06126] hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}