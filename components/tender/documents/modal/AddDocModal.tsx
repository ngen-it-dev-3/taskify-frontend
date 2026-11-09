// components/tender/documents/modal/AddDocModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { CompanyDocCategory } from "@/lib/api/tender.api";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CompanyDocCategory;
  onSubmit: (payload: any) => Promise<void> | void;
  renewDoc?: CompanyDocUI | null;
  editDoc?: CompanyDocUI | null;
}

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

function getHeaderText(category: string, isRenew: boolean, isEdit: boolean, title?: string) {
  if (isRenew) return { title: `Renew — ${title ?? "Document"}`, subtitle: "Upload the new certificate and set its expiry date.", button: "Save Renewal" };
  if (isEdit) return { title: `Edit — ${title ?? "Document"}`, subtitle: "Update the document details.", button: "Save Changes" };

  switch (category) {
    case "work-orders": return { title: "Add Work Order", subtitle: "One work order per entry.", button: "Save Work Order" };
    case "team": return { title: "Add Person / CV", subtitle: "Roles and skills become searchable tags.", button: "Save Person" };
    case "datasheets": return { title: "Add Datasheet / Brochure", subtitle: "Saved by brand and category.", button: "Save" };
    case "certificates": return { title: "Add Partnership Certificate", subtitle: "Add a new principal/distributor certificate.", button: "Save Certificate" };
    case "profiles": return { title: "Add Company Profile", subtitle: "Add a company profile document.", button: "Save Profile" };
    case "legal": return { title: "Add Legal Doc", subtitle: "Add a new legal/registration document.", button: "Save Document" };
    default: return { title: "Add Document", subtitle: "Add a new document to this custom tab.", button: "Save Document" };
  }
}

export function AddDocModal({ open, onOpenChange, category, onSubmit, renewDoc, editDoc }: Props) {
  const isRenew = !!renewDoc;
  const isEdit = !!editDoc;

  const [form, setForm] = useState<any>({
    title: "", description: "", reference: "", validityDate: "", issuedOn: "",
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

  // ✅ Fallback for custom tabs
  const isCustomOrLegal = !isWorkOrder && !isTeam && !isDatasheet && !isCertificate;

  /* Reset / seed on open */
  /* Reset / seed on open */
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (renewDoc) {
      setForm((prev: any) => ({
        ...prev,
        title: renewDoc.title || "",
        validityDate: "",
        issuedOn: "",
      }));
    } else if (editDoc) {
      // ✅ FIX: Force every field to be a string to prevent "uncontrolled to controlled" errors
      setForm({
        title: editDoc.title || "",
        description: editDoc.description || "",
        reference: editDoc.reference || "",
        validity: editDoc.validity || "",
        validityDate: toInputDate(editDoc.validUntil) || "",
        issuedOn: toInputDate(editDoc.issuedOn) || "",
        subtitle: editDoc.subtitle || "",
        chips: editDoc.chips?.join(", ") || "",
        totalValue: editDoc.totalValue !== undefined ? String(editDoc.totalValue) : "",
        customerType: editDoc.customerType || "Government",
        isGovt: editDoc.isGovt ?? true,
        products: editDoc.products?.join(", ") || "",
        workType: editDoc.workType || "Supply",
        certReceived: editDoc.certReceived ?? false,
        experienceYears: editDoc.experienceYears !== undefined ? String(editDoc.experienceYears) : "",
        isEngineer: editDoc.isEngineer ?? false,
        docType: editDoc.docType || "Partner Certificate",
      });
    } else {
      // ✅ FIX: New document always starts with clean, defined string values
      setForm({
        title: "",
        description: "",
        reference: "",
        validityDate: "",
        issuedOn: "",
        subtitle: "",
        chips: "",
        totalValue: "",
        customerType: "Government",
        isGovt: true,
        products: "",
        workType: "Supply",
        certReceived: false,
        experienceYears: "",
        isEngineer: false,
        docType: "Partner Certificate",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, renewDoc, editDoc]);

  /* Esc + body scroll lock */
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
  const { title: headerTitle, subtitle: headerSub, button: btnLabel } = getHeaderText(category, isRenew, isEdit, form.title || renewDoc?.title || editDoc?.title);

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

      if (isWorkOrder) delete payload.chips;
      if (isTeam) { delete payload.products; delete payload.totalValue; }
      if (!isCertificate) delete payload.docType;

      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onOpenChange(false)} />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{headerTitle}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{headerSub}</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Close">
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
                  <input type="number" className={inputCls} placeholder="e.g. 20 lac, 1 cr or 2000000" value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} />
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
                <input type="text" className={inputCls} placeholder="Type a product, press Enter" value={form.products} onChange={(e) => set("products", e.target.value)} />
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Document Type</label>
                  <select className={inputCls} value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                    <option value="Work Order">Work Order</option>
                    <option value="Experience Certificate">Experience Certificate</option>
                    <option value="Completion Certificate">Completion Certificate</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Upload Document</label>
                  <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                    <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                    <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                    <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
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
                <input type="text" className={inputCls} placeholder="Al Engg., Network Engg., ..." value={form.chips} onChange={(e) => set("chips", e.target.value)} />
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
                    <option value="auto">Auto (from roles)</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Certifications</label>
                <input type="text" className={inputCls} placeholder="e.g. CCNP, Acronis Certified" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Work Experience / Projects</label>
                <input type="text" className={inputCls} placeholder="e.g. Setup network for XYZ Bank" value={form.reference} onChange={(e) => set("reference", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Upload CV</label>
                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                  <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                    <option value="Datasheet">Datasheet</option>
                    <option value="Brochure">Brochure</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Upload File</label>
                  <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                    <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                    <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                    <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
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

              <div>
                <label className={labelCls}>Upload Certificate</label>
                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                  <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </>
          )}

          {/* ================= LEGAL DOCS / CUSTOM TABS / PROFILES ================= */}
          {isCustomOrLegal && (
            <>
              <div>
                <label className={labelCls}>Document Name *</label>
                <input type="text" className={inputCls} placeholder="e.g. Fire Safety Certificate" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
              </div>

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

              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Optional description..." value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Upload File</label>
                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                  <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
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
              <div>
                <label className={labelCls}>Upload New Certificate</label>
                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Choose File</span>
                  <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button type="button" onClick={handleSave} disabled={!canSave} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}