'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ThresholdBanner() {
  return (
    <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        <strong>Discount 18% exceeds the 15% policy threshold</strong> — routed to CRM
        Manager for approval before the quote can be issued.
      </span>
    </div>
  );
}