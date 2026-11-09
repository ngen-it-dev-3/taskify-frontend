// app/(dashboard)/crm/client-360/components/AutoAddedBadge.tsx
'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { SOURCE_LABELS, SOURCE_BADGE_STYLES } from './constants';

interface Props {
  source: string;
}

export function AutoAddedBadge({ source }: Props) {
  const label = SOURCE_LABELS[source] || 'Auto';
  const style =
    SOURCE_BADGE_STYLES[source] ||
    'bg-yellow-50 text-yellow-700 border-yellow-200';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${style}`}
      title={`Auto-captured from ${label}`}
    >
      {/* <Zap className="w-2.5 h-2.5" /> */}
      {/* Auto-added  */}
      {label}
    </span>
  );
}