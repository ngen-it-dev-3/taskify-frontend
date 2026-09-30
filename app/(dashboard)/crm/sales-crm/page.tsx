// app/(dashboard)/crm/sales-crm/page.tsx
'use client';

import React, { useState } from 'react';
import { FilterBar, type SalesFilters } from '@/components/CRM/sales-crm/FilterBar';
import { ForecastSummary } from '@/components/CRM/sales-crm/ForecastSummary';
import { ForecastTab } from '@/components/CRM/sales-crm/ForecastTab';
import { PipelineTab } from '@/components/CRM/sales-crm/PipelineTab';
import { SalesReportTab } from '@/components/CRM/sales-crm/SalesReportTab';
import { TopTabButton } from '@/components/CRM/sales-crm/TopTabButton';
import type { ForecastMonth } from '@/services/salesCrm.service';

type TopTab = 'pipeline' | 'forecast' | 'sales-report';

export default function SalesCrmPage() {
  const [tab, setTab] = useState<TopTab>('pipeline');
  const [activeMonth, setActiveMonth] = useState<ForecastMonth | 'all'>('all');

  const [filters, setFilters] = useState<SalesFilters>({
    region: 'All Regions',
    territory: 'All Territories',
    owner: '',
    currency: 'BDT',
    rate: 1,
    sources: [],
  });

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
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

        <FilterBar value={filters} onChange={setFilters} />

        {/* Main Tabs */}
        <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
          <TopTabButton active={tab === 'pipeline'} onClick={() => setTab('pipeline')}>
            Pipeline
          </TopTabButton>
          <TopTabButton active={tab === 'forecast'} onClick={() => setTab('forecast')}>
            Forecast
          </TopTabButton>
          <TopTabButton active={tab === 'sales-report'} onClick={() => setTab('sales-report')}>
            Sales Report
          </TopTabButton>
        </div>

        {/* ⭐ Forecast tab content — Summary (panels + KPIs) THEN Month Tabs + Entries */}
        {tab === 'forecast' && (
          <>
            <ForecastSummary
              filters={filters}
              activeMonth={activeMonth}
            />
            <ForecastTab
              filters={filters}
              activeMonth={activeMonth}
              onChangeMonth={setActiveMonth}
            />
          </>
        )}

        {tab === 'pipeline' && <PipelineTab filters={filters} />}
        {tab === 'sales-report' && <SalesReportTab filters={filters} />}
      </div>
    </main>
  );
}