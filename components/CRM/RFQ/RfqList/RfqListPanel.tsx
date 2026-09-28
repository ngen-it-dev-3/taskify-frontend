'use client';

import React from 'react';
import type { RFQItem } from '../types';
import RfqListItem from './RfqListItem';

interface Props {
  rfqs: RFQItem[];
  selectedRFQId: string;
  showArchived: boolean;
  onSelect: (id: string) => void;
  onAssign: (id: string) => void;
  onQuote: (rfq: RFQItem) => void;
}

export default function RfqListPanel({
  rfqs,
  selectedRFQId,
  showArchived,
  onSelect,
  onAssign,
  onQuote,
}: Props) {
  const safeRfqs = (rfqs ?? []).filter(
    (r): r is RFQItem => !!r && typeof r === 'object' && !!r.id
  );

  return (
    <div className="lg:col-span-5 bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden max-h-131.25 flex flex-col">
      <div className="p-3 border-b border-[#F0EBE3] bg-[#FAF8F5] flex justify-between items-center text-xs font-semibold text-slate-600">
        <span>
          {showArchived ? 'Archived Records' : 'Active Inbound Pipeline'} (
          {safeRfqs.length})
        </span>
        <span className="text-[11px] text-slate-400 font-normal">
          Click row to inspect
        </span>
      </div>

      <div className="divide-y divide-[#F0EBE3] overflow-y-auto">
        {safeRfqs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No RFQs match your filters.
          </div>
        ) : (
          safeRfqs.map((rfq) => {
            // ⭐ NEW: hide action buttons for lost/archived RFQs
            const actionsLocked =
              rfq.stage === 'lost' || rfq.stage === 'archived';

            return (
              <RfqListItem
                key={rfq.id}
                rfq={rfq}
                isSelected={rfq.id === selectedRFQId}
                onSelect={() => onSelect(rfq.id)}
                onAssign={() => onAssign(rfq.id)}
                onQuote={() => onQuote(rfq)}
                hideActions={actionsLocked}   // ⭐ pass the flag
              />
            );
          })
        )}
      </div>
    </div>
  );
}