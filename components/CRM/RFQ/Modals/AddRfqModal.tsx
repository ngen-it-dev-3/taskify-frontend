'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Globe,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import ProductEditorModal, { type ProductDraft } from './ProductEditorModal';

interface Props {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

// ---- Form data shape ----
interface LineItem {
  id: string;
  product: string;
  qty: number;
  sku?: string;
  modelNo?: string;
  brand?: string;
  description?: string;
  additionalInfo?: string;
  files?: File[];
}

interface FormData {
  // Company Info
  companyName: string;
  isReseller: boolean;
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  zipCode: string;
  deliverySameAsCompany: boolean;
  endUserSameAsCompany: boolean;

  // Shipping
  shippingCompanyName: string;
  shippingContactName: string;
  shippingDesignation: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCountry: string;
  shippingCity: string;
  shippingZipCode: string;

  // End User
  endUserCompanyName: string;
  endUserContactName: string;
  endUserDesignation: string;
  endUserEmail: string;
  endUserPhone: string;
  endUserAddress: string;
  endUserCountry: string;
  endUserCity: string;
  endUserZipCode: string;

  // Additional
  projectName: string;
  tentativeBudget: string;
  currentProjectStatus: string;
  tentativePurchaseDate: string;
  comment: string;
  skipAdditional: boolean;

  // Products
  items: LineItem[];
}

const INITIAL_FORM: FormData = {
  companyName: '',
  isReseller: false,
  contactName: '',
  designation: '',
  email: '',
  phone: '',
  address: '',
  country: '',
  city: '',
  zipCode: '',
  deliverySameAsCompany: false,
  endUserSameAsCompany: false,

  shippingCompanyName: '',
  shippingContactName: '',
  shippingDesignation: '',
  shippingEmail: '',
  shippingPhone: '',
  shippingAddress: '',
  shippingCountry: '',
  shippingCity: '',
  shippingZipCode: '',

  endUserCompanyName: '',
  endUserContactName: '',
  endUserDesignation: '',
  endUserEmail: '',
  endUserPhone: '',
  endUserAddress: '',
  endUserCountry: '',
  endUserCity: '',
  endUserZipCode: '',

  projectName: '',
  tentativeBudget: '',
  currentProjectStatus: '',
  tentativePurchaseDate: '',
  comment: '',
  skipAdditional: false,

  items: [{ id: '1', product: '', qty: 1 }],
};

const COUNTRIES = [
  'Bangladesh',
  'Singapore',
  'Pakistan',
  'Hungary',
  'Nigeria',
  'India',
  'United States of America',
  'United Kingdom',
];

type Tab = 'sync' | 'manual';
type Step = 0 | 1 | 2 | 3;

export default function AddRfqModal({ onClose, onSubmit }: Props) {
  const [tab, setTab] = useState<Tab>('sync');
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // ---- ESC to close (skip when product editor is open) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingProductId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editingProductId]);

  // ---- Toast auto-dismiss ----
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- Click outside ----
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  };

