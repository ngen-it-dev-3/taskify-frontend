// components/tender/modal/AddTenderModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X, Save, FileCheck2, Upload, ChevronRight, ChevronLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { tenderApi } from "@/lib/api/tender.api";

type TenderType = "eGP" | "RFQ" | "Hardcopy Ref.";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-300/20 transition";

const inputErrorCls =
  "h-10 w-full rounded-lg border border-rose-300 bg-rose-50/30 px-3 text-xs text-slate-900 placeholder:text-rose-300 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-200/40 transition";

const labelCls =
  "mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500";

interface FormState {
  tenderer: string;
  title: string;
  tenderRefNo: string;
  tenderId: string;
  tenderType: TenderType;
  description: string;
  tenderLink: string;
  recordedBy: string;
  responsiblePerson: string;
  lastDateOfPurchase: string;
  lastDateOfSubmission: string;
  submissionTime: string;
  tentativeBudget: string;
  scheduleValue: string;
  purchaseFrom: string;
  purchaseType: string;
  tenderSecurityAmount: string;
  tenderSecurityValidity: string;
  performanceSecurityValidity: string;
  mode: string;
  participate: string;
  docPurchased: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  note: string;
}

const INITIAL: FormState = {
  tenderer: "",
  title: "",
  tenderRefNo: "",
  tenderId: "",
  tenderType: "eGP",
  description: "",
  tenderLink: "",
  recordedBy: "",
  responsiblePerson: "",
  lastDateOfPurchase: "",
  lastDateOfSubmission: "",
  submissionTime: "",
  tentativeBudget: "",
  scheduleValue: "",
  purchaseFrom: "",
  purchaseType: "",
  tenderSecurityAmount: "",
  tenderSecurityValidity: "",
  performanceSecurityValidity: "",
  mode: "Online (eGP)",
  participate: "Yes",
  docPurchased: "Not Yet",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  note: "",
};

const STEPS = [
  { id: 1, title: "Basic Details" },
  { id: 2, title: "Schedule & Docs" },
  { id: 3, title: "Security" },
];

