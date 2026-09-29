// app/(dashboard)/online-crm/components/TopProductsPanel.tsx
'use client';

import React, { useState } from 'react';

interface ProductRow {
  name: string;
  count: number;
}

interface Props {
  products: ProductRow[];
  clients: ProductRow[];
}

const COLORS = ['#4A3AD9', '#10B981', '#F59E0B', '#EF4444', '#15803D'];

export function TopProductsPanel({ products, clients }: Props) {
  const [mode, setMode] = useState<'products' | 'clients'>('products');
  const rows = mode === 'products' ? products : clients;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {mode === 'products' ? 'Top Products' : 'Top Clients'}
        </h3>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="rounded border border-[#E2DBD1] bg-[#FDFBF7] px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none"
        >
          <option value="products">Top Products</option>
          <option value="clients">Top Clients</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r, i) => {
          const pct = (r.count / max) * 100;
          const color = COLORS[i % COLORS.length];
          return (
            <div key={r.name}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-700 font-medium truncate pr-2">
                  {r.name}
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {r.count}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="py-8 text-center text-[11px] italic text-slate-400">
            No data available.
          </p>
        )}
      </div>
    </div>
  );
}