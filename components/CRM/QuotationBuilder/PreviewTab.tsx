'use client';

import React from 'react';
import type { QuotationLineItem, QuotationMeta } from './types';

interface Props {
  meta: QuotationMeta;
  lines: QuotationLineItem[];
  calc: any;
  onSend: () => void;
}

const AUTHORIZED_BRANDS = [
  'Acronis', 'Balluff', 'EViews', 'Radmin', 'Axis Communications', 'Fortinet',
];

export default function PreviewTab({ meta, lines, calc, onSend }: Props) {
  const subtotal = calc.subTotal;
  const gst = (subtotal * 15) / 100;
  const grand = subtotal + gst;

  // Filter out empty "New Item" rows
  const displayLines = lines.filter(
    (l) => l.name && l.name.trim() !== '' && l.name !== 'New Item'
  );

  return (
    <div className="space-y-4">
      {/* ================================================
          QUOTATION DOCUMENT
          ================================================ */}
      <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden">
        {/* ---------- HEADER ---------- */}
        <div className="bg-[#0F2D4A] px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-[#A06126] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              NG
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">
                NGEN IT LIMITED
              </div>
              <div className="text-white/60 text-[11px] tracking-wide">
                Facing Next Generation IT
              </div>
            </div>
          </div>
          <div className="text-white font-serif text-2xl tracking-[0.05em]">
            PRICE QUOTATION
          </div>
        </div>

        {/* ---------- BILL TO + DETAILS ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-8 py-7 border-b border-[#F0EBE3]">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase mb-4">
              Bill To
            </div>
            <div className="space-y-3.5 text-xs">
              <InfoRow label="Company" value={meta.title.split(' — ')[0] || 'EGCB'} />
              <InfoRow
                label="Contact"
                value="Touhidur Rahman Khan"
                sub="Sub Divisional Engineer"
              />
              <InfoRow
                label="Email / Phone"
                value="touhidur.khan@egcb.gov.bd"
                sub="02-55138668"
              />
              <InfoRow label="Address" value="Haripur 412MW CCPP, Bangladesh" />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase mb-4">
              Quote Details
            </div>
            <div className="space-y-3.5 text-xs">
              <InfoRow label="PQ #" value="NG-BD/EGCB/RV/260918" />
              <InfoRow label="Date" value="27 Sept 2026" />
              <InfoRow label="PQR #" value="ME0-P021(T10)-W(L1)" />
              <InfoRow label="RFQ Ref" value={meta.rfqNumber} />
            </div>
          </div>
        </div>

        {/* ---------- LINE ITEMS ---------- */}
        <div className="px-8 py-7">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5DFD3]">
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold w-10">
                    SI
                  </th>
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Product Name
                  </th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-wider text-slate-500 font-bold w-16">
                    Qty
                  </th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-slate-500 font-bold w-32">
                    Unit Price
                  </th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-slate-500 font-bold w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {displayLines.map((l, i) => {
                  const unitPrice = l.principalCost * 1.085;
                  const total = unitPrice * l.qty;
                  return (
                    <tr key={l.id} className="hover:bg-[#FDFBF7]">
                      <td className="py-4 font-mono text-slate-500">{i + 1}</td>
                      <td className="py-4 font-medium text-slate-800 pr-3">
                        {l.name}
                      </td>
                      <td className="py-4 text-center font-mono text-slate-700">
                        {l.qty}
                      </td>
                      <td className="py-4 text-right font-mono text-slate-700">
                        ৳
                        {unitPrice.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 text-right font-mono font-semibold text-slate-900">
                        ৳
                        {total.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---------- TOTALS ---------- */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Sub Total</span>
                <span className="font-mono text-slate-800">
                  ৳
                  {subtotal.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">
                  GST / VAT (15%){' '}
                  <span className="text-slate-800">(added)</span>
                </span>
                <span className="font-mono text-slate-800">
                  ৳
                  {gst.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t-2 border-[#A06126]">
                <span className="font-bold text-[#0F2D4A] text-sm">
                  Grand Total
                </span>
                <span className="font-bold text-[#A06126] font-mono text-lg">
                  ৳
                  {grand.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- TERMS ---------- */}
        <div className="px-8 py-7 border-t border-[#F0EBE3] space-y-4">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase">
            Terms &amp; Conditions
          </div>
          <div className="space-y-4 text-xs">
            <TermRow
              label="Validity"
              value="Valid till 7 days from PQ. Offer may change on the bank forex rate or stock availability."
            />
            <TermRow
              label="Payment"
              value="100% payment through EFTN/WT & hit in the NGEN IT Limited account within 30 days of Delivery."
            />
            <TermRow
              label="Product Mode"
              value="Product may take a certain time for Payment, Shipment, Delivery. In exception it may differ."
            />
            <TermRow
              label="Delivery"
              value="4 business weeks upon receiving of WO. Extended time may require in any disaster issues."
            />
            <TermRow
              label="Warranty"
              value="Principal Standard Warranty for respective product."
            />
          </div>
        </div>

        {/* ---------- AUTHORIZED BRANDS ---------- */}
        <div className="px-8 py-7 border-t border-[#F0EBE3]">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase mb-4">
            Authorized Brands
          </div>
          <div className="flex flex-wrap gap-2">
            {AUTHORIZED_BRANDS.map((b) => (
              <span
                key={b}
                className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- SIGNATURE ---------- */}
        <div className="px-8 py-7 border-t border-[#F0EBE3] flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Akramul Haque
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Sales Executive, Bangladesh
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 leading-relaxed">
            NGEN IT Limited · Reg. No. C-193116/2024
            <br />
            Dhaka, Bangladesh · www.ngenit.com
          </div>
        </div>
      </div>

      {/* ================================================
          ACTION BAR (outside the document card)
          ================================================ */}
      <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs px-6 py-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" className="accent-[#A06126] w-4 h-4" />
          Send Quotation With Attachment
        </label>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={onSend}
            className="px-5 py-2.5 bg-[#A06126] hover:bg-[#88501E] text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            Send Quotation
          </button>
          <button className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-semibold rounded-lg transition shadow-sm inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.005c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.479-8.408z" />
            </svg>
            Share on WhatsApp
          </button>
          <button className="px-5 py-2.5 border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
            Generate Shareable Link
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ATOMS
   ============================================================ */

function InfoRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 items-start">
      <span className="text-slate-400 text-[11px] font-medium pt-0.5">
        {label}
      </span>
      <div className="min-w-0">
        <div className="text-slate-800 font-medium break-words">{value}</div>
        {sub && (
          <div className="text-slate-500 text-[11px] mt-0.5 break-words">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4">
      <span className="text-slate-700 font-bold">{label}</span>
      <span className="text-slate-600 leading-relaxed">{value}</span>
    </div>
  );
}