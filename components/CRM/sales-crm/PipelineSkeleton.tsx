// app/(dashboard)/sales-crm/components/PipelineSkeleton.tsx
'use client';

import React from 'react';

export function PipelineSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div
              key={j}
              className="h-[100px] animate-pulse rounded-lg bg-white border border-[#EBE6DF]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}