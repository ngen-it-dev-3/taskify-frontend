// app/(dashboard)/dmar/components/KpiCards.tsx
'use client';

import React from 'react';
import type { DmarStats } from './constants';
import { formatMoney } from './constants';

interface Props {
  stats: DmarStats | null;
}

export function KpiRow({ stats }: Props) {
  if (!stats) return <KpiSkeleton />;

  // Split DMAR Total into activities for a tooltip
  const breakdown = [
    { label: 'Visited', count: stats.visited },
    { label: 'Called', count: stats.called },
    { label: 'Emailed', count: stats.emailed },
    { label: 'Posted', count: stats.posted },
    { label: 'Social', count: stats.social },
    { label: 'Meeting', count: stats.meeting },
  ]
    .filter((b) => b.count > 0)
    .map((b) => `${b.label} ${b.count}`)
    .join(' · ');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* DMAR Total */}
      <Card title="DMAR Total" hint={breakdown}>
        <Big>{stats.total}</Big>
        <Sub>
          {stats.dmarTarget > 0
            ? `${stats.dmarPct}% of ${stats.dmarTarget} target`
            : 'No target set'}
        </Sub>
      </Card>

      {/* Visited */}
      <Card title="Visited">
        <Big>{stats.visited}</Big>
        <Sub>Client & site visits</Sub>
      </Card>

      {/* Quoted */}
      <Card title="Quoted">
        <Big>{stats.quoted}</Big>
        <Sub>Sales achievement</Sub>
      </Card>

      {/* Sold */}
      <Card title="Sold">
        <Big className={stats.sold > 0 ? 'text-emerald-700' : ''}>
          {stats.sold}
        </Big>
        <Sub>
          {stats.sold > 0
            ? `Value ${formatMoney(stats.soldValue)}`
            : 'Sales achievement'}
        </Sub>
      </Card>

      {/* Sales Target */}
      <Card title="Sales Target">
        <Big>{formatMoney(stats.salesTarget)}</Big>
        <Sub>
          {stats.salesTarget > 0
            ? `${stats.salesPct}% achieved so far`
            : 'Not set'}
        </Sub>
      </Card>
    </div>
  );
}

/* -------------------- Sub components -------------------- */
function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-4 shadow-xs group relative">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      {children}
      {hint && (
        <div className="pointer-events-none absolute left-3 right-3 top-full z-10 mt-1 hidden group-hover:block">
          <div className="rounded-lg bg-[#0F2D4A] px-3 py-2 text-[10px] font-medium text-white shadow-lg whitespace-nowrap">
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}

function Big({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-1.5 font-mono text-2xl font-bold text-[#0F2D4A] ${className}`}>
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[10.5px] text-slate-500">{children}</div>;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[100px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white"
        />
      ))}
    </div>
  );
}