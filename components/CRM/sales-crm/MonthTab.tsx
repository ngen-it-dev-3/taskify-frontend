// app/(dashboard)/sales-crm/components/MonthTab.tsx
'use client';

import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
  label: string;
}

export function MonthTab({ active, onClick, label }: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 px-3 pb-1.5 text-[11px] font-semibold transition ${
        active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}