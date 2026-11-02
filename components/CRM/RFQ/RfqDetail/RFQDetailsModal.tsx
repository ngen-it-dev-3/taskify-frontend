'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { RFQProduct } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rfqNumber: string;
  products: RFQProduct[];
  onProductDetails: (product: RFQProduct) => void;
}

export default function RFQDetailsModal({
  isOpen,
  onClose,
  rfqNumber,
  products,
  onProductDetails,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0F2D4A]">
            RFQ Details (RFQ# {rfqNumber})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Table */}
        <div className="p-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-gray-200">
                <th className="pb-3 w-12 text-center">SL</th>
                <th className="pb-3">ITEM NAME</th>
                <th className="pb-3 text-center w-20">QTY</th>
                <th className="pb-3 text-right w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod, idx) => (
                <tr key={prod.name + idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 text-center font-medium text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-4">
                    <div className="font-semibold text-slate-800">{prod.name}</div>
                    {prod.brand && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Brand: {prod.brand}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-center font-semibold text-slate-700">
                    {prod.qty}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onProductDetails(prod)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C3760] hover:bg-[#0F2D4A] text-white text-xs font-semibold transition-colors"
                    >
                      <span className="text-[10px]">ℹ</span> Details
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No products found for this RFQ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}