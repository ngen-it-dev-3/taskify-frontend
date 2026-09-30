// components/CRM/sales-crm/PipelineTab.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  SalesCrmApi,
  type UnifiedCard,
  type UnifiedPipelineData,
  type ForecastEntry,
} from '@/services/salesCrm.service';
import type { RFQItem } from '@/services/rfq.service';
import type { Quotation } from '@/services/quotation.service';
import type { Tender } from '@/lib/api/tender.api';
import { STAGES } from './constants';
import { PipelineCard } from './PipelineCard';
import { PipelineSkeleton } from './PipelineSkeleton';
import { EntryDrawer } from './EntryDrawer';
import type { SalesFilters } from './FilterBar';

interface Props {
  filters: SalesFilters;
}

export function PipelineTab({ filters }: Props) {
  const router = useRouter();
  const [data, setData] = useState<UnifiedPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedForecast, setSelectedForecast] = useState<ForecastEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.region !== 'All Regions') params.country = filters.region;
      if (filters.territory !== 'All Territories') params.territory = filters.territory;
      if (filters.owner) params.owner = filters.owner;
      const res = await SalesCrmApi.unifiedPipeline(params);

      // ⭐ Filter columns by the selected source badges (empty = all)
      const activeSources = filters.sources || [];
      if (activeSources.length === 0) {
        setData(res);
      } else {
        const filteredColumns = Object.fromEntries(
          Object.entries(res.columns).map(([stage, cards]) => [
            stage,
            cards.filter((c) => activeSources.includes(c.source)),
          ])
        ) as typeof res.columns;

        // Recompute counts for the filtered view
        const filteredCounts = { ...res.counts };
        (Object.keys(filteredColumns) as (keyof typeof filteredColumns)[]).forEach(
          (k) => {
            filteredCounts[k] = filteredColumns[k].length;
          }
        );

        setData({ ...res, columns: filteredColumns, counts: filteredCounts });
      }
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

  /**
   * Route the click based on the card's source:
   *   - RFQ       → /crm/rfq?selected=<id>
   *   - Quotation → /crm/quotation-builder/<rfqId>
   *   - Tender    → /crm/tender?selected=<id>       ⭐ NEW
   *   - Forecast  → open EntryDrawer modal
   */
  const handleCardClick = (card: UnifiedCard) => {
    if (card.source === 'rfq') {
      const rfq = card.raw as RFQItem;
      router.push(`/crm/rfq?selected=${rfq.id}`);
      return;
    }

    if (card.source === 'quotation') {
      const quote = card.raw as Quotation;
      if (quote.rfqId) {
        router.push(`/crm/quotation-builder/${quote.rfqId}`);
      }
      return;
    }

    // ⭐ Tender → navigate to Tender Management dashboard
    if (card.source === 'tender') {
      const t = card.raw as Tender;
      router.push(`/crm/tender?selected=${t._id}`);
      return;
    }

    // Forecast entry → open the drawer
    setSelectedForecast(card.raw as ForecastEntry);
  };

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
                    card={c}
                    currency={filters.currency}
                    rate={filters.rate}
                    onClick={() => handleCardClick(c)}
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

      {/* Forecast entry modal (only for forecast-sourced cards) */}
      {selectedForecast && (
        <EntryDrawer
          key={selectedForecast.id}
          entry={selectedForecast}
          currency={filters.currency}
          rate={filters.rate}
          onClose={() => setSelectedForecast(null)}
          onChanged={async () => {
            setSelectedForecast(null);
            await load();
          }}
        />
      )}
    </>
  );
}