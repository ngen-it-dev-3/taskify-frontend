// app/(dashboard)/online-crm/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MonthlyVolumeChart } from '@/components/CRM/online-crm/MonthlyVolumeChart';
import { ByCountryPanel } from '@/components/CRM/online-crm/ByCountryPanel';
import { TopProductsPanel } from '@/components/CRM/online-crm/TopProductsPanel';
import { FilterBar, QueryFilters } from '@/components/CRM/online-crm/FilterBar';
import { QueryLogTable } from '@/components/CRM/online-crm/QueryLogTable';
import { LogQueryModal } from '@/components/CRM/online-crm/LogQueryModal';
import { QueryDetailModal } from '@/components/CRM/online-crm/QueryDetailModal';
import { QuotationApi } from '@/services/quotation.service';
import { KpiRow } from '@/components/CRM/online-crm/KpiCards';

type BottomTab = 'current' | 'pending' | 'not-quoted';
type GroupBy = 'country' | 'source' | 'assigned' | 'stage';

// ⭐ Month name → index map
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

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
  const [byDimension, setByDimension] = useState<GroupBy>('country');

  const [filters, setFilters] = useState<QueryFilters>({
    search: '',
    source: 'all',
    stage: 'all',
    country: 'all',
    originSource: 'all',
    month: 'all',
    year: 'all',
  });

  // ---- Modals ----
  const [logOpen, setLogOpen] = useState(false);
  const [viewingQuery, setViewingQuery] = useState<OnlineQuery | null>(null);
  const [editingQuery, setEditingQuery] = useState<OnlineQuery | null>(null);

  // ============================================================
  // BUILD DATE RANGE
  // ============================================================
  const dateRange = useMemo(() => {
    if (filters.month === 'all' && filters.year === 'all') {
      return { dateFrom: undefined, dateTo: undefined };
    }

    const now = new Date();
    const year =
      filters.year !== 'all' ? Number(filters.year) : now.getFullYear();

    if (filters.month !== 'all') {
      const monthIdx = MONTH_NAMES.indexOf(
        filters.month as (typeof MONTH_NAMES)[number]
      );
      if (monthIdx >= 0) {
        const from = new Date(year, monthIdx, 1, 0, 0, 0);
        const to = new Date(year, monthIdx + 1, 0, 23, 59, 59);
        return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
      }
    }

    const from = new Date(year, 0, 1, 0, 0, 0);
    const to = new Date(year, 11, 31, 23, 59, 59);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, [filters.month, filters.year]);

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
      if (filters.originSource !== 'all')
        baseParams.originSource = filters.originSource;

      if (filters.month !== 'all') baseParams.month = filters.month;
      if (filters.year !== 'all') baseParams.year = filters.year;
      if (dateRange.dateFrom) baseParams.dateFrom = dateRange.dateFrom;
      if (dateRange.dateTo) baseParams.dateTo = dateRange.dateTo;

      let tableStage = baseParams.stage;
      if (bottomTab === 'pending') tableStage = 'To Start';
      else if (bottomTab === 'not-quoted') tableStage = 'Not Quoted';

      const [listRes, statsRes, monthlyRes, countryRes, topRes] =
        await Promise.all([
          OnlineCrmApi.unifiedList({
            ...baseParams,
            ...(tableStage ? { stage: tableStage } : {}),
            limit: 500,
          }),
          OnlineCrmApi.unifiedStats(baseParams),
          OnlineCrmApi.unifiedMonthlyVolume(baseParams),
          OnlineCrmApi.unifiedByCountry({
            ...baseParams,
            country: undefined,
            by: byDimension,   // ⭐ NEW — pass the current grouping
          }),
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
  }, [filters, bottomTab, dateRange.dateFrom, dateRange.dateTo, byDimension]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // ============================================================
  // CLIENT-SIDE FALLBACK FILTER
  // ============================================================

  // ⭐ Compute per-user query stats for the CRM Team modal
  const crmUsersWithStats = useMemo(() => {
    const users = stats?.crmUsers || [];
    if (users.length === 0) return users;

    // All online queries in scope (current filter)
    const onlineRows = rows.filter((r) => r.source === 'online');

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return users.map((u) => {
      // Match rows assigned to this user — case-insensitive, whitespace-tolerant
      const userRows = onlineRows.filter((r) => {
        const assigned = String(r.assigned || '').trim().toLowerCase();
        const target = String(u.name || '').trim().toLowerCase();
        return assigned === target;
      });

      const queriesToday = userRows.filter((r) => {
        const d = new Date(r.date);
        return !Number.isNaN(d.getTime()) && d >= todayStart;
      }).length;

      const queriesThisMonth = userRows.filter((r) => {
        const d = new Date(r.date);
        return !Number.isNaN(d.getTime()) && d >= monthStart;
      }).length;

      const queriesAllTime = userRows.length;

      return {
        ...u,
        queriesToday,
        queriesThisMonth,
        queriesAllTime,
        status: 'active' as const,
      };
    });
  }, [stats?.crmUsers, rows]);


  const visibleRows = useMemo(() => {
    let out = rows;

    if (filters.country !== 'all') {
      const needle = filters.country.trim().toLowerCase();
      out = out.filter((r) => {
        const c = ((r as any).country || '').toString().trim().toLowerCase();
        return c === needle;
      });
    }

    if (filters.originSource !== 'all') {
      out = out.filter((r) => r.source === filters.originSource);
    }

    if (filters.stage !== 'all') {
      out = out.filter((r) => r.stage === filters.stage);
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      out = out.filter((r) => {
        const hay = [
          (r as any).company,
          (r as any).rfqNumber,
          (r as any).product,
          (r as any).assigned,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (filters.month !== 'all' || filters.year !== 'all') {
      const year = filters.year !== 'all' ? Number(filters.year) : undefined;
      const monthIdx =
        filters.month !== 'all'
          ? MONTH_NAMES.indexOf(filters.month as (typeof MONTH_NAMES)[number])
          : undefined;

      out = out.filter((row) => {
        if (!row.date) return false;
        const d = new Date(row.date);
        if (Number.isNaN(d.getTime())) return false;
        if (year !== undefined && d.getFullYear() !== year) return false;
        if (monthIdx !== undefined && monthIdx >= 0 && d.getMonth() !== monthIdx)
          return false;
        return true;
      });
    }

    return out;
  }, [
    rows,
    filters.country,
    filters.originSource,
    filters.stage,
    filters.search,
    filters.month,
    filters.year,
  ]);

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
      const rfqId =
        (row as any).rfqId ||
        (row as any).rfq_id ||
        (row as any).meta?.rfqId ||
        null;

      if (rfqId) {
        router.push(`/crm/quotation-builder/${rfqId}?tab=quotes`);
        return;
      }

      try {
        const quote = await QuotationApi.get(row.raw);
        const linkedRfqId = quote?.rfqId;
        if (linkedRfqId) {
          router.push(`/crm/quotation-builder/${linkedRfqId}?tab=quotes`);
        } else {
          toast.error('This quotation has no linked RFQ');
        }
      } catch (e: any) {
        toast.error(e.message || 'Failed to open quotation');
      }
      return;
    }

    try {
      const full = await OnlineCrmApi.getById(row.raw);
      setViewingQuery(full);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load query');
    }
  };

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
            crmUsers={crmUsersWithStats}
            crmUsersCount={crmUsersWithStats.length}
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
              filterParams={{
                ...(filters.country !== 'all'
                  ? { country: filters.country }
                  : {}),
                ...(filters.originSource !== 'all'
                  ? { originSource: filters.originSource }
                  : {}),
              }}
            />
          ) : (
            <PanelSkeleton />
          )}

          {byCountry ? (
            <ByCountryPanel
              rows={byCountry.entries}
              total={byCountry.total}
              by={byDimension}
              onChangeBy={setByDimension}
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

        {/* Active-filter summary */}
        {(filters.month !== 'all' || filters.year !== 'all') && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold">Filtered:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF7E8] border border-[#F5D9B8] px-2 py-0.5 text-[10px] font-bold text-[#A06126]">
              {filters.month !== 'all' ? filters.month : 'All months'}
              {filters.year !== 'all' ? ` ${filters.year}` : ''}
            </span>
            <span>
              {visibleRows.length} of {rows.length} rows
            </span>
          </div>
        )}

        {/* Query Log Table */}
        {loading && rows.length === 0 ? (
          <TableSkeleton />
        ) : (
          <QueryLogTable
            queries={visibleRows}
            onEdit={handleEditRow}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* ---- Modals ---- */}
      {logOpen && (
        <LogQueryModal
          onClose={() => setLogOpen(false)}
          onSaved={handleSaveNewQuery}
        />
      )}

      {viewingQuery && (
        <QueryDetailModal
          query={viewingQuery}
          onClose={() => setViewingQuery(null)}
        />
      )}

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