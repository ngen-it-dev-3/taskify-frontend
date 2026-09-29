// components/CRM/sales-crm/PipelineTab.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  SalesCrmApi,
  type ForecastEntry,
  type PipelineData,
} from '@/services/salesCrm.service';
import { STAGES } from './constants';
import { PipelineCard } from './PipelineCard';
import { PipelineSkeleton } from './PipelineSkeleton';
import { EntryDrawer } from './EntryDrawer';
import type { SalesFilters } from './FilterBar';

interface Props {
  filters: SalesFilters;
}

export function PipelineTab({ filters }: Props) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ForecastEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.region !== 'All Regions') params.country = filters.region;
      if (filters.owner) params.owner = filters.owner;
      const res = await SalesCrmApi.pipeline(params);
      setData(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (loading || !data) return <PipelineSkeleton />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {STAGES.map(({ key, label }) => {
          const cards = data.columns[key] || [];
          return (
            <div key={key} className="min-w-[220px]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {cards.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {cards.map((c) => (
                  <PipelineCard
                    key={c.id}
                    entry={c}
                    stage={key}
                    onClick={() => setSelected(c)}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#E5DFD3] py-6 text-center text-[11px] italic text-slate-400">
                    No entries
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <EntryDrawer
          key={selected.id}
          entry={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            setSelected(null);
            await load();
          }}
        />
      )}
    </>
  );
}