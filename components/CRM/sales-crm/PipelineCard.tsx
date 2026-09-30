// components/CRM/sales-crm/PipelineCard.tsx
'use client';

import React from 'react';
import { formatMoney, STAGES } from './constants';
import { SourceBadge } from './SourceBadge';
import type { UnifiedCard } from '@/services/salesCrm.service';
import type { Tender } from '@/lib/api/tender.api';

interface Props {
  card: UnifiedCard;
  currency: string;
  rate: number;
  onClick?: () => void;
}

export function PipelineCard({ card, currency, rate, onClick }: Props) {
  const stageStyle =
    STAGES.find((s) => s.key === card.stage)?.color ??
    'border-slate-200 bg-white';

  const isLost = card.stage === 'lost';
  const isWon = card.stage === 'won';

  // ⭐ Build the reference string in the top-right of the card
  const reference = (() => {
    if (card.source === 'quotation') return card.pqNumber || '';
    if (card.source === 'rfq') return card.rfqNumber || '';
    if (card.source === 'tender') {
      // Tenders don't have a short ref number in the API —
      // use tenderType (eGP / RFQ / Hardcopy Ref.) as the reference.
      const t = card.raw as Tender;
      return t?.tenderType || '';
    }
    return card.pqNumber || card.rfqNumber || '';
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border ${stageStyle} px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#A06126]/30`}
    >
      {/* Source badge + reference ID */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <SourceBadge source={card.source} />
        <span className="font-mono text-[9.5px] text-slate-400 truncate">
          {reference}
        </span>
      </div>

      {/* Client + item */}
      <div className="text-[12px] font-semibold text-[#0F2D4A] leading-tight mb-1">
        {card.client}
      </div>
      {card.item && card.item !== '—' && (
        <div className="text-[10.5px] text-slate-500 leading-snug mb-2 line-clamp-2">
          {card.item}
        </div>
      )}

      {/* Value + probability */}
      <div className="flex items-end justify-between mt-2.5">
        <span className="font-mono text-[13px] font-bold text-[#0F2D4A]">
          {card.value > 0
            ? formatMoney(card.value, currency, { compact: true, rate })
            : '—'}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLost
              ? 'text-rose-600'
              : isWon
                ? 'text-emerald-700'
                : 'text-[#A06126]'
            }`}
        >
          {isLost ? 'Lost — price' : isWon ? '100%' : `${card.probability}%`}
        </span>
      </div>

      {/* Country + owner */}
      <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
        {card.country && card.country !== '—' ? (
          <span className="inline-block rounded-md bg-white/70 border border-black/5 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
            {card.country}
          </span>
        ) : (
          <span />
        )}
        {card.owner && (
          <span className="text-[9.5px] text-slate-500 truncate">
            {card.owner}
          </span>
        )}
      </div>
    </button>
  );
}