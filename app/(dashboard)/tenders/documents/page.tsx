// app/(dashboard)/tenders/documents/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Imported from next/navigation
import { Plus, Trash2, CheckSquare, Square, X } from "lucide-react";
import toast from "react-hot-toast";
import { DocsHeader } from "@/components/tender/documents/DocsHeader";
import { DocsGrid } from "@/components/tender/documents/DocsGrid";
import { DocsListView } from "@/components/tender/documents/DocsListView";
import { DocsFilterBar, type DocsViewMode, type WorkOrderFilters } from "@/components/tender/documents/DocsFilterBar";
import { ImportBar, type ImportTarget } from "@/components/tender/documents/ImportBar";
import { ExpiryWarningBanner } from "@/components/tender/documents/ExpiryWarningBanner";
import { companyDocApi, tenderApi } from "@/lib/api/tender.api";
import { toCompanyDocUI, type CompanyDocUI } from "@/lib/api/mappers";
import { AddDocModal } from "@/components/tender/documents/modal/AddDocModal";
import { ViewDocModal } from "@/components/tender/documents/modal/ViewDocModal";
import { confirmToast } from "@/lib/confirmToast";
import { useCompanyDocBundle, invalidateBundleCache } from "@/hooks/tender/useCompanyDocBundle";
import { invalidateTenderOverview } from "@/hooks/tender/useTenderOverview";

let TARGET_CACHE: { data: ImportTarget[]; ts: number } | null = null;
let TARGET_IN_FLIGHT: Promise<ImportTarget[]> | null = null;
const TARGET_TTL_MS = 60_000;

async function loadImportTargets(): Promise<ImportTarget[]> {
  if (TARGET_CACHE && Date.now() - TARGET_CACHE.ts < TARGET_TTL_MS) return TARGET_CACHE.data;
  if (TARGET_IN_FLIGHT) return TARGET_IN_FLIGHT;

  TARGET_IN_FLIGHT = (async () => {
    const res = await tenderApi.list({ includeDrafts: true, limit: 200 });
    const list: ImportTarget[] = (res?.data ?? [])
      .filter((t) => !t.draft)
      .map((t) => ({
        id: t._id,
        label: `${t.tenderer} — ${t.title}`,
        group: t.stage === "potential" ? "Potential" : "Submission",
      }));
    TARGET_CACHE = { data: list, ts: Date.now() };
    TARGET_IN_FLIGHT = null;
    return list;
  })();

  return TARGET_IN_FLIGHT;
}

const DEFAULT_TAB_IDS = ["legal", "profiles", "work-orders", "certificates", "team", "datasheets"];