  // ---- Field helpers ----
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  // ---- Product line helpers ----
  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: String(Date.now()), product: '', qty: 1 }],
    }));
  };

  const removeItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1 ? prev.items : prev.items.filter((it) => it.id !== id),
    }));
  };

  const bumpQty = (id: string, delta: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it
      ),
    }));
  };

  // ---- Save from Product Editor ----
  const handleProductSave = (draft: ProductDraft) => {
    if (!editingProductId) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === editingProductId
          ? {
            ...it,
            product: draft.name || it.product,
            qty: draft.qty || it.qty,
            sku: draft.sku,
            modelNo: draft.modelNo,
            brand: draft.brand,
            description: draft.description,
            additionalInfo: draft.additionalInfo,
            files: draft.files,
          }
          : it
      ),
    }));
    setEditingProductId(null);
    setToast('Product details updated.');
  };

  // ---- Validation per step ----
  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.companyName.trim()) errs.companyName = 'This field is required.';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = 'The email must be a valid email address.';
        setToast('The email must be a valid email address.');
      }
    }
    if (s === 1 && !form.deliverySameAsCompany) {
      if (!form.shippingCity.trim()) errs.shippingCity = 'This field is required.';
    }
    if (s === 2 && !form.endUserSameAsCompany) {
      if (!form.endUserAddress.trim()) errs.endUserAddress = 'This field is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setToast('Synced 2 new RFQs from the Web Portal.');
    }, 1400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const s of [0, 1, 2, 3] as Step[]) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    setSubmitting(true);

    // ---- Map internal form → backend payload ----
    const payload = {
      source: 'manual' as const,
      company: form.companyName,
      country: form.country || form.shippingCountry || 'Unknown',
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      designation: form.designation,
      address: form.address,
      city: form.city,
      zipCode: form.zipCode,
      isReseller: form.isReseller,
      receivedVia: 'Email',
      priority: 'normal' as const,
      products: form.items.map((it, i) => ({
        sl: i + 1,
        name: it.product || `Item ${i + 1}`,
        qty: it.qty,
        sku: it.sku,
        modelNo: it.modelNo,
        brand: it.brand,
        description: it.description,
        additionalInfo: it.additionalInfo,
        files: [], // will be filled after upload — see note below
      })),
      projectName: form.projectName,
      tentativeBudget: form.tentativeBudget,
      currentProjectStatus: form.currentProjectStatus,
      tentativePurchaseDate: form.tentativePurchaseDate,
      comment: form.comment,
      // Optionally include shipping / endUser if your backend supports it:
      shipping: form.deliverySameAsCompany
        ? undefined
        : {
          companyName: form.shippingCompanyName,
          contactName: form.shippingContactName,
          designation: form.shippingDesignation,
          email: form.shippingEmail,
          phone: form.shippingPhone,
          address: form.shippingAddress,
          country: form.shippingCountry,
          city: form.shippingCity,
          zipCode: form.shippingZipCode,
        },
      endUser: form.endUserSameAsCompany
        ? undefined
        : {
          companyName: form.endUserCompanyName,
          contactName: form.endUserContactName,
          designation: form.endUserDesignation,
          email: form.endUserEmail,
          phone: form.endUserPhone,
          address: form.endUserAddress,
          country: form.endUserCountry,
          city: form.endUserCity,
          zipCode: form.endUserZipCode,
        },
    };

    onSubmit(payload);
    // Parent controls closing. If parent throws, it will re-throw.
    setTimeout(() => setSubmitting(false), 600);
  };

  const steps = [
    { n: 0, label: 'Company Info' },
    { n: 1, label: 'Shipping Details' },
    { n: 2, label: 'End User Info' },
    { n: 3, label: 'Additional Details' },
  ];

  // ---- Get currently-edited product (for pre-filling ProductEditorModal) ----
  const editingItem = editingProductId
    ? form.items.find((i) => i.id === editingProductId)
    : null;

  return (
    <>
      <div
        onClick={onBackdropClick}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-rfq-title"
      >
        <div
          ref={panelRef}
          className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        >
          {/* =============== HEADER =============== */}
          <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-8 pt-6 pb-4 border-b border-slate-100 rounded-t-2xl">
            <div>
              <h2 id="add-rfq-title" className="text-xl font-bold text-slate-900">
                Add RFQ
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                RFQs arrive two ways — sync fresh ones from the NGEN IT website's RFQ form, or
                log one that came in by email or phone manually.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* =============== TAB SWITCHER =============== */}
          <div className="px-8 pt-5">
            <div className="flex items-center gap-6 border-b border-slate-100">
              <TabButton
                active={tab === 'sync'}
                onClick={() => setTab('sync')}
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Sync from Web Portal"
              />
              <TabButton
                active={tab === 'manual'}
                onClick={() => setTab('manual')}
                icon={<Mail className="w-3.5 h-3.5" />}
                label="Manual Entry (Email/Phone)"
              />
            </div>
          </div>

          {/* =============== BODY =============== */}
          <div className="px-8 py-6">
            {tab === 'sync' ? (
              <SyncPanel syncing={syncing} onSync={handleSync} />
            ) : (
              <ManualPanel
                step={step}
                setStep={setStep}
                steps={steps}
                form={form}
                errors={errors}
                setField={setField}
                updateItem={updateItem}
                addItem={addItem}
                removeItem={removeItem}
                bumpQty={bumpQty}
                goNext={goNext}
                goPrev={goPrev}
                handleSubmit={handleSubmit}
                submitting={submitting}
                onEditProduct={(id) => setEditingProductId(id)}
              />
            )}
          </div>

          {/* =============== TOAST =============== */}
          {toast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center font-bold text-[10px]">
                ✕
              </span>
              <span>
                <span className="text-rose-300 font-bold">Notice</span>{' '}
                <span className="ml-1">{toast}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =============== NESTED PRODUCT EDITOR MODAL =============== */}
      {editingItem && (
        <ProductEditorModal
          initial={{
            sku: editingItem.sku ?? '',
            modelNo: editingItem.modelNo ?? '',
            brand: editingItem.brand ?? '',
            qty: editingItem.qty ?? 1,
            name: editingItem.product ?? '',
            description: editingItem.description ?? '',
            additionalInfo: editingItem.additionalInfo ?? '',
            files: editingItem.files ?? [],
          }}
          onClose={() => setEditingProductId(null)}
          onSave={handleProductSave}
        />
      )}
    </>
  );
}

