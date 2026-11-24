"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ClipboardList,
  Plus,
  Download,
  Loader2,
  Trash2,
  Search,
  Eye,
  Printer,
  FileText,
  FileSpreadsheet,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Calendar,
  Filter,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  HrDocumentCategory,
  HrDocumentItem,
  fetchHrDocuments,
  deleteHrDocumentTemplate,
  formatUpdatedMonthYear,
} from "@/lib/hrDocuments";
import { UploadTemplateModal } from "./HrDocumentModals";

interface ExtendedHrDocumentItem extends HrDocumentItem {
  fileUrl?: string;
  previewUrl?: string;
}

const DEFAULT_FALLBACK_TEMPLATES: ExtendedHrDocumentItem[] = [
  {
    _id: "sample-form-1",
    title: "Leave Application Form",
    description:
      "Standard employee annual, casual, and sick leave request template",
    category: "form",
    fileName: "Leave_Application_Form.xlsx",
    fileExt: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 18432,
    version: "1.0",
    isActive: true,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    _id: "sample-form-2",
    title: "Reimbursement / Expense Claim",
    description: "Travel, meal, and work expense claim sheet",
    category: "form",
    fileName: "Reimbursement_Expense_Claim.xlsx",
    fileExt: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 22528,
    version: "1.0",
    isActive: true,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  },
  {
    _id: "sample-form-3",
    title: "Exit Interview Form",
    description: "Offboarding feedback and clearance form",
    category: "form",
    fileName: "Exit_Interview_Form.xlsx",
    fileExt: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 15360,
    version: "1.0",
    isActive: true,
    createdAt: "2025-06-05T00:00:00.000Z",
    updatedAt: "2025-06-20T00:00:00.000Z",
  },
  {
    _id: "sample-form-4",
    title: "Asset Issuance Form",
    description: "Hardware and equipment handover acknowledgment",
    category: "form",
    fileName: "Asset_Issuance_Form.xlsx",
    fileExt: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 17408,
    version: "1.0",
    isActive: true,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z",
  },
  {
    _id: "sample-policy-1",
    title: "Employee Code of Conduct",
    description: "Workplace ethics, conduct, and compliance policy",
    category: "policy",
    fileName: "Employee_Code_of_Conduct.pdf",
    fileExt: ".pdf",
    mimeType: "application/pdf",
    fileSize: 245760,
    version: "2.0",
    isActive: true,
    createdAt: "2026-01-05T00:00:00.000Z",
    updatedAt: "2026-01-25T00:00:00.000Z",
  },
  {
    _id: "sample-policy-2",
    title: "Leave & Attendance Policy",
    description: "Annual, sick, and casual leave entitlements",
    category: "policy",
    fileName: "Leave_Attendance_Policy.pdf",
    fileExt: ".pdf",
    mimeType: "application/pdf",
    fileSize: 196608,
    version: "1.4",
    isActive: true,
    createdAt: "2026-02-10T00:00:00.000Z",
    updatedAt: "2026-02-22T00:00:00.000Z",
  },
];

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileStyle(ext: string) {
  const normalized = ext.toLowerCase();
  if (normalized.includes("pdf")) {
    return {
      icon: FileText,
      bg: "bg-rose-50",
      border: "border-rose-200/80",
      text: "text-rose-600",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      label: "PDF",
    };
  }
  if (normalized.includes("xls") || normalized.includes("csv")) {
    return {
      icon: FileSpreadsheet,
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Excel",
    };
  }
  if (normalized.includes("doc")) {
    return {
      icon: FileText,
      bg: "bg-sky-50",
      border: "border-sky-200/80",
      text: "text-sky-600",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      label: "Word",
    };
  }
  return {
    icon: ClipboardList,
    bg: "bg-[#FAF5EB]",
    border: "border-[#EFE5D1]",
    text: "text-[#5C4033]",
    badgeBg: "bg-[#FAF5EB] text-[#5C4033] border-[#EFE5D1]",
    label: normalized.replace(".", "").toUpperCase() || "File",
  };
}