export default function CompanyDocsPage() {
  const router = useRouter(); // ✅ Initialize router properly

  // ✅ DYNAMIC TABS
  const [tabs, setTabs] = useState<{ id: string; label: string; count: number }[]>([]);
  const [tab, setTab] = useState<string>("legal");
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [loadingTabs, setLoadingTabs] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocUI | null>(null);
  const [editDoc, setEditDoc] = useState<CompanyDocUI | null>(null);
  const [renewDoc, setRenewDoc] = useState<CompanyDocUI | null>(null);
  const [viewMode, setViewMode] = useState<DocsViewMode>("grid");
  const [deletingBulk, setDeletingBulk] = useState(false);

  const [filters, setFilters] = useState<WorkOrderFilters>({
    search: "",
    sort: "newest",
    value: "all",
    customers: [],
    types: [],
    products: [],
  });

  // ✅ Fetch tabs on mount
  const fetchTabs = async () => {
    try {
      const list = await companyDocApi.listCategories();
      setTabs(list);

      // Fall back to the first tab if the current one was deleted
      if (list.length > 0 && !list.find((t: any) => t.id === tab)) {
        setTab(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tabs");
    } finally {
      setLoadingTabs(false);
    }
  };

  useEffect(() => {
    fetchTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ TypeScript fix: cast tab as any for the hook
  const { rows, counts, loading, refetch } = useCompanyDocBundle({ category: tab as any });

  const baseDocs: CompanyDocUI[] = useMemo(() => (Array.isArray(rows) ? rows.map(toCompanyDocUI) : []), [rows]);

  const docs = useMemo(() => {
    if (tab !== "work-orders") return baseDocs;
    let filtered = [...baseDocs];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title?.toLowerCase().includes(q) ||
        d.subtitle?.toLowerCase().includes(q) ||
        (d.products || []).some((p) => p.toLowerCase().includes(q))
      );
    }
    if (filters.customers.length > 0) filtered = filtered.filter((d) => filters.customers.includes(d.customerType || ""));
    if (filters.types.length > 0) filtered = filtered.filter((d) => filters.types.includes(d.workType || ""));
    if (filters.products.length > 0) filtered = filtered.filter((d) => (d.products || []).some((p) => filters.products.includes(p)));
    if (filters.value !== "all") {
      const val = filters.value === "1lac" ? 100000 : filters.value === "10lac" ? 1000000 : 5000000;
      filtered = filtered.filter((d) => (d.totalValue || 0) >= val);
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.issuedOn || 0).getTime();
      const dateB = new Date(b.issuedOn || 0).getTime();
      return filters.sort === "newest" ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [baseDocs, filters, tab]);

  const expiredDocs = useMemo(() => (tab === "certificates" ? docs.filter((d) => d.status === "Expired") : []), [docs, tab]);
  const linkedTenderName = useMemo(() => {
    if (expiredDocs.length === 0) return undefined;
    if (expiredDocs[0].title.toLowerCase().includes("acronis")) return "BPDB Acronis Backup";
    return undefined;
  }, [expiredDocs]);

  const [targets, setTargets] = useState<ImportTarget[]>(TARGET_CACHE?.data ?? []);
  const [importTargetId, setImportTargetId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImportTargets().then((list) => { if (!cancelled) setTargets(list); }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected = docs.length > 0 && selectedIds.size === docs.length;
  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(docs.map((d) => d.id)));
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    confirmToast({
      title: `Delete ${selectedIds.size} document(s)?`,
      description: "This will permanently remove the selected documents.",
      confirmLabel: "Delete All",
      variant: "danger",
      onConfirm: async () => {
        setDeletingBulk(true);
        const loadingId = toast.loading(`Deleting ${selectedIds.size} documents...`);
        try {
          const idsToDelete = Array.from(selectedIds);
          await Promise.all(idsToDelete.map((id) => companyDocApi.remove(id)));
          toast.success("Documents deleted", { id: loadingId });
          setSelectedIds(new Set());
          invalidateBundleCache();
          await refetch();
          fetchTabs();
        } catch (e) {
          toast.error((e as Error).message || "Failed to delete", { id: loadingId });
        } finally {
          setDeletingBulk(false);
        }
      },
    });
  };

  // ✅ CREATE TAB
  const handleCreateTab = async () => {
    if (!newTabName.trim()) return;
    try {
      const newCat = await companyDocApi.createCategory(newTabName.trim());
      toast.success("Tab created");
      setNewTabName("");
      setIsAddingTab(false);
      await fetchTabs();
      setTab(newCat.id);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create tab");
    }
  };

  // ✅ DELETE TAB
  const handleDeleteTab = (id: string, label: string) => {
    confirmToast({
      title: `Delete "${label}" tab?`,
      description: "This will permanently delete this tab AND all documents inside it.",
      confirmLabel: "Delete Tab",
      variant: "danger",
      onConfirm: async () => {
        try {
          await companyDocApi.deleteCategory(id);
          toast.success("Tab deleted");
          await fetchTabs();
          invalidateBundleCache();
        } catch (err) {
          toast.error((err as Error).message || "Failed to delete tab");
        }
      },
    });
  };

  const handleImport = async () => {
    if (!importTargetId || selectedIds.size === 0) return;
    try {
      await companyDocApi.importToTender({
        targetTenderId: importTargetId,
        documentIds: Array.from(selectedIds)
      });

      const target = targets.find((t) => t.id === importTargetId);
      toast.success(`${selectedIds.size} document${selectedIds.size === 1 ? "" : "s"} imported to ${target?.label ?? "tender"}`);

      setSelectedIds(new Set());
      setImportTargetId(null);

      invalidateBundleCache();
      invalidateTenderOverview();
      await refetch();

      // ✅ TypeScript-safe refresh to force Next.js to reload the Submission page
      (router as any).refresh();
    } catch (e) {
      toast.error((e as Error).message || "Import failed");
    }
  };

  const handleCreate = async (payload: any) => {
    try {
      if (renewDoc) {
        await companyDocApi.renewDoc(renewDoc.id, { validityDate: payload.validityDate!, issuedOn: payload.issuedOn });
        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try { await companyDocApi.uploadDocFile(renewDoc.id, payload.file); toast.success("Renewed", { id: loadingId }); }
          catch (e) { toast.error((e as Error).message || "Upload failed", { id: loadingId }); }
        } else { toast.success("Renewed"); }
        setRenewDoc(null);
      } else if (editDoc) {
        await companyDocApi.update(editDoc.id, payload);
        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try { await companyDocApi.uploadDocFile(editDoc.id, payload.file); toast.success("Updated", { id: loadingId }); }
          catch (e) { toast.error((e as Error).message || "Upload failed", { id: loadingId }); }
        } else { toast.success("Updated"); }
        setEditDoc(null);
      } else {
        // ✅ Save to the DYNAMIC tab ID
        const created = await companyDocApi.create({ category: payload.category ?? tab, ...payload });
        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try { await companyDocApi.uploadDocFile(created._id, payload.file); toast.success("Saved", { id: loadingId }); }
          catch (e) { toast.error((e as Error).message || "Upload failed", { id: loadingId }); }
        } else { toast.success("Saved"); }
      }
      setAddOpen(false);
      invalidateBundleCache();
      await refetch();
      fetchTabs();
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    }
  };

  const handleDelete = (doc: CompanyDocUI) => {
    confirmToast({
      title: `Delete "${doc.title}"?`,
      description: "This will permanently remove the document.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const loadingId = toast.loading("Deleting...");
        try {
          await companyDocApi.remove(doc.id);
          toast.success("Deleted", { id: loadingId });
          invalidateBundleCache();
          await refetch();
          fetchTabs();
        } catch (e) {
          toast.error((e as Error).message || "Delete failed", { id: loadingId });
        }
      },
    });
  };

  const handleAction = (doc: CompanyDocUI, action: "view" | "edit" | "renew" = "view") => {
    if (action === "edit") { setEditDoc(doc); setAddOpen(true); }
    else if (action === "renew" || doc.action === "Renew" || doc.action === "Replace") { setRenewDoc(doc); setAddOpen(true); }
    else { setViewDoc(doc); }
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <DocsHeader />

        {/* ✅ DYNAMIC TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            const isDefault = DEFAULT_TAB_IDS.includes(t.id);
            return (
              <div key={t.id} className="group relative flex items-center">
                <button
                  onClick={() => setTab(t.id)}
                  className={`relative inline-flex items-center gap-2 px-3 py-2 text-[12px] font-semibold transition-colors ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {t.label}
                  <span className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? "bg-[#a97400] text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                    {t.count ?? 0}
                  </span>
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />}
                </button>
                {!isDefault && (
                  <button
                    onClick={() => handleDeleteTab(t.id, t.label)}
                    className="hidden group-hover:flex ml-1 h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                    title="Delete Tab"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {isAddingTab ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTab()}
                placeholder="Tab name..."
                className="h-8 w-32 rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-[#a97400]"
              />
              <button onClick={handleCreateTab} className="text-xs font-bold text-[#a97400] hover:underline">Save</button>
              <button onClick={() => setIsAddingTab(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTab(true)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-500 hover:border-[#a97400] hover:text-[#a97400]"
            >
              <Plus className="h-3 w-3" /> Tab
            </button>
          )}
        </div>

        {/* TOOLBAR: Select All, Add Button, Delete Selected */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              disabled={docs.length === 0 || loading}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              {isAllSelected ? <CheckSquare className="h-4 w-4 text-[#a97400]" /> : <Square className="h-4 w-4 text-slate-400" />}
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
            {selectedIds.size > 0 && <span className="text-[11px] font-medium text-slate-500">{selectedIds.size} selected</span>}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={deletingBulk}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingBulk ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
              </button>
            )}
            <button
              onClick={() => { setRenewDoc(null); setEditDoc(null); setAddOpen(true); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white hover:bg-[#8f6100]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Document
            </button>
          </div>
        </div>

        {/* ✅ TypeScript fix: cast tab as any */}
        {tab === "work-orders" && (
          <DocsFilterBar value={filters} onChange={setFilters} view={viewMode} onViewChange={setViewMode} category={tab as any} />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ))}
          </div>
        ) : viewMode === "list" && tab === "work-orders" ? (
          <DocsListView docs={docs} selectedIds={selectedIds} onToggleSelect={toggleSelect} onAction={handleAction} onDelete={handleDelete} category={tab as any} />
        ) : (
          <DocsGrid docs={docs} selectedIds={selectedIds} onToggleSelect={toggleSelect} onAction={handleAction} onDelete={handleDelete} category={tab as any} />
        )}

        <ExpiryWarningBanner expiredDocs={expiredDocs} linkedTenderName={linkedTenderName} onRenew={(doc) => { setRenewDoc(doc); setAddOpen(true); }} />
      </div>

      <ImportBar selectedCount={selectedIds.size} targets={targets} value={importTargetId} onChangeTarget={setImportTargetId} onImport={handleImport} />

      <AddDocModal
        open={addOpen}
        onOpenChange={(o) => { setAddOpen(o); if (!o) { setRenewDoc(null); setEditDoc(null); } }}
        category={tab as any}
        onSubmit={handleCreate}
        renewDoc={renewDoc}
        editDoc={editDoc}
      />

      <ViewDocModal open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)} doc={viewDoc} />
    </main>
  );
}