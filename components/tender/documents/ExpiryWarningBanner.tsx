// components/tender/documents/ExpiryWarningBanner.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import type { CompanyDocUI } from '@/lib/api/mappers';

interface Props {
  expiredDocs: CompanyDocUI[];
  linkedTenderName?: string;
}

export function ExpiryWarningBanner({
  expiredDocs,
  linkedTenderName,
}: Props) {
  if (!expiredDocs || expiredDocs.length === 0) return null;

  const first = expiredDocs[0];
  const hasMultiple = expiredDocs.length > 1;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-white px-4 py-3">
      {/* Warning icon */}
      <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-400" />

      {/* Message — single line, small text */}
      <p className="text-[12px] leading-6 text-slate-600">
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
    </div>
  );
}