'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { QuotationLineItem, QuotationMeta } from '../types';
import { AUTHORIZED_BRANDS } from '../constants';

interface Props {
  meta: QuotationMeta;
  lines: QuotationLineItem[];
  calc: any;
  terms?: { label: string; value: string }[];
  onUpdateLine?: (id: string, patch: Partial<QuotationLineItem>) => void;
  onRemoveLine?: (id: string) => void;
  onAddLine?: () => void;
  onAddTerm?: () => void;
  onUpdateTerm?: (index: number, patch: { label?: string; value?: string }) => void;
  onSend?: (withAttachment: boolean) => void;
  onWhatsApp?: () => void;
  onGenerateLink?: () => void;
  sending?: boolean;
}

interface EditState {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export default function QuotationTab({
  meta,
  lines,
  calc,
  terms = [],
  onUpdateLine,
  onRemoveLine,
  onAddLine,
  onAddTerm,
  onUpdateTerm,
  onSend,
  onWhatsApp,
  onGenerateLink,
  sending = false,
}: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [withAttachment, setWithAttachment] = useState(false);
  const autoEditedIds = useRef<Set<string>>(new Set());

  // ⭐ null = not yet initialized → prevents auto-edit on first load
  const prevLineCount = useRef<number | null>(null);

  const subtotal = calc.subTotal;
  const gst = meta.vatEnabled ? (subtotal * 15) / 100 : 0;
  const grand = subtotal + gst;

  const productLines = lines.filter((l) => l.type !== 'fixed');
  const displayLines = productLines.filter((l) => l.name.trim() !== '');

  // ⭐ Auto-enter edit mode ONLY when a NEW line is added after initial load
  useEffect(() => {
    const currentCount = productLines.length;

    // First render: just record the count, don't trigger edit
    if (prevLineCount.current === null) {
      prevLineCount.current = currentCount;
      return;
    }

    // Only fire when the count actually increased
    if (currentCount > prevLineCount.current) {
      const newest = productLines[productLines.length - 1];
      if (newest && !autoEditedIds.current.has(newest.id)) {
        autoEditedIds.current.add(newest.id);
        setEditing({
          id: newest.id,
          name: '',
          qty: newest.qty || 1,
          price: newest.principalCost * 1.085 || 0,
        });
      }
    }

    prevLineCount.current = currentCount;
  }, [productLines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (l: QuotationLineItem) => {
    setEditing({
      id: l.id,
      name: l.name === 'New Item' ? '' : l.name,
      qty: l.qty,
      price: l.principalCost * 1.085,
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    const principalCost = editing.price / 1.085;
    const finalName = editing.name.trim() || 'New Item';
    onUpdateLine?.(editing.id, {
      name: finalName,
      qty: editing.qty,
      principalCost,
    });
    setEditing(null);
  };

  const cancelEdit = () => {
    if (!editing) return;
    const original = lines.find((l) => l.id === editing.id);
    if (original && original.name === 'New Item' && original.principalCost === 0) {
      onRemoveLine?.(editing.id);
    }
    setEditing(null);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[980px] bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden">
        {/* ================= LETTERHEAD ================= */}
        <div className="bg-[#0F2D4A] px-10 py-7 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-lg bg-[#A06126] flex items-center justify-center text-white font-bold text-xl shadow-lg">
              NG
            </div>
            <div>
              <div className="text-white font-bold text-[20px] leading-tight tracking-tight">
                NGEN IT LIMITED
              </div>
              <div className="text-white/70 text-[12px] tracking-wide mt-0.5">
                Facing Next Generation IT
              </div>
            </div>
          </div>
          <div className="text-white font-serif text-[26px] tracking-[0.02em] font-semibold">
            PRICE QUOTATION
          </div>
        </div>

        {/* ================= BILL TO + QUOTE DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-10 py-8 border-b border-[#F0EBE3]">
          <div>
            <div className="text-[10px] font-bold text-[#A06126] uppercase mb-5">
              Bill To
            </div>
            <div className="space-y-4">
              <InfoRow
                label="Company"
                value={meta.client?.company || '—'}
                strong
              />
              <InfoRow
                label="Contact"
                value={meta.client?.contactName || '—'}
                sub={meta.client?.designation || undefined}
              />
              <InfoRow
                label="Email / Phone"
                value={meta.client?.email || '—'}
                sub={meta.client?.phone || undefined}
                mono
              />
              <InfoRow
                label="Address"
                value={
                  [
                    meta.client?.address,
                    meta.client?.city,
                    meta.client?.country,
                    meta.client?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'
                }
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-[#A06126] uppercase mb-5">
              Quote Details
            </div>
            <div className="space-y-4">
              <InfoRow label="PQ #" value={meta.pqNumber || '—'} strong mono />
              <InfoRow
                label="Date"
                value={new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                mono
              />
              <InfoRow label="PQR #" value={meta.pqrNumber || '—'} mono />
              <InfoRow label="RFQ Ref" value={meta.rfqNumber || '—'} mono />
            </div>
          </div>
        </div>

        {/* ================= LINE ITEMS ================= */}
        <div className="px-10 py-8">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[#E5DFD3]">
                  <th className="pb-3 text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold w-12">
                    SI
                  </th>
                  <th className="pb-3 text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">
                    Product Name
                  </th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold w-20">
                    Qty
                  </th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold w-32">
                    Unit Price
                  </th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold w-32">
                    Total
                  </th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold w-24">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {displayLines.map((l, i) => {
                  const isEditing = editing?.id === l.id;
                  const unitPrice = l.principalCost * 1.085;
                  const total = unitPrice * l.qty;

                  // ============ EDIT MODE ROW ============
                  if (isEditing && editing) {
                    return (
                      <tr key={l.id} className="bg-[#FAF6EE]/70">
                        <td className="py-3.5 text-slate-500 font-mono">
                          {i + 1}
                        </td>
                        <td className="py-3.5 pr-3">
                          <input
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                            placeholder="Enter product name…"
                            className="w-full bg-white border border-[#A06126] rounded px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="number"
                            value={editing.qty}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                qty: Number(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-16 bg-white border border-[#A06126] rounded px-2 py-1.5 text-center text-[12.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                          />
                        </td>
                        <td className="py-3.5 text-right">
                          <input
                            type="number"
                            value={editing.price}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                price: Number(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-32 bg-white border border-[#A06126] rounded px-2 py-1.5 text-right text-[12.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[#A06126]/30"
                          />
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-500">
                          ৳
                          {(editing.price * editing.qty).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="px-2.5 py-1 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white text-[10px] font-semibold mr-1 transition"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2.5 py-1 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // ============ VIEW MODE ROW ============
                  return (
                    <tr key={l.id} className="hover:bg-[#FDFBF7]">
                      <td className="py-2 font-mono text-slate-500">{i + 1}</td>
                      <td className="py-2 font-medium text-slate-800 pr-3">
                        {l.name}
                      </td>
                      <td className="py-2 text-center font-mono text-slate-700">
                        {l.qty}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-700">
                        ৳
                        {unitPrice.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-slate-900">
                        ৳
                        {total.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(l)}
                            className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-slate-50 inline-flex items-center justify-center text-slate-600 transition"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveLine?.(l.id)}
                            className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 inline-flex items-center justify-center text-rose-600 transition"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayLines.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-400 italic text-[12px]"
                    >
                      No line items yet — click "+ Add Item" below
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* + Add Item */}
          <button
            type="button"
            onClick={onAddLine}
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#A06126] hover:text-[#88501E] transition"
          >
            <span className="text-base leading-none">+</span>
            Add Item
          </button>

          {/* ---------- TOTALS ---------- */}
          <div className="mt-10 flex justify-end">
            <div className="w-full max-w-[320px] space-y-3 text-[12.5px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Sub Total</span>
                <span className="font-mono text-slate-900">
                  ৳
                  {subtotal.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {meta.vatEnabled && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    GST / VAT (15%){' '}
                    <span className="text-emerald-600 font-medium">(added)</span>
                  </span>
                  <span className="font-mono text-slate-900">
                    ৳
                    {gst.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t-2 border-[#0F2D4A]">
                <span className="font-bold text-[#0F2D4A] text-[14px]">
                  Grand Total
                </span>
                <span className="font-bold text-[#A06126] font-mono text-[20px]">
                  ৳
                  {grand.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TERMS ================= */}
        {terms.length > 0 && (
          <div className="px-10 py-8 border-t border-[#F0EBE3]">
            <div className="text-[10px] font-bold text-[#A06126] uppercase mb-5">
              Terms &amp; Conditions
            </div>
            <div className="divide-y divide-[#F0EBE3]">
              {terms.map((t, i) => (
                <TermRow
                  key={i}
                  label={t.label}
                  value={t.value}
                  onChange={(patch) => onUpdateTerm?.(i, patch)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onAddTerm}
              className="mt-4 text-[12px] font-semibold text-[#A06126] hover:text-[#88501E] transition"
            >
              + Add Term
            </button>
          </div>
        )}

        {/* ================= AUTHORIZED BRANDS ================= */}
        <div className="px-10 py-8 border-t border-[#F0EBE3]">
          <div className="text-[10px] font-bold tracking-[0.18em] text-[#A06126] uppercase mb-4">
            Authorized Brands
          </div>
          <div className="flex flex-wrap gap-2 py-3 border-y border-[#F0EBE3]">
            {AUTHORIZED_BRANDS.map((b) => (
              <span
                key={b}
                className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11.5px] font-medium border border-slate-200"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ================= SIGNATURE ================= */}
        <div className="px-10 py-8 border-t border-[#F0EBE3] flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900 text-[13.5px]">
              Akramul Haque
            </div>
            <div className="text-slate-500 text-[11.5px] mt-1">
              Sales Executive, Bangladesh
            </div>
          </div>
          <div className="text-right text-[10.5px] text-slate-500 leading-relaxed">
            NGEN IT Limited · Reg. No. C-193116/2024
            <br />
            Dhaka, Bangladesh · www.ngenit.com
          </div>
        </div>

        {/* ================= ACTION BAR ================= */}
        <div className="px-10 py-6 bg-[#FAF8F5] border-t border-[#F0EBE3]">
          <label className="flex items-center gap-2 text-[12.5px] text-slate-600 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={withAttachment}
              onChange={(e) => setWithAttachment(e.target.checked)}
              className="accent-[#A06126] w-4 h-4"
            />
            Send Quotation With Attachment (PDF)
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSend?.(withAttachment)}
              disabled={sending}
              className="px-6 py-2.5 bg-[#A06126] hover:bg-[#88501E] text-white text-[12.5px] font-semibold rounded-lg transition shadow-sm disabled:opacity-60 inline-flex items-center gap-2"
            >
              {sending && (
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              {sending ? 'Sending…' : 'Send Quotation'}
            </button>
            <button
              type="button"
              onClick={onWhatsApp}
              className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1C3760] text-white text-[12.5px] font-semibold rounded-lg transition shadow-sm inline-flex items-center gap-2"
            >
              <span>💬</span>
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={onGenerateLink}
              className="px-6 py-2.5 border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold rounded-lg transition inline-flex items-center gap-2"
            >
              <span>🔗</span>
              Generate Shareable Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ATOMS
   ========================================================= */

function InfoRow({
  label,
  value,
  sub,
  strong,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className="
        grid grid-cols-[120px_1fr] gap-3 items-center py-2 mb-0
        border-b border-[#E5DFD3]
        last:border-b-0
      "
    >
      <span
        className="pt-0.5"
        style={{
          color: '#A0AEC0',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: '1.4',
        }}
      >
        {label}
      </span>

      <div className="min-w-0">
        <div
          className="break-words"
          style={{
            color: '#0F2D4A',
            fontSize: mono ? '12.5px' : '13px',
            fontWeight: strong ? 700 : 500,
            fontFamily: mono
              ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
              : 'inherit',
            lineHeight: '1.45',
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            className="mt-1 break-words"
            style={{
              color: '#64748B',
              fontSize: '11.5px',
              fontWeight: 400,
              lineHeight: '1.4',
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function TermRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (patch: { label?: string; value?: string }) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draftLabel, setDraftLabel] = React.useState(label);
  const [draftValue, setDraftValue] = React.useState(value);

  const save = () => {
    onChange?.({ label: draftLabel, value: draftValue });
    setEditing(false);
  };

  const cancel = () => {
    setDraftLabel(label);
    setDraftValue(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="grid grid-cols-[130px_1fr] gap-6 items-start py-4">
        <input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          className="bg-[#FDFBF7] border border-[#E2DBD1] rounded px-2 py-1 text-[12px] font-bold text-slate-700"
        />
        <div className="space-y-2">
          <input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-[#E2DBD1] rounded px-2 py-1 text-[12px] text-slate-700"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="px-2.5 py-1 rounded bg-[#0F2D4A] hover:bg-[#1C3760] text-white text-[10px] font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-2.5 py-1 rounded border border-[#E2DBD1] bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[130px_1fr] gap-6 items-start py-4 group">
      <span className="text-slate-800 font-bold text-[12.5px]">{label}</span>
      <div className="flex items-start gap-2">
        <span className="text-slate-600 leading-relaxed flex-1 text-[12.5px]">
          {value}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-[10.5px] text-slate-400 hover:text-[#A06126] transition font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  );
}