// app/(dashboard)/dmar/components/SectorPanel.tsx
'use client';

import React, { useState } from 'react';
import type { SectorVisitsData, Team } from './constants';

interface Props {
  data: SectorVisitsData | null;
  activeTeam: Team;
  onTeamChange: (t: Team) => void;
  onSectorClick: (sector: string) => void;
  selectedSector?: string;
}

export function SectorPanel({
  data,
  activeTeam,
  onTeamChange,
  onSectorClick,
  selectedSector,
}: Props) {
  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          Sector-wise Visits
        </h3>

        {/* Marketing / Sales toggle */}
        <div className="inline-flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="sector-team"
              checked={activeTeam === 'Marketing'}
              onChange={() => onTeamChange('Marketing')}
              className="accent-[#A06126] cursor-pointer"
            />
            <span
              className={
                activeTeam === 'Marketing'
                  ? 'text-[#A06126] font-semibold'
                  : 'text-slate-500'
              }
            >
              Marketing
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="sector-team"
              checked={activeTeam === 'Sales'}
              onChange={() => onTeamChange('Sales')}
              className="accent-[#A06126] cursor-pointer"
            />
            <span
              className={
                activeTeam === 'Sales'
                  ? 'text-[#A06126] font-semibold'
                  : 'text-slate-500'
              }
            >
              Sales
            </span>
          </label>
        </div>
      </div>

      {!data ? (
        <div className="h-[200px] animate-pulse rounded bg-slate-50" />
      ) : (
        <div className="divide-y divide-[#F0EBE3]">
          {data.sectors.map((s) => {
            const isActive = selectedSector === s.sector;
            return (
              <button
                key={s.sector}
                onClick={() => onSectorClick(s.sector)}
                className={`w-full flex items-center justify-between py-3 px-2 rounded transition text-left ${
                  isActive
                    ? 'bg-[#FFF7E8] text-[#A06126]'
                    : 'hover:bg-[#FDFBF7]'
                }`}
              >
                <span className="text-[12px] font-medium text-slate-700">
                  {s.sector}
                </span>
                <span className="font-mono text-[13px] font-bold text-slate-800">
                  {s.count}
                </span>
              </button>
            );
          })}
          {data.sectors.length === 0 && (
            <div className="py-8 text-center text-[11px] italic text-slate-400">
              No visits logged yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}