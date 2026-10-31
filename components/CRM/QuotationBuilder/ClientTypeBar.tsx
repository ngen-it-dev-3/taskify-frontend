'use client';

import React from 'react';
import type { QuotationMeta } from './types';

interface Props {
  meta: QuotationMeta;
  onChange: (m: QuotationMeta) => void;
}

export default function ClientTypeBar({ meta, onChange }: Props) {
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

      {/* ⭐ Country, Currency, and Exchange Rate have been removed from here */}

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