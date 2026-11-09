'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  logistics: {
    totalDimension: string;
    clientAskedFor: string;
    productType: string;
  };
  totalWeight: number;
  onChange: (l: any) => void;
}

export default function LogisticsInfoPanel({ logistics, totalWeight, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs">
      <h3 className="text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-4">
        Logistics Information
      </h3>

      <div className="divide-y divide-[#F0EBE3]">
        <Row label="Total Weight" value={`${totalWeight.toFixed(1)} Kg`} />

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">Total Dimension</span>
          <input
            value={logistics.totalDimension}
            onChange={(e) => onChange({ ...logistics, totalDimension: e.target.value })}
            className="w-40 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 text-right"
          />
        </div>

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">Client Asked For</span>
          <div className="relative">
            <select
              value={logistics.clientAskedFor}
              onChange={(e) => onChange({ ...logistics, clientAskedFor: e.target.value })}
              className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 cursor-pointer"
            >
              {['CIF', 'FOB', 'EXW', 'DDP', 'DAP'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">Product Type</span>
          <input
            value={logistics.productType}
            onChange={(e) => onChange({ ...logistics, productType: e.target.value })}
            className="w-40 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 text-right"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 font-mono">{value}</span>
    </div>
  );
}