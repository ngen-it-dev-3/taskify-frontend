// components/tender/documents/modals/ExtraAddDocModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X, FileText } from "lucide-react";
import type { CompanyDocCategory } from "@/lib/api/tender.api";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CompanyDocCategory;
  onSubmit: (payload: any) => Promise<void> | void;
  renewDoc?: CompanyDocUI | null;
  editDoc?: CompanyDocUI | null; // ✅ Added for Edit mode
}

const CATEGORIES: { id: CompanyDocCategory; label: string }[] = [
  { id: "legal", label: "Legal Doc" },
  { id: "profiles", label: "Company Profile" },
  { id: "work-orders", label: "Work Order" },
  { id: "certificates", label: "Partnership Certificate" },
  { id: "team", label: "Team & CVs" },
  { id: "datasheets", label: "Datasheet" },
];

const DOC_TYPES = ["Certificate", "Registration", "License", "NOC", "Clearance", "Insurance", "Guarantee", "Other"];

const CUSTOMER_TYPES = [
  "Government", "Autonomous / State-owned", "Financial (private)",
  "Enterprise (private)", "Telecom", "NGO / Development", "Educational", "Other"
];

const WORK_TYPES = ["Supply", "Service", "Supply + Service"];

const DATASHEET_CATEGORIES = [
  "Analytics software", "Backup & recovery", "Endpoint security",
  "Industrial sensors", "Remote access", "Surveillance", "Vulnerability management"
];

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

function toInputDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddDocModal({
  open,
  onOpenChange,
  category,
  onSubmit,
  renewDoc,
  editDoc,
}: Props) {
  const isRenew = !!renewDoc;
  const isEdit = !!editDoc;

  // Form State
  const [form, setForm] = useState<any>({
    title: "", reference: "", validity: "", validityDate: "", issuedOn: "",
    subtitle: "", chips: "", totalValue: "", customerType: "Government", isGovt: true,
    products: "", workType: "Supply", certReceived: false, experienceYears: "", isEngineer: false,
    docType: "Partner Certificate",
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWorkOrder = category === "work-orders";
  const isTeam = category === "team";
  const isDatasheet = category === "datasheets";
  const isCertificate = category === "certificates";
  const isLegal = category === "legal";
  const isProfile = category === "profiles";

  /* Reset / seed on open */
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (renewDoc) {
      setForm({ ...form, title: renewDoc.title, validityDate: "", issuedOn: "" });
    } else if (editDoc) {
      setForm({
        ...editDoc,
        validityDate: toInputDate(editDoc.validUntil),
        issuedOn: toInputDate(editDoc.issuedOn),
        products: editDoc.products?.join(", ") || "",
        chips: editDoc.chips?.join(", ") || "",
        totalValue: editDoc.totalValue?.toString() || "",
        experienceYears: editDoc.experienceYears?.toString() || "",
      });
    } else {
      setForm({
        title: "", reference: "", validity: "", validityDate: "", issuedOn: "",
        subtitle: "", chips: "", totalValue: "", customerType: "Government", isGovt: true,
        products: "", workType: "Supply", certReceived: false, experienceYears: "", isEngineer: false,
        docType: "Partner Certificate",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, renewDoc, editDoc]);

  /* Esc close + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, saving, onOpenChange]);

  if (!open) return null;

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const canSave = (isRenew || form.title?.trim().length > 0) && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        category,
        title: form.title.trim(),
        validityDate: form.validityDate || undefined,
        issuedOn: form.issuedOn || undefined,
        chips: typeof form.chips === "string" ? form.chips.split(",").map((s: string) => s.trim()).filter(Boolean) : form.chips,
        products: typeof form.products === "string" ? form.products.split(",").map((s: string) => s.trim()).filter(Boolean) : form.products,
        totalValue: Number(form.totalValue) || 0,
        experienceYears: Number(form.experienceYears) || 0,
        file: file ?? undefined,
      };

      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  // Determine Header Text
  let headerTitle = "Add Company Document";
  let headerSubtitle = "Upload a file and choose its category — it will appear in the matching tab.";
  let buttonLabel = "Save Document";

  if (isRenew) {
    headerTitle = `Renew — ${renewDoc?.title ?? "Document"}`;
    headerSubtitle = "Upload the new certificate and set its expiry date.";
    buttonLabel = "Save Renewal";
  } else if (isEdit) {
    headerTitle = `Edit — ${editDoc?.title ?? "Document"}`;
    headerSubtitle = "Update the document details.";
    buttonLabel = "Save Changes";
  } else {
    switch (category) {
      case "work-orders": headerTitle = "Add Work Order"; headerSubtitle = "One work order per entry."; buttonLabel = "Save Work Order"; break;
      case "team": headerTitle = "Add Person / CV"; headerSubtitle = "Roles and skills become searchable tags."; buttonLabel = "Save Person"; break;
      case "datasheets": headerTitle = "Add Datasheet / Brochure"; headerSubtitle = "Saved by brand and category."; buttonLabel = "Save"; break;
      case "certificates": headerTitle = "Add Partnership Certificate"; headerSubtitle = "Add a new principal/distributor certificate."; buttonLabel = "Save Certificate"; break;
      case "profiles": headerTitle = "Add Company Profile"; headerSubtitle = "Add a company profile document."; buttonLabel = "Save Profile"; break;
      case "legal": headerTitle = "Add Legal Doc"; headerSubtitle = "Add a new legal/registration document."; buttonLabel = "Save Document"; break;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onOpenChange(false)} />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{headerTitle}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{headerSubtitle}</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">

          {/* ================= WORK ORDERS ================= */}
          {isWorkOrder && (
            <>
              <div>
                <label className={labelCls}>Client / Company Name *</label>
                <input type="text" className={inputCls} placeholder="e.g. Grameenphone Ltd." value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Order Received Date *</label>
                  <input type="date" className={inputCls} value={form.issuedOn} onChange={(e) => set("issuedOn", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Total Sales Value (৳) *</label>
                  <input type="number" className={inputCls} placeholder="e.g. 2000000" value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Customer Type</label>
                  <select className={inputCls} value={form.customerType} onChange={(e) => set("customerType", e.target.value)}>
                    {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Govt. / Non-Govt.</label>
                  <div className="flex h-10 items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5"><input type="radio" checked={form.isGovt} onChange={() => set("isGovt", true)} /> Govt.</label>
                    <label className="flex items-center gap-1.5"><input type="radio" checked={!form.isGovt} onChange={() => set("isGovt", false)} /> Non-Govt.</label>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Products / What the order was for</label>
                <input type="text" className={inputCls} placeholder="Type a product, press Enter (Symantec, Tenable...)" value={form.products} onChange={(e) => set("products", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Short Description</label>
                <input type="text" className={inputCls} placeholder="e.g. Vulnerability scanning subscription" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Work Type</label>
                  <select className={inputCls} value={form.workType} onChange={(e) => set("workType", e.target.value)}>
                    {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Completion Certificate Received?</label>
                  <select className={inputCls} value={form.certReceived ? "yes" : "no"} onChange={(e) => set("certReceived", e.target.value === "yes")}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ================= TEAM & CVs ================= */}
          {isTeam && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input type="text" className={inputCls} placeholder="e.g. Rafiq Ahmed" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <input type="text" className={inputCls} placeholder="e.g. Senior Network Engineer" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Roles (Search Tags)</label>
                <input type="text" className={inputCls} placeholder="Al Engg., Network Engg., Acronis Engg..." value={form.chips} onChange={(e) => set("chips", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Skills</label>
                <input type="text" className={inputCls} placeholder="Cisco, Python, React" value={form.products} onChange={(e) => set("products", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Total Experience (Years)</label>
                  <input type="number" min={0} className={inputCls} placeholder="e.g. 8" value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Counts as Engineer / Technician</label>
                  <select className={inputCls} value={form.isEngineer ? "yes" : "no"} onChange={(e) => set("isEngineer", e.target.value === "yes")}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ================= DATASHEETS ================= */}
          {isDatasheet && (
            <>
              <div>
                <label className={labelCls}>Product / Title *</label>
                <input type="text" className={inputCls} placeholder="e.g. Acronis Cyber Protect" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Brand *</label>
                  <input type="text" className={inputCls} placeholder="e.g. Acronis" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={form.customerType} onChange={(e) => set("customerType", e.target.value)}>
                    {DATASHEET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                  <option value="Datasheet">Datasheet</option>
                  <option value="Brochure">Brochure</option>
                </select>
              </div>
            </>
          )}

          {/* ================= CERTIFICATES ================= */}
          {isCertificate && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Principal Name *</label>
                  <input type="text" className={inputCls} placeholder="e.g. Fortinet" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Certificate Type</label>
                  <select className={inputCls} value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                    <option value="Partner Certificate">Partner Certificate</option>
                    <option value="Reseller Authorization">Reseller Authorization</option>
                    <option value="Distributor Agreement">Distributor Agreement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Expiry Date</label>
                <input type="date" className={inputCls} value={form.validityDate} onChange={(e) => set("validityDate", e.target.value)} />
              </div>
            </>
          )}

          {/* ================= LEGAL DOCS & PROFILES ================= */}
          {(isLegal || isProfile) && (
            <>
              <div>
                <label className={labelCls}>{isProfile ? "Profile Name *" : "Document Name *"}</label>
                <input type="text" className={inputCls} placeholder={isProfile ? "e.g. General Company Profile" : "e.g. Fire Safety Certificate"} value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
              </div>

              {isProfile && (
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900" placeholder="Brief description of your company..." value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Reference / ID No.</label>
                  <input type="text" className={inputCls} placeholder="e.g. FSC-2026-0091" value={form.reference} onChange={(e) => set("reference", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Validity (Display Text)</label>
                  <input type="text" className={inputCls} placeholder="e.g. Valid until 30 Jun 2028" value={form.validity} onChange={(e) => set("validity", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Valid Until (Date)</label>
                  <input type="date" className={inputCls} value={form.validityDate} onChange={(e) => set("validityDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Issued On</label>
                  <input type="date" className={inputCls} value={form.issuedOn} onChange={(e) => set("issuedOn", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ================= RENEW MODE ================= */}
          {isRenew && (
            <>
              <div>
                <label className={labelCls}>New Expiry Date *</label>
                <input type="date" className={inputCls} value={form.validityDate} onChange={(e) => set("validityDate", e.target.value)} autoFocus />
              </div>
              <div>
                <label className={labelCls}>New Issued On (optional)</label>
                <input type="date" className={inputCls} value={form.issuedOn} onChange={(e) => set("issuedOn", e.target.value)} />
              </div>
            </>
          )}

          {/* ================= FILE UPLOAD ================= */}
          <div>
            <label className={labelCls}>Attach File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                  {file ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-slate-700">
                    {file ? file.name : "Choose a file to upload"}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {file ? `${(file.size / 1024).toFixed(0)} KB · ${file.type || "unknown"}` : "PDF, images, Word — up to 25 MB"}
                  </span>
                </span>
              </span>
              {file && (
                <span
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button type="button" onClick={() => onOpenChange(false)} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:opacity-50">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}