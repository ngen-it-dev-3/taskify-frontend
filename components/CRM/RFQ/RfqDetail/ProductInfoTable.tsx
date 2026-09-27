'use client';

import React from 'react';
import type { RFQProduct } from '../types';

interface Props {
  products: RFQProduct[];
  onDetails: (product: RFQProduct) => void;
}

export default function ProductInfoTable({ products, onDetails }: Props) {
  return (
    <div className="bg-[#FAF8F4] rounded-lg p-4 border border-[#EFE9DF]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
          Product Information
        </h3>
        <button
          onClick={() => onDetails(products[0])}
          className="text-xs font-semibold text-[#A06126] hover:underline"
        >
          Details →
        </button>
      </div>

      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-[#E8DFD1] text-slate-400 font-semibold">
            <th className="pb-2 w-8">SL</th>
            <th className="pb-2">Product Name</th>
            <th className="pb-2 text-center w-14">Qty</th>
            <th className="pb-2 text-right w-20">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFE7D8]">
          {products.map((prod, idx) => (
            <tr key={prod.name}>
              <td className="py-2.5 font-mono text-slate-500">{idx + 1}</td>
              <td className="py-2.5 font-medium text-slate-800">{prod.name}</td>
              <td className="py-2.5 text-center font-mono font-bold text-slate-700">{prod.qty}</td>
              <td className="py-2.5 text-right">
                <button
                  onClick={() => onDetails(prod)}
                  className="px-2.5 py-1 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white text-[11px] font-medium transition"
                >
                  ℹ Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}