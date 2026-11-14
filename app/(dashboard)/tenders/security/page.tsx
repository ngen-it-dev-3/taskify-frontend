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
// ✅ নতুন মডাল ইম্পোর্ট করুন (ফাইলটি তৈরি করা থাকলে)
import { SecurityViewModal } from "@/components/tender/security/SecurityViewModal";

const ENTITIES = ["NGL-26", "NG-26", "JT"];

const TYPES: SecurityType[] = [
  "Tender Security",
  "Performance Security",
  "Payments",
];

type MainView = "tender_security" | "performance_security" | "payments";

export default function TenderSecurityPage() {
  const [mainView, setMainView] = useState<MainView>("tender_security");
  const [activeTab, setActiveTab] = useState("all");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState("all");

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

  // Modals state
  const [payRow, setPayRow] = useState<any>(null);
  const [historyRow, setHistoryRow] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // ✅ নতুন স্টেট: Details Modal এর জন্য
  const [viewRow, setViewRow] = useState<any>(null);

  const allRows = useMemo(() => rawRows.map(toSecurityUIRow), [rawRows]);
  const statTiles = useMemo(() => stats ? toSecurityStatsTiles(stats) : [], [stats]);

  // ✅ Search & Filters
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      const rowData = r as any;

      const searchString = `
        ${rowData.clientDescription || ""} 
        ${rowData.invoiceNo || ""} 
        ${rowData.entity || ""} 
        ${rowData.id || ""}
      `.toLowerCase();

      const matchesSearch = searchString.includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || String(rowData.type).toLowerCase() === selectedType.toLowerCase();
      const matchesEntity = selectedEntity === "all" || String(rowData.entity).toLowerCase() === selectedEntity.toLowerCase();

      return matchesSearch && matchesType && matchesEntity;
    });
  }, [allRows, searchQuery, selectedType, selectedEntity]);

  const checkIsOverdue = (row: any) => {
    if (row.isOverdue) return true;
    if (row.dueDate && row.dueDate !== "-" && row.dueDate !== "N/A") {
      const dueDateObj = new Date(row.dueDate);
      if (!isNaN(dueDateObj.getTime())) {
        const today = new Date();
        dueDateObj.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (dueDateObj < today) return true;
      }
    }
    return false;
  };

  // ==========================================
  // 💰 PAYMENTS LOGIC
  // ==========================================
  const paymentBaseRows = useMemo(() => {
    return filteredRows.filter(r => String(r.type) === "Payments");
  }, [filteredRows]);

  const paymentRows = useMemo(() => {
    if (activeTab === "all") return paymentBaseRows;
    if (activeTab === "upcoming") return paymentBaseRows.filter(r => r.paymentStatus === "Invoiced" || r.paymentStatus === "Part paid");
    if (activeTab === "overdue") return paymentBaseRows.filter(r => checkIsOverdue(r));
    if (activeTab === "not_invoiced") return paymentBaseRows.filter(r => r.paymentStatus === "Not invoiced");
    if (activeTab === "ready") return paymentBaseRows.filter(r => r.paymentStatus === "Paid in full");
    if (activeTab === "closed") return paymentBaseRows.filter(r => r.paymentStatus === "Closed");
    return paymentBaseRows;
  }, [paymentBaseRows, activeTab]);

  const paymentCounts = {
    all: paymentBaseRows.length,
    upcoming: paymentBaseRows.filter(r => r.paymentStatus === "Invoiced" || r.paymentStatus === "Part paid").length,
    overdue: paymentBaseRows.filter(r => checkIsOverdue(r)).length,
    notInvoiced: paymentBaseRows.filter(r => r.paymentStatus === "Not invoiced").length,
    ready: paymentBaseRows.filter(r => r.paymentStatus === "Paid in full").length,
    closed: paymentBaseRows.filter(r => r.paymentStatus === "Closed").length,
  };

  // ==========================================
  // 🛡️ TENDER SECURITY LOGIC
  // ==========================================
  const tenderSecurityBaseRows = useMemo(() => {
    return filteredRows.filter(r => String(r.type) === "Tender Security");
  }, [filteredRows]);

  const tenderSecurityRows = useMemo(() => {
    if (activeTab === "all") return tenderSecurityBaseRows;
    if (activeTab === "requested") return tenderSecurityBaseRows.filter(r => r.docsStatus === "Missing");
    if (activeTab === "overdue_to_arrange") return tenderSecurityBaseRows.filter(r => checkIsOverdue(r));
    if (activeTab === "upcoming") return tenderSecurityBaseRows.filter(r => !checkIsOverdue(r));
    if (activeTab === "matured") return tenderSecurityBaseRows.filter(r => checkIsOverdue(r));
    if (activeTab === "released") return tenderSecurityBaseRows.filter(r => r.delivery === "Closed" || r.delivery === "Delivered");
    return tenderSecurityBaseRows;
  }, [tenderSecurityBaseRows, activeTab]);

  // ==========================================
  // 🛡️ PERFORMANCE SECURITY LOGIC
  // ==========================================
  const performanceSecurityBaseRows = useMemo(() => {
    return filteredRows.filter(r => String(r.type) === "Performance Security");
  }, [filteredRows]);

  const performanceSecurityRows = useMemo(() => {
    if (activeTab === "all") return performanceSecurityBaseRows;
    if (activeTab === "requested") return performanceSecurityBaseRows.filter(r => r.docsStatus === "Missing");
    if (activeTab === "overdue_to_arrange") return performanceSecurityBaseRows.filter(r => checkIsOverdue(r));
    if (activeTab === "upcoming") return performanceSecurityBaseRows.filter(r => !checkIsOverdue(r));
    if (activeTab === "matured") return performanceSecurityBaseRows.filter(r => checkIsOverdue(r));
    if (activeTab === "released") return performanceSecurityBaseRows.filter(r => r.delivery === "Closed" || r.delivery === "Delivered");
    return performanceSecurityBaseRows;
  }, [performanceSecurityBaseRows, activeTab]);

  // Counts (Tender Security)
  const tenderSecurityCounts = {
    all: tenderSecurityBaseRows.length,
    requested: tenderSecurityBaseRows.filter(r => r.docsStatus === "Missing").length,
    overdue_to_arrange: tenderSecurityBaseRows.filter(r => checkIsOverdue(r)).length,
    upcoming: tenderSecurityBaseRows.filter(r => !checkIsOverdue(r)).length,
    matured: tenderSecurityBaseRows.filter(r => checkIsOverdue(r)).length,
    released: tenderSecurityBaseRows.filter(r => r.delivery === "Closed" || r.delivery === "Delivered").length,
  };

  // Counts (Performance Security)
  const performanceSecurityCounts = {
    all: performanceSecurityBaseRows.length,
    requested: performanceSecurityBaseRows.filter(r => r.docsStatus === "Missing").length,
    overdue_to_arrange: performanceSecurityBaseRows.filter(r => checkIsOverdue(r)).length,
    upcoming: performanceSecurityBaseRows.filter(r => !checkIsOverdue(r)).length,
    matured: performanceSecurityBaseRows.filter(r => checkIsOverdue(r)).length,
    released: performanceSecurityBaseRows.filter(r => r.delivery === "Closed" || r.delivery === "Delivered").length,
  };

  // ==========================================
  // Actions
  // ==========================================
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

  const handleAddSave = async (formData: FormData) => {
    const loadingId = toast.loading("Creating record...");
    try {
      await securityApi.create(formData);
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

        {/* ✅ Main Tabs (৩টি ট্যাব) */}
        <div className="flex items-center gap-2 border-b border-transparent mb-0 ms-2 overflow-x-auto">
          <button
            onClick={() => {
              setMainView("tender_security");
              setActiveTab("all");
              setSearchQuery("");
              setSelectedType("all");
              setSelectedEntity("all");
            }}
            className={`whitespace-nowrap px-5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-colors ${mainView === "tender_security" ? "bg-[#0b172a] text-white" : "bg-[#e8e4d9] text-slate-600 hover:bg-[#ddd8ca]"}`}
          >
            Tender Security
          </button>
          
          <button
            onClick={() => {
              setMainView("performance_security");
              setActiveTab("all");
              setSearchQuery("");
              setSelectedType("all");
              setSelectedEntity("all");
            }}
            className={`whitespace-nowrap px-5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-colors ${mainView === "performance_security" ? "bg-[#0b172a] text-white" : "bg-[#e8e4d9] text-slate-600 hover:bg-[#ddd8ca]"}`}
          >
            Performance Security
          </button>

          <button
            onClick={() => {
              setMainView("payments");
              setActiveTab("all");
              setSearchQuery("");
              setSelectedType("all");
              setSelectedEntity("all");
            }}
            className={`whitespace-nowrap px-5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-colors ${mainView === "payments" ? "bg-[#0b172a] text-white" : "bg-[#e8e4d9] text-slate-600 hover:bg-[#ddd8ca]"}`}
          >
            Payments
          </button>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">

          {/* Filter Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between p-4 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tender Security এবং Performance Security এর জন্য ফিল্টার */}
              {mainView !== "payments" ? (
                [
                  { id: "all", label: "All", count: mainView === "tender_security" ? tenderSecurityCounts.all : performanceSecurityCounts.all },
                  { id: "requested", label: "Requested", count: mainView === "tender_security" ? tenderSecurityCounts.requested : performanceSecurityCounts.requested },
                  { id: "overdue_to_arrange", label: "Overdue to arrange", count: mainView === "tender_security" ? tenderSecurityCounts.overdue_to_arrange : performanceSecurityCounts.overdue_to_arrange },
                  { id: "upcoming", label: "Upcoming", count: mainView === "tender_security" ? tenderSecurityCounts.upcoming : performanceSecurityCounts.upcoming },
                  { id: "matured", label: "Matured", count: mainView === "tender_security" ? tenderSecurityCounts.matured : performanceSecurityCounts.matured },
                  { id: "released", label: "Released", count: mainView === "tender_security" ? tenderSecurityCounts.released : performanceSecurityCounts.released },
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
                    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${activeTab === t.id ? "bg-white text-[#8a6a2b]" : "bg-slate-100 text-slate-500"}`}>
                      {t.count}
                    </span>
                  </button>
                ))
              ) : (
                // Payments এর জন্য ফিল্টার
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
                    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${activeTab === t.id ? "bg-white text-[#8a6a2b]" : "bg-slate-100 text-slate-500"}`}>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-[34px] w-[220px] rounded border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>

              {/* Entity Filter */}
              <div className="relative">
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="inline-flex h-[34px] items-center justify-between gap-3 rounded border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-medium text-slate-700 hover:bg-slate-50 appearance-none focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="all">All entities</option>
                  {ENTITIES.map((entity) => (
                    <option key={entity} value={entity}>{entity}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <SecurityTable
            rows={
              mainView === "payments" ? paymentRows : 
              mainView === "tender_security" ? tenderSecurityRows : 
              performanceSecurityRows
            }
            onRecordPayment={setPayRow}
            onViewHistory={setHistoryRow}
            onEdit={setEditingRow}
            onDelete={handleDelete}
            onViewDetails={setViewRow} // ✅ এই লাইনটি যোগ করা হলো
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

      {/* ✅ নতুন View Modal */}
      <SecurityViewModal
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        row={viewRow}
      />
    </main>
  );
}