// app/(dashboard)/sales-crm/components/TopTabButton.tsx
'use client';

import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TopTabButton({ active, onClick, children }: Props) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 font-semibold relative transition ${
        active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}