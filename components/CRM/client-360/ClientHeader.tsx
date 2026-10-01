// app/(dashboard)/crm/client-360/components/ClientHeader.tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { Client360 } from './constants';
import { TIER_STYLES } from './constants';
import { AutoAddedBadge } from './AutoAddedBadge';

interface Props {
  client: Client360;
  onNewQuotation: () => void;
  onEdit: () => void;
}

export function ClientHeader({ client, onNewQuotation, onEdit }: Props) {
  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2D4A] mb-2">
            {client.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tier */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                TIER_STYLES[client.tier] || TIER_STYLES.Standard
              }`}
            >
              {client.tier} Tier
            </span>

            {/* Country */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF4FB] text-[#1F3864] border border-[#D6E3F5]">
              {client.country}
            </span>

            {/* Sector */}
            {client.sector && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {client.sector}
              </span>
            )}

            {/* Auto-added badge */}
            {client.autoAdded && client.autoAddedFrom && (
              <AutoAddedBadge source={client.autoAddedFrom} />
            )}

            {/* Partner badge */}
            {client.isPartner && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EEFF] text-[#6B3FB5] border border-[#E4D5F5]">
                Partner
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Edit
          </button>
          <button
            onClick={onNewQuotation}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2D4A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1a3d5c] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </button>
        </div>
      </div>
    </div>
  );
}