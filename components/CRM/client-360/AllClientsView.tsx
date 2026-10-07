// app/(dashboard)/crm/client-360/components/AllClientsView.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Pencil,
  MessageSquare,
  Mail,
  Phone,
  Save,
} from 'lucide-react';
import type {
  Client360,
  ClientStats,
  SectorBreakdown,
  ClientConstants,
  ClientContact,
} from './constants';
import { TIER_STYLES, fmtMoney, fmtDate } from './constants';
import { AutoAddedBadge } from './AutoAddedBadge';

// ⭐ Country list — matches your dropdown
const COUNTRIES = [
  'Bangladesh',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Vietnam',
  'Thailand',
  'Philippines',
  'UAE',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Oman',
  'UK',
  'United Kingdom',
  'Portugal',
  'Germany',
  'France',
  'Netherlands',
  'Nepal',
];

interface ContactDraft {
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  personalPhone: string;
  personalEmail: string;
  area: string;
  owner: string;
  notes: string;
}

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
    country: string;
    search: string;
    isPartner?: boolean;
  }) => void;
  activeFilter: {
    sector: string;
    tier: string;
    country: string;
    search: string;
    isPartner?: boolean;
  };
  onSaveContact?: (
    client: Client360,
    contact: ClientContact,
    updated: Partial<ClientContact>,
    index: number
  ) => Promise<void> | void;
  onChatContact?: (client: Client360, contact: ClientContact) => void;
  onEmailContact?: (client: Client360, contact: ClientContact) => void;
  onCallContact?: (client: Client360, contact: ClientContact) => void;
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
  onSaveContact,
  onChatContact,
  onEmailContact,
  onCallContact,
}: Props) {
  const [search, setSearch] = useState(activeFilter.search);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingContactKey, setEditingContactKey] = useState<string | null>(
    null
  );
  const [draft, setDraft] = useState<ContactDraft | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  const [entityTab, setEntityTab] = useState<'all' | 'clients' | 'partners'>(
    activeFilter.isPartner === true
      ? 'partners'
      : activeFilter.isPartner === false
        ? 'clients'
        : 'all'
  );

  // ⭐ Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ============================================================
  // ⭐ Client-side filter — runs entirely in the browser
  //    so the table updates instantly (no backend needed)
  // ============================================================
  const displayedClients = useMemo(() => {
    let out = clients;

    // ---- Country ----
    if (activeFilter.country && activeFilter.country !== 'all') {
      const needle = activeFilter.country.trim().toLowerCase();
      out = out.filter((c) => {
        const v = String(c.country || '').trim().toLowerCase();
        return v === needle;
      });
    }

    // ---- Sector ----
    if (activeFilter.sector && activeFilter.sector !== 'all') {
      out = out.filter((c) => c.sector === activeFilter.sector);
    }

    // ---- Tier ----
    if (activeFilter.tier && activeFilter.tier !== 'all') {
      out = out.filter((c) => c.tier === activeFilter.tier);
    }

    // ---- Entity tab (client vs partner) ----
    if (entityTab === 'partners') {
      out = out.filter((c) => c.isPartner === true);
    } else if (entityTab === 'clients') {
      out = out.filter((c) => c.isPartner !== true);
    }

    // ---- Local search ----
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((c) => {
        const hay = [
          c.name,
          c.country,
          c.sector,
          c.city,
          c.area,
          ...(c.contacts || []).flatMap((ct) => [
            ct.name,
            ct.email,
            ct.personalEmail,
            ct.phone,
            ct.personalPhone,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return out;
  }, [
    clients,
    activeFilter.country,
    activeFilter.sector,
    activeFilter.tier,
    entityTab,
    search,
  ]);

  // ============================================================
  // ⭐ Pagination — slice the filtered list
  // ============================================================
  const totalRows = displayedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pagedClients = displayedClients.slice(start, end);

  // ⭐ Reset to page 1 when the filtered set changes — but do it lazily
  //    by comparing against safePage on render instead of an effect.
  //    (No `useEffect` needed — this avoids extra renders.)
  const needsReset =
    page > totalPages || (page !== 1 && page > 1 && safePage !== page);
  if (needsReset && safePage !== page) {
    // Schedule a reset after render (React batches this)
    // Use a microtask to avoid "setState during render" warning
    queueMicrotask(() => setPage(1));
  }

  // Sync entityTab with parent filter
  // ⭐ Use a memoized callback, not an effect, so we avoid an extra render cycle
  const setEntityTabAndNotify = (key: 'all' | 'clients' | 'partners') => {
    setEntityTab(key);
    if (key === 'all') {
      onFilterChange({ ...activeFilter, isPartner: undefined });
    } else if (key === 'partners') {
      onFilterChange({ ...activeFilter, isPartner: true });
    } else {
      onFilterChange({ ...activeFilter, isPartner: false });
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId !== id) {
      setEditingContactKey(null);
      setDraft(null);
    }
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const makeContactKey = (clientId: string, ct: ClientContact, idx: number) =>
    ct._id || `${clientId}-${idx}`;

  const startEditContact = (
    client: Client360,
    contact: ClientContact,
    index: number
  ) => {
    setEditingContactKey(makeContactKey(client.id, contact, index));
    setDraft({
      name: contact.name || '',
      designation: contact.designation || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      personalPhone: contact.personalPhone || '',
      personalEmail: contact.personalEmail || '',
      area: (contact as any).area || '',
      owner: (contact as any).owner || '',
      notes: contact.notes || '',
    });
  };

  const cancelEditContact = () => {
    setEditingContactKey(null);
    setDraft(null);
  };

  const saveEditContact = async (
    client: Client360,
    contact: ClientContact,
    index: number
  ) => {
    if (!draft) return;
    try {
      setSavingContact(true);
      await onSaveContact?.(
        client,
        contact,
        draft as Partial<ClientContact>,
        index
      );
      setEditingContactKey(null);
      setDraft(null);
    } finally {
      setSavingContact(false);
    }
  };

  const patchDraft = <K extends keyof ContactDraft>(
    key: K,
    value: ContactDraft[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <>
      {/* KPI strip + sub-tabs */}
      <div className="flex justify-between items-center">
        <p className="text-[#6b7280] w-2/4 text-[14px]">
          Every client & partner (reseller) contact NGEN works with, worldwide —
          by country and sector. Access is ownership-restricted — see the note
          below for what you can see.
        </p>

        <div className="flex items-center gap-1 rounded-xl border border-[#EBE6DF] bg-white p-1 w-fit">
          {(
            [
              { key: 'all' as const, label: 'All', count: clients.length },
              {
                key: 'clients' as const,
                label: 'Clients',
                count: clients.filter((c) => c.isPartner !== true).length,
              },
              {
                key: 'partners' as const,
                label: 'Partners',
                count: clients.filter((c) => c.isPartner === true).length,
              },
            ]
          ).map((t) => {
            const active = entityTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setEntityTabAndNotify(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-[#A06126] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold min-w-[20px] ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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

      {/* Sector tabs */}
      <div className="mt-4 border-b border-[#EBE6DF] flex items-center gap-6 text-xs overflow-x-auto">
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
            onClick={() => onFilterChange({ ...activeFilter, sector: s.sector })}
            label={s.sector}
            count={s.count}
          />
        ))}
      </div>

      {/* Filter row — Tier + Country + Search + Add */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select
          value={activeFilter.tier}
          onChange={(e) =>
            onFilterChange({ ...activeFilter, tier: e.target.value })
          }
          className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        >
          <option value="all">All Tiers</option>
          {(constants?.TIERS || ['Gold', 'Silver', 'Bronze']).map(
            (t) => (
              <option key={t} value={t}>
                {t}
              </option>
            )
          )}
        </select>

        <select
          value={activeFilter.country}
          onChange={(e) =>
            onFilterChange({ ...activeFilter, country: e.target.value })
          }
          className="rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        >
          <option value="all">All Countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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

      {/* MAIN TABLE */}
      <div className="rounded-xl border border-[#EBE6DF] bg-white mt-5">
        <table className="w-full text-xs">
          <thead className="bg-[#FDFBF7]">
            <tr className="border-b border-[#F0EBE3] text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
              <th className="px-4 py-3 w-[40px]"></th>
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
                <td colSpan={9} className="px-6 py-8 text-center">
                  <div className="h-4 w-32 mx-auto animate-pulse rounded bg-slate-200" />
                </td>
              </tr>
            )}

            {!loading && displayedClients.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-[11px] italic text-slate-400"
                >
                  {entityTab === 'partners'
                    ? 'No partners match your filters.'
                    : entityTab === 'clients'
                      ? 'No clients match your filters.'
                      : 'No clients match your filters.'}
                </td>
              </tr>
            )}

            {!loading &&
              pagedClients.map((c) => {
                const isOpen = expandedId === c.id;
                const contacts: ClientContact[] = (c.contacts as any) || [];

                return (
                  <React.Fragment key={c.id}>
                    {/* MAIN ROW */}
                    <tr
                      onClick={() => toggleExpand(c.id)}
                      className={`cursor-pointer transition ${
                        isOpen ? 'bg-[#FDFBF7]' : 'hover:bg-[#FDFBF7]'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#A06126]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {c.name}
                          </span>
                          {contacts.length > 0 && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({contacts.length})
                            </span>
                          )}
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
                            TIER_STYLES[c.tier] 
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
                        {contacts.length}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {fmtDate(c.lastOrderAt)}
                      </td>
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(c)}
                          className="text-[10px] font-semibold text-[#A06126] hover:underline whitespace-nowrap"
                        >
                          View 360 →
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED CONTACTS ROW */}
                    {isOpen && (
                      <tr className="bg-[#FBFAF7]">
                        <td
                          colSpan={9}
                          className="px-0 py-0 overflow-hidden max-w-0"
                        >
                          {contacts.length === 0 ? (
                            <div className="px-6 py-6 text-center text-[11px] italic text-slate-400">
                              No contacts recorded for {c.name}.
                            </div>
                          ) : (
                            <div className="overflow-x-auto w-full">
                              <table
                                className="text-xs"
                                style={{ minWidth: 1720 }}
                              >
                                <thead className="bg-[#F5F1EA]">
                                  <tr className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 text-left">
                                    <th className="px-3 py-2.5 pl-14 w-[80px]">
                                      Status
                                    </th>
                                    <th className="px-3 py-2.5 w-[160px]">
                                      Contact Person
                                    </th>
                                    <th className="px-3 py-2.5 w-[150px]">
                                      Designation
                                    </th>
                                    <th className="px-3 py-2.5 w-[140px]">
                                      Department
                                    </th>
                                    <th className="px-3 py-2.5 w-[200px]">
                                      Official Email
                                    </th>
                                    <th className="px-3 py-2.5 w-[160px]">
                                      Personal Phone
                                    </th>
                                    <th className="px-3 py-2.5 w-[160px]">
                                      Official Phone
                                    </th>
                                    <th className="px-3 py-2.5 w-[140px]">
                                      Area
                                    </th>
                                    <th className="px-3 py-2.5 w-[140px]">
                                      Owner
                                    </th>
                                    <th className="px-3 py-2.5 w-[220px]">
                                      Comments
                                    </th>
                                    <th className="px-3 py-2.5 text-center w-[170px]">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0EBE3]">
                                  {contacts.map((ct, idx) => {
                                    const contactKey = makeContactKey(
                                      c.id,
                                      ct,
                                      idx
                                    );
                                    const isEditing =
                                      editingContactKey === contactKey;
                                    const d = isEditing ? draft : null;

                                    return (
                                      <tr
                                        key={contactKey}
                                        className={
                                          isEditing
                                            ? 'bg-[#FFFBF3]'
                                            : 'bg-white hover:bg-[#FDFBF7]'
                                        }
                                      >
                                        <td className="px-3 py-3 pl-14">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Active
                                          </span>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.name || ''}
                                              onChange={(v) =>
                                                patchDraft('name', v)
                                              }
                                            />
                                          ) : (
                                            <span className="font-medium text-slate-800">
                                              {ct.name || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.designation || ''}
                                              onChange={(v) =>
                                                patchDraft('designation', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600">
                                              {ct.designation || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.department || ''}
                                              onChange={(v) =>
                                                patchDraft('department', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600">
                                              {ct.department || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.email || ''}
                                              onChange={(v) =>
                                                patchDraft('email', v)
                                              }
                                              type="email"
                                            />
                                          ) : (
                                            <span className="text-slate-600">
                                              {ct.email || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.personalPhone || ''}
                                              onChange={(v) =>
                                                patchDraft('personalPhone', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600 font-mono text-[11px]">
                                              {ct.personalPhone || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.phone || ''}
                                              onChange={(v) =>
                                                patchDraft('phone', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600 font-mono text-[11px]">
                                              {ct.phone || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.area || ''}
                                              onChange={(v) =>
                                                patchDraft('area', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600">
                                              {(ct as any).area || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.owner || ''}
                                              onChange={(v) =>
                                                patchDraft('owner', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600">
                                              {(ct as any).owner || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3">
                                          {isEditing ? (
                                            <EditInput
                                              value={d?.notes || ''}
                                              onChange={(v) =>
                                                patchDraft('notes', v)
                                              }
                                            />
                                          ) : (
                                            <span className="text-slate-600 leading-snug">
                                              {ct.notes || '—'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-3 py-3 text-center">
                                          {isEditing ? (
                                            <div className="flex items-center justify-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  saveEditContact(c, ct, idx)
                                                }
                                                disabled={savingContact}
                                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#A06126] text-white text-[10.5px] font-semibold hover:bg-[#88501E] disabled:opacity-60 transition"
                                              >
                                                {savingContact ? (
                                                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                ) : (
                                                  <Save className="w-3 h-3" />
                                                )}
                                                {savingContact
                                                  ? 'Saving…'
                                                  : 'Save'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={cancelEditContact}
                                                disabled={savingContact}
                                                className="h-7 px-2.5 rounded-lg border border-[#E2DBD1] bg-white text-slate-700 text-[10.5px] font-semibold hover:bg-slate-50 disabled:opacity-60 transition"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center gap-1.5">
                                              <IconAction
                                                icon={
                                                  <Pencil className="w-3.5 h-3.5" />
                                                }
                                                color="text-slate-500 hover:text-[#A06126]"
                                                title="Edit contact"
                                                onClick={() =>
                                                  startEditContact(c, ct, idx)
                                                }
                                              />
                                              <IconAction
                                                icon={
                                                  <MessageSquare className="w-3.5 h-3.5" />
                                                }
                                                color="text-blue-500 hover:text-blue-700"
                                                title="Chat"
                                                onClick={() =>
                                                  onChatContact?.(c, ct)
                                                }
                                              />
                                              <IconAction
                                                icon={
                                                  <Mail className="w-3.5 h-3.5" />
                                                }
                                                color="text-slate-500 hover:text-slate-800"
                                                title="Send email"
                                                onClick={() =>
                                                  onEmailContact?.(c, ct)
                                                }
                                              />
                                              <IconAction
                                                icon={
                                                  <Phone className="w-3.5 h-3.5" />
                                                }
                                                color="text-rose-500 hover:text-rose-700"
                                                title="Call"
                                                onClick={() =>
                                                  onCallContact?.(c, ct)
                                                }
                                              />
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ⭐ PAGINATION BAR */}
      {!loading && totalRows > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
          <div className="text-[11px] text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-700">{start + 1}</span>–
            <span className="font-semibold text-slate-700">{end}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalRows}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-[#E2DBD1] bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E2DBD1] bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>

            {(() => {
              const nums: (number | '…')[] = [];
              const maxVisible = 5;
              if (totalPages <= maxVisible + 2) {
                for (let i = 1; i <= totalPages; i++) nums.push(i);
              } else {
                nums.push(1);
                const left = Math.max(2, safePage - 1);
                const right = Math.min(totalPages - 1, safePage + 1);
                if (left > 2) nums.push('…');
                for (let i = left; i <= right; i++) nums.push(i);
                if (right < totalPages - 1) nums.push('…');
                nums.push(totalPages);
              }

              return nums.map((n, i) =>
                n === '…' ? (
                  <span
                    key={`e-${i}`}
                    className="px-1 text-[11px] text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n as number)}
                    className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition ${
                      n === safePage
                        ? 'bg-[#A06126] text-white border-[#A06126]'
                        : 'bg-white text-slate-700 border-[#E2DBD1] hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                )
              );
            })()}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E2DBD1] bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-capture note */}
      <div className="mt-5 rounded-xl border border-[#EBE6DF] bg-[#FFFBF3] px-5 py-4 text-[11px] text-slate-700 leading-relaxed">
        <span className="font-bold">⚡ Auto-capture in effect:</span> a
        company&apos;s group row tagged{' '}
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

function EditInput({
  value,
  onChange,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
      }}
      className="w-full min-w-[110px] rounded-md border border-[#E2DBD1] bg-white px-2.5 py-1.5 text-[11.5px] text-slate-800 focus:outline-none focus:border-[#A06126] focus:ring-1 focus:ring-[#A06126]/40"
    />
  );
}

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

function IconAction({
  icon,
  color,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#E2DBD1] bg-white hover:bg-slate-50 transition ${color}`}
    >
      {icon}
    </button>
  );
}