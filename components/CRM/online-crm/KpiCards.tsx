// app/(dashboard)/online-crm/components/KpiCards.tsx
'use client';

import React from 'react';

export function KpiRow({
  activeCount,
  quotedValueBDT,
  quotedValueUSD,
  quotedCount,
  notQuoted,
  overdue,
  crmManager,
}: {
  activeCount: number;
  quotedValueBDT: number;
  quotedValueUSD: number;
  quotedCount: number;
  notQuoted: number;
  overdue: number;
  crmManager: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Active Queries */}
      <Card>
        <Title>Active Queries</Title>
        <Big>{activeCount}</Big>
        <Sub>To Start + Not Quoted + Quoted</Sub>
      </Card>

      {/* Quoted Value */}
      <Card>
        <Title>Quoted Value</Title>
        <Big>
          ৳{quotedValueBDT.toLocaleString()}
          {quotedValueUSD > 0 && (
            <span className="text-slate-400"> + ${quotedValueUSD.toLocaleString()}</span>
          )}
        </Big>
        <Sub>{quotedCount} quoted queries</Sub>
      </Card>

      {/* Not Quoted */}
      <Card>
        <Title>Not Quoted</Title>
        <Big>{notQuoted}</Big>
        <Sub>Awaiting pricing</Sub>
      </Card>

      {/* Overdue */}
      <Card>
        <Title>Overdue (&gt;15 days)</Title>
        <Big className="text-rose-600">{overdue}</Big>
        <Sub>Needs follow-up</Sub>
      </Card>

      {/* CRM Manager */}
      <Card>
        <Title>CRM Manager</Title>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F3864] text-[11px] font-bold text-white">
            {crmManager
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-800">
              {crmManager}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              ● Active now
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#EBE6DF] bg-white p-4 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
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
    <div className={`mt-2 font-mono text-2xl font-bold text-[#0F2D4A] ${className}`}>
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-[10.5px] text-slate-500">{children}</div>
  );
}