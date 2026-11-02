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

      const allCards = Object.values(res.columns).flat();

      // ⭐ 1. Find all RFQ IDs that ALREADY have a Quotation
      const quotedRfqIds = new Set(
        allCards
          .filter((c) => c.source === 'quotation')
          .map((c) => (c.raw as Quotation).rfqId)
          .filter(Boolean)
      );

      // ⭐ 2. GLOBAL DEDUPLICATION
      const seen = new Set<string>();
      const validCardIds = new Set<string>();

      // Force Forecasts to be processed BEFORE Tenders so we keep the green Forecast card
      const sortedAllCards = [...allCards].sort((a, b) => {
        if (a.source === 'forecast' && b.source === 'tender') return -1;
        if (a.source === 'tender' && b.source === 'forecast') return 1;
        return 0;
      });

      sortedAllCards.forEach((c) => {
        // A. Remove raw RFQs if they have been quoted
        if (c.source === 'rfq') {
          const rfq = c.raw as RFQItem;
          if (quotedRfqIds.has(rfq.id)) return;
        }

        // B. Create a signature using ONLY Title and Value
        const rawTitle = c.title || c.raw?.title || c.raw?.name || 'Untitled';
        // Remove all spaces and lowercase it so "Test Tender 1" and "Test Tender 1 " match perfectly
        const cleanTitle = rawTitle.replace(/\s+/g, '').toLowerCase();
        const value = c.value || 0;

        const signature = `${cleanTitle}-${value}`;

        // C. If we haven't seen this exact deal, keep it
        if (!seen.has(signature)) {
          seen.add(signature);
          validCardIds.add(c.id);
        }
      });

      // ⭐ 3. Rebuild the columns keeping ONLY valid cards
      const deduplicatedColumns = Object.fromEntries(
        Object.entries(res.columns).map(([stage, cards]) => [
          stage,
          cards.filter((c) => validCardIds.has(c.id)),
        ])
      ) as typeof res.columns;

      // Recalculate counts
      const deduplicatedCounts = { ...res.counts };
      (Object.keys(deduplicatedColumns) as (keyof typeof deduplicatedColumns)[]).forEach(
        (k) => {
          deduplicatedCounts[k] = deduplicatedColumns[k].length;
        }
      );

      // Apply Source Filters (ALL, RFQ, QUOTE, etc.)
      const activeSources = filters.sources || [];
      if (activeSources.length === 0) {
        setData({ ...res, columns: deduplicatedColumns, counts: deduplicatedCounts });
      } else {
        const filteredColumns = Object.fromEntries(
          Object.entries(deduplicatedColumns).map(([stage, cards]) => [
            stage,
            cards.filter((c) => activeSources.includes(c.source)),
          ])
        ) as typeof res.columns;

        const filteredCounts = { ...deduplicatedCounts };
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
  }, [params, filters.sources]);

  useEffect(() => {
    load();
  }, [load]);

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
              <div className="mb-3 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {cards.length}
                </span>
              </div>

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