// components/CRM/sales-crm/SourceBadge.tsx
'use client';

import React from 'react';
import type { UnifiedSource } from '@/services/salesCrm.service';

const STYLES: Record<UnifiedSource, string> = {
    rfq: 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
    quotation: 'bg-[#F5EEFF] text-[#6B3FB5] border-[#E4D5F5]',
    forecast: 'bg-[#FFF7E8] text-[#A06126] border-[#F5D9B8]',
    tender: 'bg-[#E8F6F1] text-[#0F6B4F] border-[#C4E8DA]',   // ⭐ NEW — teal/emerald
};

const LABELS: Record<UnifiedSource, string> = {
    rfq: 'RFQ',
    quotation: 'Quote',
    forecast: 'Forecast',
    tender: 'Tender',   // ⭐ NEW
};

export function SourceBadge({ source }: { source: UnifiedSource }) {
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${STYLES[source]}`}
        >
            {LABELS[source]}
        </span>
    );
}