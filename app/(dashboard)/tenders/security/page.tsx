// app/(dashboard)/tenders/security/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search, ChevronDown, Plus } from "lucide-react";
import { useSecurity } from "@/hooks/tender/useSecurity";
import { toSecurityUIRow, toSecurityStatsTiles } from "@/lib/api/mappers";
import { securityApi, type SecurityType } from "@/lib/api/tender.api";
import { SecurityStats } from "@/components/tender/security/SecurityStats";
import { SecurityTable } from "@/components/tender/security/SecurityTable";
import { UpdatePaymentModal } from "@/components/tender/security/UpdatePaymentModal";
import { PaymentHistoryModal } from "@/components/tender/security/PaymentHistoryModal";
import { AddSecurityModal } from "@/components/tender/security/AddSecurityModal";
import { EditSecurityModal } from "@/components/tender/security/EditSecurityModal";

const ENTITIES = ["NGL-26", "NG-26", "JT"];
const TYPES: SecurityType[] = ["Tender Security", "Performance Security", "Bank Guarantee"];

type MainView = "payments" | "security";

export default function TenderSecurityPage() {
  const [mainView, setMainView] = useState<MainView>("payments");
  const [activeTab, setActiveTab] = useState("all");

  const { rows: rawRows, loading, refetch: refetchRows } = useSecurity({ limit: 200 });

  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await securityApi.stats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats", e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setActiveTab("all");
  }, [mainView]);

  // ✅ Modals state
  const [payRow, setPayRow] = useState<any>(null);
  const [historyRow, setHistoryRow] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // ✅ NEW: Edit Modal State
  const [editingRow, setEditingRow] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allRows = useMemo(() => rawRows.map(toSecurityUIRow), [rawRows]);
  const statTiles = useMemo(() => stats ? toSecurityStatsTiles(stats) : [], [stats]);

  // Payments View Filters
  const paymentRows = useMemo(() => {
    if (activeTab === "all") return allRows;
    if (activeTab === "upcoming") return allRows.filter(r => r.paymentStatus === "Invoiced" || r.paymentStatus === "Part paid");
    if (activeTab === "overdue") return allRows.filter(r => r.isOverdue);
    if (activeTab === "not_invoiced") return allRows.filter(r => r.paymentStatus === "Not invoiced");
    if (activeTab === "ready") return allRows.filter(r => r.paymentStatus === "Paid in full");
    if (activeTab === "closed") return allRows.filter(r => r.paymentStatus === "Closed");
    return allRows;
  }, [allRows, activeTab]);

  const paymentCounts = {
    all: allRows.length,
    upcoming: allRows.filter(r => r.paymentStatus === "Invoiced" || r.paymentStatus === "Part paid").length,
    overdue: allRows.filter(r => r.isOverdue).length,
    notInvoiced: allRows.filter(r => r.paymentStatus === "Not invoiced").length,
    ready: allRows.filter(r => r.paymentStatus === "Paid in full").length,
    closed: allRows.filter(r => r.paymentStatus === "Closed").length,
  };

  // Security View Filters
  const securityRows = useMemo(() => {
    const base = allRows.filter(r => r.paymentStatus === "Not invoiced" || r.type !== "Tender Security");
    if (activeTab === "all") return base;
    if (activeTab === "requested") return base.filter(r => r.docsStatus === "Missing");
    if (activeTab === "overdue_to_arrange") return base.filter(r => r.isOverdue);
    if (activeTab === "upcoming") return base.filter(r => !r.isOverdue);
    if (activeTab === "matured") return base.filter(r => r.isOverdue && r.docsStatus === "Attached");
    if (activeTab === "released") return base.filter(r => r.delivery === "Closed");
    return base;
  }, [allRows, activeTab]);

  const securityCounts = {
    all: allRows.length,
    requested: allRows.filter(r => r.docsStatus === "Missing").length,
    overdue_to_arrange: allRows.filter(r => r.isOverdue).length,
    upcoming: allRows.filter(r => !r.isOverdue).length,
    matured: allRows.filter(r => r.isOverdue && r.docsStatus === "Attached").length,
    released: allRows.filter(r => r.delivery === "Closed").length,
  };

  const handleSavePayment = async (data: any) => {
    if (!payRow) return;
    const loadingId = toast.loading("Recording payment...");
    try {
      await securityApi.recordPayment(payRow.id, data);
      toast.success("Payment recorded successfully", { id: loadingId });
      await refetchRows();
      await fetchStats();
      setPayRow(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save payment", { id: loadingId });
      throw e;
    }
  };

  const handleAddSave = async (data: any) => {
    const loadingId = toast.loading("Creating record...");
    try {
      await securityApi.create(data);
      toast.success("Record created successfully", { id: loadingId });
      await refetchRows();
      await fetchStats();
    } catch (e: any) {
      toast.error(e.message || "Failed to create record", { id: loadingId });
      throw e;
    }
  };

  const handleSaveEdit = async (id: string, data: any) => {
    const loadingId = toast.loading("Updating record...");
    try {
      await securityApi.update(id, data);
      toast.success("Record updated successfully", { id: loadingId });
      await refetchRows();
      await fetchStats();
      setEditingRow(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update record", { id: loadingId });
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(id);
    try {
      await securityApi.remove(id);
      toast.success("Record deleted");
      await refetchRows();
      await fetchStats();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !rawRows.length) {
    return <div className="p-10 text-center animate-pulse">Loading security records...</div>;
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900 font-sans">
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8860b]">TENDER DASHBOARD</p>
            <h1 className="mt-1 text-[28px] font-serif font-bold tracking-tight text-[#1a202c]">Payment &amp; Security</h1>
            <p className="mt-1 max-w-xl text-[13px] text-slate-500 leading-relaxed">
              Track what each tender owes you, and every bank security that is held, due to mature or ready to collect back.
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Security Record
          </button>
        </div>

        <div className="bg-[#f4ebd8] text-[#8a6a2b] text-[11.5px] font-medium px-4 py-2 rounded-md">
          Live data — synced with the database.
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="h-[100px] animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <SecurityStats stats={statTiles as any} />
        )}

        {/* Main Tabs */}
        <div className="flex items-center gap-2 border-b border-transparent">
          <button
            onClick={() => setMainView("payments")}
            className={`px-5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-colors ${mainView === "payments" ? "bg-[#0b172a] text-white" : "bg-[#e8e4d9] text-slate-600 hover:bg-[#ddd8ca]"
              }`}
          >
            Tender payments
          </button>
          <button
            onClick={() => setMainView("security")}
            className={`px-5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-colors ${mainView === "security" ? "bg-[#0b172a] text-white" : "bg-[#e8e4d9] text-slate-600 hover:bg-[#ddd8ca]"
              }`}
          >
            Security &amp; guarantees
          </button>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">

          {/* Filter Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between p-4 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {mainView === "payments" ? (
                [
                  { id: "all", label: "All", count: paymentCounts.all },
                  { id: "upcoming", label: "Upcoming", count: paymentCounts.upcoming },
                  { id: "overdue", label: "Overdue", count: paymentCounts.overdue },
                  { id: "not_invoiced", label: "Not invoiced", count: paymentCounts.notInvoiced },
                  { id: "ready", label: "Paid — ready to close", count: paymentCounts.ready },
                  { id: "closed", label: "Closed", count: paymentCounts.closed },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11.5px] font-semibold transition-colors ${activeTab === t.id
                        ? "bg-[#f4ebd8] border-[#d5b98a] text-[#8a6a2b]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    {t.label}
                    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${activeTab === t.id ? "bg-white text-[#8a6a2b]" : "bg-slate-100 text-slate-500"
                      }`}>
                      {t.count}
                    </span>
                  </button>
                ))
              ) : (
                [
                  { id: "all", label: "All", count: securityCounts.all },
                  { id: "requested", label: "Requested", count: securityCounts.requested },
                  { id: "overdue_to_arrange", label: "Overdue to arrange", count: securityCounts.overdue_to_arrange },
                  { id: "upcoming", label: "Upcoming", count: securityCounts.upcoming },
                  { id: "matured", label: "Matured", count: securityCounts.matured },
                  { id: "released", label: "Released", count: securityCounts.released },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11.5px] font-semibold transition-colors ${activeTab === t.id
                        ? "bg-[#f4ebd8] border-[#d5b98a] text-[#8a6a2b]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    {t.label}
                    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${activeTab === t.id ? "bg-white text-[#8a6a2b]" : "bg-slate-100 text-slate-500"
                      }`}>
                      {t.count}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tender or client"
                  className="h-[34px] w-[220px] rounded border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>

              {mainView === "security" && (
                <button className="inline-flex h-[34px] items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                  All types <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}

              <button className="inline-flex h-[34px] items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                All entities <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Table */}
          <SecurityTable
            rows={mainView === "payments" ? paymentRows : securityRows}
            onRecordPayment={setPayRow}
            onViewHistory={setHistoryRow}
            onEdit={setEditingRow}
            onDelete={handleDelete}
            deletingId={deletingId}
          />

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-white">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Once a tender is paid in full, closing it also closes its order and delivery tracking. Accounts, Sales and Management can update payments.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddSecurityModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSave={handleAddSave}
      />

      <EditSecurityModal
        open={!!editingRow}
        onOpenChange={(o) => !o && setEditingRow(null)}
        row={editingRow}
        onSave={handleSaveEdit}
      />

      <UpdatePaymentModal
        open={!!payRow}
        onOpenChange={(o) => !o && setPayRow(null)}
        row={payRow}
        onSave={handleSavePayment}
      />

      <PaymentHistoryModal
        open={!!historyRow}
        onOpenChange={(o) => !o && setHistoryRow(null)}
        row={historyRow}
      />
    </main>
  );
}