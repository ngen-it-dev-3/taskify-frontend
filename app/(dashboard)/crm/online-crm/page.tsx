// app/(dashboard)/online-crm/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  OnlineCrmApi,
  type UnifiedOnlineRow,
  type OnlineCrmStats,
  type MonthlyVolumeData,
  type ByCountryData,
  type TopProductsData,
  type OnlineQuery,
} from '@/services/onlineCrm.service';
import { KpiRow } from '@/components/CRM/online-crm/KpiCards';
import { MonthlyVolumeChart } from '@/components/CRM/online-crm/MonthlyVolumeChart';
import { ByCountryPanel } from '@/components/CRM/online-crm/ByCountryPanel';
import { TopProductsPanel } from '@/components/CRM/online-crm/TopProductsPanel';
import { FilterBar, QueryFilters } from '@/components/CRM/online-crm/FilterBar';
import { QueryLogTable } from '@/components/CRM/online-crm/QueryLogTable';
import { LogQueryModal } from '@/components/CRM/online-crm/LogQueryModal';
import { QueryDetailModal } from '@/components/CRM/online-crm/QueryDetailModal';

type BottomTab = 'current' | 'pending' | 'not-quoted';

export default function OnlineCrmPage() {
  const router = useRouter();

  // ---- Data ----
  const [rows, setRows] = useState<UnifiedOnlineRow[]>([]);
  const [stats, setStats] = useState<OnlineCrmStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyVolumeData | null>(null);
  const [byCountry, setByCountry] = useState<ByCountryData | null>(null);
  const [topData, setTopData] = useState<TopProductsData | null>(null);

  // ---- UI ----
  const [loading, setLoading] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>('current');
  const [activeMonth, setActiveMonth] = useState<number | undefined>(undefined);

  const [filters, setFilters] = useState<QueryFilters>({
    search: '',
    source: 'all',
    stage: 'all',
    country: 'all',
    originSource: 'all',
  });

  // ---- Modals ----
  const [logOpen, setLogOpen] = useState(false);              // create modal
  const [viewingQuery, setViewingQuery] = useState<OnlineQuery | null>(null);   // read-only view
  const [editingQuery, setEditingQuery] = useState<OnlineQuery | null>(null);   // edit modal

  // ============================================================
  // FETCH
  // ============================================================
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const baseParams: Record<string, any> = {};
      if (filters.search) baseParams.search = filters.search;
      if (filters.stage !== 'all') baseParams.stage = filters.stage;
      if (filters.country !== 'all') baseParams.country = filters.country;
      if (filters.originSource !== 'all') baseParams.originSource = filters.originSource;

      let tableStage = baseParams.stage;
      if (bottomTab === 'pending') tableStage = 'To Start';
      else if (bottomTab === 'not-quoted') tableStage = 'Not Quoted';

      const [listRes, statsRes, monthlyRes, countryRes, topRes] =
        await Promise.all([
          OnlineCrmApi.unifiedList({
            ...baseParams,
            ...(tableStage ? { stage: tableStage } : {}),
            limit: 200,
          }),
          OnlineCrmApi.unifiedStats(baseParams),
          OnlineCrmApi.unifiedMonthlyVolume(baseParams),
          OnlineCrmApi.unifiedByCountry(baseParams),
          OnlineCrmApi.unifiedTopProducts(baseParams),
        ]);

      setRows(listRes.items);
      setStats(statsRes);
      setMonthly(monthlyRes);
      setByCountry(countryRes);
      setTopData(topRes);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load Online CRM data');
    } finally {
      setLoading(false);
    }
  }, [filters, bottomTab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleSaveNewQuery = async () => {
    setLogOpen(false);
    await load();
  };

  const handleSaveEdit = async () => {
    setEditingQuery(null);
    await load();
  };

  /**
   * Row click — routes by source:
   *   Online     → opens the read-only detail modal
   *   RFQ        → navigates to RFQ dashboard
   *   Tender     → navigates to Tender dashboard
   *   Quotation  → navigates to quotation builder
   */
  const handleRowClick = async (row: UnifiedOnlineRow) => {
    if (row.source === 'rfq') {
      router.push(`/crm/rfq?selected=${row.raw}`);
      return;
    }
    if (row.source === 'tender') {
      router.push(`/tenders/manage?tenderId=${row.raw}`);
      return;
    }
    if (row.source === 'quotation') {
      router.push(`/crm/quotation-builder/quotes`);
      return;
    }
    // Online → open the read-only detail modal
    try {
      const full = await OnlineCrmApi.getById(row.raw);
      setViewingQuery(full);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load query');
    }
  };

  /**
   * Edit button — only appears on Online rows.
   * Opens the LogQueryModal in edit mode.
   */
  const handleEditRow = async (row: UnifiedOnlineRow) => {
    if (row.source !== 'online') return;
    try {
      const full = await OnlineCrmApi.getById(row.raw);
      setEditingQuery(full);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load query');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
              CRM Dashboard
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#0F2D4A]">
              Online CRM
            </h1>
            <p className="mt-1 max-w-3xl text-xs text-slate-500 leading-relaxed">
              Unified view — RFQs, quotations, tenders, and manually-logged
              online queries, all in one dashboard with country and month
              analytics.
            </p>
          </div>

          <button
            onClick={() => setLogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#88501E]"
          >
            <Plus className="w-3.5 h-3.5" />
            Online Query
          </button>
        </header>

        {/* KPI Row */}
        {stats ? (
          <KpiRow
            activeCount={stats.activeCount}
            quotedValueBDT={stats.quotedValueBDT}
            quotedValueUSD={stats.quotedValueUSD}
            quotedCount={stats.quotedCount}
            notQuoted={stats.notQuoted}
            overdue={stats.overdue}
            crmManager={stats.crmManager}
          />
        ) : (
          <KpiRowSkeleton />
        )}

        {/* Analytics Panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {monthly ? (
            <MonthlyVolumeChart
              data={monthly.data}
              activeMonth={activeMonth}
              onSelectMonth={setActiveMonth}
            />
          ) : (
            <PanelSkeleton />
          )}

          {byCountry ? (
            <ByCountryPanel
              rows={byCountry.entries}
              total={byCountry.total}
            />
          ) : (
            <PanelSkeleton />
          )}

          {topData ? (
            <TopProductsPanel
              products={topData.products}
              clients={topData.clients}
            />
          ) : (
            <PanelSkeleton />
          )}
        </div>

        {/* Bottom Tabs */}
        <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
          <BottomTabBtn
            active={bottomTab === 'current'}
            onClick={() => setBottomTab('current')}
          >
            Current Queries
          </BottomTabBtn>
          <BottomTabBtn
            active={bottomTab === 'pending'}
            onClick={() => setBottomTab('pending')}
          >
            Pending
          </BottomTabBtn>
          <BottomTabBtn
            active={bottomTab === 'not-quoted'}
            onClick={() => setBottomTab('not-quoted')}
          >
            Not Quoted
          </BottomTabBtn>
        </div>

        {/* Filter Bar */}
        <FilterBar value={filters} onChange={setFilters} />

        {/* Query Log Table */}
        {loading && rows.length === 0 ? (
          <TableSkeleton />
        ) : (
          <QueryLogTable
            queries={rows}
            onEdit={handleEditRow}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* ---- Modals ---- */}

      {/* Create new query */}
      {logOpen && (
        <LogQueryModal
          onClose={() => setLogOpen(false)}
          onSaved={handleSaveNewQuery}
        />
      )}

      {/* View details (read-only) */}
      {viewingQuery && (
        <QueryDetailModal
          query={viewingQuery}
          onClose={() => setViewingQuery(null)}
        />
      )}

      {/* Edit existing query */}
      {editingQuery && (
        <LogQueryModal
          initial={editingQuery}
          onClose={() => setEditingQuery(null)}
          onSaved={handleSaveEdit}
        />
      )}
    </main>
  );
}

/* =========================================================
   SUBCOMPONENTS
   ========================================================= */
function BottomTabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 font-semibold relative transition ${active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
        }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}

function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[110px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white"
        />
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="h-[260px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white" />
  );
}

function TableSkeleton() {
  return (
    <div className="h-[300px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white" />
  );
}