const getAbsoluteFileUrl = (fileUrl?: string, fallbackId?: string) => {
  const baseApi =
    process.env.NEXT_PUBLIC_API_URL || "https://taskify-server-5gat.onrender.com/api/v1";

  if (!fileUrl) {
    const cleanApi = baseApi.replace(/\/+$/, "");
    return fallbackId ? `${cleanApi}/hr-documents/${fallbackId}/preview` : null;
  }

  if (fileUrl.startsWith("http")) return fileUrl;

  const origin = baseApi.replace(/\/api\/v1\/?$/, "");

  if (fileUrl.startsWith("/uploads")) {
    return `${origin}${fileUrl}`;
  }

  return `${origin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

export default function HrFormsPoliciesSection() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<HrDocumentCategory>("form");
  const [allCounts, setAllCounts] = useState<{ form: number; policy: number }>({
    form: 0,
    policy: 0,
  });
  const [documents, setDocuments] = useState<ExtendedHrDocumentItem[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<
    "all" | "pdf" | "excel" | "word"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] =
    useState<ExtendedHrDocumentItem | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExtendedHrDocumentItem | null>(
    null
  );
  const [previewDoc, setPreviewDoc] = useState<ExtendedHrDocumentItem | null>(
    null
  );

  const canManageTemplates =
    user?.role === "hr_manager" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const [currentItems, formItems, policyItems] = await Promise.all([
        fetchHrDocuments({ category: activeTab }),
        fetchHrDocuments({ category: "form" }).catch(() => []),
        fetchHrDocuments({ category: "policy" }).catch(() => []),
      ]);

      setDocuments(currentItems);
      setAllCounts({
        form: formItems.length,
        policy: policyItems.length,
      });
      setUsingFallback(false);
    } catch {
      const fallbackForTab = DEFAULT_FALLBACK_TEMPLATES.filter(
        (item) => item.category === activeTab
      );
      setDocuments(fallbackForTab);
      setAllCounts({
        form: DEFAULT_FALLBACK_TEMPLATES.filter((i) => i.category === "form")
          .length,
        policy: DEFAULT_FALLBACK_TEMPLATES.filter(
          (i) => i.category === "policy"
        ).length,
      });
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    } else {
      setDocuments(
        DEFAULT_FALLBACK_TEMPLATES.filter((item) => item.category === activeTab)
      );
      setUsingFallback(true);
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, loadDocuments]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q)) ||
        doc.fileName.toLowerCase().includes(q);

      const ext = (doc.fileExt || doc.fileName || "").toLowerCase();
      let matchesType = true;
      if (fileTypeFilter === "pdf") matchesType = ext.includes("pdf");
      if (fileTypeFilter === "excel")
        matchesType = ext.includes("xls") || ext.includes("csv");
      if (fileTypeFilter === "word") matchesType = ext.includes("doc");

      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, fileTypeFilter]);

  const handleDownload = async (doc: ExtendedHrDocumentItem) => {
    if (usingFallback || doc._id.startsWith("sample-")) {
      toast.error(
        "Sample template preview. Upload a real template first to download."
      );
      return;
    }

    try {
      setDownloadingId(doc._id);

      const fileUrl = getAbsoluteFileUrl(doc.fileUrl, doc._id);
      if (!fileUrl) throw new Error("File URL not found");

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName || `document-${doc._id}`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloading ${doc.fileName}...`);
    } catch (error: any) {
      console.error("Download Error:", error);
      toast.error("Failed to download. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = async (doc: ExtendedHrDocumentItem) => {
    if (usingFallback || doc._id.startsWith("sample-")) {
      toast.error("Cannot print sample templates.");
      return;
    }

    try {
      toast.loading("Preparing document for print...", { id: "print-loader" });

      const fileUrl = getAbsoluteFileUrl(doc.fileUrl, doc._id);
      if (!fileUrl) throw new Error("File URL not found");

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const printWindow = window.open(url, "_blank");
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups to print.", {
          id: "print-loader",
        });
        return;
      }

      printWindow.onload = () => {
        toast.dismiss("print-loader");
        printWindow.print();
      };
    } catch (error) {
      console.error("Print Error:", error);
      toast.error("Failed to prepare print document.", { id: "print-loader" });
    }
  };

  const handleOpenEditModal = (doc: ExtendedHrDocumentItem) => {
    if (usingFallback || doc._id.startsWith("sample-")) {
      toast.error(
        "Sample templates cannot be edited. Upload a real template first."
      );
      return;
    }
    setEditingDoc(doc);
    setShowUploadModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDoc) return;
    const doc = confirmDeleteDoc;
    if (usingFallback || doc._id.startsWith("sample-")) return;

    try {
      setDeletingId(doc._id);
      await deleteHrDocumentTemplate(doc._id);
      toast.success(`"${doc.title}" removed successfully.`);
      setConfirmDeleteDoc(null);
      if (previewDoc?._id === doc._id) setPreviewDoc(null);
      await loadDocuments();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to remove template."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2.5 py-0.5 rounded bg-[#EFECE6] text-[#6E655B] text-[10px] font-bold uppercase tracking-wider">
            HR Documentation
          </span>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#1E1E1E] tracking-tight">
            Forms &amp; Policies
          </h1>
          <p className="text-xs sm:text-[13px] text-[#6E6A63] max-w-2xl leading-relaxed">
            Centralized repository for official employee forms, operational
            templates, compliance handbooks, and company policy documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!canManageTemplates && isAuthenticated) {
                toast.error(
                  "Only HR Manager, Admin, or Super Admin can upload templates."
                );
                return;
              }
              setEditingDoc(null);
              setShowUploadModal(true);
            }}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5C4033] hover:bg-[#4A3328] text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>
              {activeTab === "policy" ? "Add Policy" : "Add Form Template"}
            </span>
          </button>
        </div>
      </div>

      {/* Preview Mode Banner */}
      {usingFallback && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Sample Preview Mode:</strong> Showing sample HR templates.
            Upload real templates to enable live preview, PDF export, and
            downloads.
          </span>
        </div>
      )}

      {/* 2. TABS BAR */}
      <div className="border-b border-[#EAE4D7] flex items-center gap-7">
        <button
          type="button"
          onClick={() => {
            setActiveTab("form");
            setFileTypeFilter("all");
          }}
          className={`cursor-pointer pb-3 text-sm transition-colors relative flex items-center gap-2 ${activeTab === "form"
              ? "text-[#1E1E1E] font-semibold border-b-2 border-[#5C4033] -mb-px"
              : "text-[#8A8478] hover:text-[#3A3732] font-medium"
            }`}
        >
          <span>Forms &amp; Templates</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${activeTab === "form"
                ? "bg-[#5C4033] text-white"
                : "bg-[#EFECE6] text-[#6E6A63]"
              }`}
          >
            {allCounts.form}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("policy");
            setFileTypeFilter("all");
          }}
          className={`cursor-pointer pb-3 text-sm transition-colors relative flex items-center gap-2 ${activeTab === "policy"
              ? "text-[#1E1E1E] font-semibold border-b-2 border-[#5C4033] -mb-px"
              : "text-[#8A8478] hover:text-[#3A3732] font-medium"
            }`}
        >
          <span>Company Policies</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${activeTab === "policy"
                ? "bg-[#5C4033] text-white"
                : "bg-[#EFECE6] text-[#6E6A63]"
              }`}
          >
            {allCounts.policy}
          </span>
        </button>
      </div>

      {/* 3. SEARCH, FILTER & RECORDS COUNT TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#9A9488] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or file name..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E5DFD3] rounded-lg text-[#1E1E1E] placeholder:text-[#9A9488] focus:outline-none focus:border-[#5C4033] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8478] hover:text-[#1E1E1E]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center bg-white p-1 rounded-lg border border-[#E5DFD3] shadow-2xs">
            {(["all", "pdf", "excel", "word"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFileTypeFilter(type)}
                className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all ${fileTypeFilter === type
                    ? "bg-[#5C4033] text-white font-semibold"
                    : "text-[#6E6A63] hover:text-[#1E1E1E]"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#7D786E] font-medium">
            <Filter className="w-3.5 h-3.5 text-[#9A9488]" />
            <span>
              {filteredDocuments.length}{" "}
              {filteredDocuments.length === 1 ? "record" : "records"} found
            </span>
          </div>

          <div className="flex items-center bg-white p-1 rounded-lg border border-[#E5DFD3] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`cursor-pointer p-1.5 rounded-md transition-all ${viewMode === "table"
                  ? "bg-[#FAF5EB] text-[#5C4033]"
                  : "text-[#8A8478] hover:text-[#1E1E1E]"
                }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
              className={`cursor-pointer p-1.5 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-[#FAF5EB] text-[#5C4033]"
                  : "text-[#8A8478] hover:text-[#1E1E1E]"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT LISTING */}
      {loading ? (
        <div className="bg-white border border-[#EAE4D7] rounded-xl p-14 flex flex-col items-center justify-center text-center shadow-2xs">
          <Loader2 className="w-7 h-7 animate-spin text-[#5C4033] mb-2.5" />
          <p className="text-xs text-[#6E6A63] font-medium">
            Loading {activeTab === "policy" ? "policies" : "forms"}...
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border border-[#EAE4D7] rounded-xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-[#FAF5EB] border border-[#EFE6D2] flex items-center justify-center mx-auto text-[#5C4033]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1E1E1E]">
              {searchQuery || fileTypeFilter !== "all"
                ? "No matching records found"
                : `No ${activeTab === "policy" ? "policies" : "forms"} available yet`}
            </h3>
            <p className="text-xs text-[#7D786E] mt-1 max-w-sm mx-auto">
              {searchQuery || fileTypeFilter !== "all"
                ? "Try clearing your search input or resetting the format filter."
                : "Click the Add button at the top right to upload your first template."}
            </p>
          </div>
          {(searchQuery || fileTypeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFileTypeFilter("all");
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#EAE4D7] text-xs font-medium text-[#4A4640] hover:bg-[#FAF8F5]"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-[#E6E0D5] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                  <th className="py-3.5 px-5">Document / Template</th>
                  <th className="py-3.5 px-4">Category / Format</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Updated Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3] text-xs">
                {filteredDocuments.map((doc) => {
                  const extLabel =
                    doc.fileExt ||
                    (doc.fileName
                      ? `.${doc.fileName.split(".").pop()?.toLowerCase()}`
                      : ".xlsx");
                  const fileStyle = getFileStyle(extLabel);
                  const FileIcon = fileStyle.icon;

                  return (
                    <tr
                      key={doc._id}
                      onClick={() => setPreviewDoc(doc)}
                      className="group cursor-pointer hover:bg-[#FCFBF8] transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-lg ${fileStyle.bg} border ${fileStyle.border} flex items-center justify-center ${fileStyle.text} shrink-0`}
                          >
                            <FileIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[#1E1E1E] group-hover:text-[#5C4033] transition-colors">
                              {doc.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#8A8478]">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-[#F5F2EB] text-[#6E6A63] rounded font-medium">
                                v{doc.version || "1.0"}
                              </span>
                              {doc.description && (
                                <>
                                  <span className="hidden md:inline">•</span>
                                  <span className="hidden md:inline truncate max-w-[240px]">
                                    {doc.description}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md border border-[#E5DFD3] bg-[#FAF8F5] text-[#4A4640] text-[11px] font-medium capitalize">
                            {doc.category === "policy" ? "Policy" : "HR Form"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-md border text-[11px] font-semibold ${fileStyle.badgeBg}`}
                          >
                            {fileStyle.label}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Active
                        </span>
                      </td>

                      <td className="py-4 px-4 text-[#5A554E] font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#9A9488]" />
                          <span>
                            {formatUpdatedMonthYear(
                              doc.updatedAt || doc.createdAt
                            )}
                          </span>
                        </div>
                      </td>

                      <td
                        className="py-4 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            title="View & Print Preview"
                            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#FAF5EB] hover:border-[#5C4033] text-[#1E1E1E] font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#5C4033]" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc._id}
                            title="Download Template"
                            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5C4033] hover:bg-[#4A3328] text-white font-medium transition-colors disabled:opacity-50"
                          >
                            {downloadingId === doc._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Download</span>
                          </button>

                          {canManageTemplates &&
                            !usingFallback &&
                            !doc._id.startsWith("sample-") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(doc)}
                                  title="Edit Template"
                                  className="cursor-pointer p-1.5 rounded-lg text-gray-500 hover:text-[#5C4033] hover:bg-[#FAF5EB] transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteDoc(doc)}
                                  title="Delete Template"
                                  className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const extLabel =
              doc.fileExt ||
              (doc.fileName
                ? `.${doc.fileName.split(".").pop()?.toLowerCase()}`
                : ".xlsx");
            const fileStyle = getFileStyle(extLabel);
            const FileIcon = fileStyle.icon;
            const updatedLabel = formatUpdatedMonthYear(
              doc.updatedAt || doc.createdAt
            );

            return (
              <div
                key={doc._id}
                onClick={() => setPreviewDoc(doc)}
                className="group cursor-pointer bg-white border border-[#EAE4D7] hover:border-[#5C4033]/50 rounded-xl p-5 flex flex-col justify-between transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl ${fileStyle.bg} border ${fileStyle.border} flex items-center justify-center ${fileStyle.text} shrink-0`}
                      >
                        <FileIcon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border ${fileStyle.badgeBg}`}
                        >
                          {fileStyle.label}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#FAF8F5] text-[#6E6A63] border border-[#EAE4D7]">
                          v{doc.version || "1.0"}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        title="Preview Document"
                        className="cursor-pointer p-1.5 rounded-lg text-[#8A8478] hover:text-[#5C4033] hover:bg-[#FAF5EB] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canManageTemplates &&
                        !usingFallback &&
                        !doc._id.startsWith("sample-") && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(doc)}
                              title="Edit template"
                              className="cursor-pointer p-1.5 rounded-lg text-gray-500 hover:text-[#5C4033] hover:bg-[#FAF5EB] transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDoc(doc)}
                              title="Remove template"
                              className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  <h3 className="mt-3.5 text-sm font-bold text-[#1E1E1E] group-hover:text-[#5C4033] transition-colors leading-snug">
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="mt-1 text-xs text-[#6E6A63] line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <p className="mt-3 text-[11px] text-[#8A8478]">
                    {formatFileSize(doc.fileSize)} · Updated {updatedLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. SPLIT-PANEL DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          isFallback={usingFallback || previewDoc._id.startsWith("sample-")}
          isDownloading={downloadingId === previewDoc._id}
          canEdit={
            canManageTemplates &&
            !usingFallback &&
            !previewDoc._id.startsWith("sample-")
          }
          canDelete={
            canManageTemplates &&
            !usingFallback &&
            !previewDoc._id.startsWith("sample-")
          }
          onClose={() => setPreviewDoc(null)}
          onEdit={() => {
            const target = previewDoc;
            setPreviewDoc(null);
            handleOpenEditModal(target);
          }}
          onDownloadOriginal={() => handleDownload(previewDoc)}
          onPrint={() => handlePrint(previewDoc)}
          onDelete={() => setConfirmDeleteDoc(previewDoc)}
        />
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white border border-[#EAE4D7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E1E1E]">
                  Remove Template?
                </h3>
                <p className="text-xs text-[#6E6A63] mt-1 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#1E1E1E]">
                    &quot;{confirmDeleteDoc.title}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(null)}
                disabled={Boolean(deletingId)}
                className="cursor-pointer px-4 py-2 rounded-lg border border-[#EAE4D7] text-xs font-semibold text-[#4A4640] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="cursor-pointer px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {deletingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. UPLOAD / EDIT TEMPLATE MODAL */}
      <UploadTemplateModal
        isOpen={showUploadModal}
        defaultCategory={activeTab}
        editDocument={editingDoc}
        onClose={() => {
          setShowUploadModal(false);
          setEditingDoc(null);
        }}
        onSuccess={() => {
          setEditingDoc(null);
          loadDocuments();
        }}
      />
    </div>
  );
}

/* ============================================================================
   SPLIT-PANEL PREVIEW MODAL (Edit, Print & PDF Download)
   ============================================================================ */
interface DocumentPreviewModalProps {
  document: ExtendedHrDocumentItem;
  isFallback: boolean;
  isDownloading: boolean;
  canEdit?: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDownloadOriginal: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

function DocumentPreviewModal({
  document: doc,
  isFallback,
  isDownloading,
  canEdit,
  canDelete,
  onClose,
  onEdit,
  onDownloadOriginal,
  onPrint,
  onDelete,
}: DocumentPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const ext = (doc.fileExt || doc.fileName || "").toLowerCase();
  const isPdf = ext.includes("pdf") || doc.mimeType === "application/pdf";
  const isImage =
    doc.mimeType?.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((e) => ext.endsWith(e));

  const fileStyle = getFileStyle(ext);
  const FileIcon = fileStyle.icon;

  const resolvedPreviewUrl = useMemo(() => {
    if (isFallback) return null;
    return getAbsoluteFileUrl(doc.previewUrl || doc.fileUrl, doc._id);
  }, [doc, isFallback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveAsPdf = () => {
    if (isPdf) {
      onDownloadOriginal();
      return;
    }
    toast("Print dialog opening — select 'Save as PDF' as destination.", {
      icon: "📄",
    });
    onPrint();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-white border-b border-[#EAE4D7] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${fileStyle.bg} border ${fileStyle.border} flex items-center justify-center ${fileStyle.text} shrink-0`}
            >
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E1E1E] truncate">
                {doc.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#7D786E]">
                <span className="px-2 py-0.5 rounded bg-[#F5F2EB] text-[#4A4640] font-medium capitalize">
                  {doc.category === "policy" ? "Company Policy" : "HR Form"}
                </span>
                <span>•</span>
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>v{doc.version || "1.0"}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="cursor-pointer p-2 rounded-lg text-[#7D786E] hover:text-[#1E1E1E] hover:bg-[#F5F2EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-[430px]">
          <div className="lg:col-span-8 bg-[#F4F7FB] border-b lg:border-b-0 lg:border-r border-[#EAE4D7] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[360px]">
            {isPdf && resolvedPreviewUrl ? (
              <iframe
                ref={iframeRef}
                src={`${resolvedPreviewUrl}#toolbar=1&navpanes=0`}
                title={doc.title}
                className="w-full h-[58vh] rounded-xl border border-[#DCE3EC] bg-white shadow-xs"
              />
            ) : isImage && resolvedPreviewUrl ? (
              <div className="bg-white p-3 rounded-xl border border-[#DCE3EC] shadow-xs max-h-[58vh] overflow-auto">
                <img
                  src={resolvedPreviewUrl}
                  alt={doc.title}
                  className="max-w-full max-h-[54vh] object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${fileStyle.bg} border ${fileStyle.border} flex items-center justify-center ${fileStyle.text} mx-auto`}
                >
                  <FileIcon className="w-7 h-7" />
                </div>

                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${fileStyle.badgeBg}`}
                  >
                    {fileStyle.label} Template File
                  </span>
                  <h3 className="mt-2.5 text-base font-bold text-[#1E1E1E]">
                    {doc.fileName}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#6E6A63] leading-relaxed">
                    {doc.description ||
                      "Official organization document template ready for viewing, printing, and download."}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={onPrint}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-xs font-semibold text-[#1E1E1E] transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5C4033]" />
                    <span>Print Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsPdf}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                </div>

                {resolvedPreviewUrl && !isFallback && (
                  <div className="pt-1">
                    <a
                      href={resolvedPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C4033] hover:underline"
                    >
                      <span>Open raw file in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white p-6 space-y-6">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Document Status
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Active &amp; Approved</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8478]">
                  File Name
                </p>
                <p className="mt-1 font-semibold text-[#1E1E1E] break-all">
                  {doc.fileName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8478]">
                    Version
                  </p>
                  <p className="mt-1 font-semibold text-[#1E1E1E]">
                    v{doc.version || "1.0"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8478]">
                    Last Updated
                  </p>
                  <p className="mt-1 font-semibold text-[#1E1E1E]">
                    {formatUpdatedMonthYear(doc.updatedAt || doc.createdAt)}
                  </p>
                </div>
              </div>

              {doc.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8478]">
                    Description
                  </p>
                  <p className="mt-1 text-[#4A4640] leading-relaxed">
                    {doc.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8478]">
                  Tags
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#F5F7FA] border border-[#E2E8F0] text-[11px] font-medium text-[#475569]">
                    #{doc.category === "policy" ? "HRPolicy" : "HRForm"}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F5F7FA] border border-[#E2E8F0] text-[11px] font-medium text-[#475569]">
                    #{fileStyle.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-white border-t border-[#EAE4D7] flex flex-wrap items-center justify-between gap-3">
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#FAF5EB] hover:border-[#5C4033] text-xs font-semibold text-[#1E1E1E] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-[#5C4033]" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E1E1E] transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#5C4033]" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onDownloadOriginal}
              disabled={isDownloading}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5C4033] hover:bg-[#4A3328] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}