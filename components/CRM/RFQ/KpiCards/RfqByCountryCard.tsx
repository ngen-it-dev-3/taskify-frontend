'use client';

import React, { useMemo, useState } from 'react';
import type { RFQStats } from '@/services/rfq.service';

export default function RfqByCountryCard({ stats }: { stats: RFQStats | null }) {
  const [query, setQuery] = useState('');
  const rows = stats?.byCountry ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter((c) =>
      c.country.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, rows]);

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            RFQ by Country
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EAEFF7] text-[#1F3864] flex items-center justify-center text-sm">
            🌐
          </div>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country…"
          className="mt-2 w-full bg-[#FDFBF7] border border-[#E2DBD1] text-xs rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />

        <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-xs text-slate-400 py-2">No data</div>
          )}
          {filtered.map((cm) => (
            <div key={cm.country}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                  {cm.country}
                </span>
                <span className="font-mono text-slate-600">
                  {cm.count}{' '}
                  <span className="text-slate-400">({cm.pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-[#EEF1F6] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#A06126] h-full rounded-full transition-all duration-300"
                  style={{ width: `${cm.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}