export function AddTenderModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(INITIAL);
      setFile(null);
      setCurrentStep(1);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

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

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ✅ Step Validation Logic
  const isStep1Valid = form.tenderer.trim().length > 0 && form.title.trim().length > 0;

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid) {
      toast.error("Company Name and Tender Name are required.");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const buildPayload = (draft: boolean) => {
    let submissionISO: string | undefined;
    if (form.lastDateOfSubmission) {
      const dt = form.submissionTime
        ? new Date(`${form.lastDateOfSubmission} ${form.submissionTime}`)
        : new Date(form.lastDateOfSubmission);
      submissionISO = !isNaN(dt.getTime()) ? dt.toISOString() : undefined;
    }

    return {
      tenderer: form.tenderer.trim(),
      title: form.title.trim(),
      tenderRefNo: form.tenderRefNo.trim() || undefined,
      tenderId: form.tenderId.trim() || undefined,
      stage: "potential" as const,
      draft,
      tenderType: form.tenderType,
      description: form.description.trim() || undefined,
      tenderLink: form.tenderLink.trim() || undefined,
      recordedBy: form.recordedBy.trim() || undefined,
      responsiblePerson: form.responsiblePerson.trim() || undefined,
      lastDateOfPurchase: form.lastDateOfPurchase
        ? new Date(form.lastDateOfPurchase).toISOString()
        : undefined,
      lastDateOfSubmission: submissionISO,
      tentativeBudget: Number(form.tentativeBudget) || 0,
      scheduleValue: Number(form.scheduleValue) || 0,
      purchaseFrom: form.purchaseFrom.trim() || undefined,
      purchaseType: form.purchaseType.trim() || undefined,
      tenderSecurityAmount: Number(form.tenderSecurityAmount) || 0,
      tenderSecurityValidity: form.tenderSecurityValidity
        ? new Date(form.tenderSecurityValidity).toISOString()
        : undefined,
      performanceSecurityValidity: form.performanceSecurityValidity
        ? new Date(form.performanceSecurityValidity).toISOString()
        : undefined,
      mode: form.mode,
      note: form.note.trim() || undefined,
    };
  };

  const handleSave = async (options: { draft: boolean; notify: boolean }) => {
    if (!isStep1Valid) {
      toast.error("Company Name and Tender Name are required.");
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      const created = await tenderApi.create(buildPayload(options.draft));

      if (file) {
        const loadingId = toast.loading(`Uploading ${file.name}...`);
        try {
          await tenderApi.uploadAttachment(created._id, file);
          toast.success("File uploaded", { id: loadingId });
        } catch (e) {
          toast.error((e as Error).message || "File upload failed", { id: loadingId });
        }
      }

      toast.success(options.draft ? "Draft saved" : "Tender created successfully");
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save tender");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => !saving && onOpenChange(false)}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Tender</h2>
            <p className="mt-1 text-xs text-slate-500">
              Step {currentStep} of 3: {STEPS[currentStep - 1].title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ Stepper Progress Bar (Perfect Center & Proportion) */}
        <div className="border-b border-slate-100 bg-white px-8 pb-5 pt-6">
          <div className="flex w-full items-start justify-between">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center relative ${idx === 0 ? "items-start" : idx === STEPS.length - 1 ? "items-end" : ""
                    }`}
                  style={{ flex: idx === 0 || idx === STEPS.length - 1 ? "0 0 auto" : "1 1 0%" }}
                >
                  {/* Circle & Line Row */}
                  <div className="flex w-full items-center">
                    {/* Left Line (for middle and last steps) */}
                    {idx > 0 && (
                      <div
                        className={`h-[2px] flex-1 transition-colors duration-300 ${isCompleted || isActive ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                      />
                    )}

                    {/* Circle */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all z-10 ${isActive
                        ? "bg-[#a97400] text-white shadow-md ring-4 ring-amber-100"
                        : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                    </div>

                    {/* Right Line (for first and middle steps) */}
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 transition-colors duration-300 ${isCompleted ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className={`mt-2 w-24 text-center ${idx === 0 ? "ml-[-2rem]" : idx === STEPS.length - 1 ? "mr-[-2rem]" : ""}`}>
                    <span
                      className={`text-[11px] font-bold ${isActive
                        ? "text-[#a97400]"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-slate-400"
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ================= STEP 1: BASIC DETAILS ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className={labelCls}>
                  <span>Company Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  className={!form.tenderer && currentStep > 1 ? inputErrorCls : inputCls}
                  placeholder="e.g. Rural Electrification Board"
                  value={form.tenderer}
                  onChange={(e) => set("tenderer", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <span>Tender Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  className={!form.title && currentStep > 1 ? inputErrorCls : inputCls}
                  placeholder="e.g. Substation Control Panel Supply"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tender Ref. No.</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 27.29.0000..."
                    value={form.tenderRefNo}
                    onChange={(e) => set("tenderRefNo", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tender ID</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 123456"
                    value={form.tenderId}
                    onChange={(e) => set("tenderId", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Tender Type</label>
                <select
                  className={inputCls}
                  value={form.tenderType}
                  onChange={(e) => set("tenderType", e.target.value as TenderType)}
                >
                  <option value="eGP">eGP</option>
                  <option value="RFQ">RFQ</option>
                  <option value="Hardcopy Ref.">Hardcopy Ref.</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Description / Item</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Substation Control Panel Supply"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2: SCHEDULE & DOCS ================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Schedule Price (৳)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="e.g. 500"
                    value={form.scheduleValue}
                    onChange={(e) => set("scheduleValue", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tentative Budget (৳)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="e.g. 500000"
                    value={form.tentativeBudget}
                    onChange={(e) => set("tentativeBudget", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Purchase Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.lastDateOfPurchase}
                    onChange={(e) => set("lastDateOfPurchase", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Schedule Closing Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.lastDateOfSubmission}
                    onChange={(e) => set("lastDateOfSubmission", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Submission Time</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 3:00 PM"
                    value={form.submissionTime}
                    onChange={(e) => set("submissionTime", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Purchase From</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. eGP Portal"
                    value={form.purchaseFrom}
                    onChange={(e) => set("purchaseFrom", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Purchase Type</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Online / Offline"
                  value={form.purchaseType}
                  onChange={(e) => set("purchaseType", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Tender Notice Link</label>
                <input
                  className={inputCls}
                  placeholder="e.g. eGP.gov.bd/reb/2609-scp"
                  value={form.tenderLink}
                  onChange={(e) => set("tenderLink", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Choose File</label>
                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:border-[#a97400] hover:bg-amber-50/30">
                  <span className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                    <Upload className="h-3 w-3" /> Browse
                  </span>
                  <span className="truncate text-slate-500">{file?.name ?? "No file chosen"}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SECURITY & CONTACT ================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Security Amount (৳)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="e.g. 25000"
                    value={form.tenderSecurityAmount}
                    onChange={(e) => set("tenderSecurityAmount", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Security Validity</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.tenderSecurityValidity}
                    onChange={(e) => set("tenderSecurityValidity", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Performance Security Validity</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.performanceSecurityValidity}
                  onChange={(e) => set("performanceSecurityValidity", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mode of Submission</label>
                  <select
                    className={inputCls}
                    value={form.mode}
                    onChange={(e) => set("mode", e.target.value)}
                  >
                    <option>Online (eGP)</option>
                    <option>Offline</option>
                    <option>Email</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Participate?</label>
                  <select
                    className={inputCls}
                    value={form.participate}
                    onChange={(e) => set("participate", e.target.value)}
                  >
                    <option>Yes</option>
                    <option>No</option>
                    <option>Undecided</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Contact Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Md. Kamal Hossain"
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 01711-000000"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Responsible Person</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Nahid Hasan"
                    value={form.responsiblePerson}
                    onChange={(e) => set("responsiblePerson", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Recorded By</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Akramul"
                    value={form.recordedBy}
                    onChange={(e) => set("recordedBy", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-300/20 transition"
                  placeholder="General / Manager / MD comments..."
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && !isStep1Valid}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave({ draft: true, notify: false })}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave({ draft: false, notify: false })}
                  disabled={saving || !isStep1Valid}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                  Save Tender
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}