/* =========================================================
   SYNC PANEL
   ========================================================= */
function SyncPanel({ syncing, onSync }: { syncing: boolean; onSync: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 leading-relaxed">
        Pulls any new RFQs submitted through the NGEN IT website's RFQ form via API since your
        last sync.
        <br />
        <span className="text-slate-500">
          Last synced: <strong className="text-slate-700">Today, 09:02 AM</strong> · 28 RFQs on
          file
        </span>
      </p>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A06126] text-white text-xs font-semibold hover:bg-[#88501E] transition disabled:opacity-70"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}

/* =========================================================
   TAB BUTTON
   ========================================================= */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 text-xs font-semibold relative transition ${active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
        }`}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}

/* =========================================================
   MANUAL PANEL — Wizard
   ========================================================= */
function ManualPanel({
  step,
  setStep,
  steps,
  form,
  errors,
  setField,
  updateItem,
  addItem,
  removeItem,
  bumpQty,
  goNext,
  goPrev,
  handleSubmit,
  submitting,
  onEditProduct,
}: {
  step: Step;
  setStep: (s: Step) => void;
  steps: { n: number; label: string }[];
  form: FormData;
  errors: Record<string, string>;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  updateItem: (id: string, patch: Partial<LineItem>) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  bumpQty: (id: string, delta: number) => void;
  goNext: () => void;
  goPrev: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onEditProduct: (id: string) => void;
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ============ PRODUCT ROWS ============ */}
      <div className="space-y-2">
        {form.items.map((it, idx) => (
          <div key={it.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditProduct(it.id)}
              className="w-9 h-9 shrink-0 rounded border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center text-lg leading-none transition"
              aria-label="Edit product details"
              title="Edit product details"
            >
              ⋯
            </button>
            <div className="w-12 text-center text-xs font-bold text-slate-700 border border-slate-200 rounded px-2 py-2 shrink-0">
              {idx + 1}
            </div>
            <input
              type="text"
              value={it.product}
              onChange={(e) => updateItem(it.id, { product: e.target.value })}
              placeholder="Product Name"
              className="flex-1 bg-slate-100 border-0 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            />
            <input
              type="number"
              value={it.qty}
              onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) || 1 })}
              className="w-16 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            />
            <div className="flex flex-col gap-[1px]">
              <button
                type="button"
                onClick={() => bumpQty(it.id, 1)}
                className="w-6 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-t text-slate-500"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => bumpQty(it.id, -1)}
                className="w-6 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-b text-slate-500"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item + Upload */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#A06126] text-[#A06126] text-xs font-semibold hover:bg-[#F9F1E2] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Items
        </button>
        <button
          type="button"
          className="text-xs font-medium text-[#A06126] underline underline-offset-2 hover:text-[#88501E]"
        >
          Upload RFQ/Tender Images
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* ============ STEP TABS ============ */}
      <div className="flex items-center gap-0 border-b border-slate-100">
        {steps.map((s) => {
          const done = s.n < step;
          const active = s.n === step;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n as Step)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition border-b-2 ${active
                ? 'text-rose-700 border-rose-700 bg-rose-50/40'
                : done
                  ? 'text-slate-700 border-transparent hover:bg-slate-50'
                  : 'text-slate-500 border-transparent hover:bg-slate-50'
                }`}
            >
              {done && <Check className="w-3.5 h-3.5 text-slate-700" />}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ============ STEP CONTENT ============ */}
      <div className="pt-1">
        {step === 0 && (
          <CompanyInfoStep form={form} errors={errors} setField={setField} />
        )}
        {step === 1 && (
          <ShippingStep form={form} errors={errors} setField={setField} />
        )}
        {step === 2 && (
          <EndUserStep form={form} errors={errors} setField={setField} />
        )}
        {step === 3 && <AdditionalStep form={form} setField={setField} />}
      </div>

      {/* ============ FOOTER ============ */}
      <div className="flex items-center justify-between pt-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-rose-200 text-white text-xs font-semibold hover:bg-rose-300 transition"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition disabled:opacity-70"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </form>
  );
}

