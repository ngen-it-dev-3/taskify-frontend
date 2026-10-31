'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { QuotationMeta } from './types';
import { COUNTRIES, CURRENCIES } from './constants';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
}

export default function ClientTypeBar({ meta, onChange }: Props) {
  const currentCurrency =
    CURRENCIES.find((c) => c.code === meta.currency) || CURRENCIES[0];

  const handleCurrencyChange = (code: string) => {
    const c = CURRENCIES.find((x) => x.code === code)!;
    onChange({
      ...meta,
      currency: c.code,
      currencySymbol: c.symbol,
      exchangeRate: c.rateToBDT || 1,
    });
  };

  const handleRateChange = (rate: number) => {
    onChange({
      ...meta,
      exchangeRate: rate > 0 ? rate : 1,
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-[#EBE6DF] shadow-2xs mt-4 flex flex-wrap items-center gap-3">
      {/* Client type toggle */}
      <div className="flex items-center gap-4 text-xs">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={meta.clientType === 'existing'}
            onChange={() => onChange({ ...meta, clientType: 'existing' })}
            className="accent-[#A06126]"
          />
          Existing Client
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={meta.clientType === 'new'}
            onChange={() => onChange({ ...meta, clientType: 'new' })}
            className="accent-[#A06126]"
          />
          New Client
        </label>
      </div>

      {/* Country */}
      <SelectBox
        value={meta.country}
        onChange={(v) => onChange({ ...meta, country: v })}
        options={COUNTRIES}
      />

      {/* Currency */}
      <SelectBox
        value={currentCurrency.code}
        onChange={handleCurrencyChange}
        options={CURRENCIES.map((c) => c.code)}
      />

      {/* Exchange rate */}
      <div className="inline-flex items-center gap-2 text-xs">
        <span className="text-slate-500">Exchange Rate</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={meta.exchangeRate}
          onChange={(e) => handleRateChange(Number(e.target.value) || 1)}
          className="w-24 bg-[#FDFBF7] border border-[#E2DBD1] text-xs rounded-lg px-3 py-1.5 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
        <span className="text-slate-400 text-[11px]">
          1 {meta.currency} = {meta.exchangeRate} {meta.baseCurrency}
        </span>
      </div>

      {/* Tax / Discount toggles */}
      <div className="ml-auto flex items-center gap-4 text-xs">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.vatEnabled}
            onChange={(e) => onChange({ ...meta, vatEnabled: e.target.checked })}
            className="accent-[#A06126]"
          />
          VAT / GST
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.discountEnabled}
            onChange={(e) =>
              onChange({ ...meta, discountEnabled: e.target.checked })
            }
            className="accent-[#A06126]"
          />
          Special Discount
        </label>
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}