'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    /** Highest discount % currently applied across any line */
    discountPct?: number;
    /** Policy threshold % (default 15) */
    threshold?: number;
}

export default function ThresholdBanner({
    discountPct = 0,
    threshold = 15,
}: Props) {
    // Round to 1 decimal for display (e.g. 17.5% → "17.5%")
    const displayPct = Number.isInteger(discountPct)
        ? discountPct
        : Number(discountPct.toFixed(1));

    return (
        <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

            <div className="text-[12.5px] text-rose-800 leading-relaxed">
                <strong className="font-semibold">
                    Discount {displayPct}%
                </strong>{' '}
                exceeds the{' '}
                <strong className="font-semibold">
                    {threshold}%
                </strong>{' '}
                policy threshold — routed to CRM Manager for approval before
                the quote can be issued.
            </div>
        </div>
    );
}