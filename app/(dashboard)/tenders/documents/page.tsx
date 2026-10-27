// app/(dashboard)/tenders/documents/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { DocsHeader } from "@/components/tender/documents/DocsHeader";
import { DocsTabs, type DocsTab } from "@/components/tender/documents/DocsTabs";
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

export default function CompanyDocsPage() {
  const [tab, setTab] = useState<DocsTab>("legal");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocUI | null>(null);
  const [editDoc, setEditDoc] = useState<CompanyDocUI | null>(null);
  const [renewDoc, setRenewDoc] = useState<CompanyDocUI | null>(null);
  const [viewMode, setViewMode] = useState<DocsViewMode>("grid");

  // Work Order Filters State
  const [filters, setFilters] = useState<WorkOrderFilters>({
    search: "",
    sort: "newest",
    value: "all",
    customers: [],
    types: [],
    products: [],
  });

  const { rows, counts, loading, refetch } = useCompanyDocBundle({ category: tab });

  const baseDocs: CompanyDocUI[] = useMemo(() => (Array.isArray(rows) ? rows.map(toCompanyDocUI) : []), [rows]);

  // ✅ DYNAMIC FILTERING LOGIC
  const docs = useMemo(() => {
    if (tab !== "work-orders") return baseDocs;

    let filtered = [...baseDocs];

    // 1. Text Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title?.toLowerCase().includes(q) ||
        d.subtitle?.toLowerCase().includes(q) ||
        (d.products || []).some((p) => p.toLowerCase().includes(q))
      );
    }

    // 2. Multi-Select Filters
    if (filters.customers.length > 0) {
      filtered = filtered.filter((d) => filters.customers.includes(d.customerType || ""));
    }
    if (filters.types.length > 0) {
      filtered = filtered.filter((d) => filters.types.includes(d.workType || ""));
    }
    if (filters.products.length > 0) {
      filtered = filtered.filter((d) =>
        (d.products || []).some((p) => filters.products.includes(p))
      );
    }

    // 3. Value Filter
    if (filters.value !== "all") {
      const val = filters.value === "1lac" ? 100000 : filters.value === "10lac" ? 1000000 : 5000000;
      filtered = filtered.filter((d) => (d.totalValue || 0) >= val);
    }

    // 4. Sort
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!importTargetId || selectedIds.size === 0) return;
    try {
      await companyDocApi.importToTender({ targetTenderId: importTargetId, documentIds: Array.from(selectedIds) });
      const target = targets.find((t) => t.id === importTargetId);
      toast.success(`${selectedIds.size} document${selectedIds.size === 1 ? "" : "s"} imported to ${target?.label ?? "tender"}`);
      setSelectedIds(new Set());
      setImportTargetId(null);
      invalidateBundleCache();
      await refetch();
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
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    }
  };

  const handleDelete = (doc: CompanyDocUI) => {
    confirmToast({
      title: `Delete "${doc.title}"?`,
      description: "This will permanently remove the document and its attached file.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const loadingId = toast.loading("Deleting...");
        try {
          await companyDocApi.remove(doc.id);
          toast.success("Deleted", { id: loadingId });
          invalidateBundleCache();
          await refetch();
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

  const getAddButtonText = () => {
    switch (tab) {
      case "work-orders": return "Add Work Order";
      case "certificates": return "Add Partnership Certificate";
      case "team": return "Add Person / CV";
      case "datasheets": return "Add Datasheet / Brochure";
      case "profiles": return "Add Company Profile";
      default: return "Add Legal Doc";
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <DocsHeader />
        <DocsTabs active={tab} counts={counts} onChange={setTab} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setRenewDoc(null); setEditDoc(null); setAddOpen(true); }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
          >
            <Plus className="h-3.5 w-3.5" /> {getAddButtonText()}
          </button>
        </div>

        {tab === "work-orders" && (
          <DocsFilterBar
            value={filters}
            onChange={setFilters}
            view={viewMode}
            onViewChange={setViewMode}
            category={tab}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ))}
          </div>
        ) : viewMode === "list" && tab === "work-orders" ? (
          <DocsListView
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onAction={handleAction}
            onDelete={handleDelete}
            category={tab}
          />
        ) : (
          <DocsGrid
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onAction={handleAction}
            onDelete={handleDelete}
            category={tab}
          />
        )}

        <ExpiryWarningBanner expiredDocs={expiredDocs} linkedTenderName={linkedTenderName} onRenew={(doc) => { setRenewDoc(doc); setAddOpen(true); }} />
      </div>

      <ImportBar selectedCount={selectedIds.size} targets={targets} value={importTargetId} onChangeTarget={setImportTargetId} onImport={handleImport} />

      <AddDocModal
        open={addOpen}
        onOpenChange={(o) => { setAddOpen(o); if (!o) { setRenewDoc(null); setEditDoc(null); } }}
        category={tab}
        onSubmit={handleCreate}
        renewDoc={renewDoc}
        editDoc={editDoc}
      />

      <ViewDocModal open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)} doc={viewDoc} />
    </main>
  );
}