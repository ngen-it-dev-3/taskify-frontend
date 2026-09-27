'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onAddRfq: () => void;
}

export default function Header({ onAddRfq }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end flex-wrap gap-4 mb-6">
      <div>
        <span className="text-[11px] font-bold tracking-wider text-[#A06126] uppercase">
          CRM DASHBOARD
        </span>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
          RFQ Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Every inbound RFQ, from any country — assign it, quote it, and track it through to close.
        </p>
      </div>
      <button
        onClick={onAddRfq}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A06126] text-white text-xs font-semibold shadow-2xs hover:bg-[#88501E] transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>+ Add RFQ</span>
      </button>
    </div>
  );
}