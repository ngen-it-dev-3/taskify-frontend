// app/(dashboard)/sales-crm/page.tsx
'use client';

import { FilterBar, SalesFilters } from '@/components/CRM/sales-crm/FilterBar';
import { ForecastTab } from '@/components/CRM/sales-crm/ForecastTab';
import { PipelineTab } from '@/components/CRM/sales-crm/PipelineTab';
import { SalesReportTab } from '@/components/CRM/sales-crm/SalesReportTab';
import { TopTabButton } from '@/components/CRM/sales-crm/TopTabButton';
import React, { useState } from 'react';

type TopTab = 'pipeline' | 'forecast' | 'sales-report';

export default function SalesCrmPage() {
  const [tab, setTab] = useState<TopTab>('pipeline');
  const [filters, setFilters] = useState<SalesFilters>({
    region: 'All Regions',
    owner: '',
  });

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* ---------- Header ---------- */}
        <header>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
            CRM Dashboard
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#0F2D4A]">
            Sales CRM
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">
            Pipeline, Forecast, and Sales Report — the views Management and
            Supervisors read every morning, now connected and region-aware.
          </p>
        </header>

        {/* ---------- Shared Filter Bar ---------- */}
        <FilterBar value={filters} onChange={setFilters} />

        {/* ---------- Top Tabs ---------- */}
        <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
          <TopTabButton
            active={tab === 'pipeline'}
            onClick={() => setTab('pipeline')}
          >
            Pipeline
          </TopTabButton>
          <TopTabButton
            active={tab === 'forecast'}
            onClick={() => setTab('forecast')}
          >
            Forecast
          </TopTabButton>
          <TopTabButton
            active={tab === 'sales-report'}
            onClick={() => setTab('sales-report')}
          >
            Sales Report
          </TopTabButton>
        </div>

        {/* ---------- Tab Content ---------- */}
        {tab === 'pipeline' && <PipelineTab filters={filters} />}
        {tab === 'forecast' && <ForecastTab filters={filters} />}
        {tab === 'sales-report' && <SalesReportTab filters={filters} />}
      </div>
    </main>
  );
}