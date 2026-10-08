// components/CRM/quotation-builder/PreviewTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { QuotationLineItem, QuotationMeta } from './types';

interface Props {
  meta: QuotationMeta;
  lines: QuotationLineItem[];
  calc: any;
  onSend: () => void;
  onChangeMeta: (patch: Partial<QuotationMeta>) => void;
}

const AUTHORIZED_BRANDS = [
  'Acronis', 'Balluff', 'EViews', 'Radmin', 'Axis Communications', 'Fortinet',
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function PreviewTab({
  meta,
  lines,
  calc,
  onSend,
  onChangeMeta,
}: Props) {
  const subtotal = calc.subTotal;
  const gst = (subtotal * 15) / 100;
  const grand = subtotal + gst;

  const displayLines = lines.filter(
    (l) => l.name && l.name.trim() !== '' && l.name !== 'New Item'
  );

  /* ⭐ On mount — if PQ # not set yet, fetch the next one from backend */
  useEffect(() => {
    if (meta.pqNumber) return; // already assigned
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/numbering-settings?scope=pq`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = await res.json();
        const s = json.data;
        if (!s || cancelled) return;

        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = s.useTodayDate
          ? `${yy}${mm}${dd}`
          : (s.manualDate || `${yy}${mm}${dd}`).replace(/\D/g, '').slice(0, 6);
        const padded = String((s.nextSeq || 0) + 1).padStart(s.padding || 4, '0');
        const num = `${s.countryCode}-${s.regionCode}/${s.entityCode}/${s.docTypeCode}/${datePart}-${padded}`;
        onChangeMeta({ pqNumber: num });
      } catch {
        // silent — user can still type manually
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ⭐ Default date display — "27 Sept 2026" style */
  const displayDate =
    meta.pqDate ||
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-4">
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

        {/* ---------- BILL TO + DETAILS (all editable) ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-8 py-7 border-b border-[#F0EBE3]">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase mb-4">
              Bill To
            </div>
            <div className="space-y-3.5 text-xs">
              <EditRow
                label="Company"
                value={meta.billToCompany ?? 'EGCB'}
                onChange={(v) => onChangeMeta({ billToCompany: v })}
              />
              <EditRow
                label="Contact"
                value={meta.billToContactName ?? 'Touhidur Rahman Khan'}
                sub={meta.billToContactRole ?? 'Sub Divisional Engineer'}
                onChange={(v) => onChangeMeta({ billToContactName: v })}
                onSubChange={(v) => onChangeMeta({ billToContactRole: v })}
              />
              <EditRow
                label="Email / Phone"
                value={meta.billToEmail ?? 'touhidur.khan@egcb.gov.bd'}
                sub={meta.billToPhone ?? '02-55138668'}
                onChange={(v) => onChangeMeta({ billToEmail: v })}
                onSubChange={(v) => onChangeMeta({ billToPhone: v })}
              />
              <EditRow
                label="Address"
                value={meta.billToAddress ?? 'Haripur 412MW CCPP, Bangladesh'}
                onChange={(v) => onChangeMeta({ billToAddress: v })}
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase mb-4">
              Quote Details
            </div>
            <div className="space-y-3.5 text-xs">
              <EditRow
                label="PQ #"
                value={meta.pqNumber ?? '—'}
                onChange={(v) => onChangeMeta({ pqNumber: v })}
                mono
              />
              <EditRow
                label="Date"
                value={displayDate}
                onChange={(v) => onChangeMeta({ pqDate: v })}
              />
              <EditRow
                label="PQR #"
                value={meta.pqrNumber ?? 'ME0-P021(T10)-W(L1)'}
                onChange={(v) => onChangeMeta({ pqrNumber: v })}
                mono
              />
              <EditRow
                label="RFQ Ref"
                value={meta.rfqRefOverride ?? meta.rfqNumber ?? ''}
                onChange={(v) => onChangeMeta({ rfqRefOverride: v })}
                mono
              />
            </div>
          </div>
        </div>

        {/* ---------- LINE ITEMS ---------- */}
        <div className="px-8 py-7">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5DFD3]">
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold w-10">SI</th>
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">Product Name</th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-wider text-slate-500 font-bold w-16">Qty</th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-slate-500 font-bold w-32">Unit Price</th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-wider text-slate-500 font-bold w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {displayLines.map((l, i) => {
                  const unitPrice = l.principalCost * 1.085;
                  const total = unitPrice * l.qty;
                  return (
                    <tr key={l.id} className="hover:bg-[#FDFBF7]">
                      <td className="py-4 font-mono text-slate-500">{i + 1}</td>
                      <td className="py-4 font-medium text-slate-800 pr-3">{l.name}</td>
                      <td className="py-4 text-center font-mono text-slate-700">{l.qty}</td>
                      <td className="py-4 text-right font-mono text-slate-700">
                        ৳{unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right font-mono font-semibold text-slate-900">
                        ৳{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Sub Total</span>
                <span className="font-mono text-slate-800">
                  ৳{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">
                  GST / VAT (15%) <span className="text-slate-800">(added)</span>
                </span>
                <span className="font-mono text-slate-800">
                  ৳{gst.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t-2 border-[#A06126]">
                <span className="font-bold text-[#0F2D4A] text-sm">Grand Total</span>
                <span className="font-bold text-[#A06126] font-mono text-lg">
                  ৳{grand.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TERMS */}
        <div className="px-8 py-7 border-t border-[#F0EBE3] space-y-4">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#A06126] uppercase">
            Terms &amp; Conditions
          </div>
          <div className="space-y-4 text-xs">
            <TermRow label="Validity" value="Valid till 7 days from PQ. Offer may change on the bank forex rate or stock availability." />
            <TermRow label="Payment" value="100% payment through EFTN/WT & hit in the NGEN IT Limited account within 30 days of Delivery." />
            <TermRow label="Product Mode" value="Product may take a certain time for Payment, Shipment, Delivery. In exception it may differ." />
            <TermRow label="Delivery" value="4 business weeks upon receiving of WO. Extended time may require in any disaster issues." />
            <TermRow label="Warranty" value="Principal Standard Warranty for respective product." />
          </div>
        </div>

        {/* BRANDS */}
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

        {/* SIGNATURE */}
        <div className="px-8 py-7 border-t border-[#F0EBE3] flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900 text-sm">Akramul Haque</div>
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

      {/* ACTION BAR */}
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
          <button className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-semibold rounded-lg transition shadow-sm">
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

/** Editable row — looks like InfoRow but is an input */
function EditRow({
  label,
  value,
  sub,
  onChange,
  onSubChange,
  mono = false,
}: {
  label: string;
  value: string;
  sub?: string;
  onChange: (v: string) => void;
  onSubChange?: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 items-start">
      <span className="text-slate-400 text-[11px] font-medium pt-1">{label}</span>
      <div className="min-w-0">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent border-b border-transparent hover:border-[#E2DBD1] focus:border-[#A06126] focus:outline-none text-slate-800 font-medium break-words pb-0.5 transition ${mono ? 'font-mono text-[11.5px]' : ''
            }`}
        />
        {sub !== undefined && onSubChange && (
          <input
            value={sub}
            onChange={(e) => onSubChange(e.target.value)}
            className="w-full bg-transparent border-b border-transparent hover:border-[#E2DBD1] focus:border-[#A06126] focus:outline-none text-slate-500 text-[11px] mt-1 pb-0.5 transition"
          />
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