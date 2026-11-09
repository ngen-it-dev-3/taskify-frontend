'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pencil,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { QuotationApi, type Quotation } from '@/services/quotation.service';
import { confirmToast } from '@/lib/confirmToast';
import toast from 'react-hot-toast';

type SortKey = 'pqNumber' | 'client' | 'updatedAt' | 'grandTotal' | 'crmManager';
type SortDir = 'asc' | 'desc';

/* =========================================================
   ⭐ SortIcon — declared OUTSIDE the component
   ========================================================= */
function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== col) {
    return (
      <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  }
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 text-[#A06126]" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-[#A06126]" />
  );
}

export default function DraftsListTab() {
  const [drafts, setDrafts] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Selection ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ---- Search ----
  const [search, setSearch] = useState('');

  // ---- Sorting ----
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ---- Pagination & Page Size ----
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Fetch
  // ============================================================
  const load = async () => {
    try {
      setLoading(true);
      const res = await QuotationApi.list({ status: 'draft', limit: 100 });
      setDrafts(res.items);
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // Filter + Sort
  // ============================================================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drafts;

    return drafts.filter((item) => {
      const ref = (item.pqNumber || '').toLowerCase();
      const company = (item.client?.company || '').toLowerCase();
      const owner = (item.crmManager || '').toLowerCase();
      return ref.includes(q) || company.includes(q) || owner.includes(q);
    });
  }, [drafts, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortKey) {
        case 'pqNumber':
          aVal = a.pqNumber || '';
          bVal = b.pqNumber || '';
          break;
        case 'client':
          aVal = a.client?.company || '';
          bVal = b.client?.company || '';
          break;
        case 'updatedAt':
          aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        case 'grandTotal':
          aVal = a.totals?.grandTotal || 0;
          bVal = b.totals?.grandTotal || 0;
          break;
        case 'crmManager':
          aVal = a.crmManager || '';
          bVal = b.crmManager || '';
          break;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // ============================================================
  // Pagination
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir, pageSize]);

  // ============================================================
  // Sorting toggle
  // ============================================================
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ============================================================
  // Selection helpers
  // ============================================================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedOnPage = pageRows.filter((r) => selectedIds.has(r.id)).length;
  const allOnPageSelected =
    pageRows.length > 0 && selectedOnPage === pageRows.length;
  const isIndeterminate =
    selectedOnPage > 0 && selectedOnPage < pageRows.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((r) => next.delete(r.id));
      } else {
        pageRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  // ============================================================
  // Delete handlers
  // ============================================================
  const handleDelete = (d: Quotation) => {
    confirmToast({
      title: `Delete draft ${d.pqNumber}?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        const loadingId = toast.loading('Deleting...');
        try {
          await QuotationApi.remove(d.id);
          toast.success('Draft deleted', { id: loadingId });
          await load();
        } catch (e: any) {
          toast.error(e.message || 'Failed to delete', { id: loadingId });
        }
      },
    });
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    confirmToast({
      title: `Delete ${count} draft${count === 1 ? '' : 's'}?`,
      description: 'This action will permanently delete selected drafts.',
      confirmLabel: `Delete ${count}`,
      variant: 'danger',
      onConfirm: async () => {
        const loadingId = toast.loading(`Deleting ${count}...`);
        try {
          await Promise.all(
            Array.from(selectedIds).map((id) => QuotationApi.remove(id))
          );
          toast.success(`${count} draft${count === 1 ? '' : 's'} deleted`, {
            id: loadingId,
          });
          setSelectedIds(new Set());
          await load();
        } catch (e: any) {
          toast.error(e.message || 'Bulk delete failed', { id: loadingId });
        }
      },
    });
  };

  // ============================================================
  // Loading
  // ============================================================
  if (loading) {
    return (
      <div className="mt-5 flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#A06126] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="mt-5 bg-white rounded-xl border border-[#EBE6DF] shadow-xs overflow-hidden">
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#F0EBE3] bg-white">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PQ No., client, or owner..."
            className="w-full pl-9 pr-8 py-1.5 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Bulk Actions + Page Size */}
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium bg-[#FDFBF7] px-2.5 py-1 rounded-md border border-[#E2DBD1]">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete selected
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="hidden sm:inline">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#FDFBF7] border border-[#E2DBD1] text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#A06126]/20 focus:border-[#A06126] cursor-pointer transition-all"
            >
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
              <option value={80}>80 items</option>
              <option value={1000}>All</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#FAF8F5] border-b border-[#EBE6DF] sticky top-0 z-10">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="pl-4 pr-2 py-3.5 w-10">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllOnPage}
                  className="w-4 h-4 rounded border-slate-300 text-[#A06126] focus:ring-[#A06126] cursor-pointer"
                  aria-label="Select all on page"
                />
              </th>

              <th className="px-3 py-3.5 w-12 text-center">#</th>

              <th
                className="px-4 py-3.5 w-[220px] cursor-pointer select-none hover:text-slate-900 group"
                onClick={() => toggleSort('pqNumber')}
              >
                <div className="flex items-center gap-1">
                  <span>PQ No.</span>
                  <SortIcon col="pqNumber" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th
                className="px-4 py-3.5 cursor-pointer select-none hover:text-slate-900 group"
                onClick={() => toggleSort('client')}
              >
                <div className="flex items-center gap-1">
                  <span>Client</span>
                  <SortIcon col="client" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th
                className="px-4 py-3.5 w-[140px] cursor-pointer select-none hover:text-slate-900 group"
                onClick={() => toggleSort('updatedAt')}
              >
                <div className="flex items-center gap-1">
                  <span>Last Edited</span>
                  <SortIcon col="updatedAt" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th
                className="px-4 py-3.5 w-[140px] text-right cursor-pointer select-none hover:text-slate-900 group"
                onClick={() => toggleSort('grandTotal')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Est. Value</span>
                  <SortIcon col="grandTotal" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th
                className="px-4 py-3.5 w-[180px] cursor-pointer select-none hover:text-slate-900 group"
                onClick={() => toggleSort('crmManager')}
              >
                <div className="flex items-center gap-1">
                  <span>Owner</span>
                  <SortIcon col="crmManager" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className="px-4 py-3.5 w-[100px] text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EBE3]">
            {pageRows.map((d, idx) => {
              const isSelected = selectedIds.has(d.id);
              const serial = (safePage - 1) * pageSize + idx + 1;

              return (
                <tr
                  key={d.id}
                  className={`transition-colors duration-150 ${isSelected ? 'bg-[#FAF5EF]' : 'hover:bg-[#FDFBF7]'
                    }`}
                >
                  <td className="pl-4 pr-2 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(d.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#A06126] focus:ring-[#A06126] cursor-pointer"
                      aria-label={`Select ${d.pqNumber}`}
                    />
                  </td>

                  <td className="px-3 py-3 text-center font-mono text-slate-400 font-medium">
                    {serial}
                  </td>

                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {d.pqNumber || '—'}
                  </td>

                  <td
                    className="px-4 py-3 text-slate-700 font-medium max-w-[200px] truncate"
                    title={d.client?.company}
                  >
                    {d.client?.company || '—'}
                  </td>

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {d.updatedAt
                      ? new Date(d.updatedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '—'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    ৳{(d.totals?.grandTotal || 0).toLocaleString()}
                  </td>

                  <td
                    className="px-4 py-3 text-slate-700 max-w-[180px] truncate"
                    title={d.crmManager}
                  >
                    {d.crmManager || '—'}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/crm/quotation-builder/${d.rfqId}`;
                        }}
                        className="p-1.5 rounded-md border border-[#E2DBD1] hover:bg-white hover:text-[#A06126] hover:border-[#A06126] text-slate-600 shadow-2xs transition"
                        title="Continue editing"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        className="p-1.5 rounded-md border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 shadow-2xs transition"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- Empty State ---------- */}
      {sorted.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-xs">
          {search ? (
            <p>
              No drafts match{' '}
              <span className="font-semibold text-slate-700">"{search}"</span>
            </p>
          ) : (
            <p>No drafts in progress.</p>
          )}
        </div>
      )}

      {/* ---------- Pagination ---------- */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0EBE3] bg-[#FAF8F5]">
          <div className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {(safePage - 1) * pageSize + 1}
            </span>
            –
            <span className="font-semibold text-slate-800">
              {Math.min(safePage * pageSize, sorted.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{sorted.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-md border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;

              if (
                totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - safePage) > 1
              ) {
                if (pageNum === 2 && safePage > 3) {
                  return (
                    <span
                      key="dots-left"
                      className="px-1.5 text-slate-400 text-xs select-none"
                    >
                      ...
                    </span>
                  );
                }
                if (pageNum === totalPages - 1 && safePage < totalPages - 2) {
                  return (
                    <span
                      key="dots-right"
                      className="px-1.5 text-slate-400 text-xs select-none"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              }

              const isActive = pageNum === safePage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition ${isActive
                      ? 'bg-[#A06126] text-white shadow-2xs'
                      : 'border border-[#E2DBD1] bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md border border-[#E2DBD1] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}