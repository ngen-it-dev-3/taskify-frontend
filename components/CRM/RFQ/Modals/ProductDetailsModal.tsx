'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { RFQProduct } from '../types';

interface Props {
  product: RFQProduct;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Click outside to close
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        ref={panelRef}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
      >
        {/* ---------- Close button (top-right, circular) ---------- */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ---------- Body ---------- */}
        <div className="p-8">
          {/* Title */}
          <h2
            id="product-modal-title"
            className="text-xl font-bold text-slate-900"
          >
            Product Details
          </h2>

          {/* ---------- Grid of fields ---------- */}
          <div className="mt-7 grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
            {/* Row 1: SKU / Part No. + Model No. */}
            <Field label="SKU / PART NO." value={product.sku ?? 'N/A'} />
            <Field label="MODEL NO." value={product.modelNo ?? 'N/A'} />

            {/* Row 2: Brand Name + Quantity */}
            <Field label="BRAND NAME" value={product.brand ?? 'Acronis'} bold />
            <Field label="QUANTITY" value={String(product.qty)} bold />

            {/* Row 3: Item Name (full width) */}
            <div className="col-span-2">
              <Field label="ITEM NAME" value={product.name} bold />
            </div>

            {/* Row 4: Item Description + Additional Info */}
            <Field
              label="ITEM DESCRIPTION"
              value={product.spec ?? 'N/A'}
            />
            <Field label="ADDITIONAL INFO" value="N/A" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Reusable field: uppercase gray label + value below
   --------------------------------------------------------- */
function Field({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
        {label}
      </div>
      <div
        className={`mt-1.5 ${
          bold
            ? 'font-semibold text-slate-900'
            : 'font-normal text-slate-500'
        } leading-snug`}
      >
        {value}
      </div>
    </div>
  );
}