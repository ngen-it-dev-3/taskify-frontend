// components/CRM/sales-crm/PipelineTab.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  // ⭐ Stable params — prevents re-fetches on parent re-renders
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (filters.region !== 'All Regions') p.country = filters.region;
    if (filters.territory !== 'All Territories') p.territory = filters.territory;
    if (filters.owner) p.owner = filters.owner;
    return p;
  }, [filters.region, filters.territory, filters.owner]);

  const load = useCallback(async () => {
    try {
      if (!data) setLoading(true);
      const res = await SalesCrmApi.unifiedPipeline(params);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, filters.sources]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * ⭐ Click routing — source-aware AND stage-aware.
   */
  const handleCardClick = (card: UnifiedCard) => {
    const goToSource = () => {
      if (card.source === 'rfq') {
        const rfq = card.raw as RFQItem;
        router.push(`/crm/rfq?selected=${rfq.id}&stage=${rfq.stage}`);
        return true;
      }
      if (card.source === 'quotation') {
        const quote = card.raw as Quotation;
        if (quote.rfqId) {
          router.push(`/crm/quotation-builder/${quote.rfqId}`);
          return true;
        }
        return false;
      }
      if (card.source === 'tender') {
        const t = card.raw as Tender;
        router.push(`/tenders/manage?tenderId=${t._id}&stage=${t.stage}`);
        return true;
      }
      return false;
    };

    if (card.source === 'forecast') {
      setSelectedForecast(card.raw as ForecastEntry);
      return;
    }

    if (card.stage === 'won' || card.stage === 'lost') {
      goToSource();
      return;
    }

    goToSource();
  };

  if (loading || !data) return <PipelineSkeleton />;

  return (
    <>
      {/* ⭐ Board — 6 columns, each scrolls independently */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
        style={{
          height: 'calc(100vh - 300px)',
          minHeight: 400,
          maxHeight: 'calc(100vh - 300px)',
        }}
      >
        {STAGES.map(({ key, label }) => {
          const cards = data.columns[key] || [];
          return (
            <div
              key={key}
              className="min-w-[220px] flex flex-col h-full overflow-hidden"
            >
              {/* Column header — sticky, never scrolls */}
              <div className="mb-3 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {cards.length}
                </span>
              </div>

              {/* ⭐ Cards area — its own scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 pipeline-scroll">
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

      {/* EntryDrawer — only for forecast-sourced cards */}
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