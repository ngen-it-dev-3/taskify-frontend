'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, X, Check } from 'lucide-react';
import type { QuotationMeta } from './types';
import { CURRENCIES } from './constants';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Bangladesh': 'BDT',
  'United States of America': 'USD',
  'United Kingdom': 'GBP',
  'Europe': 'EUR',
  'Singapore': 'SGD',
  'Pakistan': 'PKR',
  'India': 'INR',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  'Malaysia': 'MYR',
  'Japan': 'JPY',
  'Australia': 'AUD',
  'Canada': 'CAD',
  'China': 'CNY',
  'Qatar': 'QAR',
  'Kuwait': 'KWD',
};

const ALL_COUNTRIES = Object.keys(COUNTRY_CURRENCY_MAP).sort();

export default function ClientTypeBar({ meta, onChange }: Props) {
  const currentCurrency = CURRENCIES.find((c) => c.code === meta.currency) || CURRENCIES[0];

  // ⭐ State for the Sync Rate Modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false); // ⭐ Fixed typo here
  const [fetchedRate, setFetchedRate] = useState<number | null>(null);

  // Auto-sync currency when country changes
  useEffect(() => {
    const expectedCurrency = COUNTRY_CURRENCY_MAP[meta.country];
    if (expectedCurrency && expectedCurrency !== meta.currency) {
      const currencyData = CURRENCIES.find((c) => c.code === expectedCurrency);
      const newRate = expectedCurrency === meta.baseCurrency ? 1 : (currencyData?.rateToBDT || 1);
      
      onChange({
        ...meta,
        currency: expectedCurrency,
        currencySymbol: currencyData?.symbol || expectedCurrency,
        exchangeRate: newRate,
      });
    }
  }, [meta.country]);

  const handleCountryChange = (country: string) => {
    const newCurrencyCode = COUNTRY_CURRENCY_MAP[country] || 'USD';
    const currencyData = CURRENCIES.find((c) => c.code === newCurrencyCode);
    const newRate = newCurrencyCode === meta.baseCurrency ? 1 : (currencyData?.rateToBDT || 1);

    onChange({
      ...meta,
      country: country,
      currency: newCurrencyCode,
      currencySymbol: currencyData?.symbol || '$',
      exchangeRate: newRate,
    });
  };

  // ⭐ Fetch Live Rate from FREE API (No Key Required for testing)
  const handleFetchLiveRate = async () => {
    setIsFetchingRate(true); // ⭐ Fixed typo here
    setFetchedRate(null);
    
    try {
      // Using a free public API for demonstration
      const response = await fetch(`https://open.er-api.com/v6/latest/${meta.currency}`);
      
      if (!response.ok) throw new Error('Failed to fetch rate');
      
      const data = await response.json();
      
      // Extract the rate for the base currency (e.g., BDT)
      const rate = data.rates[meta.baseCurrency];
      
      if (!rate) throw new Error('Rate not found for this currency pair');
      
      setFetchedRate(rate);
    } catch (error) {
      console.error(error);
      alert('Could not fetch live rate. Please check your internet or try again later.');
    } finally {
      setIsFetchingRate(false); // ⭐ Fixed typo here
    }
  };

  const handleApplyFetchedRate = () => {
    if (fetchedRate) {
      // Round to 4 decimal places for accuracy
      const roundedRate = Number(fetchedRate.toFixed(4));
      onChange({ ...meta, exchangeRate: roundedRate });
      setIsSyncModalOpen(false);
      setFetchedRate(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-4 border border-[#EBE6DF] shadow-2xs mt-4 flex flex-wrap items-center gap-3">
        {/* Client type toggle */}
        <div className="flex items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={meta.clientType === 'existing'} onChange={() => onChange({ ...meta, clientType: 'existing' })} className="accent-[#A06126]" />
            Existing Client
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={meta.clientType === 'new'} onChange={() => onChange({ ...meta, clientType: 'new' })} className="accent-[#A06126]" />
            New Client
          </label>
        </div>

        {/* Country */}
        <SelectBox value={meta.country} onChange={handleCountryChange} options={ALL_COUNTRIES} />

        {/* Currency */}
        <SelectBox 
          value={meta.currency} 
          onChange={(code) => onChange({ 
            ...meta, 
            currency: code, 
            currencySymbol: CURRENCIES.find(c => c.code === code)?.symbol || '' 
          })} 
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
            onChange={(e) => onChange({ ...meta, exchangeRate: Number(e.target.value) || 1 })}
            className="w-24 bg-[#FDFBF7] border border-[#E2DBD1] text-xs rounded-lg px-3 py-1.5 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
          />
          
          {/* ⭐ Sync Rate Button */}
          <button
            onClick={() => {
              setIsSyncModalOpen(true);
              handleFetchLiveRate();
            }}
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-[#A06126] bg-[#F9F1E2] border border-[#E2DBD1] rounded-md hover:bg-[#F0E6D2] transition"
            title="Auto-fetch live rate"
          >
            <RefreshCw className="w-3 h-3" />
            Sync
          </button>

          <span className="text-slate-400 text-[11px]">
            {meta.currency !== meta.baseCurrency ? `1 ${meta.currency} = ${meta.exchangeRate} ${meta.baseCurrency}` : `1 ${meta.baseCurrency} (base)`}
          </span>
        </div>

        {/* Tax / Discount toggles */}
        <div className="ml-auto flex items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={meta.vatEnabled} onChange={(e) => onChange({ ...meta, vatEnabled: e.target.checked })} className="accent-[#A06126]" />
            VAT / GST
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={meta.discountEnabled} onChange={(e) => onChange({ ...meta, discountEnabled: e.target.checked })} className="accent-[#A06126]" />
            Special Discount
          </label>
        </div>
      </div>

      {/* ⭐ Sync Rate Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Live Exchange Rate</h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <p className="text-xs text-slate-500">
                Fetching latest rate for <strong>1 {meta.currency}</strong> to <strong>{meta.baseCurrency}</strong>
              </p>
              
              {isFetchingRate ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <RefreshCw className="w-6 h-6 text-[#A06126] animate-spin mb-2" />
                  <span className="text-xs text-slate-400">Connecting to live API...</span>
                </div>
              ) : fetchedRate !== null ? (
                <div className="bg-[#FDFBF7] rounded-lg p-4 border border-[#EBE6DF]">
                  <div className="text-2xl font-bold text-[#0F2D4A]">
                    {fetchedRate.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">{meta.baseCurrency} per 1 {meta.currency}</div>
                </div>
              ) : (
                <div className="text-xs text-rose-500 py-4">Failed to fetch rate. Please try again or enter manually.</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsSyncModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition">
                Cancel
              </button>
              <button 
                onClick={handleApplyFetchedRate} 
                disabled={!fetchedRate || isFetchingRate}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F2D4A] hover:bg-[#1C3760] rounded-md transition disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                Apply Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 text-slate-700 focus:outline-none cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}