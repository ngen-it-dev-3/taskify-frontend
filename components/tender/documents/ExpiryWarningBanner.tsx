// components/tender/documents/ExpiryWarningBanner.tsx
'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { CompanyDocUI } from '@/lib/api/mappers';

interface Props {
  expiredDocs: CompanyDocUI[];
  linkedTenderName?: string;
  onRenew?: (doc: CompanyDocUI) => void;
}

export function ExpiryWarningBanner({
  expiredDocs,
  linkedTenderName,
  onRenew,
}: Props) {
  if (!expiredDocs || expiredDocs.length === 0) return null;

  const first = expiredDocs[0];
  const hasMultiple = expiredDocs.length > 1;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-white px-4 py-3">
      {/* Warning icon */}
      <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-400" />

      {/* Message */}
      <p className="flex-1 text-[12px] leading-6 text-slate-600">
        <strong className="font-semibold text-rose-700">
          {first.title} has expired
        </strong>
        {linkedTenderName ? (
          <>
            {' '}
            — this is the exact gap flagged in the{' '}
            <strong className="font-semibold text-slate-800">
              {linkedTenderName}
            </strong>{' '}
            tender's eligibility check. Renewing it here will clear that gap
            automatically.
          </>
        ) : (
          <>
            {' '}
            — renew it before importing into a tender to keep your eligibility
            check clean.
          </>
        )}
        {hasMultiple && (
          <>
            {' '}
            <span className="text-slate-500">
              ({expiredDocs.length - 1} other
              {expiredDocs.length - 1 === 1 ? '' : 's'} also expired)
            </span>
          </>
        )}
      </p>

      {/* ⭐ Renew Now button */}
      {onRenew && (
        <button
          type="button"
          onClick={() => onRenew(first)}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] focus:outline-none focus:ring-2 focus:ring-[#a97400]/30"
        >
          <RefreshCw className="h-3 w-3" />
          Renew Now
        </button>
      )}
    </div>
  );
}