/* =========================================================
   STEP 1 — COMPANY INFO
   ========================================================= */
function CompanyInfoStep({
  form,
  errors,
  setField,
}: {
  form: FormData;
  errors: Record<string, string>;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <InputField
            label="Company Name"
            placeholder="Company Name (e.g: NGen It)"
            value={form.companyName}
            onChange={(v) => setField('companyName', v)}
            error={errors.companyName}
            required
          />
          <CheckboxRow
            checked={form.isReseller}
            onChange={(v) => setField('isReseller', v)}
            label="I am a reseller"
            hint="(Check if you are a reseller partner)"
            className="mt-3"
          />
        </div>
        <div className="pt-7" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Contact Name (e.g: Jhone Doe)"
          value={form.contactName}
          onChange={(v) => setField('contactName', v)}
        />
        <InputField
          label=""
          placeholder="Address (e.g: House No, Road, Block)"
          value={form.address}
          onChange={(v) => setField('address', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Designation (e.g: Sales Manager)"
          value={form.designation}
          onChange={(v) => setField('designation', v)}
        />
        <SelectField
          label=""
          placeholder="Select Country"
          value={form.country}
          onChange={(v) => setField('country', v)}
          options={COUNTRIES}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Email Address (e.g: jhone@mail.com)"
          value={form.email}
          onChange={(v) => setField('email', v)}
          error={errors.email}
        />
        <InputField
          label=""
          placeholder="Enter your City Name"
          value={form.city}
          onChange={(v) => setField('city', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Phone Number (e.g: 018687955852)"
          value={form.phone}
          onChange={(v) => setField('phone', v)}
        />
        <InputField
          label=""
          placeholder="ZIP Code (e.g: 1207)"
          value={form.zipCode}
          onChange={(v) => setField('zipCode', v)}
        />
      </div>

      <div className="pt-2 space-y-2">
        <CheckboxRow
          checked={form.deliverySameAsCompany}
          onChange={(v) => setField('deliverySameAsCompany', v)}
          label="My delivery address is the same as the company address"
        />
        <CheckboxRow
          checked={form.endUserSameAsCompany}
          onChange={(v) => setField('endUserSameAsCompany', v)}
          label="I am the end user and my information is the same as the company address"
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 2 — SHIPPING DETAILS
   ========================================================= */
function ShippingStep({
  form,
  errors,
  setField,
}: {
  form: FormData;
  errors: Record<string, string>;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const disabled = form.deliverySameAsCompany;
  return (
    <div className="space-y-4">
      <CheckboxRow
        checked={form.deliverySameAsCompany}
        onChange={(v) => setField('deliverySameAsCompany', v)}
        label="Delivery address is same as the company address"
      />

      <InputField
        label=""
        placeholder="Shipping Company Name (e.g: NGen It)"
        value={form.shippingCompanyName}
        onChange={(v) => setField('shippingCompanyName', v)}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Contact Name (e.g: Jhone Doe)"
          value={form.shippingContactName}
          onChange={(v) => setField('shippingContactName', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="Address (e.g: House No, Road, Block)"
          value={form.shippingAddress}
          onChange={(v) => setField('shippingAddress', v)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Designation (e.g: Sales Manager)"
          value={form.shippingDesignation}
          onChange={(v) => setField('shippingDesignation', v)}
          disabled={disabled}
        />
        <SelectField
          label=""
          placeholder="Select Country"
          value={form.shippingCountry}
          onChange={(v) => setField('shippingCountry', v)}
          options={COUNTRIES}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Email Address (e.g: jhone@mail.com)"
          value={form.shippingEmail}
          onChange={(v) => setField('shippingEmail', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="Enter your City Name"
          value={form.shippingCity}
          onChange={(v) => setField('shippingCity', v)}
          error={errors.shippingCity}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Phone Number (e.g: 018687955852)"
          value={form.shippingPhone}
          onChange={(v) => setField('shippingPhone', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="ZIP Code (e.g: 1207)"
          value={form.shippingZipCode}
          onChange={(v) => setField('shippingZipCode', v)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3 — END USER INFO
   ========================================================= */
function EndUserStep({
  form,
  errors,
  setField,
}: {
  form: FormData;
  errors: Record<string, string>;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const disabled = form.endUserSameAsCompany;
  return (
    <div className="space-y-4">
      <CheckboxRow
        checked={form.endUserSameAsCompany}
        onChange={(v) => setField('endUserSameAsCompany', v)}
        label="I am the end user & same as the company address"
      />

      <InputField
        label=""
        placeholder="Destination/Company Name (e.g: NGen It)"
        value={form.endUserCompanyName}
        onChange={(v) => setField('endUserCompanyName', v)}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Contact Name (e.g: Jhone Doe)"
          value={form.endUserContactName}
          onChange={(v) => setField('endUserContactName', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="Address (e.g: House No, Road, Block)"
          value={form.endUserAddress}
          onChange={(v) => setField('endUserAddress', v)}
          error={errors.endUserAddress}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Designation (e.g: Sales Manager)"
          value={form.endUserDesignation}
          onChange={(v) => setField('endUserDesignation', v)}
          disabled={disabled}
        />
        <SelectField
          label=""
          placeholder="Select Country"
          value={form.endUserCountry}
          onChange={(v) => setField('endUserCountry', v)}
          options={COUNTRIES}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Email Address (e.g: jhone@mail.com)"
          value={form.endUserEmail}
          onChange={(v) => setField('endUserEmail', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="Enter your City Name"
          value={form.endUserCity}
          onChange={(v) => setField('endUserCity', v)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Phone Number (e.g: 018687955852)"
          value={form.endUserPhone}
          onChange={(v) => setField('endUserPhone', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="ZIP Code (e.g: 1207)"
          value={form.endUserZipCode}
          onChange={(v) => setField('endUserZipCode', v)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 4 — ADDITIONAL DETAILS
   ========================================================= */
function AdditionalStep({
  form,
  setField,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const disabled = form.skipAdditional;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label=""
          placeholder="Project Name"
          value={form.projectName}
          onChange={(v) => setField('projectName', v)}
          disabled={disabled}
        />
        <InputField
          label=""
          placeholder="Tentative Budget…"
          value={form.tentativeBudget}
          onChange={(v) => setField('tentativeBudget', v)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label=""
          placeholder="Current project status"
          value={form.currentProjectStatus}
          onChange={(v) => setField('currentProjectStatus', v)}
          options={['Planning', 'Budgeting', 'Approved', 'In Progress', 'On Hold']}
          disabled={disabled}
        />
        <SelectField
          label=""
          placeholder="Tentative Purchase Date"
          value={form.tentativePurchaseDate}
          onChange={(v) => setField('tentativePurchaseDate', v)}
          options={['Within 1 month', '1–3 months', '3–6 months', '6+ months']}
          disabled={disabled}
        />
      </div>

      <textarea
        rows={4}
        value={form.comment}
        onChange={(e) => setField('comment', e.target.value)}
        disabled={disabled}
        placeholder="Leave a comment or message here…"
        className="w-full bg-slate-100 border-0 rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60"
      />

      <CheckboxRow
        checked={form.skipAdditional}
        onChange={(v) => setField('skipAdditional', v)}
        label="Skip the additional information"
      />
    </div>
  );
}

/* =========================================================
   ATOMS
   ========================================================= */
function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  required,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-slate-100 border rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60 ${error ? 'border-rose-400' : 'border-transparent'
          }`}
      />
      {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-slate-100 border-0 rounded-lg px-3 py-2.5 pr-8 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  hint,
  className = '',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer text-xs ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-slate-300 text-rose-700 focus:ring-rose-500"
      />
      <span className="text-slate-700 font-medium">
        {label}
        {hint && <span className="text-slate-400 font-normal ml-1">{hint}</span>}
      </span>
    </label>
  );
}