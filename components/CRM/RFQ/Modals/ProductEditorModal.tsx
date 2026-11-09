'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface ProductDraft {
  sku: string;
  modelNo: string;
  brand: string;
  qty: number;
  name: string;
  description: string;
  additionalInfo: string;
  files: File[];
}

interface Props {
  initial?: Partial<ProductDraft>;
  onClose: () => void;
  onSave: (data: ProductDraft) => void;
}

const EMPTY: ProductDraft = {
  sku: '',
  modelNo: '',
  brand: '',
  qty: 1,
  name: '',
  description: '',
  additionalInfo: '',
  files: [],
};

export default function ProductEditorModal({ initial, onClose, onSave }: Props) {
  const [data, setData] = useState<ProductDraft>({ ...EMPTY, ...initial });
  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- ESC to close ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ---- Click outside to close ----
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  };

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    set('files', [...data.files, ...Array.from(files)]);
  };

  const removeFile = (idx: number) =>
    set('files', data.files.filter((_, i) => i !== idx));

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-editor-title"
    >
      <div
        ref={panelRef}
        className="bg-white rounded-lg max-w-5xl w-full shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* =============== HEADER =============== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="product-editor-title"
            className="text-base font-bold text-slate-900"
          >
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-600 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* =============== BODY (scrollable) =============== */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {/* Row 1: SKU / Model / Brand / Qty */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <CompactField
                label="SKU / Part No."
                placeholder="Enter SKU / Part No."
                value={data.sku}
                onChange={(v) => set('sku', v)}
              />
              <CompactField
                label="Model No."
                placeholder="Enter Model No."
                value={data.modelNo}
                onChange={(v) => set('modelNo', v)}
              />
              <CompactField
                label="Brand Name"
                placeholder="Enter Brand Name"
                value={data.brand}
                onChange={(v) => set('brand', v)}
              />
              <CompactField
                label="Quantity"
                placeholder="Enter Quantity"
                value={String(data.qty)}
                onChange={(v) => set('qty', Number(v) || 0)}
                type="number"
              />
            </div>

            {/* Item Name (full width) */}
            <CompactField
              label="Item Name"
              placeholder="Enter Item Name"
              value={data.name}
              onChange={(v) => set('name', v)}
            />

            {/* Description + Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextareaField
                label="Item Description"
                placeholder="Enter Item Description"
                value={data.description}
                onChange={(v) => set('description', v)}
              />
              <TextareaField
                label="Additional Info"
                placeholder="Enter any additional information"
                value={data.additionalInfo}
                onChange={(v) => set('additionalInfo', v)}
              />
            </div>

            {/* Divider + Upload */}
            <div className="border-t border-slate-200 pt-5">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Upload Product Datasheet / Images
              </label>

              {/* Browser-style file input */}
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 border-r-0 rounded-l text-xs font-semibold text-slate-700"
                >
                  Choose File
                </button>
                <div className="flex-1 flex items-center px-3 border border-slate-300 rounded-r bg-white text-xs text-slate-500">
                  {data.files.length === 0
                    ? 'No file chosen'
                    : `${data.files.length} file${data.files.length > 1 ? 's' : ''} selected`}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* Selected files list */}
              {data.files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {data.files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs"
                    >
                      <span className="text-slate-700 truncate max-w-[80%]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* =============== FOOTER =============== */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(data)}
            className="px-5 py-2 rounded bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition shadow-2xs"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD ATOMS
   ========================================================= */

function CompactField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-800 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white transition"
      />
    </div>
  );
}

function TextareaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-800 mb-1.5">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white transition"
      />
    </div>
  );
}