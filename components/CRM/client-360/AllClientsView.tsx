// app/(dashboard)/crm/client-360/components/AllClientsView.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Plus, Filter } from 'lucide-react';
import type {
  Client360,
  ClientStats,
  SectorBreakdown,
  ClientConstants,
} from './constants';
import { TIER_STYLES, fmtMoney, fmtDate } from './constants';
import { AutoAddedBadge } from './AutoAddedBadge';

interface Props {
  clients: Client360[];
  stats: ClientStats | null;
  sectorBreakdown: SectorBreakdown | null;
  constants: ClientConstants | null;
  loading: boolean;
  onSelect: (c: Client360) => void;
  onAddClient: () => void;
  onFilterChange: (filters: {
    sector: string;
    tier: string;
    search: string;
    isPartner?: boolean;
  }) => void;
  activeFilter: {
    sector: string;
    tier: string;
    search: string;
    isPartner?: boolean;
  };
}

export function AllClientsView({
  clients,
  stats,
  sectorBreakdown,
  constants,
  loading,
  onSelect,
  onAddClient,
  onFilterChange,
  activeFilter,
}: Props) {
  const [search, setSearch] = useState(activeFilter.search);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== activeFilter.search) {
        onFilterChange({ ...activeFilter, search });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      {/* Sector tabs */}
      <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs overflow-x-auto">
        <SectorTab
          active={activeFilter.sector === 'all'}
          onClick={() => onFilterChange({ ...activeFilter, sector: 'all' })}
          label="All"
          count={sectorBreakdown?.total}
        />
        {(sectorBreakdown?.entries || []).map((s) => (
          <SectorTab
            key={s.sector}
            active={activeFilter.sector === s.sector}
            onClick={() =>
              onFilterChange({ ...activeFilter, sector: s.sector })
            }
            label={s.sector}
            count={s.count}
          />
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select
          value={activeFilter.tier}
          onChange={(e) =>
            onFilterChange({ ...activeFilter, tier: e.target.value })
          }
          className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        >
          <option value="all">All Tiers</option>
          {(constants?.TIERS || ['Gold', 'Silver', 'Bronze', 'Standard']).map(
            (t) => (
              <option key={t} value={t}>
                {t}
              </option>
            )
          )}
        </select>

        <select
          value={activeFilter.isPartner ? 'partners' : 'all'}
          onChange={(e) =>
            onFilterChange({
              ...activeFilter,
              isPartner: e.target.value === 'partners' ? true : undefined,
            })
          }
          className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        >
          <option value="all">All Teams</option>
          <option value="partners">Partners Only</option>
        </select>

        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients, contacts, emails…"
            className="w-full rounded-lg border border-[#E2DBD1] bg-white pl-9 pr-8 py-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <button
          onClick={onAddClient}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      {/* KPI stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-5">
          <StatCard label="Total Clients" value={stats.totalClients} />
          <StatCard label="Total Partners" value={stats.totalPartners} />
          <StatCard label="Total Contacts" value={stats.totalContacts} />
          <StatCard label="Called" value={stats.called} />
          <StatCard label="Emailed" value={stats.emailed} />
          <StatCard label="Presented" value={stats.presented} />
          <StatCard label="Potential" value={stats.potential} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#EBE6DF] bg-white mt-5">
        <table className="w-full text-xs">
          <thead className="bg-[#FDFBF7]">
            <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Lifetime Value</th>
              <th className="px-4 py-3 text-center">Contacts</th>
              <th className="px-4 py-3">Last Order</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  <div className="h-4 w-32 mx-auto animate-pulse rounded bg-slate-200" />
                </td>
              </tr>
            )}

            {!loading && clients.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-[11px] italic text-slate-400"
                >
                  No clients match your filters.
                </td>
              </tr>
            )}

            {!loading &&
              clients.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="cursor-pointer hover:bg-[#FDFBF7] transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {c.name}
                      </span>
                      {c.autoAdded && c.autoAddedFrom && (
                        <AutoAddedBadge source={c.autoAddedFrom} />
                      )}
                      {c.isPartner && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F5EEFF] text-[#6B3FB5] border border-[#E4D5F5]">
                          Partner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        TIER_STYLES[c.tier] || TIER_STYLES.Standard
                      }`}
                    >
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.sector || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.country || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                    {fmtMoney(c.lifetimeValue)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">
                    {(c.contacts || []).length}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {fmtDate(c.lastOrderAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-semibold text-[#A06126]">
                      View 360 →
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Auto-capture note */}
      <div className="mt-5 rounded-xl border border-[#EBE6DF] bg-[#FFFBF3] px-5 py-4 text-[11px] text-slate-700 leading-relaxed">
        <span className="font-bold">⚡ Auto-capture in effect:</span> a company's
        group row tagged{' '}
        {/* <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#FFF7E8] text-[#A06126] border border-[#F5D9B8]">
          Auto-added
        </span> */}
        was created automatically from Tender, RFQ, Quotation, Online CRM, Sales
        CRM, or DMAR activity — no one had to add it by hand. The system checks
        existing records by email/phone/company name before creating a new one,
        so the same contact never gets duplicated.
      </div>
    </>
  );
}

/* =========================================================
   SUBS
   ========================================================= */
function SectorTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 font-semibold relative whitespace-nowrap transition ${
        active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      {typeof count === 'number' && (
        <span
          className={`ml-1.5 text-[10px] ${
            active ? 'text-[#A06126]' : 'text-slate-400'
          }`}
        >
          ({count})
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#EBE6DF] bg-white px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-bold text-[#0F2D4A]">
        {value}
      </div>
    </div>
  );
}